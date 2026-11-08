'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const mode = process.argv[2] || 'build'
if (!['build', 'preview'].includes(mode)) {
  throw new Error(`Unsupported mode "${mode}". Use "build" or "preview".`)
}

const zpmPath = require.resolve('@zeppos/zpm/lib/node.js')
const source = fs.readFileSync(zpmPath, 'utf8')
const guardTarget = 'let g=A[0]||0;'
const guardReplacement =
  'let g=A[0]||0;if(!(g>0))return yield r().move(o,t),void console.log(`${y} Skipped resize: target icon size is unavailable`);'

if (source.split(guardTarget).length - 1 !== 1) {
  throw new Error('Unexpected ZPM bundle: resize target expression was not unique')
}

function runBuild() {
  const commandLine = `npx --no-install zeus ${mode} -t band-7`
  if (process.platform === 'win32') {
    return spawnSync(process.env.ComSpec || 'cmd.exe', [
      '/d',
      '/s',
      '/c',
      commandLine
    ], { cwd: projectRoot, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] })
  }

  return spawnSync('npx', ['--no-install', 'zeus', mode, '-t', 'band-7'], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  })
}

function findLatestZab() {
  const distPath = path.join(projectRoot, 'dist')
  if (!fs.existsSync(distPath)) {
    return null
  }

  return fs.readdirSync(distPath)
    .filter((name) => name.endsWith('.zab'))
    .map((name) => {
      const fullPath = path.join(distPath, name)
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0]?.fullPath || null
}

let buildError = null

try {
  fs.writeFileSync(zpmPath, source.replace(guardTarget, guardReplacement), 'utf8')

  const result = runBuild()
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')

  const output = `${result.stdout || ''}${result.stderr || ''}`
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`Zeus build exited with status ${result.status}`)
  }
  if (/\[RESIZE\]\s+Error:/i.test(output)) {
    throw new Error('The patched build still reported a RESIZE error')
  }

  if (mode === 'build') {
    const zabPath = findLatestZab()
    if (!zabPath) {
      throw new Error('The patched build did not generate a ZAB package')
    }

    console.log(`[PATCHED BUILD] Generated ${path.relative(projectRoot, zabPath)}`)
  } else {
    console.log('[PATCHED PREVIEW] Zeus preview completed; scan the QR code shown above with Zepp App.')
  }
} catch (error) {
  buildError = error
} finally {
  fs.writeFileSync(zpmPath, source, 'utf8')
}

if (buildError) {
  console.error(`[PATCHED BUILD] ${buildError.message}`)
  process.exitCode = 1
}

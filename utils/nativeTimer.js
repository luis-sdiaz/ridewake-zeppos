// Zepp OS 1.0 only. Keep native handles unchanged; never substitute browser timers.
function timerError(code, detail) {
  const error = new Error(detail)
  error.code = code
  return error
}

export function createNativeTimer(delay, repeat, callback) {
  const api = typeof timer === 'undefined' ? null : timer
  if (!api || typeof api.createTimer !== 'function' || typeof api.stopTimer !== 'function') {
    throw timerError('T01', 'Native API missing: timer=' + typeof timer +
      ', create=' + (api ? typeof api.createTimer : 'undefined') +
      ', stop=' + (api ? typeof api.stopTimer : 'undefined'))
  }
  const task = { api: api, handle: null, active: true }
  try {
    task.handle = api.createTimer(delay, repeat, function () {
      if (task.active) callback()
    }, {})
  } catch (error) {
    task.active = false
    throw timerError('T02', 'timer.createTimer threw: ' + String(error))
  }
  // The documented result is numeric, but the returned native reference is opaque
  // to the caller. Reject missing/failure results, not a usable object reference.
  const handle = task.handle
  if (handle === null || handle === undefined || handle === false ||
      (typeof handle === 'number' && (!isFinite(handle) || handle < 0))) {
    task.active = false
    throw timerError('T03', 'timer.createTimer returned invalid handle: type=' +
      typeof handle + ', value=' + String(handle))
  }
  console.log('RideWake timer: created delay=' + delay + ' repeat=' + repeat +
    ' handleType=' + typeof handle)
  return task
}

export function stopNativeTimer(task) {
  if (!task || task.stopped) return
  task.active = false // Also guard callbacks queued before cancellation.
  try {
    task.api.stopTimer(task.handle)
    task.stopped = true
    console.log('RideWake timer: stopped')
  } catch (error) {
    // Keep the handle so a later cleanup can retry the native cancellation.
    throw timerError('T04', 'timer.stopTimer threw: ' + String(error))
  }
}

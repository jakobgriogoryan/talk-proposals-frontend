/**
 * Coordinates delayed realtime initialization with authentication changes.
 * A new user identity always cancels the previous timer and disconnects the
 * previous session before a replacement subscription can be created.
 */
export function createRealtimeSession({ initialize, disconnect, delay = 500 }) {
  let initializationTimer = null

  const cancelInitialization = () => {
    if (initializationTimer !== null) {
      clearTimeout(initializationTimer)
      initializationTimer = null
    }
  }

  const sync = (userId) => {
    cancelInitialization()
    disconnect()

    if (!userId) {
      return
    }

    initializationTimer = setTimeout(() => {
      initializationTimer = null
      initialize(userId)
    }, delay)
  }

  const dispose = () => {
    cancelInitialization()
    disconnect()
  }

  return { sync, dispose }
}

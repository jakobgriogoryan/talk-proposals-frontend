/** Own authentication-driven subscriptions without an arbitrary startup delay. */
export function createRealtimeSession({ initialize, disconnect }) {
  const sync = (userId) => {
    disconnect()
    if (userId) initialize(userId)
  }
  return { sync, dispose: disconnect }
}

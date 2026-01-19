import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from '../api/axios'

// Configure Pusher
window.Pusher = Pusher

// Create Echo instance
const echo = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_PUSHER_APP_KEY || 'your-pusher-key',
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
  forceTLS: true,
  encrypted: true,
  disableStats: true,
  enabledTransports: ['ws', 'wss'],
  authEndpoint: '/api/broadcasting/auth',
  auth: {
    headers: {
      Accept: 'application/json',
    },
  },
  // Use axios instance for authentication requests
  authorizer: (channel, options) => {
    return {
      authorize: (socketId, callback) => {
        api.post('/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        })
          .then((response) => {
            callback(false, response.data)
          })
          .catch((error) => {
            callback(true, error)
          })
      },
    }
  },
})

export default echo


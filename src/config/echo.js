import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from '../api/axios'

const key = import.meta.env.VITE_PUSHER_APP_KEY?.trim()

// Create Echo instance
const echo = new Echo(key ? {
  broadcaster: 'pusher',
  key,
  Pusher,
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
} : { broadcaster: 'null' })

export default echo

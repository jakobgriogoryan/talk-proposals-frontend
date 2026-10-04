import api from './axios'
import axios from 'axios'

// Create a separate axios instance for CSRF cookie (it's on web routes, not API routes)
const webApi = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// CSRF cookie fetching helper with promise caching to prevent duplicate requests
let csrfCookiePromise = null
export const getCsrfCookie = async () => {
  if (!csrfCookiePromise) {
    csrfCookiePromise = webApi.get('/sanctum/csrf-cookie')
        .finally(() => {
          csrfCookiePromise = null
        })
  }
  return csrfCookiePromise
}

export const authApi = {
  async getCsrfCookie() {
    return getCsrfCookie()
  },
  async register(data) {
    return api.post('/register', data)
  },
  async login(data) {
    return api.post('/login', data)
  },
  logout() {
    return api.post('/logout')
  },
  getUser() {
    return api.get('/user')
  },
}

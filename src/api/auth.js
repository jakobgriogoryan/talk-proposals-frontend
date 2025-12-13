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

export const authApi = {
  async getCsrfCookie() {
    // CSRF cookie route is on web routes, not API routes
    return webApi.get('/sanctum/csrf-cookie')
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


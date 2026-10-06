/** Development-only settings; never expose these values as browser VITE_* config. */
export function devServerConfig(env = {}) {
  const port = Number(env.DEV_PORT || 5173)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DEV_PORT must be a valid TCP port')
  const target = env.DEV_API_TARGET || 'http://localhost:8000'
  let url
  try { url = new URL(target) } catch { throw new Error('DEV_API_TARGET must be an HTTP(S) URL') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('DEV_API_TARGET must be an HTTP(S) URL without credentials')
  }
  return {
    port,
    strictPort: true,
    allowedHosts: (env.DEV_ALLOWED_HOSTS || '').split(',').map(host => host.trim()).filter(Boolean),
    proxy: Object.fromEntries(['/api', '/sanctum'].map(path => [path, {
      target, changeOrigin: true,
    }])),
  }
}

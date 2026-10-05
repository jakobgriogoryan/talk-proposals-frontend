import { proposalsApi } from '../api'

/** Fetch through the authenticated API; resource file_path is not a browser URL. */
export async function downloadProposalFile(id, title) {
  const response = await proposalsApi.download(id)
  if (response.data?.type?.includes('application/json')) {
    const data = JSON.parse(await response.data.text())
    const error = new Error(data.message || 'Failed to download file')
    error.response = { ...response, data }
    throw error
  }

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = url
    link.setAttribute('download', (title || 'proposal').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf')
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    window.URL.revokeObjectURL(url)
  }
}

export async function proposalDownloadError(error) {
  let data = error.response?.data
  if (data instanceof Blob) {
    try { data = JSON.parse(await data.text()) } catch { data = null }
  }
  if (data?.message) return data.message
  const messages = {
    404: 'The file could not be found. It may have been deleted.',
    403: "You don't have permission to download this file.",
    401: 'Please log in to download this file.',
  }
  if (messages[error.response?.status]) return messages[error.response.status]
  if (!error.response) return 'Unable to connect to the server. Please check your internet connection.'
  return 'Failed to download file. Please try again.'
}

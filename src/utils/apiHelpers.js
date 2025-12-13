/**
 * Extract data from API response
 * Handles both nested (response.data.data) and flat (response.data) response structures
 * 
 * @param {Object} response - Axios response object
 * @returns {*} The data from the response
 */
export function extractResponseData(response) {
  return response.data?.data || response.data
}

/**
 * Extract user from API response
 * Handles both nested (response.data.data.user) and flat (response.data.user) response structures
 * 
 * @param {Object} response - Axios response object
 * @returns {Object|null} The user object or null
 */
export function extractUserFromResponse(response) {
  return response.data?.data?.user || response.data?.user || null
}


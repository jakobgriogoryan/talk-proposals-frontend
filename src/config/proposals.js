// Client-side mirrors of the API's PDF contract. The backend remains authoritative.
export const MAX_PROPOSAL_FILE_BYTES = 4 * 1024 * 1024
export const MAX_PROPOSAL_FILE_MB = MAX_PROPOSAL_FILE_BYTES / (1024 * 1024)
export const PROPOSAL_FILE_MIME = 'application/pdf'

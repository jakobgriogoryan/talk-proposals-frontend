// Share the same lazy module between background warming and route navigation.
// Importing it does not mount the form or issue its tags API request.
export const loadNewProposal = () => import('../views/NewProposal.vue')

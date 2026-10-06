import { computed, onUnmounted, ref } from 'vue'

export const proposalListParams = (page, filters) => {
  const params = { page }
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'tags') {
      if (Array.isArray(value) && value.length) params.tags = value.join(',')
    } else if (value !== '' && value !== null && value !== undefined) {
      params[key] = value
    }
  })
  return params
}

export const proposalPaginationPages = (pagination) => {
  if (!pagination || pagination.last_page <= 1) return []
  const { current_page: current, last_page: last } = pagination
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1)
  let start = Math.max(2, current - 2)
  let end = Math.min(last - 1, current + 2)
  if (current <= 3) { start = 2; end = Math.min(5, last - 1) }
  else if (current >= last - 2) { start = Math.max(2, last - 4); end = last - 1 }
  return [1, ...(start > 2 ? ['ellipsis'] : []),
    ...Array.from({ length: end - start + 1 }, (_, index) => start + index),
    ...(end < last - 1 ? ['ellipsis'] : []), last]
}

// Each role supplies its own API endpoint; state, query serialization and ordering are shared.
export const useProposalList = (fetchPage) => {
  const proposals = ref([])
  const loading = ref(false)
  const filters = ref({ search: '', tags: [], status: '' })
  const pagination = ref(null)
  let requestVersion = 0
  onUnmounted(() => { requestVersion++ })

  const fetchProposals = async (page = 1) => {
    const version = ++requestVersion
    loading.value = true
    try {
      const response = await fetchPage(proposalListParams(page, filters.value))
      if (version !== requestVersion) return
      const data = response.data.data || response.data
      proposals.value = data.proposals
      pagination.value = data.pagination
    } catch {
      // The shared API interceptor reports request failures; retain the previous results.
    } finally {
      if (version === requestVersion) loading.value = false
    }
  }
  const updateFilters = (newFilters) => {
    filters.value = newFilters
    return fetchProposals(1)
  }
  const paginationPages = computed(() => proposalPaginationPages(pagination.value))
  const paginationInfo = computed(() => {
    if (!pagination.value) return { from: 0, to: 0 }
    const { current_page, per_page, total } = pagination.value
    return { from: total === 0 ? 0 : (current_page - 1) * per_page + 1,
      to: Math.min(current_page * per_page, total) }
  })
  return { proposals, loading, filters, pagination, fetchProposals, updateFilters,
    goToPage: fetchProposals, paginationPages, paginationInfo }
}

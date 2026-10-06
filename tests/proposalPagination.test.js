import { expect, it } from 'vitest'
import { proposalListParams, proposalPaginationPages } from '../src/composables/useProposalList'

it('omits empty filters and serializes nonempty tag IDs', () => {
  expect(proposalListParams(2, { search: '', tags: [], status: null })).toEqual({ page: 2 })
  expect(proposalListParams(1, { search: 'Vue', tags: [2, 7], status: 'pending' })).toEqual({ page: 1, search: 'Vue', tags: '2,7', status: 'pending' })
})
it.each([
  [null, []],
  [{ current_page: 1, last_page: 1 }, []],
  [{ current_page: 3, last_page: 5 }, [1, 2, 3, 4, 5]],
  [{ current_page: 1, last_page: 12 }, [1, 2, 3, 4, 5, 'ellipsis', 12]],
  [{ current_page: 6, last_page: 12 }, [1, 'ellipsis', 4, 5, 6, 7, 8, 'ellipsis', 12]],
  [{ current_page: 12, last_page: 12 }, [1, 'ellipsis', 8, 9, 10, 11, 12]],
])('preserves pagination boundary behavior %#', (pagination, expected) => {
  expect(proposalPaginationPages(pagination)).toEqual(expected)
})

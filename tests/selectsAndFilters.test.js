import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, ref } from 'vue'
import AppSelect from '../src/components/AppSelect.vue'
import TagMultiSelect from '../src/components/TagMultiSelect.vue'
import ProposalFilters from '../src/components/ProposalFilters.vue'
import { find, findAll, node, renderer, settle, trigger } from './helpers/vue-renderer'

const apps = []
const events = {}
const mount = component => {
  const root = node('root')
  const app = renderer.createApp(component)
  app.mount(root)
  apps.push(app)
  return root
}
beforeEach(() => {
  vi.stubGlobal('document', {
    activeElement: null,
    addEventListener: (name, handler) => { events[name] = handler },
    removeEventListener: vi.fn(),
  })
})
afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
  vi.unstubAllGlobals()
})

describe('shared dropdown controls', () => {
  it('keeps compact status controls small while preserving mobile targets and status changes', () => {
    const change = vi.fn()
    const root = mount({ render: () => h(AppSelect, {
      modelValue: 'pending', compact: true, 'aria-label': 'Proposal status',
      options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }],
      onChange: change,
    }) })
    const select = find(root, el => el.type === 'select')
    expect(root.children[0].props.class.split(' ')).toEqual(expect.arrayContaining(['min-w-28', 'shrink-0']))
    expect(select.props.class.split(' ')).toEqual(expect.arrayContaining([
      'min-h-11', 'sm:min-h-9', 'px-2.5', 'py-1.5', 'pr-8', 'text-xs',
    ]))
    expect(select.props.class.split(' ')).not.toContain('py-2.5')
    expect(select.props['aria-label']).toBe('Proposal status')
    trigger(select, 'change', { target: { value: 'approved' } })
    expect(change).toHaveBeenCalledWith('approved')
  })

  it('emits numeric ratings and forwards native labels, disabled and validation state', () => {
    const update = vi.fn(), change = vi.fn()
    const root = mount({ render: () => h(AppSelect, {
      modelValue: '', options: [{ value: 4, label: 'Very good' }], placeholder: 'Select rating',
      id: 'rating', required: true, disabled: true, error: 'Required', 'aria-label': 'Rating',
      'onUpdate:modelValue': update, onChange: change,
    }) })
    const select = find(root, el => el.type === 'select')
    expect(select.props).toMatchObject({ id: 'rating', required: true, disabled: true, 'aria-label': 'Rating', 'aria-invalid': 'true' })
    expect(select.props.class).toContain('pr-10')
    expect(select.props.class.split(' ')).toEqual(expect.arrayContaining(['min-h-11', 'px-3.5', 'py-2.5', 'text-sm']))
    expect(select.props.class).toContain('dark:[color-scheme:dark]')
    expect(find(root, el => el.type === 'svg').props.class).toContain('pointer-events-none')
    trigger(select, 'change', { target: { value: '4' } })
    expect(update).toHaveBeenCalledWith(4)
    expect(change).toHaveBeenCalledWith(4)
  })

  it('allows clearing optional status selections', () => {
    const update = vi.fn()
    const root = mount({ render: () => h(AppSelect, {
      modelValue: 'pending', options: [{ value: 'pending', label: 'Pending' }],
      placeholder: 'All statuses', 'onUpdate:modelValue': update,
    }) })
    expect(find(root, el => el.type === 'option').props.disabled).toBe(false)
    trigger(find(root, el => el.type === 'select'), 'change', { target: { value: '' } })
    expect(update).toHaveBeenCalledWith('')
  })

  it('supports searchable tags, immutable selection, Escape and outside-click dismissal', async () => {
    const values = Object.freeze([1]), update = vi.fn()
    const root = mount({ render: () => h(TagMultiSelect, {
      modelValue: values, options: [{ id: 1, name: 'Laravel' }, { id: 2, name: 'Vue' }], 'onUpdate:modelValue': update,
    }) })
    const button = find(root, el => el.type === 'button')
    trigger(button, 'click')
    await settle()
    expect(button.props['aria-expanded']).toBe(true)
    expect(document.activeElement.props['aria-label']).toBe('Search tags')
    const search = find(root, el => el.type === 'input' && el.props.type === 'search')
    search.value = 'vue'
    trigger(search, 'input')
    await settle()
    expect(findAll(root, el => el.props.type === 'checkbox')).toHaveLength(1)
    trigger(find(root, el => el.props.type === 'checkbox'), 'change')
    expect(update).toHaveBeenCalledWith([1, 2])
    expect(values).toEqual([1])
    trigger(root.children[0], 'keydown', { key: 'Escape' })
    await settle()
    expect(button.props['aria-expanded']).toBe(false)
    expect(document.activeElement).toBe(button)
    trigger(button, 'click')
    await settle()
    events.pointerdown({ target: node('outside') })
    await settle()
    expect(button.props['aria-expanded']).toBe(false)
  })
})

describe('filter state ownership', () => {
  it('does not mutate parent tag arrays and synchronizes same-length replacements', async () => {
    const filters = ref({ tags: Object.freeze([1]) })
    const update = vi.fn()
    const root = mount({ render: () => h(ProposalFilters, {
      filters: filters.value, tags: [{ id: 1, name: 'Laravel' }, { id: 2, name: 'Vue' }], 'onUpdate:filters': update,
    }) })
    trigger(find(root, el => el.props['aria-haspopup'] === 'dialog'), 'click')
    await settle()
    const boxes = () => findAll(root, el => el.props.type === 'checkbox')
    trigger(boxes()[1], 'change')
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ tags: [1, 2] }))
    expect(filters.value.tags).toEqual([1])

    filters.value = { tags: [2] }
    await settle()
    expect(boxes().map(el => el.props.checked)).toEqual([false, true])
    expect(find(root, el => el.text === 'Vue')).toBeDefined()
  })
})

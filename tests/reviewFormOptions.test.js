import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { deferred, find, node, renderer, settle, trigger } from './helpers/vue-renderer'

const mocks = vi.hoisted(() => ({ ratings: vi.fn() }))
vi.mock('../src/api', () => ({ reviewsApi: { getRatingOptions: mocks.ratings } }))
vi.mock('../src/components/AppSelect.vue', () => ({ default: {
  props: ['id', 'options', 'disabled'], emits: ['update:modelValue'],
  setup(props, { emit }) { return () => h('select', { id: props.id, disabled: props.disabled, onChange: event => emit('update:modelValue', event.target.value) }, props.options.map(option => h('option', { value: option.value }, option.label))) },
} }))
import ReviewForm from '../src/components/ReviewForm.vue'

const apps = []
let submit
beforeEach(() => { vi.resetAllMocks(); submit = vi.fn() })
afterEach(() => apps.splice(0).forEach(app => app.unmount()))
const mount = () => {
  const root = node('root'), app = renderer.createApp({ render: () => h(ReviewForm, { onSubmit: submit }) })
  app.mount(root); apps.push(app)
  return root
}
const response = { data: { data: { ratings: [{ value: 5, label: 'Excellent' }] } } }
it('does not invent rating options after a failed request and allows retry', async () => {
  mocks.ratings.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(response)
  const root = mount()
  await settle()
  expect(find(root, el => el.type === 'select').props.disabled).toBe(true)
  expect(find(root, el => el.type === 'option')).toBeUndefined()
  trigger(find(root, el => el.type === 'form'), 'submit')
  expect(submit).not.toHaveBeenCalled()
  trigger(find(root, el => el.type === 'button' && el.text === 'Retry'), 'click')
  await settle()
  const select = find(root, el => el.type === 'select')
  expect(select.props.disabled).toBe(false)
  trigger(select, 'change', { target: { value: '5' } })
  trigger(find(root, el => el.type === 'form'), 'submit')
  expect(submit).toHaveBeenCalledWith({ rating: 5, comment: '' })
})
it('prevents submission while rating options are loading', async () => {
  const pending = deferred()
  mocks.ratings.mockReturnValue(pending.promise)
  const root = mount()
  trigger(find(root, el => el.type === 'select'), 'change', { target: { value: '5' } })
  trigger(find(root, el => el.type === 'form'), 'submit')
  expect(submit).not.toHaveBeenCalled()
  pending.resolve(response)
  await settle()
})
it('rejects values outside the returned rating contract', async () => {
  mocks.ratings.mockResolvedValue(response)
  const root = mount()
  await settle()
  trigger(find(root, el => el.type === 'select'), 'change', { target: { value: '5invalid' } })
  trigger(find(root, el => el.type === 'form'), 'submit')
  expect(submit).not.toHaveBeenCalled()
})

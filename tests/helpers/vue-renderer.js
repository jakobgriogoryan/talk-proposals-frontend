import { createRenderer, markRaw, nextTick } from 'vue'

// Like real DOM elements, host nodes must not become reactive proxies through refs.
export const node = (type, text = '') => markRaw({
  type, text, props: {}, children: [], parent: null, style: {}, value: '', listeners: {},
  addEventListener(event, handler) { (this.listeners[event] ??= []).push(handler) },
  removeEventListener(event, handler) { this.listeners[event] = (this.listeners[event] || []).filter(fn => fn !== handler) },
  contains(other) {
    for (let current = other; current; current = current.parent) if (current === this) return true
    return false
  },
  focus() { if (typeof document !== 'undefined') document.activeElement = this },
})
export const renderer = createRenderer({
  createElement: type => node(type), createText: text => node('text', text), createComment: text => node('comment', text),
  patchProp(el, key, previous, next) {
    el.props[key] = next
    if (key === 'value') el.value = next
    if (key === 'style' && typeof next === 'object') Object.assign(el.style, next)
  },
  setText: (el, text) => { el.text = text },
  setElementText: (el, text) => { el.text = text; el.children = [] },
  parentNode: el => el.parent,
  nextSibling: el => el.parent?.children[el.parent.children.indexOf(el) + 1] ?? null,
  insert(el, parent, anchor = null) {
    if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1)
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, el)
    el.parent = parent
  },
  remove(el) { if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1); el.parent = null },
})
export const findAll = (root, predicate) => [
  ...(predicate(root) ? [root] : []),
  ...root.children.flatMap(child => findAll(child, predicate)),
]
export const find = (root, predicate) => findAll(root, predicate)[0]
export const settle = async () => { for (let i = 0; i < 10; i++) await nextTick() }
export const trigger = (el, name, details = {}) => {
  const event = { target: el, stopPropagation() {}, preventDefault() {}, ...details }
  const handler = el.props[`on${name[0].toUpperCase()}${name.slice(1)}`]
  for (const fn of Array.isArray(handler) ? handler : handler ? [handler] : []) fn(event)
  for (const fn of el.listeners[name] || []) fn(event)
}
export const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

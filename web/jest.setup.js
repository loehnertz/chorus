// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

import { TextDecoder, TextEncoder } from 'util'

// Keep test output focused: several API route tests intentionally exercise
// error paths (500s) and log console.error. Only suppress the known/expected
// messages when the error object matches our mocked DB errors.
const originalConsoleError = console.error
console.error = (...args) => {
  const [msg, err] = args
  if (typeof msg === 'string' && msg.startsWith('Failed to') && err instanceof Error) {
    if (err.message === 'DB error' || err.message === 'Database connection failed') {
      return
    }
  }
  originalConsoleError(...args)
}

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder
}

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder
}

// Radix UI (Select/Dropdown) relies on these browser APIs
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

if (!global.ResizeObserver) {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (typeof window !== 'undefined') {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }

  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => {}
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => {}
  }
}

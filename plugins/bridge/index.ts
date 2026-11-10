import type { Plugin } from 'vite'
import { CLIENT } from './client.ts'

const DEFAULT_PARENT = 'https://aifiesta.ai'

// The preview bridge: a postMessage channel to the builder origins for errors,
// console output, route changes and click-to-select. `serve` only, so a
// published site carries neither it nor the dev runtime's source tags.
export function aifBridge(options: { parentOrigin?: string } = {}): Plugin {
  // A comma-separated list: the builder is served from more than one origin.
  const parents = (options.parentOrigin ?? process.env.AIF_PARENT_ORIGIN ?? DEFAULT_PARENT)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  return {
    name: 'aif-bridge',
    apply: 'serve',
    enforce: 'pre',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: CLIENT.replace('__AIF_PARENT_ORIGIN__', JSON.stringify(parents)),
          injectTo: 'body',
        },
      ]
    },
  }
}

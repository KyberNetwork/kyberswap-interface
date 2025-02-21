/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
import { ComputePositionConfig } from '@floating-ui/dom'

declare module 'cytoscape-popper' {
  interface PopperOptions extends ComputePositionConfig {
    'this param to prevent no-empty-interface eslint': false
  }

  interface PopperInstance {
    update(): void
  }
}

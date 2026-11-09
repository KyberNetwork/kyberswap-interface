import { Fragment } from 'react'

/**
 * A token symbol for display, with every "/" inside it set smaller. A symbol such as `e/acc` would
 * otherwise read as two tokens wherever it sits in a pair label (`e/acc/USDC`); the pair separator
 * keeps its full size. Only the rendering changes: the text, and so a copy of it, is the real symbol.
 *
 * Always one element, so a flex parent's `gap` never lands between the parts of a symbol.
 */
export default function TokenSymbol({ symbol, className }: { symbol?: string; className?: string }) {
  return (
    <span className={className}>
      {(symbol ?? '').split('/').map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="text-[0.7em]">/</span>}
          {part}
        </Fragment>
      ))}
    </span>
  )
}

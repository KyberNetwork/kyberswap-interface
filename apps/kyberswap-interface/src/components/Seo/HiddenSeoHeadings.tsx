import { ReactNode } from 'react'

// Visually hidden but accessible to screen-readers / SEO crawlers.
const hiddenClasses =
  'absolute m-[-1px] h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip-path:inset(50%)] [clip:rect(0_0_0_0)]'

export const HiddenH1 = ({ children }: { children: ReactNode }) => <h1 className={hiddenClasses}>{children}</h1>

export const HiddenH2 = ({ children }: { children: ReactNode }) => <h2 className={hiddenClasses}>{children}</h2>

import type { ReactNode } from 'react'

type HiddenHeadingProps = {
  children: ReactNode
}

type VisuallyHiddenHeadingProps = HiddenHeadingProps & { as: 'h1' | 'h2' }

const VisuallyHiddenHeading = ({ as: Heading, children }: VisuallyHiddenHeadingProps) => (
  <Heading className="absolute -m-px size-px overflow-hidden whitespace-nowrap border-0 p-0 [clip-path:inset(50%)] [clip:rect(0_0_0_0)]">
    {children}
  </Heading>
)

export const HiddenH1 = ({ children }: HiddenHeadingProps) => (
  <VisuallyHiddenHeading as="h1">{children}</VisuallyHiddenHeading>
)

export const HiddenH2 = ({ children }: HiddenHeadingProps) => (
  <VisuallyHiddenHeading as="h2">{children}</VisuallyHiddenHeading>
)

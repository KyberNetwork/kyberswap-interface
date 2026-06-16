import { ButtonHTMLAttributes, HTMLAttributes, LabelHTMLAttributes, createElement, forwardRef } from 'react'

import { cn } from 'utils/cn'

export type StackProps = HTMLAttributes<HTMLElement> &
  ButtonHTMLAttributes<HTMLButtonElement> &
  LabelHTMLAttributes<HTMLLabelElement> & {
    /** Render as a different HTML element. */
    as?: keyof JSX.IntrinsicElements
  }

const makeStack = (baseClassName: string, displayName: string) => {
  const Component = forwardRef<HTMLElement, StackProps>(({ as = 'div', className, ...rest }, ref) =>
    createElement(as, { ref, className: cn(baseClassName, className), ...rest }),
  )
  Component.displayName = displayName
  return Component
}

export const Stack = makeStack('flex flex-col', 'Stack')
export const HStack = makeStack('flex flex-row', 'HStack')
export const Center = makeStack('flex flex-col items-center justify-center', 'Center')

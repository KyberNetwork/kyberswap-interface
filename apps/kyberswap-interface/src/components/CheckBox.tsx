import { ForwardedRef, InputHTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  borderStyle?: boolean
}

const Checkbox = ({ borderStyle, className, ...params }: Props, ref: ForwardedRef<HTMLInputElement>) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn(borderStyle ? 'ks-checkbox-border' : 'ks-checkbox-native', className)}
    {...params}
  />
)

export default forwardRef<HTMLInputElement, Props>(Checkbox)

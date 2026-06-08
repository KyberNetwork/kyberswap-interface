import { CSSProperties, InputHTMLAttributes } from 'react'

import { cn } from 'utils/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { borderColor?: string }

export default function Input({ borderColor, color, type, className, style, ...props }: InputProps) {
  const isPassword = type === 'password'
  const overrides: CSSProperties = {
    ...(color ? { color } : null),
    ...(borderColor ? { borderColor } : null),
    // Mask user input visually while keeping type=text (browser autofill compat).
    // WebkitTextSecurity is non-standard; not in React's CSSProperties type.
    ...(isPassword ? ({ WebkitTextSecurity: 'disc' } as CSSProperties) : null),
    ...style,
  }
  return (
    <input
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      {...props}
      type={isPassword ? 'text' : type}
      className={cn(
        'flex w-full items-center whitespace-nowrap rounded-[20px] border border-border bg-buttonBlack px-3.5 py-3 text-sm text-subText outline-none transition-[border] duration-500 placeholder:text-xs placeholder:text-border',
        className,
      )}
      style={overrides}
    />
  )
}

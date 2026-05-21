import React, { CSSProperties, ChangeEvent, useCallback } from 'react'

import { cn } from 'utils/cn'

interface InputSliderProps {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  size?: number
  style?: CSSProperties
  className?: string
}

export default function Slider({
  value,
  onChange,
  min = 0,
  step = 1,
  max = 100,
  size = 28,
  style,
  className,
}: InputSliderProps) {
  const changeCallback = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value))
    },
    [onChange],
  )

  // Default inline style preserves the original 90% width with 15px horizontal margins.
  const defaultStyle: CSSProperties = { width: '90%', marginLeft: 15, marginRight: 15, padding: '15px 0' }
  const inline: CSSProperties = {
    // Pass size to the .ks-slider thumb/track rules.
    ['--ks-slider-size' as never]: `${size}px`,
    ...(style ?? defaultStyle),
  }

  return (
    <input
      type="range"
      value={value}
      style={inline}
      onChange={changeCallback}
      aria-labelledby="input slider"
      step={step}
      min={min}
      max={max}
      className={cn('ks-slider', className)}
    />
  )
}

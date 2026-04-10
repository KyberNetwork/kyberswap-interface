import { type ReactNode } from 'react'
import styled, { css } from 'styled-components'

export type SegmentedControlOption<T extends string = string> = {
  label: ReactNode
  value: T
  disabled?: boolean
}

type SegmentedControlProps<T extends string> = {
  onChange?: (value: T) => void
  options?: readonly SegmentedControlOption<T>[]
  size?: 'sm' | 'md'
  value?: T
}

const sizeStyles = {
  sm: css`
    padding: 8px;
  `,
  md: css`
    padding: 8px 12px;
  `,
}

const Container = styled.div<{ $optionCount: number }>`
  display: grid;
  position: relative;
  grid-template-columns: repeat(${({ $optionCount }) => $optionCount}, minmax(0, 1fr));
  align-items: center;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.background};
`

const ActivePill = styled.div<{ $activeIndex: number; $optionCount: number }>`
  position: absolute;
  top: 1px;
  bottom: 1px;
  left: 1px;
  width: calc((100% - 2px) / ${({ $optionCount }) => $optionCount});
  border-radius: 999px;
  background: ${({ theme }) => theme.tabActive};
  transform: translateX(calc(100% * ${({ $activeIndex }) => $activeIndex}));
  transition: transform 200ms ease, background 200ms ease;
  pointer-events: none;
`

const OptionButton = styled.button<{ $active: boolean; $size: 'sm' | 'md' }>`
  position: relative;
  z-index: 1;
  min-width: 48px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 200ms ease, background 200ms ease;

  ${({ $size }) => sizeStyles[$size]}

  :hover:not(:disabled) {
    background: ${({ theme, $active }) => ($active ? 'transparent' : theme.buttonGray)};
  }

  :disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`

const SegmentedControl = <T extends string>({
  onChange,
  options = [],
  size = 'sm',
  value,
}: SegmentedControlProps<T>) => {
  if (!options.length) return null

  const activeIndex = options.findIndex(option => option.value === value)

  return (
    <Container $optionCount={options.length} role="tablist">
      <ActivePill $activeIndex={Math.max(activeIndex, 0)} $optionCount={options.length} />
      {options.map(option => (
        <OptionButton
          $active={option.value === value}
          $size={size}
          aria-selected={option.value === value}
          disabled={option.disabled || !onChange}
          key={option.value}
          onClick={() => !option.disabled && onChange?.(option.value)}
          role="tab"
          type="button"
        >
          {option.label}
        </OptionButton>
      ))}
    </Container>
  )
}

export default SegmentedControl

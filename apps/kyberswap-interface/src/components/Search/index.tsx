import { t } from '@lingui/macro'
import React, { HTMLAttributes, InputHTMLAttributes, forwardRef, useRef } from 'react'
import { X } from 'react-feather'

import { ButtonEmpty } from 'components/Button'
import SearchIcon from 'components/Icons/Search'
import { cn } from 'utils/cn'

type ContainerProps = HTMLAttributes<HTMLDivElement> & { minWidth?: string }

export const Container = forwardRef<HTMLDivElement, ContainerProps>(({ minWidth, className, style, ...rest }, ref) => (
  <div
    ref={ref}
    style={{ ...style, ['--search-min-width' as never]: minWidth || '320px' }}
    className={cn(
      'relative z-[1] rounded-full bg-background',
      // Min-width kicks in at >= 480px (custom breakpoint, hence arbitrary screen).
      'max-sm:w-full min-[480px]:min-w-[var(--search-min-width)]',
      className,
    )}
    {...rest}
  />
))
Container.displayName = 'SearchContainer'

export const Wrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative box-border flex w-full flex-row items-center justify-end rounded-[40px] px-3 py-1.5',
      'max-[500px]:min-w-full max-[500px]:shadow-none',
      className,
    )}
    {...rest}
  />
))
Wrapper.displayName = 'SearchWrapper'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'relative flex w-full items-center whitespace-nowrap border-none bg-transparent text-xs text-text outline-none placeholder:text-xs placeholder:text-subText',
        className,
      )}
      {...rest}
    />
  ),
)
Input.displayName = 'SearchInput'

interface SearchProps {
  searchValue: string
  onSearch: (newSearchValue: string) => void
  placeholder?: string
  allowClear?: boolean
  minWidth?: string
  style?: React.CSSProperties
  /**
   * Show only the magnifier until the pointer or the keyboard reaches it, on screens that have a
   * pointer at all. A field with something typed into it stays open, or leaving it would hide what
   * the list is being filtered by.
   */
  collapsible?: boolean
  /** How wide the collapsible field opens to. */
  expandedWidth?: string
  className?: string
}

const Search = ({
  searchValue,
  onSearch,
  placeholder,
  minWidth,
  style,
  collapsible,
  expandedWidth,
  className,
}: SearchProps) => {
  const open = Boolean(searchValue)
  // A pointer that cannot hover — a tablet's — still has to be able to open the field.
  const input = useRef<HTMLInputElement>(null)

  return (
    <Container
      onClick={collapsible ? () => input.current?.focus() : undefined}
      style={{ ...style, ...(collapsible ? { ['--search-open-width' as never]: expandedWidth || '280px' } : null) }}
      minWidth={collapsible ? '0px' : minWidth}
      className={cn(
        collapsible &&
          cn(
            'group overflow-hidden transition-[width] duration-200 motion-reduce:transition-none',
            // Below the breakpoint there is no pointer to hover with, so the field stays as it was.
            'max-sm:w-full sm:w-9',
            open
              ? 'sm:w-[var(--search-open-width)]'
              : 'sm:focus-within:w-[var(--search-open-width)] sm:hover:w-[var(--search-open-width)]',
          ),
        className,
      )}
    >
      <Wrapper
        className={cn(
          // Shut, the box is the magnifier's own: it sits in the middle of it rather than against a
          // padded edge that is no longer there.
          collapsible &&
            !open &&
            'sm:justify-center sm:px-0 sm:group-focus-within:justify-end sm:group-focus-within:px-3 sm:group-hover:justify-end sm:group-hover:px-3',
        )}
      >
        <Input
          // A field still holding its width would push the magnifier off the middle of a shut box.
          className={cn(collapsible && !open && 'sm:w-0 sm:group-focus-within:w-full sm:group-hover:w-full')}
          ref={input}
          type="text"
          data-testid="search-pool"
          placeholder={placeholder || t`Search by pool address`}
          value={searchValue}
          onChange={e => {
            onSearch(e.target.value)
          }}
        />
        {searchValue && (
          <ButtonEmpty onClick={() => onSearch('')} className="w-max px-1 py-0.5">
            <X className="min-w-[14px] text-subText" size={14} />
          </ButtonEmpty>
        )}
        <SearchIcon className="shrink-0 text-subText" onClick={() => onSearch(searchValue)} />
      </Wrapper>
    </Container>
  )
}

export default Search

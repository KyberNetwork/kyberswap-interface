import { t } from '@lingui/macro'
import React, { HTMLAttributes, InputHTMLAttributes, forwardRef } from 'react'
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
}

const Search = ({ searchValue, onSearch, placeholder, minWidth, style }: SearchProps) => {
  return (
    <Container style={style} minWidth={minWidth}>
      <Wrapper>
        <Input
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
        <SearchIcon className="text-subText" onClick={() => onSearch(searchValue)} />
      </Wrapper>
    </Container>
  )
}

export default Search

import { CSSProperties } from 'react'
import { Search, X } from 'react-feather'

import { cn } from 'utils/cn'

export default function SearchInput({
  value,
  maxLength = 255,
  onChange,
  placeholder,
  style,
  className,
}: {
  maxLength?: number
  placeholder: string
  value: string
  onChange: (val: string) => void
  style?: CSSProperties
  className?: string
}) {
  return (
    <div
      style={style}
      className={cn(
        'flex w-[320px] items-center gap-2 rounded-full bg-background px-3 py-2 text-sm max-sm:w-full [&>svg]:cursor-pointer',
        className,
      )}
    >
      <input
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="max-w-[calc(100%-20px)] flex-1 truncate border-none bg-inherit text-text outline-none placeholder:text-disableText"
      />
      {value ? (
        <X className="min-w-4 cursor-pointer text-subText" size={16} onClick={() => onChange('')} />
      ) : (
        <Search className="min-w-4 text-subText" size={16} />
      )}
    </div>
  )
}

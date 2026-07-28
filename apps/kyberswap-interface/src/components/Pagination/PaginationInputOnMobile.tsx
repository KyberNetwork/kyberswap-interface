import React, { useEffect, useRef, useState } from 'react'

const isValidInteger = (s: string): boolean => {
  const numberRegex = /^\d+$/
  return !!s.match(numberRegex)
}

// This is to make the input auto-resize on typing
const getInputWidth = (n: number): number => {
  const minWidth = 48 /* px */
  const maxWidth = 120 /* px */

  const minChar = 3
  const pxPerChar = 8

  return Math.min(minWidth + Math.max(n - minChar, 0) * pxPerChar, maxWidth)
}

type Props = {
  className?: string
  page: number
  lastPage: number
  setPage: (p: number) => void
}

const PaginationInputOnMobile: React.FC<Props> = ({ page, lastPage, setPage }) => {
  const [inputValue, setInputValue] = useState(String(page))
  const inputRef = useRef<HTMLInputElement>(null)

  const minCharLength = Math.max(inputValue.length, String(page).length)
  const width = getInputWidth(minCharLength)

  const handleCommitChange = () => {
    if (!isValidInteger(inputValue)) {
      setInputValue(String(page))
      return
    }

    const newPage = parseInt(inputValue)
    if (Number.isNaN(newPage)) {
      setInputValue(String(page))
      return
    }

    if (newPage <= 0 || newPage > lastPage) {
      setInputValue(String(page))
      return
    }

    setPage(newPage)
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitChange()
      inputRef.current?.blur()
    }
  }

  useEffect(() => {
    setInputValue(String(page))
  }, [page])

  return (
    <div className="mx-1 inline-flex w-min items-center gap-2">
      <div className="inline-flex w-min items-center">
        <input
          ref={inputRef}
          value={inputValue}
          type="number"
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleCommitChange}
          onKeyUp={handleKeyUp}
          style={{ width: `${width}px` }}
          className="h-full overflow-hidden truncate rounded-[20px] border-0 bg-buttonBlack px-3 py-2 text-center text-xs font-medium leading-4 text-primary outline-none [appearance:textfield] placeholder:text-subText [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        />
      </div>
      <span className="text-xs font-medium leading-4 text-subText">/</span>
      <span className="text-xs font-medium leading-4 text-subText">{lastPage}</span>
    </div>
  )
}

export default PaginationInputOnMobile

import { t } from '@lingui/macro'
import React from 'react'
import { Search } from 'react-feather'

type Props = {
  text: string
  setText: (txt: string) => void
}

const SearchBar: React.FC<Props> = ({ text, setText }) => {
  return (
    <div className="relative h-9 w-full">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t`Search for a liquidity source`}
        className="size-full rounded-[40px] border-0 bg-buttonBlack py-2 pl-3 pr-9 text-sm font-medium leading-5 text-inherit outline-none"
      />
      <div className="absolute right-3 top-0 flex h-full w-[18px] items-center text-subText">
        <Search />
      </div>
    </div>
  )
}

export default SearchBar

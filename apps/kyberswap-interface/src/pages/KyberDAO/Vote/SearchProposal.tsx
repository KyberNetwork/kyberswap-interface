import { t } from '@lingui/macro'

import Search from 'components/Icons/Search'

export default function SearchProposal({ search, setSearch }: { search?: string; setSearch?: (s: string) => void }) {
  return (
    <div className="relative flex rounded-[20px] bg-background px-3 py-1.5 text-sm font-medium text-border">
      <input
        placeholder={t`Search proposals`}
        value={search}
        onChange={e => setSearch?.(e.target.value)}
        className="w-[min(400px,35vw)] border-none bg-transparent leading-[18px] text-subText outline-none placeholder:text-border"
      />
      <Search />
    </div>
  )
}

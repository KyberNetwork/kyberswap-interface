import { t } from '@lingui/macro'

import Search from 'components/Icons/Search'

export default function SearchProposal({ search, setSearch }: { search?: string; setSearch?: (s: string) => void }) {
  return (
    <div className="relative flex h-9 w-full items-center gap-2 rounded-full bg-background px-3 text-sm font-medium text-border sm:max-w-sm">
      <input
        placeholder={t`Search proposals`}
        value={search}
        onChange={e => setSearch?.(e.target.value)}
        className="min-w-0 flex-1 border-none bg-transparent text-subText outline-none placeholder:text-border"
      />
      <Search />
    </div>
  )
}

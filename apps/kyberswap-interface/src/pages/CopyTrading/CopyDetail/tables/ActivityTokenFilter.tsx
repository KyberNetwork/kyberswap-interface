import { Check } from 'react-feather'
import type { Token } from 'services/copyTrading/types/agents'

import Select from 'components/Select'

const tokenKey = (token: Token) => `${token.chainId}:${token.address}`
const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

export type ActivityTokenFilterProps = {
  tokens: Token[]
  selectedToken?: Token
  onChange: (token: Token | undefined) => void
}

const ActivityTokenFilter = ({ tokens, selectedToken, onChange }: ActivityTokenFilterProps) => {
  const choices = new Map(tokens.map(token => [tokenKey(token), token]))
  // Keep the active filter visible during refreshes and empty results.
  if (selectedToken && !choices.has(tokenKey(selectedToken))) choices.set(tokenKey(selectedToken), selectedToken)
  const options = [
    { value: '', label: <span className="text-subText">ALL TOKENS</span> },
    ...Array.from(choices, ([value, token]) => ({
      value,
      label: <span className="text-subText">{token.symbol?.trim() || shortAddress(token.address)}</span>,
    })),
  ]
  const value = selectedToken ? tokenKey(selectedToken) : ''

  return (
    <Select
      arrow="chevron"
      arrowSize={14}
      className="w-[180px] min-w-0 bg-white/[0.08] px-3 py-2 text-xs font-medium text-subText hover:bg-white/[0.14]"
      matchMenuWidth
      onChange={(key: string) => onChange(choices.get(key))}
      options={options}
      value={value}
      optionRender={option => (
        <span className="flex w-full items-center justify-between gap-3">
          {option?.label}
          {option?.value === value && <Check className="shrink-0 text-subText" size={14} />}
        </span>
      )}
      dropdownRender={menu => (
        <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto" onClick={event => event.stopPropagation()}>
          {menu}
        </div>
      )}
    />
  )
}

export default ActivityTokenFilter

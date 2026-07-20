import { Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useMemo, useState } from 'react'

import AddTokenToMetaMask from 'components/AddToMetamask'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { getMarketTokenInfo } from 'components/TokenInfo/utils'
import { useActiveWeb3React } from 'hooks'
import useTokenInfo from 'hooks/useTokenInfo'
import { shortenAddress } from 'utils'

export const InfoRow = ({ label, value }: { label: ReactNode; value: ReactNode }) => (
  <div className="flex min-h-7 items-center justify-between gap-3 rounded px-2 py-1 hover:bg-tabActive">
    <div className="flex min-w-0 items-center text-xs text-subText">{label}</div>
    <div className="flex min-w-0 items-center justify-end text-right text-xs font-medium text-text">{value}</div>
  </div>
)

const MarketInfo = ({ token }: { token: Token | undefined }) => {
  const { data: tokenInfo, loading } = useTokenInfo(token)
  const [expand, setExpand] = useState(false)
  const { chainId } = useActiveWeb3React()
  const listData = useMemo(() => getMarketTokenInfo(tokenInfo), [tokenInfo])
  const primaryInfo = listData.slice(0, 3)
  const extraInfo = listData.slice(3)
  const contractAddress = token ? (
    <div className="flex min-w-0 items-center justify-end gap-1">
      <CurrencyLogo currency={token} size="16px" />
      <span className="whitespace-nowrap text-xs font-medium text-text">
        {shortenAddress(chainId, token.address, 3)}
      </span>
      <CopyHelper toCopy={token.address} />
      <AddTokenToMetaMask token={token} />
    </div>
  ) : (
    <Loader />
  )

  return (
    <div className="flex w-full flex-col gap-2 rounded-sm p-4">
      {primaryInfo.map(item => (
        <InfoRow key={item.label} label={item.label} value={loading ? <Loader size="10px" /> : item.value} />
      ))}

      <div
        className="flex flex-col gap-2 overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-in-out"
        style={{
          maxHeight: expand ? 240 : 0,
          opacity: expand ? 1 : 0,
          transform: expand ? 'translateY(0)' : 'translateY(-4px)',
          marginBottom: expand ? 0 : -8,
        }}
      >
        {extraInfo.map(item => (
          <InfoRow key={item.label} label={item.label} value={loading ? <Loader size="10px" /> : item.value} />
        ))}
      </div>

      <InfoRow label={<Trans>Contract Address</Trans>} value={contractAddress} />

      <div className="flex h-6 items-center justify-center">
        <button
          type="button"
          onClick={() => setExpand(!expand)}
          className="flex w-fit cursor-pointer items-center justify-center gap-0.5 border-0 bg-transparent p-0 text-xs font-medium text-primary hover:brightness-75 focus-visible:outline-none"
        >
          {!expand ? <Trans>View more</Trans> : <Trans>View less</Trans>} <DropdownArrowIcon rotate={expand} />
        </button>
      </div>
    </div>
  )
}

export default MarketInfo

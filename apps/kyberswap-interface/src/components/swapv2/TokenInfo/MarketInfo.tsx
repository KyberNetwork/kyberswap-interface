import { Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo, useState } from 'react'

import AddTokenToMetaMask from 'components/AddToMetamask'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { RowBetween, RowFit } from 'components/Row'
import { getMarketTokenInfo } from 'components/swapv2/TokenInfo/utils'
import { useActiveWeb3React } from 'hooks'
import useTokenInfo from 'hooks/useTokenInfo'
import { shortenAddress } from 'utils'

export default function MarketInfo({ token }: { token: Token | undefined }) {
  const { data: tokenInfo, loading } = useTokenInfo(token)
  const [expand, setExpand] = useState(false)
  const { chainId } = useActiveWeb3React()
  const listData = useMemo(() => getMarketTokenInfo(tokenInfo), [tokenInfo])

  return (
    <div className="flex w-full flex-col gap-3 rounded-sm px-[26px]">
      {(expand ? listData : listData.slice(0, 3)).map(item => (
        <RowBetween key={item.label}>
          <span className="text-xs text-subText">{item.label}</span>
          <span className="text-xs font-medium text-text">{loading ? <Loader size="10px" /> : item.value}</span>
        </RowBetween>
      ))}

      <RowBetween style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <span className="text-xs text-subText">
          <Trans>Contract Address</Trans>
        </span>

        <RowFit gap="4px">
          {token ? (
            <>
              <CurrencyLogo currency={token} size="16px" />
              <span className="text-xs font-medium text-text">{shortenAddress(chainId, token.address, 3)}</span>
              <CopyHelper toCopy={token.address} />
              <AddTokenToMetaMask token={token} />
            </>
          ) : (
            <Loader />
          )}
        </RowFit>
      </RowBetween>

      <div
        onClick={() => setExpand(!expand)}
        className="flex h-5 cursor-pointer items-center justify-center gap-0.5 text-xs font-medium text-primary"
      >
        {!expand ? <Trans>View more</Trans> : <Trans>View less</Trans>} <DropdownArrowIcon rotate={expand} />
      </div>
    </div>
  )
}

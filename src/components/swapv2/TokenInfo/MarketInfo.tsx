import { Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import AddTokenToMetaMask from 'components/AddToMetamask'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTokenInfo from 'hooks/useTokenInfo'
import { formattedNum, shortenAddress } from 'utils'
import { formatLongNumber } from 'utils/formatBalance'

const NOT_AVAIALBLE = '--'

const Wrapper = styled.div`
  border-radius: 4px;
  width: 100%;
  padding: 0 26px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const InfoRowLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
`

const InfoRowValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 12px;
  font-weight: 500;
`
export default function MarketInfo({ token }: { token: Token | undefined }) {
  const { data: tokenInfo, loading } = useTokenInfo(token)
  const [expand, setExpand] = useState(false)
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const listData = [
    { label: t`Price`, value: tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAIALBLE },
    {
      label: t`Market Cap Rank`,
      value: tokenInfo.marketCapRank ? `#${formattedNum(tokenInfo.marketCapRank.toString())}` : NOT_AVAIALBLE,
    },
    {
      label: t`Trading Volume (24H)`,
      value: tokenInfo.tradingVolume ? formatLongNumber(tokenInfo.tradingVolume.toString(), true) : NOT_AVAIALBLE,
    },
    {
      label: t`Market Cap`,
      value: tokenInfo.marketCap ? formatLongNumber(tokenInfo.marketCap.toString(), true) : NOT_AVAIALBLE,
    },
    {
      label: t`All-Time High`,
      value: tokenInfo.allTimeHigh ? formattedNum(tokenInfo.allTimeHigh.toString(), true) : NOT_AVAIALBLE,
    },
    {
      label: t`All-Time Low`,
      value: tokenInfo.allTimeLow ? formattedNum(tokenInfo.allTimeLow.toString(), true) : NOT_AVAIALBLE,
    },
    {
      label: t`Circulating Supply`,
      value: tokenInfo.circulatingSupply ? formatLongNumber(tokenInfo.circulatingSupply.toString()) : NOT_AVAIALBLE,
    },
    {
      label: t`Total Supply`,
      value: tokenInfo.totalSupply ? formatLongNumber(tokenInfo.totalSupply.toString()) : NOT_AVAIALBLE,
    },
  ]
  return (
    <Wrapper>
      {(expand ? listData : listData.slice(0, 3)).map(item => (
        <RowBetween key={item.label}>
          <InfoRowLabel>{item.label}</InfoRowLabel>
          <InfoRowValue>{loading ? <Loader size="10px" /> : item.value}</InfoRowValue>
        </RowBetween>
      ))}

      <RowBetween style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <InfoRowLabel>
          <Trans>Contract Address</Trans>
        </InfoRowLabel>

        <Flex width="fit-content" alignItems={'center'} sx={{ gap: '4px' }}>
          {token ? (
            <>
              <CurrencyLogo currency={token} size="16px" />
              <InfoRowValue>{shortenAddress(chainId, token.address, 3)}</InfoRowValue>
              <CopyHelper toCopy={token.address} />
              <AddTokenToMetaMask token={token} />
            </>
          ) : (
            <Loader />
          )}
        </Flex>
      </RowBetween>

      <Flex
        sx={{
          alignItems: 'center',
          gap: '2px',
          cursor: 'pointer',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '500',
          height: '20px',
        }}
        color={theme.primary}
        onClick={() => setExpand(!expand)}
      >
        {expand ? <Trans>View more</Trans> : <Trans>View less</Trans>} <DropdownArrowIcon rotate={expand} />
      </Flex>
    </Wrapper>
  )
}

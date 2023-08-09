import { Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import AddTokenToMetaMask from 'components/AddToMetamask'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import { getMarketTokenInfo } from 'components/swapv2/TokenInfo/utils'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTokenInfo from 'hooks/useTokenInfo'
import { shortenAddress } from 'utils'

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
  const listData = useMemo(() => getMarketTokenInfo(tokenInfo), [tokenInfo])

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
        {!expand ? <Trans>View more</Trans> : <Trans>View less</Trans>} <DropdownArrowIcon rotate={expand} />
      </Flex>
    </Wrapper>
  )
}

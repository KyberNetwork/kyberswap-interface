import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { ArrowDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { NetworkLogo } from 'components/Logo'
import { RowBetween } from 'components/Row'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useCrossChainState } from 'state/crossChain/hooks'
import { formattedNum } from 'utils'
import { uint256ToFraction } from 'utils/numbers'

const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 24px;
  font-weight: 500;
`

const CurrencyInputAmountWrapper = styled(Flex)`
  flex-direction: column;
  gap: 8px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px 16px;
`

const ArrowDownWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.buttonGray};
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: calc(76px - 6px);
  left: 50%;
  transform: translateX(-50%);
`

const Network = ({ chainId }: { chainId: ChainId | undefined }) => {
  const theme = useTheme()
  if (!chainId) return null
  return (
    <Flex alignItems={'center'} sx={{ gap: '4px' }}>
      <NetworkLogo chainId={chainId} style={{ width: 16 }} />{' '}
      <Text fontSize={12} color={theme.subText} fontWeight={'500'}>
        {NETWORKS_INFO[chainId].name}
      </Text>
    </Flex>
  )
}

export default function SwapBrief() {
  const theme = useTheme()
  const [{ currencyIn, currencyOut, chainIdOut, formatRoute }] = useCrossChainState()
  const { chainId } = useActiveWeb3React()

  const { amountUsdIn, amountUsdOut, outputAmount, inputAmount } = formatRoute

  const renderAmount = (amount: string | undefined, decimals: number | undefined) => {
    try {
      return (
        <TruncatedText>
          {amount ? uint256ToFraction(amount, decimals).toSignificant(RESERVE_USD_DECIMALS) : '--'}
        </TruncatedText>
      )
    } catch (error) {
      return null
    }
  }

  const renderAmountUsd = (amountUsdOut: string | undefined | number) => {
    return (
      <Text fontSize={14} fontWeight={500} color={theme.subText}>
        {amountUsdOut ? `~${formattedNum(amountUsdOut, true)}` : '--'}
      </Text>
    )
  }

  return (
    <AutoColumn gap="sm" style={{ position: 'relative' }}>
      <CurrencyInputAmountWrapper>
        <RowBetween>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>Input Amount</Trans>
          </Text>
          <Network chainId={chainId} />
        </RowBetween>
        <RowBetween>
          {renderAmount(inputAmount, currencyIn?.decimals)}
          <Flex alignItems="center" sx={{ gap: '8px' }} minWidth="fit-content">
            {renderAmountUsd(amountUsdIn)}
            <CurrencyLogo currency={currencyIn} size="24px" />
            <Text fontSize={20} fontWeight={500} color={theme.subText}>
              {currencyIn?.symbol}
            </Text>
          </Flex>
        </RowBetween>
      </CurrencyInputAmountWrapper>

      <ArrowDownWrapper>
        <ArrowDown size="12" color={theme.subText} />
      </ArrowDownWrapper>

      <CurrencyInputAmountWrapper>
        <RowBetween>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>Output Amount</Trans>
          </Text>
          <Network chainId={chainIdOut} />
        </RowBetween>
        <RowBetween>
          {renderAmount(outputAmount, currencyOut?.decimals)}
          <Flex alignItems="center" sx={{ gap: '8px' }} minWidth="fit-content">
            {renderAmountUsd(amountUsdOut)}
            <CurrencyLogo currency={currencyOut} size="24px" />
            <Text fontSize={20} fontWeight={500} color={theme.subText}>
              {currencyOut?.symbol}
            </Text>
          </Flex>
        </RowBetween>
      </CurrencyInputAmountWrapper>
    </AutoColumn>
  )
}

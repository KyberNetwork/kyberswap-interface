import React, { useState } from 'react'
import { Token, ChainId, WETH } from '@vutien/sdk-core'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import CopyHelper from 'components/Copy'
import { Share2, ChevronDown, ChevronUp } from 'react-feather'
import { shortenAddress } from 'utils'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { useActiveWeb3React } from 'hooks'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { Link } from 'react-router-dom'
import useTheme from 'hooks/useTheme'
import { ProMMPoolData } from 'state/prommPools/hooks'
import { ExternalLink } from 'theme'
import { formatDollarAmount } from 'utils/numbers'
import { t, Trans } from '@lingui/macro'
import InfoHelper from 'components/InfoHelper'
import Divider from 'components/Divider'
import { nativeOnChain } from 'constants/tokens'

interface ListItemProps {
  pair: ProMMPoolData[]
  idx: number
  onShared: (id: string) => void
  userPositions: { [key: string]: number }
}

const getPrommAnalyticLink = (chainId: number | undefined, poolAddress: string) => {
  switch (chainId) {
    case ChainId.RINKEBY:
      return `https://promm-analytics.vercel.app/#/rinkeby/pools/${poolAddress}`
    default:
      return ''
  }
}

export const Wrapper = styled.div`
  padding: 20px 16px;
  font-size: 12px;
  background-color: ${({ theme }) => theme.background};
  border-radius: 8px;
  margin-bottom: 20px;
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text};
  flex-direction: column;
`

const PoolAddressContainer = styled(Flex)`
  align-items: center;
`

export const TokenPairContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const ButtonWrapper = styled(Flex)`
  justify-content: flex-end;
  gap: 4px;
  align-items: center;
`

export default function ProAmmPoolCardItem({ pair, onShared, userPositions }: ListItemProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(true)

  const token0 = new Token(chainId as ChainId, pair[0].token0.address, pair[0].token0.decimals, pair[0].token0.symbol)
  const token1 = new Token(chainId as ChainId, pair[0].token1.address, pair[0].token1.decimals, pair[0].token1.symbol)

  const token0Symbol = token0.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
    ? nativeOnChain(chainId as ChainId).symbol
    : token0.symbol
  const token1Symbol =
    token1.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
    ? nativeOnChain(chainId as ChainId).symbol
    : token1.symbol
  return (
    <>
      <Flex justifyContent="space-between" marginY="20px">
        <Flex alignItems="center">
          <DoubleCurrencyLogo size={24} currency0={token0} currency1={token1} />
          <Text fontSize={20} fontWeight="500">
            {token0Symbol} - {token1Symbol}
          </Text>
        </Flex>
        <ButtonEmpty
          padding="0"
          disabled={pair.length === 1}
          style={{ width: '28px' }}
          onClick={() => {
            pair.length > 1 && setIsOpen(prev => !prev)
          }}
        >
          {isOpen && pair.length > 1 ? (
            <ChevronUp size="24px" color={theme.text} />
          ) : (
            <ChevronDown size="24px" color={theme.text} />
          )}
        </ButtonEmpty>
      </Flex>
      {pair.map((pool, index) => {
        const myLiquidity = userPositions[pool.address]
        if (pair.length > 1 && index !== 0 && !isOpen) return null
        return (
          <Wrapper key={pool.address}>
            <DataText justifyContent="center" alignItems="center">
              <PoolAddressContainer>
                <Text color={theme.text} fontSize="16px">
                  {shortenAddress(pool.address, 3)}
                </Text>
                <CopyHelper toCopy={pool.address} />
              </PoolAddressContainer>
              <Flex marginTop={'4px'}>
                <Text color={theme.subText} fontSize={12}>
                  Fee = {pool.feeTier / 100}%
                </Text>
                <InfoHelper
                    text={t`A token pair can have multiple pools, each with a different swapping fee. Your swap fee earnings will be automatically reinvested in your pool`}
                  />
                </Flex>
            </DataText>

            <Flex marginTop="20px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                <Trans>Total Value Locked</Trans>
              </Text>
              <Text>{formatDollarAmount(pool.tvlUSD)}</Text>
            </Flex>

            <Flex marginTop="16px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                APR
                <InfoHelper size={14} text={t`Estimated return based on yearly fees of the pool`} />
              </Text>
              <DataText alignItems="flex-end" color={theme.apr}>
                {pool.apr.toFixed(2)}%
              </DataText>
            </Flex>

            <Flex marginTop="16px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                <Trans>Volume (24H)</Trans>
              </Text>
              <Text>{formatDollarAmount(pool.volumeUSD)}</Text>
            </Flex>

            <Flex marginTop="16px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                <Trans>Fees (24H)</Trans>
              </Text>
              <Text>{formatDollarAmount(pool.volumeUSD * (pool.feeTier / 10000))}</Text>
            </Flex>

            <Flex marginTop="16px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                <Trans>Your Liquidity Balance</Trans>
              </Text>
              <Text>{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</Text>
            </Flex>

            <Flex marginY="20px" justifyContent="space-between" fontSize="14px">
              <ButtonPrimary
                as={Link}
                to={
                  myLiquidity
                    ? `/myPools?search=${pool.address}`
                    : `/proamm/add/${pool.token0.address}/${pool.token1.address}/${pool.feeTier}`
                }
              >
                <Trans>Add Liquidity</Trans>
              </ButtonPrimary>
            </Flex>

            <Divider />

            <Flex marginTop="16px" fontSize="14px" justifyContent="space-between">
              <ExternalLink href={getPrommAnalyticLink(chainId, pool.address)}>Analytics ↗</ExternalLink>

              <ButtonEmpty
                width="max-content"
                padding="0"
                onClick={e => {
                  e.stopPropagation()
                  onShared(pool.address)
                }}
              >
                <Text marginRight="4px">
                  <Trans>Share</Trans>
                </Text>
                <Share2 size="14px" color={theme.primary} />
              </ButtonEmpty>
            </Flex>
          </Wrapper>
        )
      })}
    </>
  )
}

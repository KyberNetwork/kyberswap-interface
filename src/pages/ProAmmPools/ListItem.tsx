import React, { useState } from 'react'
import { Token, ChainId, WETH } from '@vutien/sdk-core'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import CopyHelper from 'components/Copy'
import { Share2, BarChart2, ChevronDown, ChevronUp } from 'react-feather'
import { shortenAddress } from 'utils'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { useActiveWeb3React } from 'hooks'
import { ButtonEmpty } from 'components/Button'
import { Link } from 'react-router-dom'
import { darken, rgba } from 'polished'
import { Plus } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { ProMMPoolData } from 'state/prommPools/hooks'
import Divider from 'components/Divider'
import { ExternalLink } from 'theme'
import { formatDollarAmount } from 'utils/numbers'
import { nativeOnChain } from 'constants/tokens'
import ViewPositionIcon from '../../assets/svg/view_positions.svg'
import { Trans } from '@lingui/macro'
import { MouseoverTooltip } from 'components/Tooltip'

const Dropdown = styled.div`
  display: none;
  position: absolute;
  background: ${({ theme }) => theme.tableHeader};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 8px;
  padding: 8px 4px;
  width: max-content;
  top: 36px;

  left: 50%;
  transform: translate(-50%, 0);
  z-index: 1000;
`
const HoverDropdown = styled.div<{ active: boolean }>`
  position: relative;
  display: inline-block;
  cursor: pointer;

  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;


  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};

    ${Dropdown} {
      display: flex;
      flex-direction: column;
    }
  }
`


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

export const TableRow = styled.div<{ isOpen?: boolean; isShowBorderBottom: boolean; hoverable: boolean }>`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1.5fr 1.5fr 1.5fr 0.75fr 1fr 1fr 1.2fr 1.5fr;
  padding: 24px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  background-color: ${({ theme, isOpen }) => (isOpen ? theme.tableHeader : theme.background)};
  position: relative;

  ${({ theme, hoverable }) =>
    hoverable
      ? `
    :hover {
      background-color: ${theme.tableHeader};
      cursor: pointer;
    }
    `
      : ''}

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 86.36%; // 100% - (1.5fr / grid-template-columns)
    border-bottom: ${({ theme, isShowBorderBottom }) => (isShowBorderBottom ? `1px dashed ${theme.border}` : 'none')};
  }
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

export default function ProAmmPoolListItem({ pair, idx, onShared, userPositions }: ListItemProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(pair.length > 1 ? idx === 0 : false)

  const token0 = new Token(chainId as ChainId, pair[0].token0.address, pair[0].token0.decimals, pair[0].token0.symbol)
  const token1 = new Token(chainId as ChainId, pair[0].token1.address, pair[0].token1.decimals, pair[0].token1.symbol)

  return (
    <>
      {pair.map((pool, index) => {
        const myLiquidity = userPositions[pool.address]
        const hoverable = pair.length > 1 && index === 0
        if (pair.length > 1 && index !== 0 && !isOpen) return null

        const token0Address =
          pool.token0.address === WETH[chainId as ChainId].address.toLowerCase()
            ? nativeOnChain(chainId as ChainId).symbol
            : pool.token0.address

        const token0Symbol =
          pool.token0.address === WETH[chainId as ChainId].address.toLowerCase()
            ? nativeOnChain(chainId as ChainId).symbol
            : pool.token0.symbol
  
        const token1Address =
          pool.token1.address === WETH[chainId as ChainId].address.toLowerCase()
            ? nativeOnChain(chainId as ChainId).symbol
            : pool.token1.address
        const token1Symbol =
          pool.token1.address === WETH[chainId as ChainId].address.toLowerCase()
            ? nativeOnChain(chainId as ChainId).symbol
            : pool.token1.symbol

        return (
          <TableRow
            isOpen={isOpen}
            key={pool.address}
            isShowBorderBottom={isOpen && index !== pair.length - 1}
            hoverable={hoverable}
            onClick={() => {
              hoverable && setIsOpen(prev => !prev)
            }}
          >
            {index === 0 ? (
              <DataText>
                <DoubleCurrencyLogo currency0={token0} currency1={token1} />
                <Text fontSize={16} marginTop="8px">
                  {token0Symbol} - {token1Symbol}
                </Text>
              </DataText>
            ) : (
              <DataText />
            )}

            <DataText grid-area="pool">
              <PoolAddressContainer>
                <Text color={theme.text}>{shortenAddress(pool.address, 3)}</Text>
                <CopyHelper toCopy={pool.address} />
              </PoolAddressContainer>
              <Text color={theme.text3} fontSize={12} marginTop={'8px'}>
                Fee = {pool.feeTier / 100}%
              </Text>
            </DataText>
            <DataText alignItems="flex-end">{formatDollarAmount(pool.tvlUSD)}</DataText>
            <DataText alignItems="flex-end" color={theme.apr}>
              {pool.apr.toFixed(2)}%
            </DataText>
            <DataText alignItems="flex-end">{formatDollarAmount(pool.volumeUSD)}</DataText>
            <DataText alignItems="flex-end">{formatDollarAmount(pool.volumeUSD * (pool.feeTier / 10000))}</DataText>
            <DataText alignItems="flex-end">{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</DataText>
            <ButtonWrapper style={{ marginRight: '-3px' }}>
              <MouseoverTooltip text={<Trans> Add liquidity </Trans>} placement={"top"} width={"fit-content"}>
                <ButtonEmpty
                    padding="0"
                    as={Link}
                    to={`/proamm/add/${token0Address}/${token1Address}/${pool.feeTier}`}
                    style={{
                      background: rgba(theme.primary, 0.2),
                      minWidth: '28px',
                      minHeight: '28px',
                      width: '28px',
                      height: '28px',
                    }}
                  >
                    <Plus size={16} color={theme.primary} />
                </ButtonEmpty>
              </MouseoverTooltip>
              {myLiquidity && <MouseoverTooltip text={<Trans> View my position </Trans>} placement={"top"} width={"fit-content"}>
                <ButtonEmpty
                  padding="0"
                  as={Link}
                  to={`/myPools?search=${pool.address}`}
                  style={{
                    background: rgba(theme.primary, 0.2),
                    minWidth: '28px',
                    minHeight: '28px',
                    width: '28px',
                    height: '28px',
                  }}
                >
                  <img src={ViewPositionIcon}/>
                </ButtonEmpty>
              </MouseoverTooltip>
              }
              
              <MouseoverTooltip text={<Trans> Share this pool </Trans>} placement={"top"} width={"fit-content"}>
                <ButtonEmpty
                  padding="0"
                  onClick={e => {
                    e.stopPropagation()
                    onShared(pool.address)
                  }}
                  style={{
                    background: rgba(theme.buttonBlack, 0.2),
                    minWidth: '28px',
                    minHeight: '28px',
                    width: '28px',
                    height: '28px',
                  }}
                >
                  <Share2 size="14px" color={theme.subText} />
                </ButtonEmpty>
              </MouseoverTooltip>
              <ExternalLink href={getPrommAnalyticLink(chainId, pool.address)}>
                <MouseoverTooltip text={<Trans> View analytics </Trans>} placement={"top"} width={"fit-content"}>
                  <ButtonEmpty
                    padding="0"
                    onClick={e => {
                      e.stopPropagation()
                    }}
                    style={{
                      background: rgba(theme.buttonBlack, 0.2),
                      minWidth: '28px',
                      minHeight: '28px',
                      width: '28px',
                      height: '28px',
                    }}
                  >
                    <BarChart2 size="14px" color={theme.subText} />
                  </ButtonEmpty>
                </MouseoverTooltip>
              </ExternalLink>

              <ButtonEmpty padding="0" disabled={pair.length === 1} style={{ width: '28px' }}>
                {index !== 0 ? null : isOpen ? (
                  <ChevronUp size="20px" color={theme.text} />
                ) : (
                  <ChevronDown size="20px" color={theme.text} />
                )}
              </ButtonEmpty>
            </ButtonWrapper>
          </TableRow>
        )
      })}
      <Divider />
    </>
  )
}

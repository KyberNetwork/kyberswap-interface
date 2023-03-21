import { Token } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { Plus, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import Row, { RowBetween, RowFit, RowWrap } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { useFarmV2Action } from 'state/farms/elasticv2/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { PositionDetails } from 'types/position'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { convertTickToPrice } from '../utils'
import { FarmContext } from './FarmCard'
import PriceVisualize from './PriceVisualize'

const Wrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ContentWrapper = styled.div`
  padding: 16px;
  border-radius: 16px;
  background-color: var(--button-black);
`

const NFTsWrapper = styled(RowWrap)`
  --gap: 12px;
  --items-in-row: 4;
`

const NFTItemWrapper = styled.div<{ active?: boolean; disabled?: boolean }>`
  border: 1px solid var(--border);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 12px;
  background-color: var(--button-black);
  cursor: pointer;
  ${({ active, disabled }) =>
    disabled
      ? css`
          opacity: 0.5;
        `
      : active &&
        css`
          border-color: var(--primary);
          background-color: rgba(49, 203, 158, 0.15);
        `}

  :hover {
    filter: brightness(1.3);
  }
`

const CloseButton = styled.div`
  cursor: pointer;
`

export const NFTItem = ({
  active,
  disabled,
  pos,
  onClick,
}: {
  active?: boolean
  disabled?: boolean
  pos?: PositionDetails
  onClick?: (tokenId: string) => void
}) => {
  const { activeRange } = useContext(FarmContext)
  const token0 = useToken(pos?.token0)
  const token1 = useToken(pos?.token1)
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const usdPrices = useTokenPrices(pos ? [pos.token0, pos.token1] : [])

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, pos?.fee)
  const position =
    pool && pos
      ? new Position({
          pool: pool,
          liquidity: pos.liquidity.toString(),
          tickLower: pos.tickLower,
          tickUpper: pos.tickUpper,
        })
      : undefined
  const usd =
    parseFloat(position?.amount0.toExact() || '0') * (usdPrices[0] || 0) +
    parseFloat(position?.amount1.toExact() || '0') * (usdPrices[1] || 0)

  return (
    <>
      {pos && (
        <NFTItemWrapper
          disabled={disabled}
          active={active}
          onClick={() => !disabled && onClick?.(pos.tokenId.toString())}
        >
          <Text fontSize="12px" lineHeight="16px" color="var(--primary)">
            {`#${pos.tokenId.toString()}`}
          </Text>
          {token0 && token1 && (
            <PriceVisualize
              rangeInclude={false}
              token0={token0 as Token}
              token1={token1 as Token}
              tickRangeUpper={activeRange?.tickUpper}
              tickRangeLower={activeRange?.tickLower}
              tickPosLower={pos?.tickLower}
              tickPosUpper={pos?.tickUpper}
              tickCurrent={0}
            />
          )}
          <Text fontSize="12px" lineHeight="16px">
            {formatDollarAmount(usd)}
          </Text>
        </NFTItemWrapper>
      )}
    </>
  )
}

const StakeWithNFTsModal = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const { farm, activeRange } = useContext(FarmContext)
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { positions: allPositions } = useProAmmPositions(account)

  const positions = useMemo(() => {
    return allPositions?.filter(item => item.poolId.toLowerCase() === farm?.poolAddress.toLowerCase())
  }, [allPositions, farm?.poolAddress])

  const [selectedPos, setSelectedPos] = useState<{ [tokenId: string]: boolean }>({})
  const selectedPosArray: Array<number> = useMemo(
    () =>
      Object.keys(selectedPos)
        .filter(key => selectedPos[key] === true)
        .map(p => +p),
    [selectedPos],
  )
  const handlePosClick = useCallback((tokenId: string) => {
    setSelectedPos(prev => {
      return { ...prev, [tokenId]: !prev[tokenId] }
    })
  }, [])
  const { deposit } = useFarmV2Action()

  const handleStake = useCallback(() => {
    if (!farm || activeRange === undefined) return
    deposit(farm.fId, activeRange.index, selectedPosArray).then(txHash => txHash && onDismiss?.())
  }, [farm, activeRange, deposit, onDismiss, selectedPosArray])

  const priceLower = farm && convertTickToPrice(farm.token0, farm.token1, activeRange?.tickLower || 0)

  const priceUpper = farm && convertTickToPrice(farm.token0, farm.token1, activeRange?.tickUpper || 0)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="min(724px, 100vw)">
      <Wrapper>
        <RowBetween>
          <Text fontSize="20px" lineHeight="24px" color={theme.text}>
            <Trans>Stake your liquidity</Trans>
          </Text>
          <CloseButton onClick={onDismiss}>
            <X />
          </CloseButton>
        </RowBetween>
        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
          <Trans>
            Stake your liquidity positions (NFT tokens) into the farms to start earning rewards. Positions that cover
            the Active Range of the farm will earn maximum rewards
          </Trans>
        </Text>
        <ContentWrapper>
          <RowFit gap="4px" marginBottom="20px">
            <Text fontSize="12px" lineHeight="20px" color="var(--subtext)">
              <Trans>Active Range</Trans>
            </Text>
            <Text fontSize="12px" lineHeight="20px" color="var(--text)">
              {priceLower ? `${priceLower} - ${priceUpper}` : '0.0005788 - 0.0006523'}
            </Text>
          </RowFit>
          <NFTsWrapper>
            {positions && positions.length > 0 ? (
              positions.map(pos => {
                return (
                  <NFTItem
                    key={pos.tokenId.toString()}
                    disabled={
                      activeRange && (pos.tickLower > activeRange.tickLower || pos.tickUpper < activeRange.tickUpper)
                    }
                    active={selectedPos[pos.tokenId.toString()]}
                    pos={pos}
                    onClick={handlePosClick}
                  />
                )
              })
            ) : (
              <Row height="100px" justify="center" fontSize="12px" color="var(--subtext)" flex="1">
                <Trans>No liquidity position</Trans>
              </Row>
            )}
          </NFTsWrapper>
          <Pagination currentPage={1} pageSize={8} totalCount={2} onPageChange={p => console.log(p)} haveBg={false} />
        </ContentWrapper>
        <ButtonPrimary
          width="fit-content"
          alignSelf="flex-end"
          padding="8px 18px"
          onClick={handleStake}
          disabled={selectedPosArray.length === 0}
        >
          <Text fontSize="14px" lineHeight="20px" fontWeight={500}>
            <Row gap="6px">
              <Plus size={16} />
              <Trans>Stake Selected</Trans>
            </Row>
          </Text>
        </ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}

export default React.memo(StakeWithNFTsModal)

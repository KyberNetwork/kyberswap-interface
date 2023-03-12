import { Token } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import React, { useCallback, useContext, useState } from 'react'
import { Plus, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import Row, { RowBetween, RowFit, RowWrap } from 'components/Row'
import { useToken } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import { useFarmV2Action } from 'state/farms/elasticv2/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { PositionDetails } from 'types/position'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

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

const NFTItemWrapper = styled.div<{ active?: boolean }>`
  border: 1px solid var(--border);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 12px;
  background-color: var(--button-black);
  cursor: pointer;
  ${({ active }) =>
    active &&
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
  pos,
  onClick,
}: {
  active?: boolean
  pos?: PositionDetails
  onClick?: (tokenId: string) => void
}) => {
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
      {pos ? (
        <NFTItemWrapper active={active} onClick={() => onClick?.(pos.tokenId.toString())}>
          <Text fontSize="12px" lineHeight="16px" color="var(--primary)">
            {`#${pos.tokenId.toString()}`}
          </Text>
          <PriceVisualize
            rangeInclude={false}
            token0={token0 as Token}
            token1={token1 as Token}
            tickUpper={pos?.tickUpper.toString()}
            tickLower={pos?.tickLower.toString()}
            tickCurrent={'0'}
          />
          <Text fontSize="12px" lineHeight="16px">
            {formatDollarAmount(usd)}
          </Text>
        </NFTItemWrapper>
      ) : (
        <NFTItemWrapper active={active}>
          <Text fontSize="12px" lineHeight="16px" color="var(--primary)">
            #123456789
          </Text>
          <PriceVisualize rangeInclude={false} />
          <Text fontSize="12px" lineHeight="16px">
            $230,23K
          </Text>
        </NFTItemWrapper>
      )}
    </>
  )
}

const StakeWithNFTsModal = ({
  isOpen,
  onDismiss,
  positions,
}: {
  isOpen: boolean
  onDismiss: () => void
  positions?: PositionDetails[]
}) => {
  const { farm, activeRange } = useContext(FarmContext)
  const theme = useTheme()
  const [selectedPos, setSelectedPos] = useState<{ [tokenId: string]: boolean }>({})
  const handlePosClick = useCallback((tokenId: string) => {
    setSelectedPos(prev => {
      return { ...prev, [tokenId]: !prev[tokenId] }
    })
  }, [])
  const { deposit } = useFarmV2Action()

  const handleStake = useCallback(() => {
    if (!farm || activeRange === undefined) return
    deposit(
      farm.fId,
      activeRange,
      Object.keys(selectedPos).map(p => +p),
    )
  }, [farm, activeRange, deposit, selectedPos])

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
              0.0005788 - 0.0006523
            </Text>
          </RowFit>
          <NFTsWrapper>
            {positions ? (
              positions.map(pos => (
                <>
                  <NFTItem active={selectedPos[pos.tokenId.toString()]} pos={pos} onClick={handlePosClick} />
                </>
              ))
            ) : (
              <>
                <NFTItem active />
                <NFTItem active />
                <NFTItem active />
                <NFTItem active />
                <NFTItem />
                <NFTItem />
                <NFTItem />
                <NFTItem />
              </>
            )}
          </NFTsWrapper>
          <Pagination currentPage={2} pageSize={8} totalCount={100} onPageChange={p => console.log(p)} haveBg={false} />
        </ContentWrapper>
        <ButtonPrimary width="fit-content" alignSelf="flex-end" padding="8px 18px" onClick={handleStake}>
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

import { Trans } from '@lingui/macro'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { Minus, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit, RowWrap } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { useFarmV2Action } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2, UserFarmV2Info } from 'state/farms/elasticv2/types'

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
  pos?: UserFarmV2Info
  onClick?: (tokenId: string) => void
}) => {
  const { farm, activeRange } = useContext(FarmContext)

  return (
    <>
      {pos && (
        <NFTItemWrapper active={active} onClick={() => onClick?.(pos.nftId.toString())}>
          <Text fontSize="12px" lineHeight="16px" color="var(--primary)">
            {`#${pos.nftId.toString()}`}
          </Text>
          {farm?.token0 && farm?.token1 && (
            <PriceVisualize
              rangeInclude={false}
              token0={farm.token0}
              token1={farm.token1}
              tickRangeUpper={activeRange?.tickUpper}
              tickRangeLower={activeRange?.tickLower}
              tickPosLower={pos?.position?.tickLower}
              tickPosUpper={pos?.position?.tickUpper}
              tickCurrent={0}
            />
          )}
          <Text fontSize="12px" lineHeight="16px">
            $230,23K
          </Text>
        </NFTItemWrapper>
      )}
    </>
  )
}

const UnstakeWithNFTsModal = ({
  isOpen,
  onDismiss,
  stakedPos,
}: {
  isOpen: boolean
  onDismiss: () => void
  stakedPos?: UserFarmV2Info[]
}) => {
  const theme = useTheme()
  const { farm, activeRange } = useContext(FarmContext)
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
  const { withdraw } = useFarmV2Action()
  const handleUnstake = useCallback(() => {
    if (!farm) return
    withdraw(
      farm.fId,
      Object.keys(selectedPos).map(p => +p),
    )
  }, [withdraw, farm, selectedPos])

  const priceLower = farm && convertTickToPrice(farm.token0, farm.token1, activeRange?.tickLower || 0)

  const priceUpper = farm && convertTickToPrice(farm.token0, farm.token1, activeRange?.tickUpper || 0)
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="min(724px, 100vw)">
      <Wrapper>
        <RowBetween>
          <Text fontSize="20px" lineHeight="24px" color={theme.text}>
            <Trans>Unstake your liquidity</Trans>
          </Text>
          <CloseButton onClick={onDismiss}>
            <X />
          </CloseButton>
        </RowBetween>
        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
          <Trans>
            Unstake your liquidity positions (NFT tokens) from the farm. You will no longer earn rewards on these
            positions once unstaked
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
            {stakedPos ? (
              stakedPos.map(pos => (
                <NFTItem
                  key={pos.nftId.toString()}
                  active={selectedPos[pos.nftId.toString()]}
                  pos={pos}
                  onClick={handlePosClick}
                />
              ))
            ) : (
              <Row height="100px" justify="center" fontSize="12px" color="var(--subtext)" flex="1">
                <Trans>No liquidity position</Trans>
              </Row>
            )}
          </NFTsWrapper>
        </ContentWrapper>
        <ButtonPrimary
          disabled={selectedPosArray.length === 0}
          width="fit-content"
          alignSelf="flex-end"
          padding="8px 18px"
          onClick={handleUnstake}
        >
          <Text fontSize="14px" lineHeight="20px" fontWeight={500}>
            <Row gap="6px">
              <Minus size={16} />
              <Trans>Unstake Selected</Trans>
            </Row>
          </Text>
        </ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}

export default React.memo(UnstakeWithNFTsModal)

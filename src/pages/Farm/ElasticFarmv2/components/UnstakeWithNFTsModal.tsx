import { Trans } from '@lingui/macro'
import React, { useCallback, useMemo, useState } from 'react'
import { Info, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DownSvg } from 'assets/svg/down.svg'
import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import PriceVisualize from 'components/ProAmm/PriceVisualize'
import Row, { RowBetween, RowFit, RowWrap } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import useTheme from 'hooks/useTheme'
import { useFarmV2Action } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2, UserFarmV2Info } from 'state/farms/elasticv2/types'
import { getTickToPrice } from 'utils/getTickToPrice'
import { formatDollarAmount } from 'utils/numbers'

import { convertTickToPrice } from '../utils'

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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    --items-in-row: 2;
  `}
`

const NFTItemWrapper = styled.div<{ active?: boolean }>`
  border: 1px solid var(--border);
  padding: 12px;
  display: flex;
  flex-direction: column;
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
  pos: UserFarmV2Info
  onClick?: (tokenId: string) => void
}) => {
  const priceLower = getTickToPrice(
    pos.position.pool.token0.wrapped,
    pos.position.pool.token1.wrapped,
    pos.position.tickLower,
  )
  const priceUpper = getTickToPrice(
    pos.position.pool.token0.wrapped,
    pos.position.pool.token1.wrapped,
    pos.position.tickUpper,
  )
  const ticksAtLimit = useIsTickAtLimit(pos.position.pool.fee, pos.position.tickLower, pos.position.tickUpper)

  const canUpdateLiquidity = pos.liquidity.gt(pos.stakedLiquidity)
  const notStakedUSD = pos.positionUsdValue - pos.stakedUsdValue
  const theme = useTheme()

  return (
    <>
      {pos && (
        <NFTItemWrapper active={active} onClick={() => onClick?.(pos.nftId.toString())}>
          <Text fontSize="12px" lineHeight="16px" color="var(--primary)">
            {`#${pos.nftId.toString()}`}
          </Text>
          {priceLower && priceUpper && pos.position.pool && (
            <PriceVisualize
              showTooltip
              priceLower={priceLower}
              priceUpper={priceUpper}
              price={pos.position.pool.token0Price}
              ticksAtLimit={ticksAtLimit}
            />
          )}
          <Text
            fontSize="12px"
            fontWeight="500"
            marginTop="12px"
            color={canUpdateLiquidity ? theme.warning : theme.text}
          >
            <MouseoverTooltip
              placement="bottom"
              width={canUpdateLiquidity ? '270px' : 'fit-content'}
              text={
                canUpdateLiquidity ? (
                  <Flex
                    sx={{
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '12px',
                      lineHeight: '16px',
                      fontWeight: 400,
                    }}
                  >
                    <Text as="span" color={theme.subText}>
                      <Trans>
                        You still have {formatDollarAmount(notStakedUSD)} in liquidity to stake to earn even more
                        farming rewards
                      </Trans>
                    </Text>
                    <Text as="span" color={theme.text}>
                      Staked: {formatDollarAmount(pos.stakedUsdValue)}
                    </Text>
                    <Text as="span" color={theme.warning}>
                      Not staked: {formatDollarAmount(notStakedUSD)}
                    </Text>
                  </Flex>
                ) : (
                  <>
                    <Flex alignItems="center" sx={{ gap: '4px' }}>
                      <CurrencyLogo currency={pos.position.amount0.currency} size="16px" />
                      {pos.position.amount0.toSignificant(6)} {pos.position.amount0.currency.symbol}
                    </Flex>

                    <Flex alignItems="center" sx={{ gap: '4px' }}>
                      <CurrencyLogo currency={pos.position.amount1.currency} size="16px" />
                      {pos.position.amount1.toSignificant(6)} {pos.position.amount1.currency.symbol}
                    </Flex>
                  </>
                )
              }
            >
              {formatDollarAmount(pos.positionUsdValue)}
              {canUpdateLiquidity && <Info size={14} style={{ marginLeft: '4px' }} />}
              <DownSvg />
            </MouseoverTooltip>
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
  farm,
  activeRangeIndex,
}: {
  isOpen: boolean
  onDismiss: () => void
  stakedPos: UserFarmV2Info[]
  farm: ElasticFarmV2
  activeRangeIndex: number
}) => {
  const activeRange = farm.ranges[activeRangeIndex]
  const theme = useTheme()
  const [selectedPos, setSelectedPos] = useState<{ [tokenId: string]: boolean }>({})
  const selectedPosArray: Array<number> = useMemo(
    () =>
      Object.keys(selectedPos)
        .filter(key => selectedPos[key] === true)
        .map(p => +p),
    [selectedPos],
  )

  const canUpdatePositions = stakedPos
    .filter(item => item.liquidity.gt(item.stakedLiquidity) && activeRange.isRemoved)
    .map(item => +item.nftId.toString())

  const handlePosClick = useCallback((tokenId: string) => {
    setSelectedPos(prev => {
      return { ...prev, [tokenId]: !prev[tokenId] }
    })
  }, [])
  const { withdraw, updateLiquidity } = useFarmV2Action()

  const handleUnstake = useCallback(async () => {
    const txHash = await withdraw(farm.fId, selectedPosArray)
    if (txHash) onDismiss()
    setSelectedPos({})
  }, [withdraw, farm, selectedPosArray, onDismiss])

  const handleUpdateLiquidity = async () => {
    const txHash = await updateLiquidity(farm.fId, activeRange.index, selectedPosArray)
    if (txHash) onDismiss()
    setSelectedPos({})
  }

  const priceLower = convertTickToPrice(farm.token0, farm.token1, activeRange?.tickLower || 0)
  const priceUpper = convertTickToPrice(farm.token0, farm.token1, activeRange?.tickUpper || 0)

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={() => {
        setSelectedPos({})
        onDismiss()
      }}
      maxWidth="min(724px, 100vw)"
    >
      <Wrapper>
        <RowBetween>
          <Text fontSize="20px" lineHeight="24px" color={theme.text}>
            <Trans>Unstake your liquidity</Trans>
          </Text>
          <CloseButton
            onClick={() => {
              setSelectedPos({})
              onDismiss()
            }}
          >
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

        <Flex sx={{ gap: '8px' }} justifyContent="flex-end">
          {!!canUpdatePositions.length && (
            <ButtonPrimary
              disabled={!selectedPosArray.length || !selectedPosArray.every(item => canUpdatePositions.includes(item))}
              width="fit-content"
              alignSelf="flex-end"
              padding="8px 18px"
              onClick={handleUpdateLiquidity}
            >
              <Trans>Update Selected</Trans>
            </ButtonPrimary>
          )}

          <ButtonPrimary
            disabled={selectedPosArray.length === 0}
            width="fit-content"
            alignSelf="flex-end"
            padding="8px 18px"
            onClick={handleUnstake}
          >
            <Trans>Unstake Selected</Trans>
          </ButtonPrimary>
        </Flex>
      </Wrapper>
    </Modal>
  )
}

export default React.memo(UnstakeWithNFTsModal)

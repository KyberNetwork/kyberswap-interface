import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Info, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DownSvg } from 'assets/svg/down.svg'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Modal from 'components/Modal'
import PriceVisualize from 'components/ProAmm/PriceVisualize'
import { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import useTheme from 'hooks/useTheme'
import { useFarmV2Action, useUserFarmV2Info } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2, UserFarmV2Info } from 'state/farms/elasticv2/types'
import { Bound } from 'state/mint/proamm/type'
import { formatTickPrice } from 'utils/formatTickPrice'
import { getTickToPrice } from 'utils/getTickToPrice'
import { formatDollarAmount } from 'utils/numbers'

const Wrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.background};
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ContentWrapper = styled.div`
  overflow-y: scroll;
  display: grid;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  padding: 1rem;
  gap: 1rem;
  justify-content: center;
  grid-template-columns: 1fr 1fr 1fr;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 1fr;
  `}
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
  `}
`

const NFTItemWrapper = styled.div<{ active?: boolean; disabled?: boolean }>`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.buttonBlack};
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

const SelectedCheck = styled.div(({ theme }) => ({
  borderRadius: '50%',
  width: '12px',
  height: '12px',
  background: theme.primary,
  display: 'flex',
  fontSize: '10px',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '500',
  color: theme.textReverse,
}))

const NFTItem = ({
  farm,
  active,
  pos,
  onClick,
}: {
  farm: ElasticFarmV2
  active?: boolean
  pos: UserFarmV2Info
  onClick?: (tokenId: string) => void
}) => {
  console.log(pos.nftId.toString(), pos.unclaimedRewardsUsd)
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
  const canUpdateLiquidity =
    !farm.isSettled && farm.endTime > Date.now() / 1000 && pos.liquidity.gt(pos.stakedLiquidity)

  const notStakedUSD = pos.positionUsdValue - pos.stakedUsdValue

  const theme = useTheme()

  const outOfRange =
    pos.position.pool.tickCurrent < pos.position.tickLower || pos.position.pool.tickCurrent >= pos.position.tickUpper

  return (
    <>
      {pos && (
        <NFTItemWrapper active={active} onClick={() => onClick?.(pos.nftId.toString())}>
          <RowBetween>
            <Flex alignItems="center" sx={{ gap: '4px' }} fontSize="14px" fontWeight="500" color={theme.subText}>
              NFT ID <Text color={outOfRange ? theme.warning : theme.primary}>{pos.nftId.toString()}</Text>
              <RangeBadge size={12} hideText removed={false} inRange={!outOfRange} />
            </Flex>
            {active && <SelectedCheck>✓</SelectedCheck>}
          </RowBetween>

          <Flex justifyContent="space-between" fontSize={12} fontWeight="500" color={theme.subText} marginTop="12px">
            <Text>
              <Trans>My Deposit</Trans>
            </Text>
            <Trans>My Rewards</Trans>
          </Flex>

          <Flex
            justifyContent="space-between"
            marginTop="4px"
            fontSize="12px"
            fontWeight="500"
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
              {canUpdateLiquidity && <Info size={12} style={{ marginLeft: '4px' }} />}
              <DownSvg />
            </MouseoverTooltip>

            <MouseoverTooltip
              width="fit-content"
              placement="bottom"
              text={pos.unclaimedRewards.map(item => (
                <Flex alignItems="center" sx={{ gap: '4px' }} key={item.currency.wrapped.address}>
                  <CurrencyLogo currency={item.currency} size="16px" />
                  {item.toSignificant(6)} {item.currency.symbol}
                </Flex>
              ))}
            >
              <Text color={theme.text} display="flex" alignItems="center">
                {formatDollarAmount(pos.unclaimedRewardsUsd)}
                <DownSvg />
              </Text>
            </MouseoverTooltip>
          </Flex>

          {priceLower && priceUpper && pos.position.pool && (
            <PriceVisualize
              showTooltip
              priceLower={priceLower}
              priceUpper={priceUpper}
              price={pos.position.pool.token0Price}
              ticksAtLimit={ticksAtLimit}
            />
          )}

          <Flex justifyContent="space-between" fontSize="12px" fontWeight="500" marginTop="8px">
            <Text>
              <Text as="span" color={theme.subText}>
                <Trans>Min Price</Trans>:
              </Text>{' '}
              {formatTickPrice(priceLower, ticksAtLimit, Bound.LOWER)}
            </Text>
            <Text>
              <Text as="span" color={theme.subText}>
                <Trans>Max Price</Trans>:
              </Text>{' '}
              {formatTickPrice(priceUpper, ticksAtLimit, Bound.UPPER)}
            </Text>
          </Flex>
        </NFTItemWrapper>
      )}
    </>
  )
}

const UnstakeWithNFTsModal = ({
  isOpen,
  onDismiss,
  farm,
}: {
  isOpen: boolean
  onDismiss: () => void
  farm: ElasticFarmV2
}) => {
  const stakedPos = useUserFarmV2Info(farm.fId)
  const theme = useTheme()
  const [selectedPos, setSelectedPos] = useState<{ [tokenId: string]: boolean }>({})

  useEffect(() => {
    setSelectedPos({})
  }, [stakedPos?.length])

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

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [attemptingTxn, setAttemptingTxn] = useState(false)

  const handleDismiss = () => {
    txHash && onDismiss()
    setTxHash('')
    setShowConfirmModal(false)
    setErrorMessage('')
    setAttemptingTxn(false)
    txHash && setSelectedPos({})
  }

  const handleUnstake = useCallback(async () => {
    setShowConfirmModal(true)
    setAttemptingTxn(true)
    await withdraw(farm.fId, selectedPosArray)
      .then(txHash => {
        setSelectedPos({})
        setAttemptingTxn(false)
        setTxHash(txHash || '')
      })
      .catch(e => {
        setAttemptingTxn(false)
        setErrorMessage(e?.message || JSON.stringify(e))
      })
  }, [withdraw, farm, selectedPosArray])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="min(900px, 100vw)" width="900px">
      <Wrapper>
        <RowBetween>
          <RowFit>
            <DoubleCurrencyLogo currency0={farm.token0} currency1={farm.token1} size={24} />
            <Text fontSize="20px" lineHeight="24px" color={theme.text}>
              <Trans>Unstake your liquidity</Trans>
            </Text>
          </RowFit>

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
          {stakedPos.map(pos => (
            <NFTItem
              farm={farm}
              key={pos.nftId.toString()}
              active={selectedPos[pos.nftId.toString()]}
              pos={pos}
              onClick={handlePosClick}
            />
          ))}
        </ContentWrapper>

        <Flex sx={{ gap: '8px' }} justifyContent="flex-end">
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

      <TransactionConfirmationModal
        isOpen={showConfirmModal}
        onDismiss={handleDismiss}
        hash={txHash}
        attemptingTxn={attemptingTxn}
        pendingText={`Unstaking from farm`}
        content={() => (
          <Flex flexDirection={'column'} width="100%">
            {errorMessage ? <TransactionErrorContent onDismiss={handleDismiss} message={errorMessage} /> : null}
          </Flex>
        )}
      />
    </Modal>
  )
}

export default UnstakeWithNFTsModal

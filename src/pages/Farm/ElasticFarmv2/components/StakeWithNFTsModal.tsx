import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Info, Plus, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import LocalLoader from 'components/LocalLoader'
import Modal from 'components/Modal'
import PriceVisualize from 'components/ProAmm/PriceVisualize'
import Row, { RowBetween, RowFit } from 'components/Row'
import Tabs from 'components/Tabs'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { useFarmV2Action } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'
import { Bound } from 'state/mint/proamm/type'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { StyledInternalLink } from 'theme'
import { PositionDetails } from 'types/position'
import { formatTickPrice } from 'utils/formatTickPrice'
import { getTickToPrice } from 'utils/getTickToPrice'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { convertTickToPrice } from '../utils'

const Wrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.background};
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ContentWrapper = styled.div`
  overflow-y: scroll;
  display: grid;
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

export const NFTItem = ({
  active,
  disabled,
  pos,
  onClick,
  prices: usdPrices,
}: {
  active?: boolean
  disabled?: boolean
  pos?: PositionDetails
  onClick?: (tokenId: string) => void
  prices: { [address: string]: number }
}) => {
  const theme = useTheme()
  const token0 = useToken(pos?.token0)
  const token1 = useToken(pos?.token1)
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

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
    parseFloat(position?.amount0.toExact() || '0') * (usdPrices[token0?.wrapped.address || ''] || 0) +
    parseFloat(position?.amount1.toExact() || '0') * (usdPrices[token1?.wrapped.address || ''] || 0)

  const priceLower = getTickToPrice(token0?.wrapped, token1?.wrapped, position?.tickLower)
  const priceUpper = getTickToPrice(token0?.wrapped, token1?.wrapped, position?.tickUpper)
  const ticksAtLimit = useIsTickAtLimit(pool?.fee, position?.tickLower, position?.tickUpper)

  const outOfRange = !!pos && !!pool && (pool.tickCurrent < pos.tickLower || pool.tickCurrent >= pos.tickUpper)

  return (
    <>
      {pos && (
        <NFTItemWrapper
          disabled={disabled}
          active={active}
          onClick={() => !disabled && onClick?.(pos.tokenId.toString())}
        >
          <RowBetween>
            <Flex alignItems="center" sx={{ gap: '4px' }} fontSize="14px" fontWeight="500" color={theme.subText}>
              NFT ID <Text color={outOfRange ? theme.warning : theme.primary}>{pos.tokenId.toString()}</Text>
              <RangeBadge size={12} hideText removed={false} inRange={!outOfRange} />
            </Flex>
            {active && <SelectedCheck>✓</SelectedCheck>}
          </RowBetween>

          <Flex color={theme.subText} fontSize="12px" fontWeight="500" sx={{ gap: '4px' }} marginTop="12px">
            <Trans>My Liquidity</Trans>
            <Text color={theme.text}>{formatDollarAmount(usd)}</Text>
          </Flex>

          <Flex fontSize="12px" fontWeight="500" alignItems="center" sx={{ gap: '4px' }} marginTop="8px">
            <CurrencyLogo currency={currency0} size="12px" />
            <HoverInlineText maxCharacters={10} text={position?.amount0.toSignificant(6)} />

            <Text color={theme.subText}>|</Text>

            <CurrencyLogo currency={currency1} size="12px" />
            <HoverInlineText maxCharacters={10} text={position?.amount1.toSignificant(6)} />
          </Flex>

          {pool && priceLower && priceUpper && (
            <PriceVisualize
              showTooltip
              priceLower={priceLower}
              priceUpper={priceUpper}
              price={pool?.token0Price}
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

const StakeWithNFTsModal = ({
  isOpen,
  onDismiss,
  farm,
}: {
  farm: ElasticFarmV2
  isOpen: boolean
  onDismiss: () => void
}) => {
  const [activeRange, setActiveRange] = useState(farm.ranges[0])

  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { loading, positions: allPositions } = useProAmmPositions(account)

  const positions = useMemo(() => {
    return allPositions?.filter(
      item =>
        item.poolId.toLowerCase() === farm?.poolAddress.toLowerCase() &&
        item.liquidity.gt(0) &&
        item.tickLower <= activeRange.tickLower &&
        item.tickUpper >= activeRange.tickUpper,
    )
  }, [allPositions, farm?.poolAddress, activeRange.tickUpper, activeRange.tickLower])

  useEffect(() => {
    setSelectedPos({})
  }, [positions?.length])

  const prices = useTokenPrices([farm.token0.wrapped.address, farm.token1.wrapped.address])

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
  }

  const handleStake = useCallback(() => {
    if (!farm || activeRange === undefined) return
    setShowConfirmModal(true)
    setAttemptingTxn(true)
    deposit(farm.fId, activeRange.index, selectedPosArray)
      .then(txHash => {
        setSelectedPos({})
        setAttemptingTxn(false)
        setTxHash(txHash || '')
      })
      .catch(e => {
        setAttemptingTxn(false)
        setErrorMessage(e?.message || JSON.stringify(e))
      })
  }, [farm, activeRange, deposit, selectedPosArray])

  const addliquidityElasticPool = `${APP_PATHS.ELASTIC_CREATE_POOL}/${
    farm.token0.isNative ? farm.token0.symbol : farm.token0.address
  }/${farm.token1.isNative ? farm.token1.symbol : farm.token1.address}/${farm.pool.fee}?farmRange=${activeRange.index}`

  return (
    <>
      <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="min(900px, 100vw)" width="900px">
        <Wrapper>
          <RowBetween>
            <RowFit>
              <DoubleCurrencyLogo currency0={farm.token0} currency1={farm.token1} size={24} />
              <Text fontSize="20px" lineHeight="24px" color={theme.text}>
                <Trans>Stake your liquidity</Trans>
              </Text>
            </RowFit>
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

          <Tabs
            activeKey={activeRange.index}
            onChange={key => {
              setSelectedPos({})
              const range = farm.ranges.find(item => +item.index === +key)
              if (range) setActiveRange(range)
            }}
            items={farm.ranges
              .filter(range => !range.isRemoved)
              .map(range => {
                const priceLower = convertTickToPrice(farm.token0, farm.token1, range.tickLower)
                const priceUpper = convertTickToPrice(farm.token0, farm.token1, range.tickUpper)

                return {
                  key: range.index,
                  label: (
                    <Flex sx={{ gap: '2px' }} alignItems="center">
                      {priceLower}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" display="block">
                        <path
                          d="M11.3405 8.66669L11.3405 9.86002C11.3405 10.16 11.7005 10.3067 11.9071 10.0934L13.7605 8.23335C13.8871 8.10002 13.8871 7.89335 13.7605 7.76002L11.9071 5.90669C11.7005 5.69335 11.3405 5.84002 11.3405 6.14002L11.3405 7.33335L4.66047 7.33335L4.66047 6.14002C4.66047 5.84002 4.30047 5.69335 4.0938 5.90669L2.24047 7.76669C2.1138 7.90002 2.1138 8.10669 2.24047 8.24002L4.0938 10.1C4.30047 10.3134 4.66047 10.16 4.66047 9.86669L4.66047 8.66669L11.3405 8.66669Z"
                          fill="currentcolor"
                        />
                      </svg>
                      {priceUpper}
                    </Flex>
                  ),
                  children: loading ? (
                    <LocalLoader />
                  ) : !positions?.length ? (
                    <Flex
                      sx={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                      fontSize={14}
                      color={theme.subText}
                      padding="16px"
                      marginTop="20px"
                      marginBottom="44px"
                    >
                      <Info size="48px" />
                      <Text marginTop="16px" textAlign="center" lineHeight={1.5}>
                        <Trans>
                          You don&apos;t have any relevant liquidity positions yet.
                          <br />
                          Add liquidity to this pool with the current{' '}
                          <StyledInternalLink to={addliquidityElasticPool}>Active Farm Range ↗</StyledInternalLink>{' '}
                        </Trans>
                      </Text>
                    </Flex>
                  ) : (
                    <ContentWrapper>
                      {positions.map(pos => {
                        return (
                          <NFTItem
                            key={pos.tokenId.toString()}
                            disabled={
                              activeRange &&
                              (pos.tickLower > activeRange.tickLower || pos.tickUpper < activeRange.tickUpper)
                            }
                            active={selectedPos[pos.tokenId.toString()]}
                            pos={pos}
                            onClick={handlePosClick}
                            prices={prices}
                          />
                        )
                      })}
                    </ContentWrapper>
                  ),
                }
              })}
          />

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
      <TransactionConfirmationModal
        isOpen={showConfirmModal}
        onDismiss={handleDismiss}
        hash={txHash}
        attemptingTxn={attemptingTxn}
        pendingText={`Staking into farm`}
        content={() => (
          <Flex flexDirection={'column'} width="100%">
            {errorMessage ? <TransactionErrorContent onDismiss={handleDismiss} message={errorMessage} /> : null}
          </Flex>
        )}
      />
    </>
  )
}

export default StakeWithNFTsModal

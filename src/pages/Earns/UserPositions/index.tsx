import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { EarnPosition, PositionStatus, useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/ic_earn_not_found.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import CopyHelper from 'components/Copy'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { CurrencyRoundedImage, CurrencySecondImage, Disclaimer, NavigateButton } from '../PoolExplorer/styles'
import { IconArrowLeft, PositionAction as PositionActionBtn } from '../PositionDetail/styles'
import useLiquidityWidget from '../useLiquidityWidget'
import useSupportedDexesAndChains from '../useSupportedDexesAndChains'
import Filter from './Filter'
import PositionBanner from './PositionBanner'
import {
  Badge,
  BadgeType,
  ChainImage,
  DexImage,
  Divider,
  EmptyPositionText,
  ImageContainer,
  MyLiquidityWrapper,
  PositionAction,
  PositionOverview,
  PositionPageWrapper,
  PositionRow,
  PositionValueLabel,
  PositionValueWrapper,
} from './styles'
import useFilter from './useFilter'

const LIMIT = 20

const MyPositions = () => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const navigate = useNavigate()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { filters, onFilterChange } = useFilter()
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  const { liquidityWidget, handleOpenZapInWidget, handleOpenZapOut } = useLiquidityWidget()
  const firstLoading = useRef(false)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const { data: userPosition, isFetching } = useUserPositionsQuery(filters, {
    skip: !filters.addresses,
    pollingInterval: 15_000,
  })

  const isShowPagination = (!isFetching || !loading) && userPosition && userPosition.length > LIMIT

  const positionsToShow = useMemo(() => {
    if (!isShowPagination) return userPosition
    return userPosition.slice((page - 1) * LIMIT, page * LIMIT)
  }, [isShowPagination, page, userPosition])

  const onOpenIncreaseLiquidityWidget = (e: React.MouseEvent, position: EarnPosition) => {
    e.stopPropagation()
    handleOpenZapInWidget(
      {
        exchange: position.pool.project || '',
        chainId: position.chainId,
        address: position.pool.poolAddress,
      },
      position.tokenId,
    )
  }

  useEffect(() => {
    if (!isFetching) setLoading(false)
    else {
      if (!firstLoading.current) {
        setLoading(true)
        firstLoading.current = true
      }
    }
  }, [isFetching])

  return (
    <>
      {liquidityWidget}
      <PositionPageWrapper>
        <Flex
          flexDirection={upToSmall ? 'column' : 'row'}
          alignItems={upToSmall ? 'flex-start' : 'center'}
          justifyContent={'space-between'}
          sx={{ gap: 3 }}
        >
          <Flex sx={{ gap: 3 }}>
            <IconArrowLeft onClick={() => navigate(-1)} />
            <Text as="h1" fontSize={24} fontWeight="500">
              {t`My Liquidity Positions`}
            </Text>
          </Flex>
          <NavigateButton
            mobileFullWidth
            icon={<RocketIcon width={20} height={20} />}
            text={t`Explore Pools`}
            to={APP_PATHS.EARN_POOLS}
          />
        </Flex>

        <PositionBanner userPosition={userPosition} />

        <Filter
          supportedChains={supportedChains}
          supportedDexes={supportedDexes}
          filters={filters}
          onFilterChange={(...args) => {
            onFilterChange(...args)
            setPage(1)
            setLoading(true)
          }}
        />

        <MyLiquidityWrapper>
          {isFetching && loading ? (
            <LocalLoader />
          ) : account && positionsToShow && positionsToShow.length > 0 ? (
            positionsToShow.map(position => {
              const { id, status, chainId: poolChainId } = position
              const positionId = position.tokenId
              const chainImage = position.chainLogo
              const dexImage = position.pool.projectLogo
              const dexVersion = position.pool.project?.split(' ')?.[1] || ''
              const token0Logo = position.pool.tokenAmounts[0]?.token.logo
              const token1Logo = position.pool.tokenAmounts[1]?.token.logo
              const token0Symbol = position.pool.tokenAmounts[0]?.token.symbol
              const token1Symbol = position.pool.tokenAmounts[1]?.token.symbol
              const poolFee = position.pool.fees?.[0]
              const poolAddress = position.pool.poolAddress
              const totalValue = position.currentPositionValue
              const token0TotalProvide =
                position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price
              const token1TotalProvide =
                position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price
              const token0EarnedAmount =
                position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price +
                position.feesClaimed[0]?.quotes.usd.value / position.feesClaimed[0]?.quotes.usd.price
              const token1EarnedAmount =
                position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price +
                position.feesClaimed[1]?.quotes.usd.value / position.feesClaimed[1]?.quotes.usd.price
              const token0TotalAmount = token0TotalProvide + token0EarnedAmount
              const token1TotalAmount = token1TotalProvide + token1EarnedAmount
              const totalEarnedFee =
                position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0) +
                position.feesClaimed.reduce((a, b) => a + b.quotes.usd.value, 0)

              return (
                <PositionRow
                  key={positionId}
                  onClick={() =>
                    navigate({
                      pathname: APP_PATHS.EARN_POSITION_DETAIL.replace(':chainId', poolChainId.toString()).replace(
                        ':id',
                        id,
                      ),
                    })
                  }
                >
                  <PositionOverview>
                    <Flex alignItems={'center'} sx={{ gap: 2 }}>
                      <ImageContainer>
                        <CurrencyRoundedImage src={token0Logo} alt="" />
                        <CurrencySecondImage src={token1Logo} alt="" />
                        <ChainImage src={chainImage} alt="" />
                      </ImageContainer>
                      <Text marginLeft={-3}>
                        {token0Symbol}/{token1Symbol}
                      </Text>
                      {poolFee && <Badge>{poolFee}%</Badge>}
                      <Badge type={status === PositionStatus.IN_RANGE ? BadgeType.PRIMARY : BadgeType.WARNING}>
                        ● {status === PositionStatus.IN_RANGE ? t`In range` : t`Out of range`}
                      </Badge>
                    </Flex>
                    <Flex alignItems={'center'} sx={{ gap: '10px' }}>
                      <Flex alignItems={'center'} sx={{ gap: 1 }}>
                        <DexImage src={dexImage} alt="" />
                        <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                          {dexVersion}
                        </Text>
                      </Flex>
                      <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                        #{positionId}
                      </Text>
                      <Badge type={BadgeType.SECONDARY}>
                        <Text fontSize={14}>{shortenAddress(poolChainId, poolAddress, 4)}</Text>
                        <CopyHelper size={16} toCopy={poolAddress} />
                      </Badge>
                    </Flex>
                  </PositionOverview>
                  {upToLarge && !upToSmall && (
                    <Flex alignItems={'center'} justifyContent={'flex-end'} sx={{ gap: '16px' }}>
                      <PositionAction
                        onClick={e => {
                          e.stopPropagation()
                          handleOpenZapOut({
                            dex: position.pool.project || '',
                            chainId: position.chainId,
                            id: position.tokenId,
                            poolAddress: position.pool.poolAddress,
                          })
                        }}
                      >
                        <Minus size={16} />
                      </PositionAction>
                      <PositionAction primary onClick={e => onOpenIncreaseLiquidityWidget(e, position)}>
                        <Plus size={16} />
                      </PositionAction>
                    </Flex>
                  )}
                  <PositionValueWrapper>
                    <PositionValueLabel>{t`Value`}</PositionValueLabel>
                    <MouseoverTooltipDesktopOnly
                      text={
                        <>
                          <Text>
                            {formatDisplayNumber(token0TotalAmount, { significantDigits: 6 })} {token0Symbol}
                          </Text>
                          <Text>
                            {formatDisplayNumber(token1TotalAmount, { significantDigits: 6 })} {token1Symbol}
                          </Text>
                        </>
                      }
                      width="fit-content"
                      placement="bottom"
                    >
                      <Text>
                        {formatDisplayNumber(totalValue, {
                          style: 'currency',
                          significantDigits: 4,
                        })}
                      </Text>
                    </MouseoverTooltipDesktopOnly>
                  </PositionValueWrapper>
                  <PositionValueWrapper align={upToLarge ? 'center' : ''}>
                    <PositionValueLabel>{t`Earned Fee`}</PositionValueLabel>
                    <MouseoverTooltipDesktopOnly
                      text={
                        <>
                          <Text>
                            {formatDisplayNumber(token0EarnedAmount, { significantDigits: 6 })} {token0Symbol}
                          </Text>
                          <Text>
                            {formatDisplayNumber(token1EarnedAmount, { significantDigits: 6 })} {token1Symbol}
                          </Text>
                        </>
                      }
                      width="fit-content"
                      placement="bottom"
                    >
                      <Text>{formatDisplayNumber(totalEarnedFee, { style: 'currency', significantDigits: 4 })}</Text>
                    </MouseoverTooltipDesktopOnly>
                  </PositionValueWrapper>
                  <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                    <PositionValueLabel>Balance</PositionValueLabel>
                    <Flex flexDirection={upToSmall ? 'row' : 'column'} sx={{ gap: 1.8 }}>
                      <Text>
                        {formatDisplayNumber(token0TotalProvide, { significantDigits: 4 })} {token0Symbol}
                      </Text>
                      {upToSmall && <Divider />}
                      <Text>
                        {formatDisplayNumber(token1TotalProvide, { significantDigits: 4 })} {token1Symbol}
                      </Text>
                    </Flex>
                  </PositionValueWrapper>
                  {(upToSmall || !upToLarge) && (
                    <Flex alignItems={'center'} justifyContent={'flex-end'} sx={{ gap: '16px' }}>
                      <MouseoverTooltipDesktopOnly
                        text={t`Remove liquidity from this position by zapping out to any token(s) or migrating to another position.`}
                        placement="top"
                      >
                        <PositionAction
                          onClick={e => {
                            e.stopPropagation()
                            handleOpenZapOut({
                              dex: position.pool.project || '',
                              chainId: position.chainId,
                              id: position.tokenId,
                              poolAddress: position.pool.poolAddress,
                            })
                          }}
                        >
                          <Minus size={16} />
                        </PositionAction>
                      </MouseoverTooltipDesktopOnly>
                      <MouseoverTooltipDesktopOnly
                        text={t`Add more liquidity to this position using any token(s) or migrate liquidity from your existing positions.`}
                        placement="top"
                      >
                        <PositionAction primary onClick={e => onOpenIncreaseLiquidityWidget(e, position)}>
                          <Plus size={16} />
                        </PositionAction>
                      </MouseoverTooltipDesktopOnly>
                    </Flex>
                  )}
                </PositionRow>
              )
            })
          ) : (
            <EmptyPositionText>
              <IconEarnNotFound />
              <Flex flexDirection={upToSmall ? 'column' : 'row'} sx={{ gap: 1 }} marginBottom={12}>
                <Text color={theme.subText}>{t`You don’t have any liquidity positions yet`}.</Text>
                <Link to={APP_PATHS.EARN_POOLS}>{t`Explore Liquidity Pools to get started`}!</Link>
              </Flex>
              {!account && <PositionActionBtn onClick={toggleWalletModal}>Connect Wallet</PositionActionBtn>}
            </EmptyPositionText>
          )}
        </MyLiquidityWrapper>
        {isShowPagination && (
          <Pagination
            haveBg={false}
            onPageChange={(newPage: number) => setPage(newPage)}
            totalCount={userPosition.length}
            currentPage={page}
            pageSize={LIMIT}
          />
        )}

        <Disclaimer>{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</Disclaimer>
      </PositionPageWrapper>
    </>
  )
}

export default MyPositions

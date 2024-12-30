import { t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { EarnPosition, PositionStatus, useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/ic_earn_not_found.svg'
import CopyHelper from 'components/Copy'
import LocalLoader from 'components/LocalLoader'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { CurrencyRoundedImage, CurrencySecondImage, Disclaimer } from '../PoolExplorer/styles'
import useLiquidityWidget from '../useLiquidityWidget'
import useSupportedDexesAndChains from '../useSupportedDexesAndChains'
import Filter from './Filter'
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

const MyPositions = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { filters, onFilterChange } = useFilter()
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  const { liquidityWidget, handleOpenZapInWidget, handleOpenZapOut } = useLiquidityWidget()
  const firstLoading = useRef(false)
  const [loading, setLoading] = useState(false)

  const { data: userPosition, isFetching } = useUserPositionsQuery(filters, {
    skip: !filters.addresses,
    pollingInterval: 15_000,
  })

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
        <div>
          <Text as="h1" fontSize={24} fontWeight="500">
            {t`My Liquidity`}
          </Text>
          <Text color={theme.subText} marginTop="8px" fontStyle={'italic'}>
            {t`KyberSwap Zap: Instantly and easily add liquidity to high-APY pools using any token or a combination of tokens.`}
          </Text>
        </div>

        <Filter
          supportedChains={supportedChains}
          supportedDexes={supportedDexes}
          filters={filters}
          onFilterChange={(...args) => {
            onFilterChange(...args)
            setLoading(true)
          }}
        />

        <MyLiquidityWrapper>
          {isFetching && loading ? (
            <LocalLoader />
          ) : userPosition && userPosition.length > 0 ? (
            userPosition.map(position => {
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
              const token0TotalAmount =
                position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price
              const token1TotalAmount =
                position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price
              const token0EarnedAmount =
                position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price +
                position.feesClaimed[0]?.quotes.usd.value / position.feesClaimed[0]?.quotes.usd.price
              const token1EarnedAmount =
                position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price +
                position.feesClaimed[1]?.quotes.usd.value / position.feesClaimed[1]?.quotes.usd.price
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
                        {formatDisplayNumber(token0TotalAmount, { significantDigits: 4 })} {token0Symbol}
                      </Text>
                      {upToSmall && <Divider />}
                      <Text>
                        {formatDisplayNumber(token1TotalAmount, { significantDigits: 4 })} {token1Symbol}
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
              <Flex sx={{ gap: 1 }}>
                <Text color={theme.subText}>{t`You don’t have any liquidity positions yet`}.</Text>
                <Link to={APP_PATHS.EARN_POOLS}>{t`Explore Liquidity Pools to get started`}!</Link>
              </Flex>
            </EmptyPositionText>
          )}
        </MyLiquidityWrapper>

        <Disclaimer>{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</Disclaimer>
      </PositionPageWrapper>
    </>
  )
}

export default MyPositions

import { t } from '@lingui/macro'
import { Minus, Plus } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { EarnPosition, PositionStatus } from 'services/zapEarn'

import { ReactComponent as IconClaim } from 'assets/svg/ic_claim.svg'
import { ReactComponent as IconEarnNotFound } from 'assets/svg/ic_earn_not_found.svg'
import CopyHelper from 'components/Copy'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { CurrencyRoundedImage, CurrencySecondImage } from '../PoolExplorer/styles'
import { PositionAction as PositionActionBtn } from '../PositionDetail/styles'
import {
  Badge,
  BadgeType,
  ChainImage,
  DexImage,
  Divider,
  EmptyPositionText,
  ImageContainer,
  PositionAction,
  PositionOverview,
  PositionRow,
  PositionTableBody,
  PositionValueLabel,
  PositionValueWrapper,
} from './styles'

export default function TableContent({
  positions,
  onOpenZapInWidget,
  onOpenZapOut,
}: {
  positions: Array<EarnPosition> | undefined
  onOpenZapInWidget: (pool: { exchange: string; chainId?: number; address: string }, positionId?: string) => void
  onOpenZapOut: (position: { dex: string; chainId: number; poolAddress: string; id: string }) => void
}) {
  const { account } = useActiveWeb3React()
  const navigate = useNavigate()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const handleOpenIncreaseLiquidityWidget = (e: React.MouseEvent, position: EarnPosition) => {
    e.stopPropagation()
    onOpenZapInWidget(
      {
        exchange: position.pool.project || '',
        chainId: position.chainId,
        address: position.pool.poolAddress,
      },
      position.tokenId,
    )
  }

  const handleOpenZapOut = (e: React.MouseEvent, position: EarnPosition) => {
    e.stopPropagation()
    onOpenZapOut({
      dex: position.pool.project || '',
      chainId: position.chainId,
      id: position.tokenId,
      poolAddress: position.pool.poolAddress,
    })
  }

  return (
    <PositionTableBody>
      {account && positions && positions.length > 0 ? (
        positions.map(position => {
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
          const earning7d = position.earning7d
          const totalUnclaimedFee = position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0)
          const token0UnclaimedAmount =
            position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price
          const token1UnclaimedAmount =
            position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price

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
                  <Text marginLeft={-3} fontSize={upToSmall ? 15 : 16}>
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
                  <PositionAction primary onClick={e => handleOpenIncreaseLiquidityWidget(e, position)}>
                    <Plus size={16} />
                  </PositionAction>
                  <PositionAction onClick={e => handleOpenZapOut(e, position)}>
                    <Minus size={16} />
                  </PositionAction>
                  <PositionAction>
                    <IconClaim width={16} style={{ margin: '0 7px' }} />
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
              <PositionValueWrapper>
                <PositionValueLabel>{t`APR`}</PositionValueLabel>
                <Text>
                  {formatDisplayNumber(earning7d, {
                    style: 'currency',
                    significantDigits: 4,
                  })}
                </Text>
              </PositionValueWrapper>
              <PositionValueWrapper align={upToLarge ? 'center' : ''}>
                <PositionValueLabel>{t`Unclaimed Fee`}</PositionValueLabel>
                <MouseoverTooltipDesktopOnly
                  text={
                    <>
                      <Text>
                        {formatDisplayNumber(token0UnclaimedAmount, { significantDigits: 6 })} {token0Symbol}
                      </Text>
                      <Text>
                        {formatDisplayNumber(token1UnclaimedAmount, { significantDigits: 6 })} {token1Symbol}
                      </Text>
                    </>
                  }
                  width="fit-content"
                  placement="bottom"
                >
                  <Text>{formatDisplayNumber(totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}</Text>
                </MouseoverTooltipDesktopOnly>
              </PositionValueWrapper>
              <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                <PositionValueLabel>{t`Bal`}</PositionValueLabel>
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
              <PositionValueWrapper />
              {(upToSmall || !upToLarge) && (
                <Flex alignItems={'center'} justifyContent={upToSmall ? 'flex-end' : 'flex-start'} sx={{ gap: '12px' }}>
                  <MouseoverTooltipDesktopOnly
                    text={t`Add more liquidity to this position using any token(s) or migrate liquidity from your existing positions.`}
                    placement="top"
                  >
                    <PositionAction primary onClick={e => handleOpenIncreaseLiquidityWidget(e, position)}>
                      <Plus size={16} />
                    </PositionAction>
                  </MouseoverTooltipDesktopOnly>
                  <MouseoverTooltipDesktopOnly
                    text={t`Remove liquidity from this position by zapping out to any token(s) or migrating to another position.`}
                    placement="top"
                  >
                    <PositionAction onClick={e => handleOpenZapOut(e, position)}>
                      <Minus size={16} />
                    </PositionAction>
                  </MouseoverTooltipDesktopOnly>
                  <PositionAction>
                    <IconClaim width={16} style={{ margin: '0 7px' }} />
                  </PositionAction>
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
    </PositionTableBody>
  )
}

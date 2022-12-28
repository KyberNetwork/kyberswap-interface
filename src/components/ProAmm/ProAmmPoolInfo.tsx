import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import RangeBadge from 'components/Badge/RangeBadge'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { FarmingIcon } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { RotateSwapIcon } from './styles'

export default function ProAmmPoolInfo({
  isFarmActive,
  position,
  tokenId,
  narrow = false,
}: {
  isFarmActive?: boolean
  position: Position
  tokenId?: string
  narrow?: boolean
}) {
  const { networkInfo } = useActiveWeb3React()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()
  const poolAddress = useProAmmPoolInfo(position.pool.token0, position.pool.token1, position.pool.fee as FeeAmount)

  const removed = BigNumber.from(position.liquidity.toString()).eq(0)
  const outOfRange = position.pool.tickCurrent < position.tickLower || position.pool.tickCurrent >= position.tickUpper

  const token0Shown = unwrappedToken(position.pool.token0)
  const token1Shown = unwrappedToken(position.pool.token1)

  const renderFarmIcon = () => {
    if (!isFarmActive) {
      return null
    }

    if (upToSmall) {
      return (
        <MouseoverTooltip
          noArrow
          placement="top"
          text={
            <Text>
              <Trans>
                Available for yield farming. Click{' '}
                <Link to={`${APP_PATHS.FARMS}/${networkInfo.route}?tab=elastic&type=active&search=${poolAddress}`}>
                  here
                </Link>{' '}
                to go to the farm.
              </Trans>
            </Text>
          }
        >
          <FarmingIcon />
        </MouseoverTooltip>
      )
    }

    return (
      <MouseoverTooltip width="fit-content" placement="top" text={t`Available for yield farming`}>
        <Link to={`${APP_PATHS.FARMS}/${networkInfo.route}?tab=elastic&type=active&search=${poolAddress}`}>
          <FarmingIcon />
        </Link>
      </MouseoverTooltip>
    )
  }

  const [rotated, setRotated] = useState(false)
  const [tokenA, tokenB] = rotated ? [position.amount0, position.amount1] : [position.amount1, position.amount0]

  const onReversePrice: React.MouseEventHandler<HTMLSpanElement> = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      setRotated(!rotated)
    },
    [rotated],
  )

  return (
    <>
      {poolAddress ? (
        <AutoColumn>
          <Flex alignItems="center" justifyContent="space-between">
            <Flex sx={{ gap: '4px', alignItems: 'center' }}>
              <Flex>
                <DoubleCurrencyLogo currency0={token0Shown} currency1={token1Shown} size={24} />
                <Text fontSize="20px" fontWeight="500">
                  {token0Shown.symbol} - {token1Shown.symbol}
                </Text>
              </Flex>
              <FeeTag style={{ fontSize: '12px' }}>FEE {(position.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
            </Flex>

            {narrow ? (
              <Flex sx={{ gap: '16px' }}>
                <Copy
                  toCopy={poolAddress}
                  text={
                    <Text fontSize="12px" fontWeight="500" color={theme.subText}>
                      <Trans>Address</Trans>
                    </Text>
                  }
                />
                <Flex sx={{ gap: '4px' }}>
                  <Text fontSize={12}>
                    <Trans>
                      <Flex>
                        <Text color={theme.subText}>Current Price:</Text>&nbsp;1 {tokenB.currency.symbol} ={' '}
                        {position.pool.priceOf(tokenB.currency).toSignificant(6)} {tokenA.currency.symbol}
                      </Flex>
                    </Trans>
                  </Text>
                  <span onClick={onReversePrice} style={{ cursor: 'pointer' }}>
                    <RotateSwapIcon rotated={rotated} size={12} />
                  </span>
                </Flex>
              </Flex>
            ) : (
              <Flex sx={{ gap: '8px' }}>
                {renderFarmIcon()}
                <RangeBadge removed={removed} inRange={!outOfRange} hideText />
              </Flex>
            )}
          </Flex>

          {!narrow ? (
            <Flex sx={{ gap: '16px' }} alignItems="center" marginTop="8px">
              <Flex alignItems="center" color={theme.subText} fontSize={12}>
                <Copy
                  toCopy={poolAddress}
                  text={
                    <Text fontSize="12px" fontWeight="500" color={theme.subText}>
                      <Trans>Address</Trans>
                    </Text>
                  }
                />
              </Flex>
              {tokenId ? (
                <Text fontSize="12px" marginRight="4px" color={theme.subText}>
                  NFT ID: {tokenId}
                </Text>
              ) : null}
            </Flex>
          ) : null}
        </AutoColumn>
      ) : null}
    </>
  )
}

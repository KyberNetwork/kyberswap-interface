import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import CurrencyLogo from 'components/CurrencyLogo'
import { formatUSDValue } from 'components/EarningAreaChart/utils'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { Position as SubgraphLegacyPosition } from 'hooks/useElasticLegacy'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import CollectFeesPanel from 'pages/MyEarnings/ElasticPools/SinglePosition/CollectFeesPanel'
import CommonView, { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import PriceRangeChart from 'pages/MyEarnings/ElasticPools/SinglePosition/PriceRangeChart'
import { Column, Label, Row, Value, ValueAPR } from 'pages/MyEarnings/ElasticPools/SinglePosition/styleds'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import { useRemoveLiquidityFromLegacyPosition } from 'pages/MyEarnings/hooks'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useAppSelector } from 'state/hooks'
import { updateChainId } from 'state/user/actions'
import { unwrappedToken } from 'utils/wrappedCurrency'

import ActionButtons from './ActionButtons'

const defaultPendingFee = ['0', '0']

const PositionView: React.FC<CommonProps> = props => {
  const { positionEarning, position, pendingFee = defaultPendingFee, tokenPrices: prices, chainId } = props
  const { chainId: currentChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const dispatch = useDispatch()
  const isLegacyPosition = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)

  // Need these because we'll display native tokens instead of wrapped tokens
  const visibleCurrency0 = unwrappedToken(position.pool.token0)
  const visibleCurrency1 = unwrappedToken(position.pool.token1)

  const liquidityValue0 = CurrencyAmount.fromRawAmount(visibleCurrency0, position.amount0.quotient)
  const liquidityValue1 = CurrencyAmount.fromRawAmount(visibleCurrency1, position.amount1.quotient)

  const isElasticLegacyPosition = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)

  const feeReward0 = CurrencyAmount.fromRawAmount(visibleCurrency0, pendingFee[0])
  const feeReward1 = CurrencyAmount.fromRawAmount(visibleCurrency1, pendingFee[1])
  const feeUsd =
    +feeReward0.toExact() * prices[position.pool.token0.address] +
    +feeReward1.toExact() * prices[position.pool.token1.address]

  const liquidityInUsd =
    parseFloat(position.amount0.toExact() || '0') * prices[visibleCurrency0.wrapped.address || ''] +
    parseFloat(position.amount1.toExact() || '0') * prices[visibleCurrency1.wrapped.address || '']

  const liquidityInUsdString = Number.isNaN(liquidityInUsd) ? '--' : formatUSDValue(liquidityInUsd, true)

  const liquidityTime =
    positionEarning.lastCollectedFeeAt && Date.now() / 1000 - Number(positionEarning.lastCollectedFeeAt)
  const estimatedOneYearFee = liquidityTime && (feeUsd * 365 * 24 * 60 * 60) / liquidityTime
  const positionAPR = liquidityTime ? ((estimatedOneYearFee || 0) * 100) / liquidityInUsd : 0

  const { userFarmInfo = {} } = useElasticFarms()
  let farmAddress = ''
  const rewards: CurrencyAmount<Currency>[][] = []
  Object.entries(userFarmInfo).forEach(([address, info]) => {
    Object.keys(info.rewardByNft).forEach(key => {
      if (key.split('_')[1] === positionEarning.id) {
        rewards.push(info.rewardByNft[key])
        farmAddress = address
      }
    })
  })

  const rewardUsd = rewards.reduce((total, item) => {
    const temp = item.reduce((acc, cur) => {
      return acc + +cur.toExact() * prices[cur.currency.wrapped.address]
    }, 0)

    return temp + total
  }, 0)

  const farmingTime =
    positionEarning.lastHarvestedFarmRewardAt && Date.now() / 1000 - Number(positionEarning.lastHarvestedFarmRewardAt)

  const estimatedOneYearFarmReward = farmingTime && (rewardUsd * 365 * 24 * 60 * 60) / farmingTime
  const farmAPR =
    rewardUsd && farmingTime && liquidityInUsd ? ((estimatedOneYearFarmReward || 0) * 100) / liquidityInUsd : 0

  const nft = Object.values(userFarmInfo)
    .map(info => Object.values(info.joinedPositions).flat())
    .flat()
    .find(item => item.nftId.toString() === positionEarning.id)

  const myStakedBalance =
    nft &&
    +nft.amount0.toExact() * prices[nft.amount0.currency.wrapped.address] +
      +nft.amount1.toExact() * prices[nft.amount1.currency.wrapped.address]

  const farm = (
    <Link
      to={`${APP_PATHS.FARMS}/${NETWORKS_INFO[chainId].route}?tab=elastic&type=active&search=${positionEarning.pool.id}`}
    >
      <Trans>farm</Trans>
    </Link>
  )

  const legacyPosition: SubgraphLegacyPosition = {
    id: positionEarning.id,
    owner: positionEarning.owner,
    liquidity: positionEarning.liquidity,
    token0: positionEarning.pool.token0,
    token1: positionEarning.pool.token1,
    tickLower: {
      tickIdx: positionEarning.tickLower,
    },
    tickUpper: {
      tickIdx: positionEarning.tickUpper,
    },
    pool: {
      id: positionEarning.pool.id,
      feeTier: positionEarning.pool.feeTier,
      sqrtPrice: positionEarning.pool.sqrtPrice,
      liquidity: positionEarning.pool.liquidity,
      reinvestL: positionEarning.pool.reinvestL,
      tick: positionEarning.pool.tick,
    },
  }

  const removeLiquidity = useRemoveLiquidityFromLegacyPosition(legacyPosition, prices, pendingFee as [string, string])

  const onRemoveLiquidityFromLegacyPosition = async () => {
    if (currentChainId !== chainId) {
      changeNetwork(chainId, () => {
        dispatch(updateChainId(chainId))
        removeLiquidity()
      })
    } else {
      removeLiquidity()
    }
  }

  return (
    <CommonView isEarningView={false} {...props}>
      <Column>
        <Row>
          <Label>
            <Trans>My Liquidity Balance</Trans>
          </Label>
          <Label $hasTooltip>
            <MouseoverTooltip width="fit-content" text={<Trans>Amount staked in a farm</Trans>} placement="top">
              <Trans>My Staked Balance</Trans>
            </MouseoverTooltip>
          </Label>
        </Row>

        <Row>
          {/* TODO: check if there're more than 10 tokens */}
          <HoverDropdown
            anchor={<Value>{liquidityInUsdString}</Value>}
            text={
              <>
                <Flex alignItems="center">
                  <CurrencyLogo currency={visibleCurrency0} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
                  </Text>
                </Flex>
                <Flex alignItems="center" marginTop="8px">
                  <CurrencyLogo currency={visibleCurrency1} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
                  </Text>
                </Flex>
              </>
            }
          />

          {myStakedBalance ? (
            <HoverDropdown
              anchor={<Value>{formatUSDValue(myStakedBalance, true)}</Value>}
              text={
                <>
                  <Flex alignItems="center">
                    <CurrencyLogo currency={nft.amount0.currency} size="16px" />
                    <Text fontSize={12} marginLeft="4px">
                      <FormattedCurrencyAmount currencyAmount={nft.amount0} />
                    </Text>
                  </Flex>
                  <Flex alignItems="center" marginTop="8px">
                    <CurrencyLogo currency={nft.amount1.currency} size="16px" />
                    <Text fontSize={12} marginLeft="4px">
                      <FormattedCurrencyAmount currencyAmount={nft.amount1} />
                    </Text>
                  </Flex>
                </>
              }
            />
          ) : (
            <Value>--</Value>
          )}
        </Row>
      </Column>

      <Column>
        <Row>
          <Label>
            <Trans>My Pool APR</Trans>
          </Label>
          <Label $hasTooltip>
            <MouseoverTooltip
              text={<Trans>You can stake your liquidity in this farm to earn even more rewards. View the {farm}</Trans>}
              placement="top"
            >
              <Trans>My Farm APR</Trans>
            </MouseoverTooltip>
          </Label>
        </Row>
        <Row>
          <ValueAPR>{positionAPR ? `${positionAPR.toFixed(2)}%` : '--'}</ValueAPR>
          <ValueAPR>{farmAPR ? `${farmAPR.toFixed(2)}%` : '--'}</ValueAPR>
        </Row>
      </Column>

      <Flex
        sx={{
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <PriceRangeChart position={position} disabled={isElasticLegacyPosition} />

        <CollectFeesPanel
          nftId={positionEarning.id}
          chainId={chainId}
          feeUsd={feeUsd}
          feeValue0={feeReward0}
          feeValue1={feeReward1}
          hasUserDepositedInFarm={!!nft}
          farmAddress={farmAddress}
          poolAddress={positionEarning.pool.id}
          position={position}
        />

        <ActionButtons
          chainId={chainId}
          nftId={positionEarning.id}
          currency0={visibleCurrency0}
          currency1={visibleCurrency1}
          feeAmount={position.pool.fee}
          liquidity={Number(position.liquidity || '0')}
          isLegacy={isLegacyPosition}
          onRemoveLiquidityFromLegacyPosition={onRemoveLiquidityFromLegacyPosition}
        />
      </Flex>
    </CommonView>
  )
}

export default PositionView

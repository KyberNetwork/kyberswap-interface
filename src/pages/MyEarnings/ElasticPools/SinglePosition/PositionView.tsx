import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { ChevronsUp, Minus } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import { formatUSDValue } from 'components/EarningAreaChart/utils'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { ActionButton } from 'pages/MyEarnings/ActionButton'
import CollectFeesPanel from 'pages/MyEarnings/ElasticPools/SinglePosition/CollectFeesPanel'
import CommonView, { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import PriceRangeChart from 'pages/MyEarnings/ElasticPools/SinglePosition/PriceRangeChart'
import { Column, Label, Row, Value, ValueAPR } from 'pages/MyEarnings/ElasticPools/SinglePosition/styleds'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useAppSelector } from 'state/hooks'
import { unwrappedToken } from 'utils/wrappedCurrency'

const ActionButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  ${ActionButton} {
    flex: 1;
    gap: 4px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 8px;

    ${ActionButton} {
      padding: 8px;
      font-size: 11px;
    }
  `}
`

type ActionButtonsProps = {
  liquidity: number | undefined
  chainId: ChainId
  nftId: string
  currency0: Currency
  currency1: Currency
  feeAmount: FeeAmount
  isIncreaseDisabled: boolean
}
const ActionButtons: React.FC<ActionButtonsProps> = ({
  chainId,
  nftId,
  currency0,
  currency1,
  feeAmount,
  liquidity,
  isIncreaseDisabled,
}) => {
  const chainRoute = NETWORKS_INFO[chainId].route

  const currency0Slug = currency0.isNative ? currency0.symbol : currency0.wrapped.address
  const currency1Slug = currency1.isNative ? currency1.symbol : currency1.wrapped.address

  const renderRemoveButton = () => {
    if (!liquidity) {
      return (
        <ActionButton $variant="red" disabled>
          <Minus size="16px" /> <Trans>Remove Liquidity</Trans>
        </ActionButton>
      )
    }

    return (
      <ActionButton $variant="red" as={Link} to={`/${chainRoute}${APP_PATHS.ELASTIC_REMOVE_POOL}/${nftId}`}>
        <Minus size="16px" /> <Trans>Remove Liquidity</Trans>
      </ActionButton>
    )
  }

  const renderIncreaseButton = () => {
    if (!liquidity || isIncreaseDisabled) {
      return (
        <ActionButton $variant="green" disabled>
          <ChevronsUp size="16px" /> <Trans>Increase Liquidity</Trans>
        </ActionButton>
      )
    }

    return (
      <ActionButton
        $variant="green"
        as={Link}
        to={`/${chainRoute}${APP_PATHS.ELASTIC_INCREASE_LIQ}/${currency0Slug}/${currency1Slug}/${feeAmount}/${nftId}`}
      >
        <ChevronsUp size="16px" /> <Trans>Increase Liquidity</Trans>
      </ActionButton>
    )
  }

  return (
    <ActionButtonsWrapper>
      {renderRemoveButton()}
      {renderIncreaseButton()}
    </ActionButtonsWrapper>
  )
}

const defaultPendingFee = ['0', '0']

const PositionView: React.FC<CommonProps> = props => {
  const { positionEarning, position, pendingFee = defaultPendingFee, tokenPrices: prices, chainId } = props
  const isLegacyPosition = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)

  // Need these because we'll display native tokens instead of wrapped tokens
  const visibleCurrency0 = unwrappedToken(position.pool.token0)
  const visibleCurrency1 = unwrappedToken(position.pool.token1)

  const liquidityValue0 = CurrencyAmount.fromRawAmount(visibleCurrency0, position.amount0.quotient)
  const liquidityValue1 = CurrencyAmount.fromRawAmount(visibleCurrency1, position.amount1.quotient)

  const isElasticLegacyPosition = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)

  const feeReward0 = CurrencyAmount.fromRawAmount(position.pool.token0, pendingFee[0])
  const feeReward1 = CurrencyAmount.fromRawAmount(position.pool.token1, pendingFee[1])
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
                  <CurrencyLogo currency={position.pool.token0} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
                  </Text>
                </Flex>
                <Flex alignItems="center" marginTop="8px">
                  <CurrencyLogo currency={position.pool.token1} size="16px" />
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
          isIncreaseDisabled={isLegacyPosition}
        />
      </Flex>
    </CommonView>
  )
}

export default PositionView

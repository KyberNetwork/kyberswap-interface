import { defaultAbiCoder } from '@ethersproject/abi'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Flex, Text } from 'rebass'

import { ButtonOutlined } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { MouseoverTooltip } from 'components/Tooltip'
import PROMM_FARM_ABI from 'constants/abis/v2/farm.json'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { Position as SubgraphLegacyPosition } from 'hooks/useElasticLegacy'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import CollectFeesPanel from 'pages/MyEarnings/ElasticPools/SinglePosition/CollectFeesPanel'
import CommonView, { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import PriceRangeChart from 'pages/MyEarnings/ElasticPools/SinglePosition/PriceRangeChart'
import { Column, Label, Row, Value } from 'pages/MyEarnings/ElasticPools/SinglePosition/styleds'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import { MODAL_PENDING_TEXTS } from 'pages/MyEarnings/constants'
import { useRemoveLiquidityFromLegacyPosition } from 'pages/MyEarnings/hooks'
import { useAppSelector } from 'state/hooks'
import { setAttemptingTxn, setShowPendingModal, setTxError, setTxnHash } from 'state/myEarnings/actions'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { updateChainId } from 'state/user/actions'
import { calculateGasMargin } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import ActionButtons from './ActionButtons'

const FarmInterface = new Interface(PROMM_FARM_ABI)

const PositionView: React.FC<CommonProps> = props => {
  const { positionEarning, position, pendingFee, tokenPrices: prices, chainId, currency0, currency1 } = props

  const { chainId: currentChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const { library } = useWeb3React()
  const libraryRef = useRef(library)
  libraryRef.current = library

  const dispatch = useDispatch()
  const isLegacyPosition = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)

  const liquidityValue0 = CurrencyAmount.fromRawAmount(currency0, position.amount0.quotient)
  const liquidityValue1 = CurrencyAmount.fromRawAmount(currency1, position.amount1.quotient)

  const isElasticLegacyPosition = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)

  const feeReward0 = CurrencyAmount.fromRawAmount(currency0, positionEarning.pendingFee0 || '0')
  const feeReward1 = CurrencyAmount.fromRawAmount(currency1, positionEarning.pendingFee1 || '0')
  const feeUsd = +positionEarning.pendingFeeUSD

  const liquidityInUsd =
    parseFloat(position.amount0.toExact() || '0') * prices[currency0.wrapped.address || ''] +
    parseFloat(position.amount1.toExact() || '0') * prices[currency1.wrapped.address || '']

  const stakedPosition = new Position({
    pool: position.pool,
    liquidity: positionEarning.joinedPositions?.[0]?.liquidity || '0',
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
  })

  const myStakedBalance =
    +stakedPosition.amount0.toExact() * prices[stakedPosition.amount0.currency.wrapped.address] +
    +stakedPosition.amount1.toExact() * prices[stakedPosition.amount1.currency.wrapped.address]

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

  const theme = useTheme()
  const tokens = useAllTokens(true, chainId)

  const farmRewards = positionEarning.joinedPositions?.[0]?.farmingPool?.rewardTokensIds?.map((rwId, index) => {
    const token = tokens[rwId] || new Token(chainId, rwId, 18, '', '')

    return CurrencyAmount.fromRawAmount(token, positionEarning.joinedPositions?.[0]?.pendingRewards?.[index] || '0')
  })

  const addTransactionWithType = useTransactionAdder()

  const handleHarvest = () => {
    const farmContract = positionEarning.joinedPositions?.[0]?.farmId
    const pId = positionEarning.joinedPositions?.[0]?.pid
    const library = libraryRef.current

    dispatch(setShowPendingModal(MODAL_PENDING_TEXTS.HARVEST))
    dispatch(setAttemptingTxn(true))

    if (!library || !pId || !farmContract) {
      dispatch(setAttemptingTxn(false))
      dispatch(setTxError('Something went wrong!'))
      return
    }

    const encodedPid = defaultAbiCoder.encode(['tupple(uint256[] pIds)'], [{ pIds: [pId] }])
    const encodedData = FarmInterface.encodeFunctionData('harvestMultiplePools', [[positionEarning.id], [encodedPid]])

    const txn = {
      to: farmContract,
      data: encodedData,
    }
    library
      .getSigner()
      .estimateGas(txn)
      .then(async (estimated: BigNumber) => {
        return library
          .getSigner()
          .sendTransaction({
            ...txn,
            gasLimit: calculateGasMargin(estimated),
          })
          .then((response: TransactionResponse) => {
            addTransactionWithType({
              hash: response.hash,
              type: TRANSACTION_TYPE.HARVEST,
              extraInfo: {
                tokenAddressIn: positionEarning.pool.token0.id,
                tokenAddressOut: positionEarning.pool.token1.id,
                tokenSymbolIn: positionEarning.pool.token0?.symbol,
                tokenSymbolOut: positionEarning.pool.token1?.symbol,
                contract: farmContract,
                rewards:
                  farmRewards?.map(reward => ({
                    tokenSymbol: reward.currency.symbol ?? '',
                    tokenAmount: reward.toSignificant(6),
                    tokenAddress: reward.currency.wrapped.address,
                  })) ?? [],
              },
            })
            dispatch(setAttemptingTxn(false))
            dispatch(setTxnHash(response.hash))
          })
      })
      .catch((error: any) => {
        dispatch(setShowPendingModal(MODAL_PENDING_TEXTS.HARVEST))
        dispatch(setAttemptingTxn(false))
        dispatch(setTxError(error?.message || JSON.stringify(error)))
        console.error(error)
      })
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
          <HoverDropdown
            anchor={<Value>{formatDisplayNumber(liquidityInUsd, { style: 'currency', significantDigits: 6 })}</Value>}
            disabled={!liquidityInUsd || Number.isNaN(liquidityInUsd)}
            text={
              <div>
                <Flex alignItems="center">
                  <CurrencyLogo currency={currency0} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
                  </Text>
                </Flex>
                <Flex alignItems="center" marginTop="8px">
                  <CurrencyLogo currency={currency1} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
                  </Text>
                </Flex>
              </div>
            }
          />

          {myStakedBalance ? (
            <HoverDropdown
              anchor={
                <Value>{formatDisplayNumber(myStakedBalance, { style: 'currency', significantDigits: 6 })}</Value>
              }
              text={
                <div>
                  <Flex alignItems="center">
                    <CurrencyLogo currency={currency0} size="16px" />
                    <Text fontSize={12} marginLeft="4px">
                      <FormattedCurrencyAmount currencyAmount={stakedPosition.amount0} />
                    </Text>
                  </Flex>
                  <Flex alignItems="center" marginTop="9px">
                    <CurrencyLogo currency={currency1} size="16px" />
                    <Text fontSize={12} marginLeft="4px">
                      <FormattedCurrencyAmount currencyAmount={stakedPosition.amount1} />
                    </Text>
                  </Flex>
                </div>
              }
            />
          ) : (
            <Value>--</Value>
          )}
        </Row>
      </Column>

      <PriceRangeChart position={position} disabled={isElasticLegacyPosition} />

      <Divider />

      <CollectFeesPanel
        nftId={positionEarning.id}
        chainId={chainId}
        feeUsd={feeUsd}
        feeValue0={feeReward0}
        feeValue1={feeReward1}
        hasUserDepositedInFarm={positionEarning.owner !== positionEarning.ownerOriginal}
        farmAddress={positionEarning.depositedPosition?.farm || positionEarning.joinedPositions?.[0]?.farmId}
        poolAddress={positionEarning.pool.id}
        position={position}
        isLegacy={isLegacyPosition}
      />

      <Divider />

      <Flex justifyContent="space-between">
        <Flex flexDirection="column" sx={{ gap: '4px' }}>
          <Text fontSize={12} fontWeight="500" color={theme.subText}>
            <Trans>Farm Rewards</Trans>
          </Text>

          <HoverDropdown
            anchor={
              <Text as="span" fontSize="16px" fontWeight={500} lineHeight={'20px'}>
                {+positionEarning.pendingRewardUSD
                  ? formatDisplayNumber(positionEarning.pendingRewardUSD, { style: 'currency', significantDigits: 6 })
                  : '--'}
              </Text>
            }
            disabled={!+positionEarning.pendingRewardUSD}
            text={
              <>
                {farmRewards?.map((rw, index) => (
                  <Flex
                    alignItems="center"
                    key={index}
                    sx={{
                      gap: '4px',
                    }}
                  >
                    <CurrencyLogo currency={rw.currency} size="14px" />
                    <Text fontSize={12}>
                      {rw.toSignificant(8)} {rw.currency.symbol}
                    </Text>
                  </Flex>
                ))}
              </>
            }
          />
        </Flex>

        <ButtonOutlined
          disabled={!positionEarning.joinedPositions?.[0]?.pendingRewards?.some(item => item !== '0')}
          style={{
            height: '36px',
            width: 'fit-content',
            flexWrap: 'nowrap',
            padding: '0 12px',
          }}
          onClick={() => {
            if (currentChainId !== chainId) {
              changeNetwork(chainId, () => {
                dispatch(updateChainId(chainId))
                handleHarvest()
              })
            } else {
              handleHarvest()
            }
          }}
        >
          <Trans>Harvest</Trans>
        </ButtonOutlined>
      </Flex>

      <ActionButtons
        chainId={chainId}
        nftId={positionEarning.id}
        currency0={currency0}
        currency1={currency1}
        feeAmount={position.pool.fee}
        liquidity={Number(position.liquidity || '0')}
        isLegacy={isLegacyPosition}
        onRemoveLiquidityFromLegacyPosition={onRemoveLiquidityFromLegacyPosition}
      />
    </CommonView>
  )
}

export default PositionView

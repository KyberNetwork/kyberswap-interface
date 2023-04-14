import { ChainId } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool } from '@kyberswap/ks-sdk-elastic'
import { Interface } from 'ethers/lib/utils'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { PoolEarningWithDetails, PositionEarningWithDetails } from 'services/earning'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import { MoneyBag } from 'components/Icons'
import Logo from 'components/Logo'
import ProAmmPoolStateABI from 'constants/abis/v2/ProAmmPoolState.json'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useMulticallContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import Positions from 'pages/MyEarnings/Positions'
import PoolEarningsSection from 'pages/MyEarnings/SinglePool/PoolEarningsSection'
import StatsRow from 'pages/MyEarnings/SinglePool/StatsRow'
import { useAppSelector } from 'state/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { isAddress, shortenAddress } from 'utils'

const PoolStateInterface = new Interface(ProAmmPoolStateABI.abi)

type CallParam = {
  callData: string
  target: string
  fragment: string
  key: string
}

const formatResult = (responseData: any, calls: CallParam[], defaultValue?: any): any => {
  const response: any = responseData.returnData
    ? responseData.returnData.map((item: [boolean, string]) => item[1])
    : responseData

  console.log({
    responseData,
    response,
  })

  const resultList: { [key: string]: any } = {}
  if (!response) return resultList
  for (let i = 0, len = calls.length; i < len; i++) {
    const item = calls[i]
    if (!response[i]) continue
    let value: any
    try {
      value = PoolStateInterface?.decodeFunctionResult(item.fragment, response[i])
    } catch (error) {
      continue
    }
    const output = value || defaultValue
    if (output) resultList[item.key] = output
  }
  return resultList
}

const useGetMultiplePoolDetails = (
  chainId: ChainId,
  poolEarning: PoolEarningWithDetails,
  currency0: WrappedTokenInfo | undefined,
  currency1: WrappedTokenInfo | undefined,
  fee: FeeAmount,
) => {
  const multicallContract = useMulticallContract(chainId)

  const getPoolsDetails = useCallback(async () => {
    if (!multicallContract || !poolEarning) {
      return
    }

    const callParams = [
      {
        callData: PoolStateInterface.encodeFunctionData('getPoolState'),
        target: poolEarning.id,
        fragment: 'getPoolState',
        key: 'poolState',
      },
      {
        callData: PoolStateInterface.encodeFunctionData('getLiquidityState'),
        target: poolEarning.id,
        fragment: 'getLiquidityState',
        key: 'liquidityState',
      },
    ]

    const returnData = await multicallContract.callStatic.tryBlockAndAggregate(
      false,
      callParams.map(({ callData, target }) => ({ callData, target })),
    )

    const xxx = formatResult(returnData, callParams, '0')

    if (!currency0 || !currency1) {
      return
    }

    const pool = new Pool(
      currency0,
      currency1,
      fee,
      xxx.poolState.sqrtP,
      xxx.liquidityState.baseL,
      xxx.liquidityState.reinvestL,
      xxx.poolState.currentTick,
    )

    console.log({ xxx, pool })
  }, [currency0, currency1, fee, multicallContract, poolEarning])

  // const getEvmPoolsData = useCallback(async () => {
  //   if (!chainId) return Promise.reject('Wrong input')
  //   try {
  //     const calls = getCallParams(tokenList)
  //     const returnData = await multicallContract?.callStatic.tryBlockAndAggregate(
  //       false,
  //       calls.map(({ callData, target }) => ({ target, callData })),
  //     )
  //     return formatResult(returnData, calls, '0')
  //   } catch (error) {
  //     return Promise.reject(error)
  //   }
  // }, [chainId, tokenList, multicallContract])

  return getPoolsDetails
}

const Badge = styled.div<{ $color?: string }>`
  height: 32px;

  display: flex;
  align-items: center;
  gap: 4px;

  padding: 0 8px;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  border-radius: 16px;

  color: ${({ $color, theme }) => $color || theme.subText};
  background: ${({ $color, theme }) => rgba($color || theme.subText, 0.3)};
`

type Props = {
  chainId: ChainId
  poolEarning: PoolEarningWithDetails
  positionEarnings: PositionEarningWithDetails[]
}
const SinglePool: React.FC<Props> = ({ poolEarning, chainId, positionEarnings }) => {
  const theme = useTheme()
  const [isExpanded, setExpanded] = useState(false)
  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)

  const feeAmount = Number(poolEarning.feeTier) as FeeAmount

  const [currency0, currency1] = useMemo(() => {
    const tokenAddress0 = isAddress(chainId, poolEarning.token0.id)
    const tokenAddress1 = isAddress(chainId, poolEarning.token1.id)

    if (!tokenAddress0 || !tokenAddress1) {
      return []
    }

    const currency0 = tokensByChainId[chainId][tokenAddress0]
    const currency1 = tokensByChainId[chainId][tokenAddress1]

    return [currency0, currency1]
  }, [chainId, poolEarning.token0.id, poolEarning.token1.id, tokensByChainId])

  const toggleExpanded = useCallback(() => {
    setExpanded(e => !e)
  }, [])

  const getData = useGetMultiplePoolDetails(chainId, poolEarning, currency0, currency1, feeAmount)

  useEffect(() => {
    getData()
  }, [getData])

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        padding: '24px',
        background: theme.background,
        border: `1px solid ${theme.border}`,
        borderRadius: '20px',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Flex
            alignItems={'center'}
            sx={{
              gap: '4px',
            }}
          >
            <Flex alignItems={'center'}>
              <Logo srcs={[currency0?.logoURI || '']} style={{ width: 24, height: 24, borderRadius: '999px' }} />
              <Logo srcs={[currency1?.logoURI || '']} style={{ width: 24, height: 24, borderRadius: '999px' }} />
            </Flex>

            <Text
              sx={{
                fontWeight: 500,
                fontSize: '20px',
                lineHeight: '24px',
              }}
            >
              {poolEarning.token0.symbol} - {poolEarning.token1.symbol}
            </Text>
          </Flex>

          <Badge $color={theme.blue}>FEE {(Number(poolEarning.feeTier) * 100) / ELASTIC_BASE_FEE_UNIT}%</Badge>

          <Badge $color={theme.apr}>
            <MoneyBag size={16} /> Farm
          </Badge>
        </Flex>

        <Flex
          sx={{
            alignItems: 'center',
            color: theme.subText,
            fontSize: '14px',
            gap: '4px',
          }}
        >
          <CopyHelper toCopy={poolEarning.id} />
          <Text>{shortenAddress(chainId, poolEarning.id, 4)}</Text>
        </Flex>
      </Flex>

      <StatsRow
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
        chainId={chainId}
        totalValueLockedUsd={poolEarning.totalValueLockedUsd}
        apr={poolEarning.apr}
        volume24hUsd={Number(poolEarning.volumeUsd) - Number(poolEarning.volumeUsdOneDayAgo)}
        fees24hUsd={Number(poolEarning.feesUsd) - Number(poolEarning.feesUsdOneDayAgo)}
      />

      {isExpanded && (
        <>
          <PoolEarningsSection poolEarning={poolEarning} chainId={chainId} />
          <Positions positionEarnings={positionEarnings} chainId={chainId} />
        </>
      )}
    </Flex>
  )
}

export default SinglePool

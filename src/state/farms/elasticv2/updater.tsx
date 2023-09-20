import { gql, useLazyQuery } from '@apollo/client'
import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import { CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { BigNumber } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useEffect, useMemo, useRef } from 'react'
import { useLazyGetFarmV2Query } from 'services/knprotocol'

import FarmV2QuoterABI from 'constants/abis/farmv2Quoter.json'
import NFTPositionManagerABI from 'constants/abis/v2/ProAmmNFTPositionManager.json'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useContract, useMulticallContract } from 'hooks/useContract'
import { useKyberSwapConfig } from 'state/application/hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { isAddressString } from 'utils'

import { defaultChainData, setFarms, setLoading, setUserFarmInfo } from '.'
import { ElasticFarmV2, SubgraphFarmV2, SubgraphToken, UserFarmV2Info } from './types'

const positionManagerInterface = new Interface(NFTPositionManagerABI.abi)

const queryFarms = gql`
  {
    farmV2S(first: 1000) {
      id
      startTime
      endTime
      isSettled
      liquidity
      depositedPositions(first: 1000) {
        id
        position {
          id
          liquidity
          tickLower {
            tickIdx
          }
          tickUpper {
            tickIdx
          }
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
        }
      }
      pool {
        id
        feeTier
        tick
        sqrtPrice
        liquidity
        reinvestL
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
      }
      rewards(orderBy: index, orderDirection: asc) {
        token {
          id
          symbol
          name
          decimals
        }
        amount
        index
      }
      ranges(orderBy: isRemoved) {
        id
        index
        isRemoved
        tickUpper
        tickLower
        weight
        createdAt
        updatedAt
      }
    }
  }
`

export default function ElasticFarmV2Updater({ interval = true }: { interval?: boolean }) {
  const dispatch = useAppDispatch()
  const { networkInfo, isEVM, chainId, account } = useActiveWeb3React()
  const elasticFarm = useAppSelector(state => state.elasticFarmV2[chainId] || defaultChainData)
  const { elasticClient } = useKyberSwapConfig()
  const isEnableKNProtocol = true

  const multicallContract = useMulticallContract()
  const farmv2QuoterContract = useContract(
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.farmv2Quoter : undefined,
    FarmV2QuoterABI,
  )

  const [getElasticFarmV2, { data: subgraphData, error: subgraphError }] = useLazyQuery(queryFarms, {
    client: elasticClient,
    fetchPolicy: 'network-only',
  })

  const [getElasticFarmV2FromKnProtocol, { data: knProtocolData, error: knProtocolError }] = useLazyGetFarmV2Query()

  const latestKnProtocolData = useRef(knProtocolData)

  const data = useMemo(() => {
    if (isEnableKNProtocol) {
      return {
        farmV2S: knProtocolData?.data?.data || latestKnProtocolData.current?.data?.data || [],
      }
    } else return subgraphData
  }, [isEnableKNProtocol, knProtocolData, subgraphData])

  const error = useMemo(() => {
    if (isEnableKNProtocol) return knProtocolError
    return subgraphError
  }, [isEnableKNProtocol, subgraphError, knProtocolError])

  useEffect(() => {
    if (isEVM && !elasticFarm?.farms && !elasticFarm?.loading) {
      dispatch(setLoading({ chainId, loading: true }))
      if (isEnableKNProtocol) {
        getElasticFarmV2FromKnProtocol(chainId).finally(() => {
          dispatch(setLoading({ chainId, loading: false }))
        })
      } else
        getElasticFarmV2().finally(() => {
          dispatch(setLoading({ chainId, loading: false }))
        })
    }
  }, [isEVM, chainId, dispatch, getElasticFarmV2, elasticFarm, getElasticFarmV2FromKnProtocol, isEnableKNProtocol])

  useEffect(() => {
    const i = interval
      ? setInterval(() => {
          if (isEnableKNProtocol) getElasticFarmV2FromKnProtocol(chainId)
          else getElasticFarmV2()
        }, 10_000)
      : undefined
    return () => {
      i && clearInterval(i)
    }
  }, [interval, chainId, dispatch, getElasticFarmV2, getElasticFarmV2FromKnProtocol, isEnableKNProtocol])

  useEffect(() => {
    if (error && chainId) {
      dispatch(setFarms({ chainId, farms: [] }))
      dispatch(setLoading({ chainId, loading: false }))
    }
  }, [error, dispatch, chainId])

  const { fetchPrices } = useTokenPricesWithLoading([])

  useEffect(() => {
    const getData = async () => {
      if (data?.farmV2S.length && chainId) {
        const tokens = [
          ...new Set(
            data.farmV2S
              .map((item: SubgraphFarmV2) => [
                item.pool.token0.id,
                item.pool.token1.id,
                ...item.rewards.map((rw: { token: SubgraphToken }) =>
                  rw.token.id === ZERO_ADDRESS || rw.token.id.toLowerCase() === ETHER_ADDRESS.toLowerCase()
                    ? NativeCurrencies[chainId].wrapped.address.toLowerCase()
                    : rw.token.id.toLowerCase(),
                ),
              ])
              .flat(),
          ),
        ] as string[]

        const prices = await fetchPrices(tokens)

        const formattedData: ElasticFarmV2[] = data.farmV2S.map((farm: SubgraphFarmV2) => {
          const getToken = (t: SubgraphToken, keepWrapped = false) => {
            const address = isAddressString(chainId, t.id)
            return (keepWrapped ? false : address === WETH[chainId].address) || address === ZERO_ADDRESS
              ? NativeCurrencies[chainId]
              : new Token(
                  chainId,
                  address,
                  Number(t.decimals),
                  t.symbol.toLowerCase() === 'mimatic' ? 'MAI' : t.symbol,
                  t.name,
                )
          }
          const token0 = getToken(farm.pool.token0)
          const token1 = getToken(farm.pool.token1)
          const p = new Pool(
            token0.wrapped,
            token1.wrapped,
            Number(farm.pool.feeTier) as FeeAmount,
            farm.pool.sqrtPrice,
            farm.pool.liquidity,
            farm.pool.reinvestL,
            Number(farm.pool.tick),
          )

          let tvl = 0
          if (farm.stakedTvl) {
            tvl = +farm.stakedTvl
          } else {
            let tvlToken0 = CurrencyAmount.fromRawAmount(token0.wrapped, 0)
            let tvlToken1 = CurrencyAmount.fromRawAmount(token1.wrapped, 0)

            farm.depositedPositions?.forEach(pos => {
              const position = new Position({
                pool: p,
                liquidity: pos.position.liquidity,
                tickLower: Number(pos.position.tickLower.tickIdx),
                tickUpper: Number(pos.position.tickUpper.tickIdx),
              })

              tvlToken0 = tvlToken0.add(position.amount0)
              tvlToken1 = tvlToken1.add(position.amount1)
            })
            tvl =
              Number(tvlToken0.toExact() || '0') * (prices[farm.pool.token0.id] || 0) +
              Number(tvlToken1.toExact() || '0') * (prices[farm.pool.token1.id] || 0)
          }

          const totalRewards = farm.rewards.map(item =>
            CurrencyAmount.fromRawAmount(getToken(item.token, true), item.amount),
          )

          return {
            id: farm.id,
            fId: +farm.id.split('_')[1],
            farmAddress: farm.id.split('_')[0],
            startTime: Number(farm.startTime),
            endTime: Number(farm.endTime),
            isSettled: farm.isSettled,
            poolAddress: farm.pool.id,
            pool: p,
            token0,
            token1,
            totalRewards,
            tvl,
            ranges: farm.ranges.map(r => {
              // https://www.notion.so/kybernetwork/LM-v2-APR-Formula-15b8606e820745b59a5a3aded8bf46e0

              // t_0
              const totalFarmingTime = (+farm.endTime - +farm.startTime) / 60 / 60 / 24 // in days
              // r
              const totalFarmRewardUsd = totalRewards.reduce(
                (total, item) => total + +item.toExact() * (prices[item.currency.wrapped.address] || 0),
                0,
              )
              // w_f = r.weight
              // l_f = farm.liquidity
              // f(r_min, r_max, p_c)

              const sqrtLower = Math.sqrt(1.0001 ** +r.tickLower)
              const sqrtUpper = Math.sqrt(1.0001 ** +r.tickUpper)
              const sqrtCurrent = Math.sqrt(1.0001 ** +p.tickCurrent)

              const price0 = (prices[farm.pool.token0.id] || 0) / 10 ** +farm.pool.token0.decimals
              const price1 = (prices[farm.pool.token1.id] || 0) / 10 ** +farm.pool.token1.decimals

              let f
              if (p.tickCurrent < +r.tickLower) {
                f = (1 / sqrtLower - 1 / sqrtUpper) * price0
              } else if (p.tickCurrent >= +r.tickUpper) f = (sqrtUpper - sqrtLower) * price1
              else f = (1 / sqrtCurrent - 1 / sqrtUpper) * price0 + (sqrtCurrent - sqrtLower) * price1
              const denominator = +farm.liquidity * f

              const apr =
                farm.isSettled || +farm.endTime < Date.now() / 1000 || farm.liquidity === '0'
                  ? 0
                  : (100 * (totalFarmRewardUsd * +r.weight * 365)) / totalFarmingTime / denominator

              return {
                ...r,
                tickLower: +r.tickLower,
                tickUpper: +r.tickUpper,
                tickCurrent: +p.tickCurrent,
                apr,
                createdAt: +r.createdAt,
                updatedAt: +r.updatedAt,
              }
            }),
          }
        })

        dispatch(setFarms({ chainId, farms: formattedData }))

        const farmAddresses = [...new Set(formattedData.map(item => item.farmAddress))]

        type UserInfoRes = {
          nftId: BigNumber
          fId: BigNumber
          rangeId: BigNumber
          liquidity: BigNumber
          currentUnclaimedRewards: BigNumber[]
        }

        // get user deposit info
        if (account && farmv2QuoterContract && multicallContract && farmAddresses.length) {
          const userInfos: UserInfoRes[][] = await Promise.all(
            farmAddresses.map(farmAddress => {
              return farmv2QuoterContract.getUserInfo(farmAddress, account)
            }),
          )

          const userFarmInfos = await Promise.all(
            userInfos.map(async (res: UserInfoRes[], index) => {
              const nftIds = res.map(item => {
                return item.nftId
              })
              const nftDetailFragment = positionManagerInterface.getFunction('positions')
              const nftDetailChunks = nftIds.map(id => ({
                target: (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager,
                callData: positionManagerInterface.encodeFunctionData(nftDetailFragment, [id]),
              }))

              const detailNFTMultiCallData = (
                await multicallContract.callStatic.tryBlockAndAggregate(false, nftDetailChunks)
              ).returnData

              const nftDetailResult = detailNFTMultiCallData.map((data: [boolean, string]) =>
                data[0] ? positionManagerInterface.decodeFunctionResult(nftDetailFragment, data[1]) : null,
              )

              type NFT_INFO = {
                [id: string]: {
                  poolAddress: string
                  liquidity: BigNumber
                  tickLower: BigNumber
                  tickUpper: BigNumber
                }
              }

              const nftInfos = nftDetailResult.reduce((acc: NFT_INFO, item: any, index: number) => {
                if (!item) return acc
                return {
                  ...acc,
                  [nftIds[index].toString()]: {
                    poolAddress: getCreate2Address(
                      (networkInfo as EVMNetworkInfo).elastic.coreFactory,
                      keccak256(
                        ['bytes'],
                        [
                          defaultAbiCoder.encode(
                            ['address', 'address', 'uint24'],
                            [item.info.token0, item.info.token1, item.info.fee],
                          ),
                        ],
                      ),
                      (networkInfo as EVMNetworkInfo).elastic.initCodeHash,
                    ),
                    liquidity: item.pos.liquidity,
                    tickLower: item.pos.tickLower,
                    tickUpper: item.pos.tickUpper,
                  },
                }
              }, {} as NFT_INFO)

              const infos = res.reduce((acc: UserFarmV2Info[], item) => {
                const farm = formattedData.find(
                  farm =>
                    farm.farmAddress === farmAddresses[index] &&
                    farm.poolAddress.toLowerCase() === nftInfos[item.nftId.toString()].poolAddress.toLowerCase() &&
                    +farm.fId === +item.fId.toString(),
                )

                if (!farm) return acc

                const position = new Position({
                  pool: farm.pool,
                  liquidity: nftInfos[item.nftId.toString()].liquidity,
                  tickLower: nftInfos[item.nftId.toString()].tickLower,
                  tickUpper: nftInfos[item.nftId.toString()].tickUpper,
                })
                const positionUsdValue =
                  +position.amount0.toExact() * (prices[position.amount0.currency.wrapped.address] || 0) +
                  +position.amount1.toExact() * (prices[position.amount1.currency.wrapped.address] || 0)

                const stakedLiquidity = BigNumber.from(item.liquidity.toString()).div(
                  farm.ranges.find(r => r.index.toString() === item.rangeId.toString())?.weight || 1,
                )

                const stakedPos = new Position({
                  pool: farm.pool,
                  liquidity: stakedLiquidity.toString(),
                  tickLower: nftInfos[item.nftId.toString()].tickLower,
                  tickUpper: nftInfos[item.nftId.toString()].tickUpper,
                })

                const stakedUsdValue =
                  +stakedPos.amount0.toExact() * (prices[stakedPos.amount0.currency.wrapped.address] || 0) +
                  +stakedPos.amount1.toExact() * (prices[stakedPos.amount1.currency.wrapped.address] || 0)

                const unclaimedRewards = farm.totalRewards.map((rw, i) =>
                  CurrencyAmount.fromRawAmount(rw.currency, item.currentUnclaimedRewards[i].toString()),
                )

                const unclaimedRewardsUsd = unclaimedRewards.reduce(
                  (total, item) => total + +item.toExact() * (prices[item.currency.wrapped.address] || 0),
                  0,
                )

                return [
                  ...acc,
                  {
                    nftId: item.nftId,
                    position,
                    stakedPosition: stakedPos,
                    liquidity: nftInfos[item.nftId.toString()].liquidity,
                    stakedLiquidity: stakedLiquidity,
                    poolAddress: farm.poolAddress,
                    fId: Number(item.fId.toString()),
                    rangeId: Number(item.rangeId.toString()),
                    unclaimedRewards,
                    positionUsdValue,
                    stakedUsdValue,
                    unclaimedRewardsUsd,
                    farmAddress: farmAddresses[index],
                  },
                ]
              }, [] as UserFarmV2Info[])

              return infos
            }),
          )

          dispatch(setUserFarmInfo({ chainId, userInfo: userFarmInfos.flat() }))
        } else {
          dispatch(setUserFarmInfo({ chainId, userInfo: [] }))
        }
      }
    }

    getData()
  }, [fetchPrices, networkInfo, chainId, dispatch, data, account, farmv2QuoterContract, multicallContract])

  return null
}

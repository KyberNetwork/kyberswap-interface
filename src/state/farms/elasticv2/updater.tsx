import { gql, useLazyQuery } from '@apollo/client'
import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import { CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { BigNumber } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useEffect } from 'react'

import FarmV2QuoterABI from 'constants/abis/farmv2Quoter.json'
import NFTPositionManagerABI from 'constants/abis/v2/ProAmmNFTPositionManager.json'
import { ZERO_ADDRESS } from 'constants/index'
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
      ranges {
        id
        index
        isRemoved
        tickUpper
        tickLower
        weight
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
      }
    }
  }
`

export default function ElasticFarmV2Updater({ interval = true }: { interval?: boolean }) {
  const dispatch = useAppDispatch()
  const { networkInfo, isEVM, chainId, account } = useActiveWeb3React()
  const elasticFarm = useAppSelector(state => state.elasticFarmV2[chainId] || defaultChainData)
  const { elasticClient } = useKyberSwapConfig()

  const multicallContract = useMulticallContract()
  const farmv2QuoterContract = useContract(
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.farmv2Quoter : undefined,
    FarmV2QuoterABI,
  )

  const [getElasticFarmV2, { data, error }] = useLazyQuery(queryFarms, {
    client: elasticClient,
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    if (isEVM && !elasticFarm?.farms && !elasticFarm?.loading) {
      dispatch(setLoading({ chainId, loading: true }))
      getElasticFarmV2().finally(() => {
        dispatch(setLoading({ chainId, loading: false }))
      })
    }
  }, [isEVM, chainId, dispatch, getElasticFarmV2, elasticFarm])

  useEffect(() => {
    const i = interval
      ? setInterval(() => {
          getElasticFarmV2()
        }, 10_000)
      : undefined
    return () => {
      i && clearInterval(i)
    }
  }, [interval, dispatch, getElasticFarmV2])

  useEffect(() => {
    if (error && chainId) {
      dispatch(setFarms({ chainId, farms: [] }))
      dispatch(setLoading({ chainId, loading: false }))
    }
  }, [error, dispatch, chainId])

  const { fetchPrices } = useTokenPricesWithLoading([])

  useEffect(() => {
    const getData = async () => {
      if (data?.farmV2S && chainId) {
        const tokens = [
          ...new Set(
            data.farmV2S
              .map((item: SubgraphFarmV2) => [
                item.pool.token0.id,
                item.pool.token1.id,
                ...item.rewards.map((rw: { token: SubgraphToken }) => rw.token.id),
              ])
              .flat(),
          ),
        ] as string[]

        const prices = await fetchPrices(tokens)

        const formattedData: ElasticFarmV2[] = data.farmV2S.map((farm: SubgraphFarmV2) => {
          const getToken = (t: SubgraphToken) => {
            const address = isAddressString(chainId, t.id)
            return address === WETH[chainId].address || address === ZERO_ADDRESS
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

          const totalRewards = farm.rewards.map(item => CurrencyAmount.fromRawAmount(getToken(item.token), item.amount))
          return {
            id: farm.id,
            fId: +farm.id.split('_')[1],
            startTime: Number(farm.startTime),
            endTime: Number(farm.endTime),
            poolAddress: farm.pool.id,
            pool: p,
            token0,
            token1,
            totalRewards,
            ranges: farm.ranges.map(r => {
              let tvlToken0 = TokenAmount.fromRawAmount(token0.wrapped, 0)
              let tvlToken1 = TokenAmount.fromRawAmount(token1.wrapped, 0)

              r.depositedPositions.forEach(pos => {
                const position = new Position({
                  pool: p,
                  liquidity: pos.position.liquidity,
                  tickLower: Number(pos.position.tickLower.tickIdx),
                  tickUpper: Number(pos.position.tickUpper.tickIdx),
                })
                tvlToken0 = tvlToken0.add(position.amount0)
                tvlToken1 = tvlToken1.add(position.amount1)
              })

              const tvl =
                Number(tvlToken0.toExact() || '0') * (prices[farm.pool.token0.id] || 0) +
                Number(tvlToken1.toExact() || '0') * (prices[farm.pool.token1.id] || 0)

              const isFarmStarted = Number(farm.startTime) - Date.now() / 1000 < 0
              let apr = 0

              if (isFarmStarted && tvl) {
                const totalRewardUSD =
                  totalRewards.reduce(
                    (total, rw) => total + +rw.toExact() * (prices[rw.currency.wrapped.address.toLowerCase()] || 0),
                    0,
                  ) * Number(r.weight)
                const farmingTime = Date.now() / 1000 - Number(farm.startTime)
                const totalTime = Number(farm.endTime) - Number(farm.startTime)
                const rewarded = (totalRewardUSD * farmingTime) / totalTime
                apr = (rewarded * 365 * 24 * 60 * 60 * 100) / farmingTime / tvl
              }

              return { ...r, tickLower: +r.tickLower, tickUpper: +r.tickUpper, tickCurrent: +p.tickCurrent, tvl, apr }
            }),
          }
        })

        dispatch(setFarms({ chainId, farms: formattedData }))

        // get user deposit info
        if (account && farmv2QuoterContract && multicallContract) {
          farmv2QuoterContract.getUserInfo(account).then(
            async (
              res: {
                nftId: BigNumber
                fId: BigNumber
                rangeId: BigNumber
                liquidity: BigNumber
                currentUnclaimedRewards: BigNumber[]
              }[],
            ) => {
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
                  farm => farm.poolAddress.toLowerCase() === nftInfos[item.nftId.toString()].poolAddress.toLowerCase(),
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
                  (total, item) => total + +item.toExact() * prices[item.currency.wrapped.address],

                  0,
                )

                return [
                  ...acc,
                  {
                    nftId: item.nftId,
                    position,
                    poolAddress: farm.poolAddress,
                    stakedLiquidity: stakedLiquidity,
                    fId: Number(item.fId.toString()),
                    rangeId: Number(item.rangeId.toString()),
                    liquidity: item.liquidity,
                    unclaimedRewards,
                    positionUsdValue,
                    stakedUsdValue,
                    unclaimedRewardsUsd,
                  },
                ]
              }, [] as UserFarmV2Info[])

              dispatch(setUserFarmInfo({ chainId, userInfo: infos }))
            },
          )
        }
      }
    }

    getData()
  }, [fetchPrices, networkInfo, chainId, dispatch, data, account, farmv2QuoterContract, multicallContract])

  return null
}

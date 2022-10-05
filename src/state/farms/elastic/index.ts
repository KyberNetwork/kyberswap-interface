import { BigintIsh, Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { createSlice } from '@reduxjs/toolkit'
import { BigNumber } from 'ethers'

export interface FarmingPool {
  id: string
  pid: string
  startTime: number
  endTime: number
  feeTarget: string
  vestingDuration: number
  rewardTokens: Currency[]
  totalRewards: Array<CurrencyAmount<Currency>>
  token0: Currency
  token1: Currency
  pool: Pool
  poolAddress: string
  poolTvl: number
  feesUSD: number
  tvlToken0: TokenAmount
  tvlToken1: TokenAmount
}
export interface ElasticFarm {
  id: string // farm contract
  rewardLocker: string
  pools: Array<FarmingPool>
}

interface PositionConstructorArgs {
  nftId: BigNumber
  pool: Pool
  tickLower: number
  tickUpper: number
  liquidity: BigintIsh
}
export class NFTPosition extends Position {
  readonly nftId: BigNumber
  constructor({ nftId, pool, liquidity, tickLower, tickUpper }: PositionConstructorArgs) {
    super({ pool, liquidity, tickUpper, tickLower })
    this.nftId = nftId
  }
}

export interface UserInfo {
  depositedPositions: NFTPosition[]
  joinedPositions: {
    [pid: string]: NFTPosition[]
  }
  rewardPendings: {
    [pid: string]: Array<CurrencyAmount<Currency>>
  }
}

export interface UserFarmInfo {
  [farmContract: string]: UserInfo
}

interface ElasticFarmState {
  [chainId: number]: {
    loading: boolean
    loadingUserInfo: boolean
    farms: ElasticFarm[] | null
    userFarmInfo?: UserFarmInfo
    poolFeeLast24h: {
      [poolId: string]: number
    }
  }
}

const defaultChainData = {
  loadingUserInfo: false,
  loading: false,
  farms: [],
  poolFeeLast24h: {},
}
const initialState: ElasticFarmState = {}

const slice = createSlice({
  name: 'elasticFarm',
  initialState: initialState,
  reducers: {
    setFarms(state, { payload: { farms, chainId } }: { payload: { farms: ElasticFarm[]; chainId: number } }) {
      if (!state[chainId]) {
        state[chainId] = { ...defaultChainData, farms }
      } else state[chainId] = { ...state[chainId], farms }
    },
    setLoading(state, { payload: { loading, chainId } }) {
      if (!state[chainId]) {
        state[chainId] = { ...defaultChainData, loading }
      } else state[chainId] = { ...state[chainId], loading }
    },

    setUserFarmInfo(
      state,
      { payload: { userInfo, chainId } }: { payload: { userInfo: UserFarmInfo; chainId: number } },
    ) {
      if (!state[chainId]) {
        state[chainId] = defaultChainData
      }
      state[chainId].userFarmInfo = userInfo
    },

    setPoolFeeData(state, { payload: { chainId, data } }) {
      if (!state[chainId]) {
        state[chainId] = defaultChainData
      }
      state[chainId].poolFeeLast24h = data
    },
  },
})

export const { setFarms, setLoading, setUserFarmInfo, setPoolFeeData } = slice.actions

export default slice.reducer

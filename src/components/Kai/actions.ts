export enum Space {
  HALF_WIDTH = 50,
  FULL_WIDTH = 100,
}

export interface KaiAction {
  title: string
  space: Space
}

interface ListActions {
  [actionKey: string]: KaiAction
}

export const LIST_ACTIONS: ListActions = {
  CHECK_TOKEN_PRICE: {
    title: 'Check the token price',
    space: Space.FULL_WIDTH,
  },
  SEE_MARKET_TRENDS: {
    title: 'See market trends',
    space: Space.FULL_WIDTH,
  },
  FIND_HIGH_APY_POOLS: {
    title: 'Find high APY pools',
    space: Space.FULL_WIDTH,
  },
  BUY_TOKENS: {
    title: 'Buy tokens',
    space: Space.HALF_WIDTH,
  },
  SELL_TOKENS: {
    title: 'Sell tokens',
    space: Space.HALF_WIDTH,
  },
  ADD_LIQUIDITY: {
    title: 'Add liquidity',
    space: Space.FULL_WIDTH,
  },
}

export const MAIN_MENU: KaiAction[] = [
  LIST_ACTIONS.CHECK_TOKEN_PRICE,
  LIST_ACTIONS.SEE_MARKET_TRENDS,
  LIST_ACTIONS.FIND_HIGH_APY_POOLS,
  LIST_ACTIONS.BUY_TOKENS,
  LIST_ACTIONS.SELL_TOKENS,
  LIST_ACTIONS.ADD_LIQUIDITY,
]

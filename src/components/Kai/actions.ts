export enum Space {
  HALF_WIDTH = 'calc(50% - 6px)',
  FULL_WIDTH = '100%',
}

export enum ActionType {
  TEXT,
  OPTION,
  USER_MESSAGE,
  INVALID,
}

export interface KaiAction {
  title?: string
  type: ActionType
  data?: KaiOption[]
  placeholder?: string
  loadingText?: string
  response?: (answer: string) => KaiAction[]
}

export interface KaiOption {
  title: string
  space: Space
}

interface ListOptions {
  [optionKey: string]: KaiOption
}

interface ListActions {
  [actionKey: string]: KaiAction
}

const KAI_OPTIONS: ListOptions = {
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
  BACK_TO_MENU: {
    title: 'Back to the main menu',
    space: Space.FULL_WIDTH,
  },
}

export const MAIN_MENU: KaiOption[] = [
  KAI_OPTIONS.CHECK_TOKEN_PRICE,
  KAI_OPTIONS.SEE_MARKET_TRENDS,
  KAI_OPTIONS.FIND_HIGH_APY_POOLS,
  KAI_OPTIONS.BUY_TOKENS,
  KAI_OPTIONS.SELL_TOKENS,
  KAI_OPTIONS.ADD_LIQUIDITY,
]

export const KAI_ACTIONS: ListActions = {
  WELCOME: {
    type: ActionType.OPTION,
    data: MAIN_MENU,
    placeholder: 'Ask me anything or select...',
    response: (answer: string) => {
      if (MAIN_MENU.find((option: KaiOption) => answer.trim().toLowerCase() === option.title.toLowerCase()))
        return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.BACK_TO_MENU]
      return [KAI_ACTIONS.INVALID]
    },
  },
  BACK_TO_MENU: {
    type: ActionType.OPTION,
    data: [KAI_OPTIONS.BACK_TO_MENU],
    response: (answer: string) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title) return [KAI_ACTIONS.WELCOME]
      return [KAI_ACTIONS.INVALID]
    },
  },
  COMING_SOON: {
    title: 'Coming soon, do you want to go back to the main menu?',
    type: ActionType.TEXT,
  },
  INVALID: {
    title: 'Invalid input, please follow the instruction!',
    type: ActionType.INVALID,
  },
}

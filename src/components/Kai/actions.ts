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
  // response?: (answer: string) => KaiAction[]
  response?: any
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
  MAIN_MENU: {
    type: ActionType.OPTION,
    data: MAIN_MENU,
    placeholder: 'Ask me anything or select...',
    response: (answer: string) => {
      if (answer === KAI_OPTIONS.CHECK_TOKEN_PRICE.title.toLowerCase()) return [KAI_ACTIONS.TYPE_TOKEN_TO_CHECK_PRICE]
      if (MAIN_MENU.find((option: KaiOption) => answer.trim().toLowerCase() === option.title.toLowerCase()))
        return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.BACK_TO_MENU]
      return [KAI_ACTIONS.INVALID]
    },
  },
  TYPE_TOKEN_TO_CHECK_PRICE: {
    title: 'Great! Which token are you interested in? Just type the name or address.',
    type: ActionType.TEXT,
    response: async (answer: string) => {
      const filter: any = {
        chainId: 8453, // Base
        search: answer,
        page: '1',
        // pageSize: 80,
        pageSize: 5,
        chainIds: 8453, // Base
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_TOKEN_API_URL}/v1/public/assets?` + new URLSearchParams(filter).toString(),
          {
            method: 'GET',
          },
        )
        const { data } = await res.json()
        console.log(data.assets)

        if (data.assets.length === 1) {
          const token = data.assets[0]

          return [
            {
              title: `Here’s what I’ve got for ${answer}`,
              type: ActionType.TEXT,
            },
            {
              type: ActionType.TEXT,
              title: `
                - 📈 Price: ${token.tokens[0]?.priceBuy || ''}
                - 🔄 24h Price Change: ${-token.tokens[0]?.priceBuyChange24h}
                - 💸 24h Volume: ${token.volume24h}
                - 🏦 Market Cap: ${token.marketCap}
              `,
            },
            KAI_ACTIONS.WOULD_LIKE_TO_DO_SOMETHING_ELSE,
            KAI_ACTIONS.DO_SOMETHING_AFTER_CHECK_PRICE,
          ]
        } else if (data.assets.length > 1) {
          return [
            {
              title: `Here are the tokens I found. Which one do you mean?`,
              type: ActionType.TEXT,
            },
            {
              type: ActionType.OPTION,
              data: data.assets.map((item: any) => ({
                title: item.name,
                space: Space.HALF_WIDTH,
              })),
              response: (innerAnswer: string) => {
                const token = data.assets.find((item: any) => item.name.toLowerCase() === innerAnswer)
                if (token)
                  return [
                    {
                      title: `Here’s what I’ve got for ${innerAnswer}`,
                      type: ActionType.TEXT,
                    },
                    {
                      type: ActionType.TEXT,
                      title: `
                      - 📈 Price: ${token.tokens[0]?.priceBuy || ''}
                      - 🔄 24h Price Change: ${-token.tokens[0]?.priceBuyChange24h}
                      - 💸 24h Volume: ${token.volume24h}
                      - 🏦 Market Cap: ${token.marketCap}
                    `,
                    },
                    KAI_ACTIONS.WOULD_LIKE_TO_DO_SOMETHING_ELSE,
                    KAI_ACTIONS.DO_SOMETHING_AFTER_CHECK_PRICE,
                  ]

                return [KAI_ACTIONS.TOKEN_NOT_FOUND]
              },
            },
          ]
        }

        return [KAI_ACTIONS.TOKEN_NOT_FOUND]
      } catch (error) {
        return [KAI_ACTIONS.ERROR]
      }
    },
  },
  BACK_TO_MENU: {
    type: ActionType.OPTION,
    data: [KAI_OPTIONS.BACK_TO_MENU],
    response: (answer: string) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      return [KAI_ACTIONS.INVALID]
    },
  },
  DO_SOMETHING_AFTER_CHECK_PRICE: {
    type: ActionType.OPTION,
    data: [KAI_OPTIONS.BUY_TOKENS, KAI_OPTIONS.SELL_TOKENS, KAI_OPTIONS.BACK_TO_MENU],
    response: (answer: string) => {
      if (
        answer === KAI_OPTIONS.BUY_TOKENS.title.toLowerCase() ||
        answer === KAI_OPTIONS.SELL_TOKENS.title.toLowerCase()
      )
        return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.BACK_TO_MENU]

      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      return [KAI_ACTIONS.INVALID]
    },
  },
  WOULD_LIKE_TO_DO_SOMETHING_ELSE: {
    title: 'Would you like to do something else with this token?',
    type: ActionType.TEXT,
  },
  COMING_SOON: {
    title: 'Coming soon, do you want to go back to the main menu?',
    type: ActionType.TEXT,
  },
  INVALID: {
    title: 'Invalid input, please follow the instruction!',
    type: ActionType.INVALID,
  },
  ERROR: {
    title: 'Something went wrong, please try again!',
    type: ActionType.INVALID,
  },
  TOKEN_NOT_FOUND: {
    title: 'I can not find your token, please enter others!',
    type: ActionType.INVALID,
  },
}

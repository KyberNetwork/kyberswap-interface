import { formatDisplayNumber } from 'utils/numbers'

export enum Space {
  HALF_WIDTH = 'calc(50% - 6px)',
  FULL_WIDTH = '100%',
  ONE_THIRD_WIDTH = 'calc((100% - 24px) / 3)',
}

export enum ActionType {
  TEXT,
  OPTION,
  MAIN_OPTION,
  USER_MESSAGE,
  INVALID,
  HTML,
  INVALID_AND_BACK,
}

export interface KaiAction {
  title?: string
  type: ActionType
  data?: KaiOption[]
  arg?: any
  placeholder?: string
  loadingText?: string
  response?: (...args: any[]) => KaiAction[] | Promise<KaiAction[]>
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
  SWAP_TOKEN: {
    title: 'Buy/Sell tokens',
    space: Space.FULL_WIDTH,
  },
  ADD_LIQUIDITY: {
    title: 'Add liquidity',
    space: Space.FULL_WIDTH,
  },
  TOP_BIG_SPREAD: {
    title: 'Top 24h Big Spread',
    space: Space.FULL_WIDTH,
  },
  TOP_GAINERS: {
    title: 'Top 24h Gainers',
    space: Space.HALF_WIDTH,
  },
  TOP_VOLUME: {
    title: 'Top 24h Volume',
    space: Space.HALF_WIDTH,
  },
  BACK_TO_MENU: {
    title: '↩ Back to the main menu',
    space: Space.FULL_WIDTH,
  },
}

export const MAIN_MENU: KaiOption[] = [
  KAI_OPTIONS.CHECK_TOKEN_PRICE,
  KAI_OPTIONS.SEE_MARKET_TRENDS,
  KAI_OPTIONS.FIND_HIGH_APY_POOLS,
  KAI_OPTIONS.SWAP_TOKEN,
  KAI_OPTIONS.ADD_LIQUIDITY,
]

export const KAI_ACTIONS: ListActions = {
  MAIN_MENU: {
    type: ActionType.MAIN_OPTION,
    data: MAIN_MENU,
    placeholder: 'Ask me anything or select...',
    response: ({ answer }: { answer: string }) => {
      if (answer === KAI_OPTIONS.CHECK_TOKEN_PRICE.title.toLowerCase()) return [KAI_ACTIONS.TYPE_TOKEN_TO_CHECK_PRICE]
      if (answer === KAI_OPTIONS.SEE_MARKET_TRENDS.title.toLowerCase())
        return [KAI_ACTIONS.SEE_MARKET_TRENDS_WELCOME, KAI_ACTIONS.SEE_MARKET_TRENDS]
      if (MAIN_MENU.find((option: KaiOption) => answer.trim().toLowerCase() === option.title.toLowerCase()))
        return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.BACK_TO_MENU]
      return [KAI_ACTIONS.INVALID]
    },
  },
  BACK_TO_MENU: {
    type: ActionType.OPTION,
    data: [KAI_OPTIONS.BACK_TO_MENU],
    response: ({ answer }: { answer: string }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      return [KAI_ACTIONS.INVALID]
    },
  },
  INVALID_BACK_TO_MENU: {
    type: ActionType.INVALID_AND_BACK,
    data: [KAI_OPTIONS.BACK_TO_MENU],
  },
  DO_SOMETHING_AFTER_CHECK_PRICE: {
    type: ActionType.OPTION,
    data: [KAI_OPTIONS.SWAP_TOKEN, KAI_OPTIONS.BACK_TO_MENU],
    response: ({ answer }: { answer: string }) => {
      if (answer === KAI_OPTIONS.SWAP_TOKEN.title.toLowerCase())
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
    title: '🏃🏻 Coming soon, do you want to go back to the main menu?',
    type: ActionType.TEXT,
  },
  INVALID: {
    title: '❌ Invalid input, please follow the instruction!',
    type: ActionType.INVALID,
  },
  ERROR: {
    title: '❌ Something went wrong, please try again!',
    type: ActionType.INVALID,
  },
  TOKEN_NOT_FOUND: {
    title: '🔭 I can not find your token, please enter others!',
    type: ActionType.INVALID,
  },
  TOKEN_FOUND: {
    title: '👀 Here are the tokens I found. Which one do you mean?',
    type: ActionType.TEXT,
  },
  TYPE_TOKEN_TO_CHECK_PRICE: {
    title: '🫡 Great! Which token are you interested in? Just type the name or address.',
    type: ActionType.TEXT,
    response: async ({
      answer,
      chainId,
      whitelistTokenAddress,
      quoteSymbol,
    }: {
      answer: string
      chainId: number
      whitelistTokenAddress: string[]
      quoteSymbol: string
    }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]

      const filter: any = {
        chainId: chainId,
        search: answer,
        page: 1,
        pageSize: 50,
        chainIds: chainId,
        sort: '',
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_TOKEN_API_URL}/v1/public/assets?` + new URLSearchParams(filter).toString(),
          {
            method: 'GET',
          },
        )
        const { data } = await res.json()
        const result = data.assets
          .filter(
            (token: any) =>
              token.marketCap && token.tokens.find((item: any) => whitelistTokenAddress.includes(item.address)),
          )
          .map((token: any) => ({
            ...token,
            token: token.tokens.find(
              (item: any) => item.chainId === chainId.toString() && whitelistTokenAddress.includes(item.address),
            ),
          }))
          .filter((token: any) => token.token)
          .sort((a: any, b: any) => b.marketCap - a.marketCap)

        if (result.length === 1) {
          const token = result[0]

          return [
            {
              title: `Here’s what I’ve got for ${answer}`,
              type: ActionType.TEXT,
            },
            {
              type: ActionType.HTML,
              title: `
                <div>📈 Buy Price: ${
                  token.token.priceBuy
                    ? `${formatDisplayNumber(token.token.priceBuy, {
                        fractionDigits: 2,
                        significantDigits: 7,
                      })} ${quoteSymbol}`
                    : '--'
                }</div>
                <div>📈 Sell Price: ${
                  token.token.priceSell
                    ? `${formatDisplayNumber(token.token.priceSell, {
                        fractionDigits: 2,
                        significantDigits: 7,
                      })} ${quoteSymbol}`
                    : '--'
                }</div>
                <div>🔄 24h Buy Price Change: ${
                  token.token.priceBuyChange24h
                    ? `${token.token.priceBuyChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                        Math.abs(token.token.priceBuyChange24h),
                        {
                          style: 'decimal',
                          fractionDigits: 2,
                        },
                      )}%`
                    : '--'
                }</div>
                <div>🔄 24h Sell Price Change: ${
                  token.token.priceSellChange24h
                    ? `${token.token.priceSellChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                        Math.abs(token.token.priceSellChange24h),
                        {
                          style: 'decimal',
                          fractionDigits: 2,
                        },
                      )}%`
                    : '--'
                }</div>
                <div>💸 24h Volume: ${
                  token.volume24h
                    ? formatDisplayNumber(token.volume24h, { style: 'currency', fractionDigits: 2 })
                    : '--'
                }</div>
                <div>🏦 Market Cap: ${
                  token.marketCap
                    ? formatDisplayNumber(token.marketCap, { style: 'currency', fractionDigits: 2 })
                    : '--'
                }</div>
              `,
            },
            KAI_ACTIONS.WOULD_LIKE_TO_DO_SOMETHING_ELSE,
            KAI_ACTIONS.DO_SOMETHING_AFTER_CHECK_PRICE,
          ]
        } else if (result.length > 1) {
          return [
            KAI_ACTIONS.TOKEN_FOUND,
            {
              type: ActionType.OPTION,
              data: result
                .map((item: any) => ({
                  title: item.symbol,
                  space: item.symbol.length <= 10 ? Space.HALF_WIDTH : Space.FULL_WIDTH,
                }))
                .concat(KAI_ACTIONS.INVALID_BACK_TO_MENU.data),
              response: ({ answer: tokenSymbolSelected }: { answer: string }) => {
                if (tokenSymbolSelected === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]

                const token = result.find((item: any) => item.symbol.toLowerCase() === tokenSymbolSelected)
                if (token)
                  return [
                    {
                      title: `Here’s what I’ve got for ${tokenSymbolSelected}`,
                      type: ActionType.TEXT,
                    },
                    {
                      type: ActionType.HTML,
                      title: `
                        <div>📈 Buy Price: ${
                          token.token.priceBuy
                            ? `${formatDisplayNumber(token.token.priceBuy, {
                                fractionDigits: 2,
                                significantDigits: 7,
                              })} ${quoteSymbol}`
                            : '--'
                        }</div>
                        <div>📈 Sell Price: ${
                          token.token.priceSell
                            ? `${formatDisplayNumber(token.token.priceSell, {
                                fractionDigits: 2,
                                significantDigits: 7,
                              })} ${quoteSymbol}`
                            : '--'
                        }</div>
                        <div>🔄 24h Buy Price Change: ${
                          token.token.priceBuyChange24h
                            ? `${token.token.priceBuyChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                                Math.abs(token.token.priceBuyChange24h),
                                {
                                  style: 'decimal',
                                  fractionDigits: 2,
                                },
                              )}%`
                            : '--'
                        }</div>
                        <div>🔄 24h Sell Price Change: ${
                          token.token.priceSellChange24h
                            ? `${token.token.priceSellChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                                Math.abs(token.token.priceSellChange24h),
                                {
                                  style: 'decimal',
                                  fractionDigits: 2,
                                },
                              )}%`
                            : '--'
                        }</div>
                        <div>💸 24h Volume: ${
                          token.volume24h
                            ? formatDisplayNumber(token.volume24h, { style: 'currency', fractionDigits: 2 })
                            : '--'
                        }</div>
                        <div>🏦 Market Cap: ${
                          token.marketCap
                            ? formatDisplayNumber(token.marketCap, { style: 'currency', fractionDigits: 2 })
                            : '--'
                        }</div>
                      `,
                    },
                    KAI_ACTIONS.WOULD_LIKE_TO_DO_SOMETHING_ELSE,
                    KAI_ACTIONS.DO_SOMETHING_AFTER_CHECK_PRICE,
                  ]

                return [KAI_ACTIONS.TOKEN_NOT_FOUND, KAI_ACTIONS.INVALID_BACK_TO_MENU]
              },
            },
          ]
        }

        return [KAI_ACTIONS.TOKEN_NOT_FOUND, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      } catch (error) {
        return [KAI_ACTIONS.ERROR, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      }
    },
  },
  SEE_MARKET_TRENDS_WELCOME: {
    title: '🫡 Got it! What would you like to see the trend in 24 hours?',
    type: ActionType.TEXT,
  },
  SEE_MARKET_TRENDS: {
    type: ActionType.OPTION,
    data: [KAI_OPTIONS.TOP_BIG_SPREAD, KAI_OPTIONS.TOP_GAINERS, KAI_OPTIONS.TOP_VOLUME, KAI_OPTIONS.BACK_TO_MENU],
    response: ({ answer }: { answer: string }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      if (answer === KAI_OPTIONS.TOP_BIG_SPREAD.title.toLowerCase())
        return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.BACK_TO_MENU]
      if (
        answer === KAI_OPTIONS.TOP_GAINERS.title.toLowerCase() ||
        answer === KAI_OPTIONS.TOP_VOLUME.title.toLowerCase()
      )
        return [{ ...KAI_ACTIONS.SEE_MARKET_TRENDS_CHOOSE_AMOUNT, arg: answer }]

      return [KAI_ACTIONS.INVALID]
    },
  },
  SEE_MARKET_TRENDS_CHOOSE_AMOUNT: {
    type: ActionType.OPTION,
    data: [10, 15, 20].map((item: number) => ({ title: item.toString(), space: Space.ONE_THIRD_WIDTH })),
    response: async ({
      answer,
      chainId,
      arg,
      quoteSymbol,
    }: {
      answer: string
      chainId: number
      arg: any
      quoteSymbol: string
    }) => {
      const filter: any = {
        chainId: chainId,
        search: '',
        page: 1,
        pageSize: answer,
        chainIds: chainId,
        sort:
          arg === KAI_OPTIONS.TOP_GAINERS.title.toLowerCase()
            ? 'price_sell_change_24h-1 desc'
            : arg === KAI_OPTIONS.TOP_VOLUME.title.toLowerCase()
            ? 'volume_24h desc'
            : '',
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_TOKEN_API_URL}/v1/public/assets?` + new URLSearchParams(filter).toString(),
          {
            method: 'GET',
          },
        )
        const { data } = await res.json()
        const result = data.assets.map((token: any) => ({
          ...token,
          token: token.tokens.find((item: any) => item.chainId === chainId.toString()),
        }))

        const resultToActionData = result.map((item: any) => {
          const price = item.token.priceSell

          const priceSellChange24h = item.token.priceSellChange24h
            ? `${item.token.priceSellChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                Math.abs(item.token.priceSellChange24h),
                {
                  style: 'decimal',
                  fractionDigits: 2,
                },
              )}%`
            : '--'
          const volume24h = item.volume24h
            ? formatDisplayNumber(item.volume24h, { style: 'currency', fractionDigits: 2 })
            : '--'
          const metricValue =
            arg === KAI_OPTIONS.TOP_GAINERS.title.toLowerCase()
              ? priceSellChange24h
              : arg === KAI_OPTIONS.TOP_VOLUME.title.toLowerCase()
              ? volume24h
              : ''
          return {
            title: `💸 ${item.symbol} - ${metricValue} - ${
              price
                ? `${formatDisplayNumber(price, {
                    fractionDigits: 2,
                    significantDigits: 7,
                  })} ${quoteSymbol}`
                : '--'
            }`,
            space: Space.FULL_WIDTH,
          }
        })

        return [
          {
            title: `Here’s the list of ${arg
              .replace('24h', '')
              .trim()} for the last 24h,  click on a token to see more details!`,
            type: ActionType.TEXT,
          },
          {
            type: ActionType.OPTION,
            data: resultToActionData.concat([KAI_OPTIONS.SWAP_TOKEN, KAI_OPTIONS.BACK_TO_MENU]),
            response: ({ answer, quoteSymbol }: { answer: string; quoteSymbol: string }) => {
              if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
              if (answer === KAI_OPTIONS.SWAP_TOKEN.title.toLowerCase())
                return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.BACK_TO_MENU]

              const index = resultToActionData.findIndex((item: KaiOption) => item.title.toLowerCase() === answer)

              if (index > 1) {
                const token = result[index]

                return [
                  {
                    type: ActionType.HTML,
                    title: `
                      <div>📈 Buy Price: ${
                        token.token.priceBuy
                          ? `${formatDisplayNumber(token.token.priceBuy, {
                              fractionDigits: 2,
                              significantDigits: 7,
                            })} ${quoteSymbol}`
                          : '--'
                      }</div>
                      <div>📈 Sell Price: ${
                        token.token.priceSell
                          ? formatDisplayNumber(token.token.priceSell, {
                              fractionDigits: 2,
                              significantDigits: 7,
                            })
                          : '--'
                      }</div>
                      <div>🔄 24h Buy Price Change: ${
                        token.token.priceBuyChange24h
                          ? `${token.token.priceBuyChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                              Math.abs(token.token.priceBuyChange24h),
                              {
                                style: 'decimal',
                                fractionDigits: 2,
                              },
                            )}%`
                          : '--'
                      }</div>
                      <div>🔄 24h Sell Price Change: ${
                        token.token.priceSellChange24h
                          ? `${token.token.priceSellChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                              Math.abs(token.token.priceSellChange24h),
                              {
                                style: 'decimal',
                                fractionDigits: 2,
                              },
                            )}%`
                          : '--'
                      }</div>
                      <div>💸 24h Volume: ${
                        token.volume24h
                          ? formatDisplayNumber(token.volume24h, { style: 'currency', fractionDigits: 2 })
                          : '--'
                      }</div>
                      <div>🏦 Market Cap: ${
                        token.marketCap
                          ? formatDisplayNumber(token.marketCap, { style: 'currency', fractionDigits: 2 })
                          : '--'
                      }</div>
                    `,
                  },
                  KAI_ACTIONS.WOULD_LIKE_TO_DO_SOMETHING_ELSE,
                  KAI_ACTIONS.DO_SOMETHING_AFTER_CHECK_PRICE,
                ]
              }

              return [KAI_ACTIONS.INVALID, KAI_ACTIONS.INVALID_BACK_TO_MENU]
            },
          },
        ]
      } catch (error) {
        return [KAI_ACTIONS.ERROR, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      }
    },
  },
}

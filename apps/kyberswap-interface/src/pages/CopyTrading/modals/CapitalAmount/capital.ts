import type { PreparedToken } from 'services/copyTrading/types/preparedActions'

export const CAPITAL_PERCENTAGES = [25, 50, 75, 100] as const

export type CapitalPercentage = (typeof CAPITAL_PERCENTAGES)[number]

export type CapitalPreset = {
  amount: string
  percentage: CapitalPercentage
}

export type CapitalAction = 'startCopy' | 'addCapital'

export type CapitalInputQuoteToken = Required<Pick<PreparedToken, 'address' | 'decimals' | 'symbol'>> & {
  minimumAmountRaw: Record<CapitalAction, string>
}

const inputQuoteTokens: Record<number, CapitalInputQuoteToken> = {
  8453: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    minimumAmountRaw: {
      addCapital: '1000000',
      startCopy: '1000000',
    },
    symbol: 'USDC',
  },
}

export const getCapitalInputQuoteToken = (chainId: number) => inputQuoteTokens[chainId]

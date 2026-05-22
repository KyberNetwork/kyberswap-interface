import { createAction } from '@reduxjs/toolkit'

export type DustToken = {
  address: string
  symbol: string
  decimals: number
  logo?: string
}

export type DustInput = DustToken & {
  // human-readable amount (e.g. "1.23"); empty string = treat as 0
  amount: string
}

export const addInputToken = createAction<{ token: DustToken }>('dustLiquidation/addInputToken')
export const removeInputToken = createAction<{ address: string }>('dustLiquidation/removeInputToken')
export const setInputAmount = createAction<{ address: string; amount: string }>('dustLiquidation/setInputAmount')
export const replaceInputs = createAction<{ inputs: DustInput[] }>('dustLiquidation/replaceInputs')

export const setOutputToken = createAction<{ token: DustToken | null }>('dustLiquidation/setOutputToken')
export const setSlippage = createAction<{ slippage: number }>('dustLiquidation/setSlippage')
export const setRecipient = createAction<{ recipient: string | null }>('dustLiquidation/setRecipient')

export const resetState = createAction<void>('dustLiquidation/resetState')

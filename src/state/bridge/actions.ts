import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

export type BridgeStateParams = {
  tokenIn?: WrappedTokenInfo | undefined
  tokenOut?: WrappedTokenInfo | undefined
  chainIdOut?: ChainId | undefined
  listChainIn?: ChainId[] | undefined
  listTokenIn?: WrappedTokenInfo[] | undefined
  listTokenOut?: WrappedTokenInfo[] | undefined
}

export const setBridgeState = createAction<BridgeStateParams>('bridge/setBridgeState')

export const resetBridgeState = createAction('bridge/resetBridgeState')

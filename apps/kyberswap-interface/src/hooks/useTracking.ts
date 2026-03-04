import { useFormo } from '@formo/analytics'
import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { formatUnits, isAddress } from 'ethers/lib/utils'
import mixpanel, { crossChainMixpanel } from 'libs/mixpanel'
import { useCallback, useEffect, useMemo } from 'react'
import { isMobile } from 'react-device-detect'
import { useLocation } from 'react-router-dom'
import { usePrevious } from 'react-use'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { RANGE } from 'state/mint/proamm/type'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'

export enum TRACKING_EVENT_TYPE {
  PAGE_VIEWED,
  WALLET_CONNECTED,
  WALLET_CONNECT_CLICK,
  WALLET_CONNECT_ACCEPT_TERM_CLICK,
  WALLET_CONNECT_WALLET_CLICK,
  SWAP_INITIATED,
  SWAP_CONFIRMED,
  SWAP_COMPLETED,
  SWAP_TYPED_ON_THE_TEXT_BOX,
  SWAP_INPUT_AMOUNT,
  SWAP_SETTINGS_CLICK,
  SWAP_TUTORIAL_CLICK,
  SWAP_TOKEN_INFO_CLICK,
  SWAP_MORE_INFO_CLICK,
  SWAP_DISPLAY_SETTING_CLICK,
  DEGEN_MODE_TOGGLE,
  ADD_RECIPIENT_CLICKED,
  SLIPPAGE_CHANGED,
  LIVE_CHART_ON_OFF,
  TRADING_ROUTE_ON_OFF,
  LIVE_CHART_ON_MOBILE,
  PRO_CHART_CLICKED,
  BASIC_CHART_CLICKED,
  TRADING_ROUTE_ON_MOBILE,
  TOKEN_INFO_CHECKED,
  TOKEN_SWAP_LINK_SHARED,
  CHAIN_SWITCHED,
  ADD_FAVORITE_CHAIN,
  REMOVE_FAVORITE_CHAIN,
  CREATE_POOL_INITITATED,
  CREATE_POOL_COMPLETED,
  CREATE_POOL_LINK_SHARED,
  ADD_LIQUIDITY_INITIATED,
  ADD_LIQUIDITY_COMPLETED,
  REMOVE_LIQUIDITY_COMPLETED,
  REMOVE_LIQUIDITY_INITIATED,
  MIGRATE_LIQUIDITY_INITIATED,
  CLAIM_REWARDS_INITIATED,
  IMPORT_POOL_INITIATED,
  MYPOOLS_STAKED_VIEWED,
  MYPOOLS_POOLS_VIEWED,
  MYPOOLS_CLICK_SUBSCRIBE_BTN,

  FARMS_ACTIVE_VIEWED,
  FARMS_ENDING_VIEWED,
  FARMS_UPCOMING_VIEWED,
  FARMS_MYVESTING_VIEWED,
  INDIVIDUAL_REWARD_HARVESTED,
  ALL_REWARDS_HARVESTED,
  SINGLE_REWARD_CLAIMED,
  ALL_REWARDS_CLAIMED,
  ABOUT_SWAP_CLICKED,
  ABOUT_START_EARNING_CLICKED,
  ABOUT_VIEW_FARMS_CLICKED,
  ABOUT_CREATE_NEW_POOL_CLICKED,
  ABOUT_STAKE_KNC_CLICKED,
  ANALYTICS_MENU_CLICKED,
  BLOG_MENU_CLICKED,
  DISCOVER_TRENDING_SOON_CLICKED,
  DISCOVER_TRENDING_CLICKED,
  DISCOVER_SWAP_INITIATED,
  DISCOVER_SWAP_DISCOVER_MORE_CLICKED,
  DISCOVER_SWAP_SEE_HERE_CLICKED,
  DISCOVER_SWAP_BUY_NOW_CLICKED,
  DISCOVER_SWAP_MORE_INFO_CLICKED,
  DISCOVER_SWAP_BUY_NOW_POPUP_CLICKED,
  ELASTIC_CREATE_POOL_INITIATED,
  ELASTIC_CREATE_POOL_COMPLETED,
  ELASTIC_MYPOOLS_ELASTIC_POOLS_CLICKED,
  ELASTIC_POOLS_ELASTIC_POOLS_CLICKED,
  ELASTIC_ADD_LIQUIDITY_INITIATED,
  ELASTIC_ADD_LIQUIDITY_IN_LIST_INITIATED,
  ELASTIC_ADD_LIQUIDITY_COMPLETED,
  ELASTIC_ADD_LIQUIDITY_ADD_NEW_POSITION,
  ELASTIC_ADD_LIQUIDITY_CLICK_TO_REMOVE_POSITION,
  ELASTIC_ADD_LIQUIDITY_SELECT_RANGE_FOR_POOL,
  ELASTIC_ADD_LIQUIDITY_CLICK_SWAP,
  ELASTIC_ADD_LIQUIDITY_CLICK_PRICE_CHART,
  ELASTIC_ADD_LIQUIDITY_CLICK_POOL_ANALYTIC,
  ELASTIC_REMOVE_LIQUIDITY_INITIATED,
  ELASTIC_REMOVE_LIQUIDITY_COMPLETED,
  ELASTIC_INCREASE_LIQUIDITY_INITIATED,
  ELASTIC_INCREASE_LIQUIDITY_COMPLETED,
  ELASTIC_COLLECT_FEES_INITIATED,
  ELASTIC_COLLECT_FEES_COMPLETED,
  ELASTIC_DEPOSIT_LIQUIDITY_COMPLETED,
  ELASTIC_WITHDRAW_LIQUIDITY_COMPLETED,
  ELASTIC_STAKE_LIQUIDITY_COMPLETED,
  ELASTIC_UNSTAKE_LIQUIDITY_COMPLETED,
  ELASTIC_INDIVIDUAL_REWARD_HARVESTED,
  ELASTIC_ALLS_REWARD_HARVESTED,
  ELASTIC_ALL_REWARD_CLAIMED,
  FAUCET_MENU_CLICKED,
  FAUCET_REQUEST_INITIATED,
  FAUCET_REQUEST_COMPLETED,
  DISCOVER_CLICK_SUBSCRIBE_TRENDING_SOON,
  DISCOVER_SUBSCRIBE_TRENDING_SOON_SUCCESS,
  DISCOVER_UNSUBSCRIBE_TRENDING_SOON_SUCCESS,
  TRANSAK_BUY_CRYPTO_CLICKED,
  TRANSAK_DOWNLOAD_WALLET_CLICKED,
  TRANSAK_SWAP_NOW_CLICKED,
  SWAP_BUY_CRYPTO_CLICKED,

  // for tutorial swap
  TUTORIAL_CLICK_START,
  TUTORIAL_CLICK_DONE,
  TUTORIAL_CLICK_DENY,
  TUTORIAL_VIEW_VIDEO_SWAP,

  // MEV Protection
  MEV_CLICK_ADD_MEV,
  MEV_ADD_CLICK_MODAL,
  MEV_ADD_RESULT,

  BANNER_CLICK,
  CLOSE_BANNER_CLICK,

  FARM_UNDER_EARN_TAB_CLICK,

  // bridge
  BRIDGE_CLICK_REVIEW_TRANSFER,
  BRIDGE_CLICK_TRANSFER,
  BRIDGE_TRANSACTION_SUBMIT,
  BRIDGE_CLICK_HISTORY_TRANSFER_TAB,
  BRIDGE_CLICK_SUBSCRIBE_BTN,
  BRIDGE_CLICK_DISCLAIMER,
  BRIDGE_CLICK_UNDERSTAND_IN_FIRST_TIME_VISIT,

  //Kyber DAO
  KYBER_DAO_STAKE_CLICK,
  KYBER_DAO_UNSTAKE_CLICK,
  KYBER_DAO_DELEGATE_CLICK,
  KYBER_DAO_VOTE_CLICK,
  KYBER_DAO_CLAIM_CLICK,
  KYBER_DAO_FEATURE_REQUEST_CLICK,
  GAS_REFUND_CLAIM_CLICK,
  GAS_REFUND_SOURCE_CLICK,

  // notification
  NOTIFICATION_CLICK_MENU,
  NOTIFICATION_SELECT_TOPIC,
  NOTIFICATION_DESELECT_TOPIC,

  ANNOUNCEMENT_CLICK_BELL_ICON_OPEN_POPUP,
  ANNOUNCEMENT_CLICK_TAB_INBOX,
  ANNOUNCEMENT_CLICK_TAB_ANNOUNCEMENT,
  ANNOUNCEMENT_CLICK_ANNOUNCEMENT_MESSAGE,
  ANNOUNCEMENT_CLICK_INBOX_MESSAGE,
  ANNOUNCEMENT_CLICK_CLOSE_POPUP,
  ANNOUNCEMENT_CLICK_CTA_POPUP,
  ANNOUNCEMENT_CLICK_CLEAR_ALL_INBOXES,

  // limit order
  LO_CLICK_PLACE_ORDER,
  LO_PLACE_ORDER_SUCCESS,
  LO_ENTER_DETAIL,
  LO_CLICK_CANCEL_ORDER,
  LO_CANCEL_ORDER_SUBMITTED,
  LO_CLICK_REVIEW_PLACE_ORDER,
  LO_CLICK_EDIT_ORDER,
  LO_DISPLAY_SETTING_CLICK,
  LO_CLICK_SUBSCRIBE_BTN,
  LO_CLICK_CANCEL_TYPE,
  LO_CLICK_UPDATE_TYPE,
  LO_CLICK_GET_STARTED,
  LO_CLICK_WARNING_IN_SWAP,
  LO_REVIEW_OPENED,
  LO_ORDER_PLACED,
  LO_ORDER_FAILED,
  LO_ORDER_FILLED,
  LO_ORDER_CANCELLED,
  LO_SIDE_SELECTED,
  LO_PRICE_SET,
  LO_EXPIRY_CHANGED,

  // Wallet UI
  WUI_WALLET_CLICK,
  WUI_PINNED_WALLET,
  WUI_UNPINNED_WALLET,
  WUI_BUTTON_CLICK,
  WUI_IMPORT_TOKEN_CLICK,
  WUI_TRANSACTION_CLICK,
  WUI_IMPORT_TOKEN_BUTTON_CLICK,

  // Menu header
  MENU_MENU_CLICK,
  MENU_PREFERENCE_CLICK,
  MENU_CLAIM_REWARDS_CLICK,
  SUPPORT_CLICK,

  // price alert
  PA_CLICK_TAB_IN_NOTI_CENTER,
  PA_CREATE_SUCCESS,

  // Permit
  PERMIT_CLICK,
  INFINITE_APPROVE_CLICK,
  CUSTOM_APPROVE_CLICK,
  PERMIT_FAILED_TOO_MANY_TIMES,

  ACCEPT_NEW_AMOUNT,

  // cross chain
  CROSS_CHAIN_CLICK_DISCLAIMER,
  CROSS_CHAIN_SWAP_INIT,
  CROSS_CHAIN_SWAP_CONFIRMED,
  CROSS_CHAIN_CLICK_DISCLAIMER_CHECKBOX,
  CROSS_CHAIN_TXS_SUBMITTED,
  CROSS_CHAIN_CLICK_SUBSCRIBE,

  // earning dashboard
  EARNING_DASHBOARD_CLICK_TOP_LEVEL_SHARE_BUTTON,
  EARNING_DASHBOARD_SHARE_SUCCESSFULLY,
  EARNING_DASHBOARD_CLICK_POOL_EXPAND,
  EARNING_DASHBOARD_CLICK_ALL_CHAINS_BUTTON,
  EARNING_DASHBOARD_CLICK_REFRESH_BUTTON,
  EARNING_DASHBOARD_CLICK_CHANGE_TIMEFRAME_EARNING_CHART,
  EARNING_DASHBOARD_CLICK_ADD_LIQUIDITY_BUTTON,
  EARNING_DASHBOARD_CLICK_CURRENT_CHAIN_BUTTON,
  EARNING_DASHBOARD_VIEW_PAGE,
  EARNING_DASHBOARD_CLICK_SUBSCRIBE,

  // earn banner
  EARN_BANNER_CLICK,
  EARN_BANNER_POOL_CLICK,

  // Swap flow custom events
  SWAP_REVIEW_OPENED,
  TOKEN_APPROVAL_INITIATED,
  TOKEN_APPROVAL_COMPLETED,
  TOKEN_APPROVAL_FAILED,
  SWAP_FAILED,

  // Swap form interactions
  TOKEN_SELECTED,
  AMOUNT_ENTERED,
  TOKEN_PAIR_REVERSED,
  MAX_BALANCE_CLICKED,

  // Swap settings interactions
  TRANSACTION_TIME_LIMIT_CHANGED,
  GAS_TOKEN_CHANGED,
  LIQUIDITY_SOURCES_TOGGLED,

  // Cross-chain execution flow
  CC_ROUTE_VIEWED,
  CC_REVIEW_OPENED,
  CC_SWAP_INITIATED,
  CC_SWAP_COMPLETED,
  CC_SWAP_FAILED,

  // Cross-chain form interactions
  CC_TAB_SELECTED,
  CC_SOURCE_CHAIN_SELECTED,
  CC_DESTINATION_CHAIN_SELECTED,
  CC_RECIPIENT_ADDRESS_ENTERED,
  CC_WALLET_SELECTED,

  // Cross-chain settings interactions
  CC_SETTINGS_OPENED,
  CC_SLIPPAGE_CHANGED,
  CC_ROUTING_SOURCE_TOGGLED,
  CC_SETTINGS_SAVED,
}

export const NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES: readonly TRANSACTION_TYPE[] = [
  TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY,
  TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
  TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY,
  TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
  TRANSACTION_TYPE.CLASSIC_CREATE_POOL,
  TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
] as const

type FeeInfo = {
  chargeTokenIn: boolean
  tokenSymbol: string
  feeUsd: string
  feeAmount: string
}

export enum CROSS_CHAIN_MIXPANEL_TYPE {
  CROSS_CHAIN_SWAP_INIT = 'cross_chain_swap_init',
  CROSS_CHAIN_SWAP_SUCCESS = 'cross_chain_swap_success',
  CROSS_CHAIN_SWAP_FAILED = 'cross_chain_swap_failed',
}

export const useCrossChainMixpanel = () => {
  const crossChainMixpanelHandler = useCallback((type: CROSS_CHAIN_MIXPANEL_TYPE, payload?: any) => {
    switch (type) {
      case CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_INIT: {
        crossChainMixpanel?.track(type, payload)
        break
      }
      case CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_SUCCESS: {
        crossChainMixpanel?.track(type, payload)
        break
      }
      case CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_FAILED: {
        crossChainMixpanel?.track(type, payload)
        break
      }
    }
  }, [])

  return { crossChainMixpanelHandler }
}

export default function useTracking(currencies?: { [field in Field]?: Currency }) {
  const { account, networkInfo } = useActiveWeb3React()
  const network = networkInfo.name
  const analytics = useFormo()

  const inputCurrencyFromHook = useInputCurrency()
  const outputCurrencyFromHook = useOutputCurrency()
  const inputCurrency = currencies ? currencies[Field.INPUT] : inputCurrencyFromHook
  const outputCurrency = currencies ? currencies[Field.OUTPUT] : outputCurrencyFromHook

  const inputSymbol = inputCurrency && inputCurrency.isNative ? networkInfo.nativeToken.symbol : inputCurrency?.symbol
  const outputSymbol =
    outputCurrency && outputCurrency.isNative ? networkInfo.nativeToken.symbol : outputCurrency?.symbol
  const [allowedSlippage] = useUserSlippageTolerance()

  const formoTrack = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      analytics?.track(eventName, properties)
    },
    [analytics],
  )

  const trackingHandler = useCallback(
    (type: TRACKING_EVENT_TYPE, payload?: any) => {
      // Anonymous events
      switch (type) {
        case TRACKING_EVENT_TYPE.PAGE_VIEWED: {
          const { page } = payload
          page && formoTrack(page + ' Page Viewed')
          break
        }
        case TRACKING_EVENT_TYPE.WALLET_CONNECT_CLICK: {
          formoTrack('Wallet Connect - Connect Wallet Button Click')
          break
        }
        case TRACKING_EVENT_TYPE.WALLET_CONNECT_ACCEPT_TERM_CLICK: {
          formoTrack('Wallet Connect - Accept term button click')
          break
        }
        case TRACKING_EVENT_TYPE.WALLET_CONNECT_WALLET_CLICK: {
          formoTrack('Wallet Connect - Wallet click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CHAIN_SWITCHED: {
          const { old_network, new_network } = payload
          formoTrack('Chain Switched', {
            old_network,
            new_network,
          })
          break
        }
      }
      if (!account) {
        return
      }
      // Need connect wallet events
      switch (type) {
        case TRACKING_EVENT_TYPE.WALLET_CONNECTED:
          formoTrack('Wallet Connected', {
            wallet_address: account,
            platform: isMobile ? 'Mobile' : 'Web',
            network,
            source: location.pathname,
          })
          break
        case TRACKING_EVENT_TYPE.ADD_FAVORITE_CHAIN:
          formoTrack('Favourite Chain - Add chain over favourite list success', payload)
          break
        case TRACKING_EVENT_TYPE.REMOVE_FAVORITE_CHAIN:
          formoTrack('Favourite Chain - Remove chain from favourite list success', payload)
          break
        case TRACKING_EVENT_TYPE.SWAP_INITIATED: {
          const {
            gasUsd,
            inputAmount,
            priceImpact,
            feeInfo,
            from_token_address,
            to_token_address,
            pair,
            amount_in_usd,
            amount_out_estimated,
            amount_out_usd,
            minimum_received,
            rate,
            transaction_time_limit,
            gas_token,
            trade_route_dexes,
            trade_route_steps,
            route_split,
            chain,
            volume,
          } = (payload || {}) as {
            gasUsd: number | string | undefined
            inputAmount: CurrencyAmount<Currency> | undefined
            priceImpact: number | undefined
            feeInfo?: FeeInfo
            from_token_address?: string
            to_token_address?: string
            pair?: string
            amount_in_usd?: string
            amount_out_estimated?: string
            amount_out_usd?: string
            minimum_received?: string
            rate?: string
            transaction_time_limit?: number
            gas_token?: string
            trade_route_dexes?: string[]
            trade_route_steps?: number
            route_split?: boolean
            chain?: string
            volume?: number
          }

          const body: Record<string, any> = {
            input_token: inputSymbol,
            output_token: outputSymbol,
            from_token_address,
            to_token_address,
            pair,
            estimated_gas: gasUsd ? Number(gasUsd).toFixed(4) : undefined,
            trade_qty: inputAmount?.toExact(),
            amount_in_usd,
            amount_out_estimated,
            amount_out_usd,
            minimum_received,
            rate,
            slippage_setting: allowedSlippage ? allowedSlippage / 100 : 0,
            price_impact: priceImpact && priceImpact > 0.01 ? priceImpact.toFixed(2) : '<0.01',
            transaction_time_limit,
            gas_token,
            trade_route_dexes,
            trade_route_steps,
            route_split,
            chain,
            volume,
          }

          if (feeInfo) {
            if (feeInfo.chargeTokenIn) {
              body.charged_token_type = 'input'
            } else {
              body.charged_token_type = 'output'
            }

            body.charged_token_symbol = feeInfo.tokenSymbol
            body.amount_fee_usd = feeInfo.feeUsd
            body.amount_fee_token = feeInfo.feeAmount
          }

          formoTrack('Swap Initiated', body)
          break
        }
        case TRACKING_EVENT_TYPE.SWAP_CONFIRMED: {
          const { gasUsd, inputAmount, priceImpact, outputAmountDescription, currentPrice, feeInfo } = (payload ||
            {}) as {
            gasUsd: string | undefined
            inputAmount: CurrencyAmount<Currency> | undefined
            priceImpact: number | undefined
            outputAmountDescription: string | undefined
            currentPrice: string | undefined
            feeInfo?: FeeInfo
          }

          const body: Record<string, any> = {
            input_token: inputSymbol,
            output_token: outputSymbol,
            estimated_gas: gasUsd,
            trade_qty: inputAmount?.toExact(),
            slippage_setting: allowedSlippage ? allowedSlippage / 100 : 0,
            price_impact: priceImpact && priceImpact > 0.01 ? priceImpact.toFixed(2) : '<0.01',
            initial_output_amt_type: outputAmountDescription,
            current_price: currentPrice, // price in swap confirmation step
          }

          if (feeInfo) {
            if (feeInfo.chargeTokenIn) {
              body.charged_token_type = 'input'
            } else {
              body.charged_token_type = 'output'
            }

            body.charged_token_symbol = feeInfo.tokenSymbol
            body.amount_fee_usd = feeInfo.feeUsd
            body.amount_fee_token = feeInfo.feeAmount
          }

          formoTrack('Swap Confirmed', body)

          break
        }
        case TRACKING_EVENT_TYPE.SWAP_COMPLETED: {
          const { arbitrary, actual_gas, gas_price, tx_hash } = payload
          const feeInfo = payload.feeInfo as FeeInfo
          const formattedGas = gas_price ? formatUnits(gas_price, networkInfo.nativeToken.decimal) : '0'

          const body: Record<string, any> = {
            input_token: arbitrary.inputSymbol,
            output_token: arbitrary.outputSymbol,
            from_token_address: arbitrary.inputAddress,
            to_token_address: arbitrary.outputAddress,
            pair:
              arbitrary.inputSymbol && arbitrary.outputSymbol
                ? `${arbitrary.inputSymbol}/${arbitrary.outputSymbol}`
                : undefined,
            actual_gas: actual_gas.toNumber() * parseFloat(formattedGas),
            tx_hash: tx_hash,
            trade_qty: arbitrary.inputAmount,
            amount_in_usd: arbitrary.amountInUsd,
            amount_out_usd: arbitrary.amountOutUsd,
            slippage_setting: arbitrary.slippageSetting,
            price_impact: arbitrary.priceImpact,
            gas_price: formattedGas,
            actual_gas_native: actual_gas?.toNumber(),
            trade_route_dexes: arbitrary.tradeRouteDexes,
            chain: arbitrary.chain,
            volume: arbitrary.volume,
          }

          if (feeInfo) {
            if (feeInfo.chargeTokenIn) {
              body.charged_token_type = 'input'
            } else {
              body.charged_token_type = 'output'
            }

            body.charged_token_symbol = feeInfo.tokenSymbol
            body.amount_fee_usd = feeInfo.feeUsd
            body.amount_fee_token = feeInfo.feeAmount
          }

          formoTrack('Swap Completed', body)
          break
        }
        case TRACKING_EVENT_TYPE.SWAP_SETTINGS_CLICK: {
          formoTrack('Swap Settings Opened', payload)
          break
        }
        case TRACKING_EVENT_TYPE.SWAP_TUTORIAL_CLICK: {
          formoTrack('Swap - Tutorial Click in swap box')
          break
        }
        case TRACKING_EVENT_TYPE.SWAP_TOKEN_INFO_CLICK: {
          formoTrack('Swap - Token Info Click in swap box')
          break
        }
        case TRACKING_EVENT_TYPE.SWAP_MORE_INFO_CLICK: {
          formoTrack('Swap - More information Click in swap box', payload)
          break
        }
        case TRACKING_EVENT_TYPE.SWAP_DISPLAY_SETTING_CLICK: {
          formoTrack('Swap - Display settings on Swap settings', payload)
          break
        }
        case TRACKING_EVENT_TYPE.DEGEN_MODE_TOGGLE: {
          formoTrack('Degen Mode Toggle', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            type: payload.type,
          })
          break
        }
        case TRACKING_EVENT_TYPE.ADD_RECIPIENT_CLICKED: {
          formoTrack('Add Recipient Clicked', {
            input_token: inputSymbol,
            output_token: outputSymbol,
          })
          break
        }
        case TRACKING_EVENT_TYPE.SLIPPAGE_CHANGED: {
          const { new_slippage, previous_value, input_method } = payload
          formoTrack('Max Slippage Changed', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            previous_value,
            new_value: new_slippage,
            input_method,
          })
          break
        }
        case TRACKING_EVENT_TYPE.LIVE_CHART_ON_OFF: {
          const { live_chart_on_or_off } = payload
          formoTrack('Live Chart Turned On/Off (Desktop)', {
            live_chart_on_or_off: live_chart_on_or_off ? 'On' : 'Off',
          })
          break
        }
        case TRACKING_EVENT_TYPE.TRADING_ROUTE_ON_OFF: {
          const { trading_route_on_or_off } = payload
          formoTrack('Trading Route Turned On/Off (Desktop)', {
            trading_route_on_or_off: trading_route_on_or_off ? 'On' : 'Off',
          })
          break
        }
        case TRACKING_EVENT_TYPE.LIVE_CHART_ON_MOBILE: {
          formoTrack('Live Chart Turned On (Mobile)')
          break
        }
        case TRACKING_EVENT_TYPE.PRO_CHART_CLICKED: {
          formoTrack('Swap - Pro Live Chart - Pro button clicked on Swap Page')
          break
        }
        case TRACKING_EVENT_TYPE.BASIC_CHART_CLICKED: {
          formoTrack('Swap - Pro Live Chart - Basic button clicked on Swap Page')
          break
        }
        case TRACKING_EVENT_TYPE.TRADING_ROUTE_ON_MOBILE: {
          formoTrack('Trading Route Turned On (Mobile)')
          break
        }
        case TRACKING_EVENT_TYPE.TOKEN_INFO_CHECKED: {
          formoTrack('Token information viewed in Info tab (Swap Page)', {
            input_token: inputSymbol,
            output_token: outputSymbol,
          })
          break
        }
        case TRACKING_EVENT_TYPE.TOKEN_SWAP_LINK_SHARED: {
          formoTrack('Token Swap Link Shared', {
            input_token: inputSymbol,
            output_token: outputSymbol,
          })
          break
        }
        case TRACKING_EVENT_TYPE.MEV_CLICK_ADD_MEV: {
          formoTrack('MEV Protection - Click add MEV protection')
          break
        }
        case TRACKING_EVENT_TYPE.MEV_ADD_CLICK_MODAL: {
          formoTrack('MEV Protection -  MEV protection type click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.MEV_ADD_RESULT: {
          formoTrack('MEV Protection -  Add MEV protection result', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CREATE_POOL_INITITATED: {
          formoTrack('Create New Pool Initiated')
          break
        }
        case TRACKING_EVENT_TYPE.CREATE_POOL_COMPLETED: {
          const { token_1, token_2, amp } = payload
          formoTrack('Create New Pool Completed', {
            token_1,
            token_2,
            amp,
          })
          break
        }
        case TRACKING_EVENT_TYPE.CREATE_POOL_LINK_SHARED: {
          const { token_1, token_2 } = payload
          formoTrack('Create New Pool Link Shared', {
            token_1,
            token_2,
          })
          break
        }
        case TRACKING_EVENT_TYPE.ADD_LIQUIDITY_INITIATED: {
          const { token_1, token_2, amp } = payload
          formoTrack('Add Liquidity Initiated', {
            token_1,
            token_2,
            amp,
          })
          break
        }
        case TRACKING_EVENT_TYPE.ADD_LIQUIDITY_COMPLETED: {
          formoTrack('Add Liquidity Completed', { ...payload, tx_hash: payload.tx_hash })
          break
        }
        case TRACKING_EVENT_TYPE.REMOVE_LIQUIDITY_COMPLETED: {
          formoTrack('Remove Liquidity Completed', { ...payload, tx_hash: payload.tx_hash })
          break
        }
        case TRACKING_EVENT_TYPE.REMOVE_LIQUIDITY_INITIATED: {
          const { token_1, token_2, amp } = payload
          formoTrack('Remove Liquidity Initiated', {
            token_1,
            token_2,
            amp,
          })

          break
        }
        case TRACKING_EVENT_TYPE.MIGRATE_LIQUIDITY_INITIATED: {
          formoTrack('Migrate Liquidity Initiated')
          break
        }
        case TRACKING_EVENT_TYPE.CLAIM_REWARDS_INITIATED: {
          formoTrack('Claim Rewards Initiated')
          break
        }
        case TRACKING_EVENT_TYPE.IMPORT_POOL_INITIATED: {
          formoTrack('Import Pool Initiated')

          break
        }
        case TRACKING_EVENT_TYPE.MYPOOLS_STAKED_VIEWED: {
          formoTrack(`My Pools - 'Staked Pools' Tab Viewed`, {})

          break
        }
        case TRACKING_EVENT_TYPE.MYPOOLS_POOLS_VIEWED: {
          formoTrack(`My Pools - 'Pools' Tab Viewed`)

          break
        }
        case TRACKING_EVENT_TYPE.MYPOOLS_CLICK_SUBSCRIBE_BTN: {
          formoTrack('My Pools - User click to Subscribe button')
          break
        }

        case TRACKING_EVENT_TYPE.FARMS_ACTIVE_VIEWED: {
          formoTrack(`Farms - 'Active' Tab Viewed`)

          break
        }
        case TRACKING_EVENT_TYPE.FARMS_ENDING_VIEWED: {
          formoTrack(`Farms - 'Ending' Tab Viewed`)

          break
        }
        case TRACKING_EVENT_TYPE.FARMS_UPCOMING_VIEWED: {
          formoTrack(`Farms - 'Upcoming' Tab Viewed`)

          break
        }
        case TRACKING_EVENT_TYPE.FARMS_MYVESTING_VIEWED: {
          formoTrack(`Farms - 'My Vesting' Tab Viewed`)

          break
        }
        case TRACKING_EVENT_TYPE.INDIVIDUAL_REWARD_HARVESTED: {
          const { reward_tokens_and_amounts } = payload
          formoTrack('Individual Reward Harvested', { reward_tokens_and_qty: reward_tokens_and_amounts })

          break
        }
        case TRACKING_EVENT_TYPE.ALL_REWARDS_HARVESTED: {
          const { reward_tokens_and_amounts } = payload

          formoTrack('All Rewards Harvested', { reward_tokens_and_qty: reward_tokens_and_amounts })

          break
        }
        case TRACKING_EVENT_TYPE.SINGLE_REWARD_CLAIMED: {
          const { reward_token, reward_amount } = payload

          formoTrack('Single Reward Claimed', { reward_token, reward_qty: reward_amount })

          break
        }
        case TRACKING_EVENT_TYPE.ALL_REWARDS_CLAIMED: {
          const { reward_tokens_and_amounts } = payload

          formoTrack('All Rewards Claimed', { reward_tokens_and_qty: reward_tokens_and_amounts })
          break
        }
        case TRACKING_EVENT_TYPE.ABOUT_SWAP_CLICKED: {
          formoTrack('About - Swap Clicked')
          break
        }
        case TRACKING_EVENT_TYPE.ABOUT_START_EARNING_CLICKED: {
          formoTrack('About - Start Earning Clicked')
          break
        }
        case TRACKING_EVENT_TYPE.ABOUT_VIEW_FARMS_CLICKED: {
          formoTrack('About - View Farms Clicked')
          break
        }
        case TRACKING_EVENT_TYPE.ABOUT_CREATE_NEW_POOL_CLICKED: {
          formoTrack('About - Create New Pool Clicked')
          break
        }
        case TRACKING_EVENT_TYPE.ABOUT_STAKE_KNC_CLICKED: {
          formoTrack('About - Stake KNC Clicked')
          break
        }
        case TRACKING_EVENT_TYPE.ANALYTICS_MENU_CLICKED: {
          formoTrack('Analytics Page Clicked')
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_TRENDING_SOON_CLICKED: {
          formoTrack('Discover - Trending Soon Tab Clicked')
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_TRENDING_CLICKED: {
          formoTrack('Discover - Trending Tab Clicked')
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_CLICK_SUBSCRIBE_TRENDING_SOON: {
          formoTrack(`Discover - 'Subscribe' clicked on Trending Soon`)
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_SUBSCRIBE_TRENDING_SOON_SUCCESS: {
          formoTrack(`Discover - 'Subscribed' Trending Soon successfully`)
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_UNSUBSCRIBE_TRENDING_SOON_SUCCESS: {
          formoTrack(`Discover - 'Unsubscribed' Trending Soon successfully`)
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_SWAP_INITIATED: {
          const { token_name, trending_or_trending_soon, token_on_chain, token_contract_address } = payload
          formoTrack('Discover - Swap Initiated', {
            token_name,
            trending_or_trending_soon,
            token_on_chain,
            token_contract_address,
          })

          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_SWAP_DISCOVER_MORE_CLICKED: {
          formoTrack('Discover - "Discover more" clicked from Swap Page')
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_SWAP_SEE_HERE_CLICKED: {
          const { trending_token } = payload
          formoTrack('Discover - "See here" clicked from Swap page', { trending_token })
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_SWAP_BUY_NOW_CLICKED: {
          const { trending_token } = payload
          formoTrack('Discover - "Buy Now" clicked on Swap Page', { trending_token })
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_SWAP_MORE_INFO_CLICKED: {
          const { trending_token } = payload
          formoTrack('Discover - "More info" clicked on Swap Page', { trending_token })
          break
        }
        case TRACKING_EVENT_TYPE.DISCOVER_SWAP_BUY_NOW_POPUP_CLICKED: {
          const { trending_token } = payload
          formoTrack('Discover - "Buy Now" clicked in pop-up after \'More Info\' on Swap page', {
            trending_token,
          })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_CREATE_POOL_INITIATED: {
          formoTrack('Elastic Pools - Create New Pool Initiated')
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_CREATE_POOL_COMPLETED: {
          formoTrack('Elastic Pools - Create New Pool Completed', {
            ...payload,
            tx_hash: payload.tx_hash,
          })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_MYPOOLS_ELASTIC_POOLS_CLICKED: {
          formoTrack('Elastic Pools - My pools - Click on Elastic Pool')
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_POOLS_ELASTIC_POOLS_CLICKED: {
          formoTrack('Elastic Pools - Click on Elastic Pool')
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ADD_LIQUIDITY_INITIATED: {
          formoTrack('Elastic Pools - Add Liquidity Initiated')
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ADD_LIQUIDITY_IN_LIST_INITIATED: {
          formoTrack('Elastic Pools - Add Liquidity Initiated in Token Pair List', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ADD_LIQUIDITY_COMPLETED: {
          formoTrack('Elastic Pools - Add Liquidity Completed', {
            ...payload,
            tx_hash: payload.tx_hash,
          })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_REMOVE_LIQUIDITY_INITIATED: {
          formoTrack('Elastic Pools - My Pools - Remove Liquidity Initiated', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_REMOVE_LIQUIDITY_COMPLETED: {
          formoTrack('Elastic Pools - My Pools - Remove Liquidity Completed', {
            ...payload,
            tx_hash: payload.tx_hash,
          })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_INCREASE_LIQUIDITY_INITIATED: {
          formoTrack('Elastic Pools - My Pools - Increase Liquidity Initiated', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_INCREASE_LIQUIDITY_COMPLETED: {
          formoTrack('Elastic Pools - My Pools - Increase Liquidity Completed', {
            ...payload,
            tx_hash: payload.tx_hash,
          })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_COLLECT_FEES_INITIATED: {
          formoTrack('Elastic Pools - My Pools - Collect Fees Initiated', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_COLLECT_FEES_COMPLETED: {
          formoTrack('Elastic Pools - My Pools - Collect Fees Completed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_DEPOSIT_LIQUIDITY_COMPLETED: {
          formoTrack('Elastic Farms - Deposit Liquidity Completed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_WITHDRAW_LIQUIDITY_COMPLETED: {
          formoTrack('Elastic Farms - Withdraw Liquidity Completed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_STAKE_LIQUIDITY_COMPLETED: {
          formoTrack('Elastic Farms - Stake Liquidity Completed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_UNSTAKE_LIQUIDITY_COMPLETED: {
          formoTrack('Elastic Farms - Unstake Liquidity Completed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_INDIVIDUAL_REWARD_HARVESTED: {
          formoTrack('Elastic Farms - Individual Reward Harvested', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ALLS_REWARD_HARVESTED: {
          formoTrack('Elastic Farms - All Rewards Harvested', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ALL_REWARD_CLAIMED: {
          formoTrack('Elastic Farms - Reward Claimed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.FAUCET_MENU_CLICKED: {
          formoTrack('Faucet feature - Faucet button clicked on Menu')
          break
        }
        case TRACKING_EVENT_TYPE.FAUCET_REQUEST_INITIATED: {
          formoTrack('Faucet feature - Request faucet Initiated')
          break
        }
        case TRACKING_EVENT_TYPE.FAUCET_REQUEST_COMPLETED: {
          formoTrack('Faucet feature - Request faucet Completed')
          break
        }
        case TRACKING_EVENT_TYPE.TRANSAK_DOWNLOAD_WALLET_CLICKED: {
          formoTrack('Buy Crypto - Download a wallet "Download Wallet”')
          break
        }
        case TRACKING_EVENT_TYPE.TRANSAK_BUY_CRYPTO_CLICKED: {
          formoTrack('Buy Crypto - To purchase crypto on Transak "Buy Now”')
          break
        }
        case TRACKING_EVENT_TYPE.TRANSAK_SWAP_NOW_CLICKED: {
          formoTrack('Buy Crypto - Swap token on KyberSwap "Swap" button')
          break
        }
        case TRACKING_EVENT_TYPE.SWAP_BUY_CRYPTO_CLICKED: {
          formoTrack('Buy Crypto - Click on Buy Crypto on KyberSwap')
          break
        }
        case TRACKING_EVENT_TYPE.TUTORIAL_CLICK_START: {
          formoTrack('On-Screen Guide - User click on "View" in Setting to view guide')
          break
        }
        case TRACKING_EVENT_TYPE.TUTORIAL_CLICK_DENY: {
          formoTrack('On-Screen Guide - User click on "Dismiss" button', { step: payload })
          break
        }
        case TRACKING_EVENT_TYPE.TUTORIAL_CLICK_DONE: {
          formoTrack('On-Screen Guide - User click on "Done" button at Step 8')
          break
        }
        case TRACKING_EVENT_TYPE.TUTORIAL_VIEW_VIDEO_SWAP: {
          formoTrack('On-Screen Guide - User click on Step 3 Embedded video')
          break
        }

        case TRACKING_EVENT_TYPE.BANNER_CLICK: {
          formoTrack('User click on "Banner" at swap page')
          break
        }
        case TRACKING_EVENT_TYPE.CLOSE_BANNER_CLICK: {
          formoTrack('User click close "Banner" at swap page')
          break
        }
        case TRACKING_EVENT_TYPE.FARM_UNDER_EARN_TAB_CLICK: {
          formoTrack('Farms Page Viewed - under Earn tab')
          break
        }

        case TRACKING_EVENT_TYPE.BRIDGE_CLICK_HISTORY_TRANSFER_TAB: {
          formoTrack('Bridge - Transfer History Tab Click')
          break
        }
        case TRACKING_EVENT_TYPE.BRIDGE_CLICK_REVIEW_TRANSFER: {
          formoTrack('Bridge - Review Transfer Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.BRIDGE_CLICK_TRANSFER: {
          formoTrack('Bridge - Transfer Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.BRIDGE_TRANSACTION_SUBMIT: {
          const { tx_hash, from_token, to_token, bridge_fee, from_network, to_network, trade_qty } = payload
          formoTrack('Bridge -  Transaction Submitted', {
            tx_hash,
            from_token,
            to_token,
            bridge_fee,
            from_network,
            to_network,
            trade_qty,
          })
          break
        }
        case TRACKING_EVENT_TYPE.BRIDGE_CLICK_SUBSCRIBE_BTN: {
          formoTrack('Bridge - User click to Subscribe button')
          break
        }
        case TRACKING_EVENT_TYPE.BRIDGE_CLICK_DISCLAIMER: {
          if (typeof payload !== 'boolean') {
            throw new Error(`Wrong payload type for tracking event: ${TRACKING_EVENT_TYPE.BRIDGE_CLICK_DISCLAIMER}`)
          }

          formoTrack('Bridge - User click to Checkbox Disclaimer in Confirmation popup', {
            checkbox: payload ? 'checked' : 'unchecked',
          })
          break
        }
        case TRACKING_EVENT_TYPE.BRIDGE_CLICK_UNDERSTAND_IN_FIRST_TIME_VISIT: {
          formoTrack('Bridge - User click to I understand button the first time visit Bridge page')
          break
        }

        case TRACKING_EVENT_TYPE.NOTIFICATION_CLICK_MENU: {
          formoTrack('Notification Clicked')
          break
        }
        case TRACKING_EVENT_TYPE.NOTIFICATION_SELECT_TOPIC: {
          formoTrack('Notification Features selected and save', payload)
          break
        }
        case TRACKING_EVENT_TYPE.NOTIFICATION_DESELECT_TOPIC: {
          formoTrack('Notification Features unselected and save', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_BELL_ICON_OPEN_POPUP: {
          formoTrack('Notifications - Open Notification Pop Up')
          break
        }
        case TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_TAB_INBOX: {
          formoTrack('Notifications - Click on My Inbox', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_TAB_ANNOUNCEMENT: {
          formoTrack('Notifications - Click on General', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_INBOX_MESSAGE: {
          formoTrack('Notifications - Click on inbox messages', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_ANNOUNCEMENT_MESSAGE: {
          formoTrack('Notifications - Click on announcement messages', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_CLOSE_POPUP: {
          formoTrack('Notifications - Click to close pop up', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_CTA_POPUP: {
          formoTrack('Notifications - Click on Announcement Pop Up CTA', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ANNOUNCEMENT_CLICK_CLEAR_ALL_INBOXES: {
          formoTrack('Notifications - Clear All Messages', payload)
          break
        }

        case TRACKING_EVENT_TYPE.KYBER_DAO_STAKE_CLICK: {
          formoTrack('KyberDAO - Stake Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.KYBER_DAO_UNSTAKE_CLICK: {
          formoTrack('KyberDAO - Unstake Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.KYBER_DAO_DELEGATE_CLICK: {
          formoTrack('KyberDAO - Delegate Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.KYBER_DAO_VOTE_CLICK: {
          formoTrack('KyberDAO - Vote Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.KYBER_DAO_CLAIM_CLICK: {
          formoTrack('KyberDAO - Claim Reward Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.KYBER_DAO_FEATURE_REQUEST_CLICK: {
          formoTrack('KyberDAO - Feature Request Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.GAS_REFUND_CLAIM_CLICK: {
          const { token_amount, source } = payload
          formoTrack('Gas refund - Click claim reward', { token_amount, source })
          break
        }
        case TRACKING_EVENT_TYPE.GAS_REFUND_SOURCE_CLICK: {
          const { source } = payload
          formoTrack('Gas refund - KNC Utility source click', { source })
          break
        }
        case TRACKING_EVENT_TYPE.LO_CLICK_PLACE_ORDER: {
          formoTrack('Limit Order -  Place Order Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_PLACE_ORDER_SUCCESS: {
          formoTrack('Limit Order -  Place Order Submit Success', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_ENTER_DETAIL: {
          formoTrack('Limit Order - Enter Detail', { action: payload })
          break
        }
        case TRACKING_EVENT_TYPE.LO_CLICK_CANCEL_ORDER: {
          formoTrack('Limit Order -  Cancel Order Click', payload)
          break
        }

        case TRACKING_EVENT_TYPE.LO_CANCEL_ORDER_SUBMITTED: {
          formoTrack('Limit Order -  Cancel Order Submit Success', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_CLICK_REVIEW_PLACE_ORDER: {
          formoTrack('Limit Order -  Review Order Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_CLICK_EDIT_ORDER: {
          formoTrack('Limit Order -  Update Order Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_DISPLAY_SETTING_CLICK: {
          formoTrack('Limit Order - Display settings on Limit settings', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_CLICK_SUBSCRIBE_BTN: {
          formoTrack('Limit Order - User click to Subscribe button')
          break
        }
        case TRACKING_EVENT_TYPE.LO_CLICK_CANCEL_TYPE: {
          formoTrack('Limit Order - Cancel Order Double Signature Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_CLICK_UPDATE_TYPE: {
          formoTrack('Limit Order - Update Order Double Signature Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_CLICK_GET_STARTED: {
          formoTrack('Limit Order - Get Started Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_CLICK_WARNING_IN_SWAP: {
          formoTrack('Limit Order - Warning in Swap Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_REVIEW_OPENED: {
          formoTrack('Limit Order Review Opened', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_ORDER_PLACED: {
          formoTrack('Limit Order Placed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_ORDER_FAILED: {
          formoTrack('Limit Order Failed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_ORDER_FILLED: {
          formoTrack('Limit Order Filled', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_ORDER_CANCELLED: {
          formoTrack('Limit Order Cancelled', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_SIDE_SELECTED: {
          formoTrack('Limit Order Side Selected', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_PRICE_SET: {
          formoTrack('Limit Price Set', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LO_EXPIRY_CHANGED: {
          formoTrack('Limit Order Expiry Changed', payload)
          break
        }

        case TRACKING_EVENT_TYPE.WUI_WALLET_CLICK: {
          formoTrack('Wallet UI - Wallet Click')
          break
        }
        case TRACKING_EVENT_TYPE.WUI_PINNED_WALLET: {
          formoTrack('Wallet UI - Pinned Wallet')
          break
        }
        case TRACKING_EVENT_TYPE.WUI_UNPINNED_WALLET: {
          formoTrack('Wallet UI - Unpinned Wallet')
          break
        }
        case TRACKING_EVENT_TYPE.WUI_BUTTON_CLICK: {
          formoTrack('Wallet UI - Button click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.WUI_IMPORT_TOKEN_CLICK: {
          formoTrack('Wallet UI - Import Token click')
          break
        }
        case TRACKING_EVENT_TYPE.WUI_TRANSACTION_CLICK: {
          formoTrack('Wallet UI - Transaction click')
          break
        }
        case TRACKING_EVENT_TYPE.WUI_IMPORT_TOKEN_BUTTON_CLICK: {
          formoTrack('Wallet UI - Import Token - Import button click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.MENU_MENU_CLICK: {
          formoTrack('Menu - Menu Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.MENU_PREFERENCE_CLICK: {
          formoTrack('Menu - Preference Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ADD_LIQUIDITY_ADD_NEW_POSITION: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          formoTrack('Elastic - Add Liquidity page - Add new position', { token_1, token_2 })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ADD_LIQUIDITY_CLICK_TO_REMOVE_POSITION: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          formoTrack('Elastic - Add Liquidity page - Click to remove position', { token_1, token_2 })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ADD_LIQUIDITY_SELECT_RANGE_FOR_POOL: {
          const { token_1, token_2, range } = payload as {
            token_1: string
            token_2: string
            range: RANGE
          }
          formoTrack('Elastic - Add Liquidity page - Select range for pool', {
            token_1,
            token_2,
            range: range.toLowerCase().replace('_', ' '),
          })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ADD_LIQUIDITY_CLICK_SWAP: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          formoTrack('Elastic - Add Liquidity page - Click Swap', { token_1, token_2 })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ADD_LIQUIDITY_CLICK_PRICE_CHART: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          formoTrack('Elastic - Add Liquidity page - Click Price chart', { token_1, token_2 })
          break
        }
        case TRACKING_EVENT_TYPE.ELASTIC_ADD_LIQUIDITY_CLICK_POOL_ANALYTIC: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          formoTrack('Elastic - Add Liquidity page - Click Pool analytic', { token_1, token_2 })
          break
        }

        case TRACKING_EVENT_TYPE.PA_CLICK_TAB_IN_NOTI_CENTER: {
          formoTrack('Price Alert Click')
          break
        }
        case TRACKING_EVENT_TYPE.PA_CREATE_SUCCESS: {
          formoTrack('Create Alert', payload)
          break
        }
        case TRACKING_EVENT_TYPE.PERMIT_CLICK: {
          formoTrack('Permit Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.INFINITE_APPROVE_CLICK: {
          formoTrack('Infinite Allowance Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CUSTOM_APPROVE_CLICK: {
          formoTrack('Custom Allowance Click', payload)
          break
        }
        case TRACKING_EVENT_TYPE.PERMIT_FAILED_TOO_MANY_TIMES: {
          formoTrack('Permit Failed Too Many Times', payload)
          break
        }
        case TRACKING_EVENT_TYPE.ACCEPT_NEW_AMOUNT: {
          formoTrack('Accept New Amount Button Click', payload)
          break
        }

        case TRACKING_EVENT_TYPE.CROSS_CHAIN_CLICK_DISCLAIMER: {
          mixpanel.track('Cross-chain - Disclaimer click')
          break
        }
        case TRACKING_EVENT_TYPE.CROSS_CHAIN_CLICK_DISCLAIMER_CHECKBOX: {
          mixpanel.track('Cross chain - Disclaimer checkbox click')
          break
        }
        case TRACKING_EVENT_TYPE.CROSS_CHAIN_CLICK_SUBSCRIBE: {
          mixpanel.track('Cross chain - Subscribe click')
          break
        }
        case TRACKING_EVENT_TYPE.CROSS_CHAIN_SWAP_INIT: {
          mixpanel.track('Cross chain - Swap Initiated', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CROSS_CHAIN_SWAP_CONFIRMED: {
          mixpanel.track('Cross chain - Swap Confirmed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CROSS_CHAIN_TXS_SUBMITTED: {
          mixpanel.track('Cross chain - Transaction Submitted', payload)
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_CLICK_TOP_LEVEL_SHARE_BUTTON: {
          formoTrack('Earning Dashboard - Share button click')
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_SHARE_SUCCESSFULLY: {
          formoTrack('Earning Dashboard - Share success', {
            option: payload,
          })
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_CLICK_POOL_EXPAND: {
          const { pool_name, pool_address } = payload as {
            pool_name: string
            pool_address: string
          }

          formoTrack('Earning Dashboard - Pool expand click', { pool_name, pool_address })
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_CLICK_ALL_CHAINS_BUTTON: {
          formoTrack('Earning Dashboard - All Chain button click')
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_CLICK_REFRESH_BUTTON: {
          formoTrack('Earning Dashboard - Refresh button click')
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_CLICK_CHANGE_TIMEFRAME_EARNING_CHART: {
          formoTrack('Earning Dashboard - Multi chain earning chart - Change timeframe')
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_CLICK_ADD_LIQUIDITY_BUTTON: {
          formoTrack('Earning Dashboard - Add liquidity button click')
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_CLICK_CURRENT_CHAIN_BUTTON: {
          formoTrack('Earning Dashboard - Current chain button click')
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_VIEW_PAGE: {
          formoTrack('Earning Dashboard - Page View')
          break
        }

        case TRACKING_EVENT_TYPE.EARNING_DASHBOARD_CLICK_SUBSCRIBE: {
          formoTrack('Earning Dashboard - Subscribe Click')
          break
        }

        case TRACKING_EVENT_TYPE.EARN_BANNER_CLICK: {
          formoTrack('Banner Click to Earn', payload)
          break
        }

        case TRACKING_EVENT_TYPE.EARN_BANNER_POOL_CLICK: {
          formoTrack('Banner Click to Pool Details', payload)
          break
        }

        // Swap flow custom events
        case TRACKING_EVENT_TYPE.SWAP_REVIEW_OPENED: {
          formoTrack('Swap Review Opened', payload)
          break
        }
        case TRACKING_EVENT_TYPE.TOKEN_APPROVAL_INITIATED: {
          formoTrack('Token Approval Initiated', payload)
          break
        }
        case TRACKING_EVENT_TYPE.TOKEN_APPROVAL_COMPLETED: {
          formoTrack('Token Approval Completed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.TOKEN_APPROVAL_FAILED: {
          formoTrack('Token Approval Failed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.SWAP_FAILED: {
          formoTrack('Swap Failed', payload)
          break
        }

        // Swap form interaction events
        case TRACKING_EVENT_TYPE.TOKEN_SELECTED: {
          formoTrack('Token Selected', payload)
          break
        }
        case TRACKING_EVENT_TYPE.AMOUNT_ENTERED: {
          formoTrack('Amount Entered', payload)
          break
        }
        case TRACKING_EVENT_TYPE.TOKEN_PAIR_REVERSED: {
          formoTrack('Token Pair Reversed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.MAX_BALANCE_CLICKED: {
          formoTrack('Max Balance Clicked', payload)
          break
        }

        // Swap settings interaction events
        case TRACKING_EVENT_TYPE.TRANSACTION_TIME_LIMIT_CHANGED: {
          formoTrack('Transaction Time Limit Changed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.GAS_TOKEN_CHANGED: {
          formoTrack('Gas Token Changed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.LIQUIDITY_SOURCES_TOGGLED: {
          formoTrack('Liquidity Sources Toggled', payload)
          break
        }

        // Cross-chain execution flow events
        case TRACKING_EVENT_TYPE.CC_ROUTE_VIEWED: {
          formoTrack('Cross-Chain Route Viewed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_REVIEW_OPENED: {
          formoTrack('Cross-Chain Review Opened', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_SWAP_INITIATED: {
          formoTrack('Cross-Chain Swap Initiated', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_SWAP_COMPLETED: {
          formoTrack('Cross-Chain Swap Completed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_SWAP_FAILED: {
          formoTrack('Cross-Chain Swap Failed', payload)
          break
        }

        // Cross-chain form interaction events
        case TRACKING_EVENT_TYPE.CC_TAB_SELECTED: {
          formoTrack('Cross-Chain Tab Selected', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_SOURCE_CHAIN_SELECTED: {
          formoTrack('Cross-Chain Source Chain Selected', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_DESTINATION_CHAIN_SELECTED: {
          formoTrack('Cross-Chain Destination Chain Selected', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_RECIPIENT_ADDRESS_ENTERED: {
          formoTrack('Cross-Chain Recipient Address Entered', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_WALLET_SELECTED: {
          formoTrack('Cross-Chain Wallet Selected', payload)
          break
        }

        // Cross-chain settings interaction events
        case TRACKING_EVENT_TYPE.CC_SETTINGS_OPENED: {
          formoTrack('Cross-Chain Settings Opened', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_SLIPPAGE_CHANGED: {
          formoTrack('Cross-Chain Slippage Changed', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_ROUTING_SOURCE_TOGGLED: {
          formoTrack('Cross-Chain Routing Source Toggled', payload)
          break
        }
        case TRACKING_EVENT_TYPE.CC_SETTINGS_SAVED: {
          formoTrack('Cross-Chain Settings Saved', payload)
          break
        }
      }
    },
    /* eslint-disable */
    [currencies, network, account, mixpanel.hasOwnProperty('get_distinct_id'), formoTrack],
    /* eslint-enable */
  )
  return { trackingHandler }
}

export const useGlobalTrackingEvents = () => {
  const { account, chainId } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const analytics = useFormo()
  const oldNetwork = usePrevious(chainId)
  const location = useLocation()
  const pathName = useMemo(() => {
    if (location.pathname.split('/')[1] !== 'elastic') return location.pathname.split('/')[1]
    return 'elastic/' + location.pathname.split('/')[2]
  }, [location])

  useEffect(() => {
    if (account && isAddress(account)) {
      analytics?.identify({ address: account })
      crossChainMixpanel?.identify(account)

      const getQueryParam = (url: string, param: string) => {
        // eslint-disable-next-line
        param = param.replace(/\[\[\]/, '[').replace(/[]]/, ']')
        const regexS = '[?&]' + param + '=([^&#]*)',
          regex = new RegExp(regexS),
          results: any = regex.exec(url)
        if (results === null || (results && typeof results[1] !== 'string' && results[1].length)) {
          return ''
        } else {
          return decodeURIComponent(results[1]).replace(/\W/gi, ' ')
        }
      }
      let kw = ''
      const campaign_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term'.split(' '),
        params: { [key: string]: any } = {},
        first_params: { [key: string]: any } = {}
      let index
      for (index = 0; index < campaign_keywords.length; ++index) {
        kw = getQueryParam(document.URL, campaign_keywords[index])
        if (kw.length) {
          params[campaign_keywords[index] + ' [last touch]'] = kw
        }
      }
      for (index = 0; index < campaign_keywords.length; ++index) {
        kw = getQueryParam(document.URL, campaign_keywords[index])
        if (kw.length) {
          first_params[campaign_keywords[index] + ' [first touch]'] = kw
        }
      }

      crossChainMixpanel?.people.set(params)
      crossChainMixpanel?.people.set_once(first_params)
      crossChainMixpanel?.register_once(params)

      trackingHandler(TRACKING_EVENT_TYPE.WALLET_CONNECTED)
    }
    return () => {
      if (account) {
        analytics?.reset()
        crossChainMixpanel?.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  useEffect(() => {
    if (oldNetwork) {
      trackingHandler(TRACKING_EVENT_TYPE.CHAIN_SWITCHED, {
        new_network: chainId && NETWORKS_INFO[chainId].name,
        old_network: oldNetwork && NETWORKS_INFO[oldNetwork as ChainId].name,
      })
      crossChainMixpanel?.register({ network: chainId && NETWORKS_INFO[chainId].name })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  useEffect(() => {
    if (pathName) {
      const map: { [key: string]: string } = {
        swap: 'Swap',
        find: 'Pool Finder',
        pools: 'Pools',
        farms: 'Farms',
        myPools: 'My Pools',
        migration: 'Migration',
        create: 'Create Pool',
        add: 'Add Liquidity',
        remove: 'Remove Liquidity',
        about: 'About',
        discover: 'Discover',
        'elastic/remove': 'Elastic - Remove Liquidity',
        'elastic/add': 'Elastic - Add Liquidity',
        'elastic/increase': 'Elastic - Increase Liquidity',
        'buy-crypto': 'Buy Crypto',
        bridge: 'Bridge',
        '/kyberdao/stake-knc': 'KyberDAO Stake',
        '/kyberdao/vote': 'KyberDAO Vote',
        limit: 'Limit Order',
        'cross-chain': 'Cross Chain',
        'notification-center': 'Notification',
      }
      const pageName = map[pathName] || map[location.pathname]
      pageName && trackingHandler(TRACKING_EVENT_TYPE.PAGE_VIEWED, { page: pageName })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathName, account, chainId, location.pathname])
}

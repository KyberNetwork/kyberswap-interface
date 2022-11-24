import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import axios from 'axios'
import { ethers } from 'ethers'
import JSBI from 'jsbi'

import { formatNumberWithPrecisionRange, formattedNum } from 'utils'
import { removeCollection } from 'utils/firebase'

import { LimitOrder, LimitOrderStatus } from './type'

export const isActiveStatus = (status: LimitOrderStatus) =>
  [LimitOrderStatus.ACTIVE, LimitOrderStatus.OPEN, LimitOrderStatus.PARTIALLY_FILLED].includes(status)

const formatData = (data: any) => data.data.data
export const getListOrder = (params: any): Promise<{ orders: LimitOrder[]; pagination: { totalItems: number } }> => {
  return axios.get(`${process.env.REACT_APP_LIMIT_ORDER_API_READ}/v1/orders`, { params }).then(formatData)
}

export const submitOrder = (data: any) => {
  return axios.post(`${process.env.REACT_APP_LIMIT_ORDER_API_WRITE}/v1/orders`, data).then(formatData)
}

export const hashOrder = (data: any) => {
  return axios.post(`${process.env.REACT_APP_LIMIT_ORDER_API_WRITE}/v1/orders/hash`, data).then(formatData)
}

export const getTotalActiveMakingAmount = (chainId: string, tokenAddress: string, account: string) => {
  return axios
    .get(`${process.env.REACT_APP_LIMIT_ORDER_API_READ}/v1/orders/active-making-amount`, {
      params: {
        chainId,
        makerAsset: tokenAddress,
        maker: account,
      },
    })
    .then(formatData)
}

export const getEncodeData = (orderIds: number[], isCancelAll = false) => {
  const method = isCancelAll ? 'increase-nonce' : 'cancel-batch-orders'
  return axios
    .post(`${process.env.REACT_APP_LIMIT_ORDER_API_READ}/v1/encode/${method}`, isCancelAll ? {} : { orderIds })
    .then(formatData)
}

export const ackNotificationOrder = (type: LimitOrderStatus, account: string, chainId: ChainId) => {
  return removeCollection(type, chainId, account)
}

// js number to fraction
function parseFraction(value: string, decimals = 18) {
  try {
    return new Fraction(
      ethers.utils.parseUnits(value, decimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)),
    )
  } catch (error) {
    return new Fraction(0)
  }
}

// 1.00010000 => 1.0001
export const removeTrailingZero = (value: string) => parseFloat(value).toString()

// uint256 to fraction
export const uint256ToFraction = (value: string, decimals = 18) =>
  new Fraction(value, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))

export function calcOutput(input: string, rate: string, decimals: number) {
  try {
    if (parseFloat(rate) === 1) return input
    const value = parseFraction(input, decimals).multiply(parseFraction(rate))
    return removeTrailingZero(value.toFixed(16))
  } catch (error) {
    return ''
  }
}

export function calcRate(input: string, output: string, decimalsOut: number) {
  try {
    if (input && input === output) return '1'
    const rate = parseFraction(output, decimalsOut).divide(parseFraction(input))
    return removeTrailingZero(rate.toFixed(16))
  } catch (error) {
    return ''
  }
}

// calc 1/value
export function calcInvert(value: string) {
  try {
    if (parseFloat(value) === 1) return '1'
    return removeTrailingZero(new Fraction(1).divide(parseFraction(value)).toFixed(16))
  } catch (error) {
    return ''
  }
}

export function calcPriceUsd(input: string, price: number) {
  try {
    const value = parseFraction(input).multiply(parseFraction(price.toString()))
    return value.toFixed(16)
  } catch (error) {
    return
  }
}

export const formatUsdPrice = (input: string, price: number | undefined) => {
  if (!price || !input) return
  const calcPrice = calcPriceUsd(input, price)
  return calcPrice ? `${formattedNum(calcPrice, true)}` : undefined
}

export const formatAmountOrder = (uint256: string) => {
  return formatNumberWithPrecisionRange(parseFloat(uint256ToFraction(uint256).toFixed(16)), 2, 10)
}

export const formatRateOrder = (order: LimitOrder, invert: boolean) => {
  let rateValue = new Fraction(0)
  const { takingAmount, makingAmount } = order
  try {
    rateValue = invert
      ? uint256ToFraction(takingAmount).divide(uint256ToFraction(makingAmount))
      : uint256ToFraction(makingAmount).divide(uint256ToFraction(takingAmount))
  } catch (error) {
    console.log(error)
  }
  return formatNumberWithPrecisionRange(parseFloat(rateValue.toFixed(16)), 2, 8)
}

export const calcPercentFilledOrder = (value: string, total: string) => {
  try {
    const float = parseFloat(uint256ToFraction(value).divide(uint256ToFraction(total)).multiply(100).toFixed(16))
    return float && float < 0.01 ? '< 0.01' : formatNumberWithPrecisionRange(float, 0, 2)
  } catch (error) {
    console.log(error)
    return '0'
  }
}

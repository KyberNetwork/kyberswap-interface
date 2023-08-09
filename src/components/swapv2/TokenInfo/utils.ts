import { t } from '@lingui/macro'
import { SecurityInfo } from 'services/coingecko'

import { ItemData, WarningType } from 'components/swapv2/TokenInfo/SecurityInfo/Content'
import { TokenInfo } from 'hooks/useTokenInfo'
import { formattedNum } from 'utils'
import { formatLongNumber } from 'utils/formatBalance'

export const RISKY_THRESHOLD = {
  RISKY: 0.05,
  WARNING: 0.01,
}

export const isItemRisky = ({ value, isNumber, riskyReverse }: ItemData) => {
  const isRisky =
    (!isNumber && value === '0') || (isNumber && (Number(value) >= RISKY_THRESHOLD.WARNING || value === ''))
  return value !== undefined && (riskyReverse ? !isRisky : isRisky)
}

const reverseValue = (value: string | undefined) => (!value ? undefined : value === '0' ? '1' : '0')

const calcTotalRiskFn = (total: { totalRisk: number; totalWarning: number }, item: ItemData) => {
  if (isItemRisky(item)) {
    if (item.type === WarningType.RISKY) total.totalRisk++
    else total.totalWarning++
  }
  return total
}

const calcTotalRisk = (data: ItemData[]) => {
  return data.reduce(calcTotalRiskFn, {
    totalRisk: 0,
    totalWarning: 0,
  })
}

export const getSecurityTokenInfo = (data: SecurityInfo | undefined) => {
  const contractData: ItemData[] = [
    {
      label: t`Open Source`,
      value: data?.is_open_source,
      type: WarningType.RISKY,
    },
    {
      label: t`Proxy Contract`,
      value: data?.is_proxy,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: t`Mint Function`,
      value: data?.is_mintable,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: t`Take Back Ownership`,
      value: data?.can_take_back_ownership,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: t`Can Change Balance`,
      value: data?.owner_change_balance,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: t`Self-destruct`,
      value: data?.selfdestruct,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: t`External Call`,
      value: data?.external_call,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: t`Gas Abuser`,
      value: data?.gas_abuse,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
  ].filter(el => el.value !== undefined)

  const tradingData: ItemData[] = [
    {
      label: t`Buy Tax`,
      value: data?.buy_tax,
      type: WarningType.WARNING,
      isNumber: true,
    },
    {
      label: t`Sell Tax`,
      value: data?.sell_tax,
      type: WarningType.WARNING,
      isNumber: true,
    },
    {
      label: t`Modifiable Tax`,
      value: data?.slippage_modifiable,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: t`Honeypot`,
      value: data?.is_honeypot,
      type: WarningType.RISKY,
      riskyReverse: true,
    },
    {
      label: t`Can be bought`,
      value: reverseValue(data?.cannot_buy),
      type: WarningType.RISKY,
    },
    {
      label: t`Can sell all`,
      value: reverseValue(data?.cannot_sell_all),
      type: WarningType.RISKY,
    },
    {
      label: t`Blacklisted Function`,
      value: data?.is_blacklisted,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: t`Whitelisted Function`,
      value: data?.is_whitelisted,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: t`Anti Whale`,
      value: data?.is_anti_whale,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: t`Modifiable Anti Whale`,
      value: data?.anti_whale_modifiable,
      type: WarningType.WARNING,
      riskyReverse: true,
    },
  ].filter(el => el.value !== undefined)

  const { totalRisk: totalRiskContract, totalWarning: totalWarningContract } = calcTotalRisk(contractData)
  const { totalRisk: totalRiskTrading, totalWarning: totalWarningTrading } = calcTotalRisk(tradingData)

  return { contractData, tradingData, totalRiskContract, totalWarningContract, totalWarningTrading, totalRiskTrading }
}

const NOT_AVAILABLE = '--'
export const getMarketTokenInfo = (tokenInfo: TokenInfo) => {
  const listData = [
    { label: t`Price`, value: tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAILABLE },
    {
      label: t`Market Cap Rank`,
      value: tokenInfo.marketCapRank ? `#${formattedNum(tokenInfo.marketCapRank.toString())}` : NOT_AVAILABLE,
    },
    {
      label: t`Trading Volume (24H)`,
      value: tokenInfo.tradingVolume ? formatLongNumber(tokenInfo.tradingVolume.toString(), true) : NOT_AVAILABLE,
    },
    {
      label: t`Market Cap`,
      value: tokenInfo.marketCap ? formatLongNumber(tokenInfo.marketCap.toString(), true) : NOT_AVAILABLE,
    },
    {
      label: t`All-Time High`,
      value: tokenInfo.allTimeHigh ? formattedNum(tokenInfo.allTimeHigh.toString(), true) : NOT_AVAILABLE,
    },
    {
      label: t`All-Time Low`,
      value: tokenInfo.allTimeLow ? formattedNum(tokenInfo.allTimeLow.toString(), true) : NOT_AVAILABLE,
    },
    {
      label: t`Circulating Supply`,
      value: tokenInfo.circulatingSupply ? formatLongNumber(tokenInfo.circulatingSupply.toString()) : NOT_AVAILABLE,
    },
    {
      label: t`Total Supply`,
      value: tokenInfo.totalSupply ? formatLongNumber(tokenInfo.totalSupply.toString()) : NOT_AVAILABLE,
    },
  ]
  return listData
}

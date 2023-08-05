import { t } from '@lingui/macro'
import { SecurityInfo } from 'services/coingecko'

import { ItemData, WarningType } from 'components/swapv2/TokenInfo/SecurityInfo/Content'

export const isItemRisky = ({ value, isNumber, riskyReverse }: ItemData) => {
  const isRisky = (!isNumber && value === '0') || (isNumber && (Number(value) > 0.05 || value === ''))
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
      type: WarningType.RISKY,
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
      type: WarningType.WARNING,
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
  ]

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
      type: WarningType.WARNING,
      riskyReverse: true,
    },
    {
      label: t`Can be bought`,
      value: reverseValue(data?.cannot_buy),
      type: WarningType.WARNING,
    },
    {
      label: t`Can sell all`,
      value: reverseValue(data?.cannot_sell_all),
      type: WarningType.WARNING,
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
  ]

  const { totalRisk: totalRiskContract, totalWarning: totalWarningContract } = calcTotalRisk(contractData)
  const { totalRisk: totalRiskTrading, totalWarning: totalWarningTrading } = calcTotalRisk(tradingData)

  return { contractData, tradingData, totalRiskContract, totalWarningContract, totalWarningTrading, totalRiskTrading }
}

import React, { useEffect } from 'react'
import { isAddressString } from 'utils'
import useTokenBalance from 'hooks/useTokenBalance'
import { Farm } from 'state/farms/types'
import { ethers } from 'ethers'
import { getTradingFeeAPR, useFarmApr } from 'utils/dmm'
import JSBI from 'jsbi'
import { Fraction } from '@vutien/sdk-core'
import { MAX_ALLOW_APY } from 'constants/index'

function Apr({ farm, onAprUpdate }: { farm: Farm; onAprUpdate: any }) {
  const poolAddressChecksum = isAddressString(farm.id)
  const { decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)
  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
    ),
  )
  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  // const farmAPR = 0
  const farmAPR = useFarmApr(farm, liquidity.toString())
  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)
  const apr = farmAPR + (tradingFeeAPR < MAX_ALLOW_APY ? tradingFeeAPR : 0)

  useEffect(() => {
    if (apr > 0) onAprUpdate(apr)
  }, [apr, onAprUpdate])
  return <></>
}

export default Apr

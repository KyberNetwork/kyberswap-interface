import { t } from '@lingui/macro'
import { ethers } from 'ethers'

import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

export const formatAllowance = (value: string, decimals: number) =>
  value === ethers.constants.MaxUint256.toString()
    ? t`Unlimited`
    : formatDisplayNumber(uint256ToFraction(value, decimals), { style: 'decimal', significantDigits: 6 }) // todo uint256ToFraction

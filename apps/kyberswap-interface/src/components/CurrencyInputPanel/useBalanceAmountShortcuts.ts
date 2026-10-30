import { Currency, CurrencyAmount, Fraction } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import type { AmountShortcut } from 'components/CurrencyInputPanel'
import { getGasReservation } from 'utils/gasReserve'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const SHARES = [25, 50, 100] as const

/** Reserve native gas for Max; percentage presets use the full balance. */
export const useBalanceAmountShortcuts = (
  balance: CurrencyAmount<Currency> | undefined,
  value: string,
  onChange: (value: string) => void,
  testIdPrefix: string,
): AmountShortcut[] =>
  useMemo(() => {
    const spendable = maxAmountSpend(balance)
    const maxAmount = getGasReservation(balance)?.maxAmount ?? spendable
    return SHARES.map(share => {
      const amount = share === 100 ? maxAmount : spendable?.multiply(new Fraction(share, 100))
      const exact = amount?.toExact()
      return {
        label: share === 100 ? t`Max` : `${share}%`,
        active: !!exact && Number(exact) > 0 && exact === value,
        onClick: () => {
          if (exact) onChange(exact)
        },
        dataTestId: `${testIdPrefix}-${share === 100 ? 'max' : share}`,
      }
    })
  }, [balance, value, onChange, testIdPrefix])

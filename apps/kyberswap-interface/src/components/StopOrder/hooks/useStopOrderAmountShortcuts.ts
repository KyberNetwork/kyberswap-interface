import { Currency, CurrencyAmount, Fraction } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import type { AmountShortcut } from 'components/CurrencyInputPanel'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const SHARES = [25, 50, 100] as const

/**
 * 25%, 50% and Max of what the shared spend helper says can be spent, with the one matching the amount
 * entered marked. That helper returns the whole balance, the native coin's included, so Max on a native
 * sell leaves nothing for gas.
 */
export const useStopOrderAmountShortcuts = (
  balance: CurrencyAmount<Currency> | undefined,
  value: string,
  onChange: (value: string) => void,
  testIdPrefix: string,
): AmountShortcut[] =>
  useMemo(() => {
    const spendable = maxAmountSpend(balance)
    return SHARES.map(share => {
      const amount = share === 100 ? spendable : spendable?.multiply(new Fraction(share, 100))
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

import { t } from '@lingui/macro'
import { memo, useState } from 'react'

import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'

import LimitOrderForm from './LimitOrderForm'

type Props = {
  refreshListOrder: () => void
  setIsSelectCurrencyManual: (v: boolean) => void
  isSelectCurrencyManual: boolean
}

function LimitOrderComp({ refreshListOrder, setIsSelectCurrencyManual, isSelectCurrencyManual }: Props) {
  const { onSelectPair } = useLimitActionHandlers()

  const { currencyIn, currencyOut } = useLimitState()

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectPair, isSelectCurrencyManual)

  // modal and loading
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  return (
    <LimitOrderForm
      flowState={flowState}
      setFlowState={setFlowState}
      refreshListOrder={refreshListOrder}
      currencyIn={currencyIn}
      currencyOut={currencyOut}
      setIsSelectCurrencyManual={setIsSelectCurrencyManual}
      note={
        currencyOut?.isNative
          ? t`Note: Once your order is filled, you will receive ${currencyOut?.wrapped.name} (${currencyOut?.wrapped.symbol})`
          : undefined
      }
    />
  )
}

export default memo(LimitOrderComp)

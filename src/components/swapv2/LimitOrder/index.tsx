import { memo, useState } from 'react'
import styled from 'styled-components'

import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { TRANSACTION_STATE_DEFAULT, TransactionFlowState } from 'types'

import LimitOrderForm from './LimitOrderForm'

export const Label = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  margin-bottom: 0.5rem;
`

type Props = {
  refreshListOrder: () => void
}

function LimitOrderComp({ refreshListOrder }: Props) {
  const { onSelectPair } = useLimitActionHandlers()
  const [isSelectCurrencyManual, setIsSelectCurrencyManual] = useState(false) // true when: select token input, output manually or click rotate token.

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
    />
  )
}

export default memo(LimitOrderComp)

import { memo, useState } from 'react'

import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useLimitState } from 'state/limit/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'

import LimitOrderForm from './LimitOrderForm'

function LimitOrderComp() {
  const { currencyIn, currencyOut } = useLimitState()

  // modal and loading
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  return (
    <div style={{ padding: '16px' }}>
      <LimitOrderForm
        flowState={flowState}
        setFlowState={setFlowState}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
      />
    </div>
  )
}

export default memo(LimitOrderComp)

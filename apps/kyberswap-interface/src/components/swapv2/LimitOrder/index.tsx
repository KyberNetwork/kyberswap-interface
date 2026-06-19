import { memo, useState } from 'react'

import LimitOrderForm from 'components/swapv2/LimitOrder/LimitOrderForm'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useLimitState } from 'state/limit/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'

function LimitOrderComp() {
  const { currencyIn, currencyOut } = useLimitState()

  // modal and loading
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  return (
    <div className="p-4">
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

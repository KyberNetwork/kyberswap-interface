import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useEffect } from 'react'

import { WrapType } from 'hooks/useWrapCallback'
import { Field } from 'state/swap/actions'

const useResetInputFieldInSolanaUnwrap = (
  isSolana: boolean,
  wrapType: WrapType,
  balanceIn: CurrencyAmount<Currency> | undefined,
  onUserInput: (field: Field, value: string) => void,
) => {
  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) onUserInput(Field.INPUT, balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap, onUserInput])
}

export default useResetInputFieldInSolanaUnwrap

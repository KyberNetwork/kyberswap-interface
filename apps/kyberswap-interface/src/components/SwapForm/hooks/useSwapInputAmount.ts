import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import { useNotify } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'

export const useSwapInputAmount = (prefill = true) => {
  const notify = useNotify()
  const [searchParams] = useSearchParams()
  const { typedValue } = useSwapState()
  const { onUserInput: updateInputAmount } = useSwapActionHandlers()
  const onUserInput = useCallback((value: string) => updateInputAmount(Field.INPUT, value), [updateInputAmount])
  const prefillInputAmount = searchParams.get('input')
  const handledPrefillInputRef = useRef<string | null>(null)

  useEffect(() => {
    if (!prefill) return
    const inputAmount = prefillInputAmount?.trim()
    if (!inputAmount) {
      handledPrefillInputRef.current = null
      return
    }
    if (handledPrefillInputRef.current === inputAmount) return
    handledPrefillInputRef.current = inputAmount

    const isValidRegex = /^\d*\.?\d*$/.test(inputAmount)
    if (isValidRegex && Number.isFinite(Number(inputAmount)) && !Number.isNaN(Number(inputAmount))) {
      updateInputAmount(Field.INPUT, inputAmount)
    } else {
      notify({
        title: 'Invalid input amount in. Please enter another amount',
        type: NotificationType.WARNING,
      })
    }
  }, [prefill, prefillInputAmount, updateInputAmount, notify])

  return { typedValue, onUserInput }
}

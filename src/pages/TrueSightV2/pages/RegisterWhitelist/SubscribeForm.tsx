import { Trans, t } from '@lingui/macro'
import debounce from 'lodash/debounce'
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Text } from 'rebass'
import { useLazyCheckReferralCodeQuery, useRequestWhiteListMutation } from 'services/kyberAISubscription'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Tooltip from 'components/Tooltip'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { getErrorMessage, isReferrerCodeInvalid } from 'pages/TrueSightV2/utils'
import { useSessionInfo } from 'state/authen/hooks'

import { FormWrapper, Input } from './styled'

export default function EmailForm({
  showVerify,
}: {
  showVerify: (email: string, code: string, showSuccess: boolean) => void
}) {
  const { userInfo } = useSessionInfo()
  const { mixpanelHandler } = useMixpanel()
  const [inputEmail, setInputEmail] = useState(userInfo?.email || '')
  const qs = useParsedQueryString<{ referrer: string }>()
  const [referredByCode, setCode] = useState(qs.referrer || '')
  const [errorInput, setErrorInput] = useState({ email: '', referredByCode: '' })

  const [requestWaitList] = useRequestWhiteListMutation()

  const [checkReferalCode] = useLazyCheckReferralCodeQuery()
  const checkingInput = useRef(false)

  const checkReferCodeExist = useCallback(
    async (code: string) => {
      try {
        if (!code?.trim()) return
        const { data } = await checkReferalCode(code.trim())
        if (!data?.isValid) {
          setErrorInput(prev => ({ ...prev, referredByCode: t`Referral code is invalid` }))
        }
      } catch (error) {
      } finally {
        checkingInput.current = false
      }
    },
    [checkReferalCode],
  )

  useEffect(() => {
    userInfo?.email && setInputEmail(userInfo?.email)
  }, [userInfo?.email])

  const debouncedCheckReferCode = useMemo(
    () => debounce((code: string) => checkReferCodeExist(code), 500),
    [checkReferCodeExist],
  )

  const onChangeCode = (e: FormEvent<HTMLInputElement>) => {
    checkingInput.current = true
    const value = e.currentTarget.value
    setCode(value)
    setErrorInput(prev => ({ ...prev, referredByCode: '' }))
    debouncedCheckReferCode(value)
  }

  const hasErrorInput = Object.values(errorInput).some(e => e)

  const joinWaitList = async () => {
    mixpanelHandler(MIXPANEL_TYPE.KYBERAI_JOIN_KYBER_WAITLIST_CLICK)
    try {
      if (hasErrorInput || checkingInput.current) return
      if (inputEmail) showVerify(inputEmail, referredByCode, !!userInfo?.email)
      else requestWaitList({ referredByCode }).unwrap()
    } catch (error) {
      const msg = getErrorMessage(error)
      setErrorInput(prev => ({ ...prev, [isReferrerCodeInvalid(error) ? 'referredByCode' : 'email']: msg }))
    }
  }
  const theme = useTheme()
  return (
    <>
      <FormWrapper>
        <Column width="100%" gap="6px">
          <Tooltip text={errorInput.referredByCode} show={!!errorInput.referredByCode} placement="top">
            <Input
              $borderColor={errorInput.referredByCode ? theme.red : theme.border}
              value={referredByCode}
              placeholder={t`Referral Code (Optional)`}
              onChange={onChangeCode}
            />
          </Tooltip>
          <Text fontSize={10} color={theme.subText}>
            <Trans>Use a referral code to get access to KyberAI faster!</Trans>
          </Text>
        </Column>
      </FormWrapper>

      <ButtonPrimary width="230px" height="36px" onClick={joinWaitList}>
        <Trans>Join KyberAI Waitlist</Trans>
      </ButtonPrimary>
    </>
  )
}

import { Trans, t } from '@lingui/macro'
import { debounce } from 'lodash'
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
import { isEmailValid } from 'utils/string'

import { FormWrapper, Input } from './styled'

export default function EmailForm({
  showVerify,
}: {
  showVerify: (email: string, code: string, showSuccess: boolean) => void
}) {
  const { mixpanelHandler } = useMixpanel()
  const [inputEmail, setInputEmail] = useState('')
  const qs = useParsedQueryString<{ referrer: string }>()
  const [referredByCode, setCode] = useState(qs.referrer || '')
  const [errorInput, setErrorInput] = useState({ email: '', referredByCode: '' })

  const { userInfo } = useSessionInfo()
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

  const validateInput = useCallback((value: string, required = false) => {
    const isValid = isEmailValid(value)
    const errMsg = t`Please input a valid email address`
    const msg = (value.length && !isValid) || (required && !value.length) ? errMsg : ''
    setErrorInput(prev => ({ ...prev, email: msg ? msg : '' }))
  }, [])

  const debouncedCheckReferCode = useMemo(
    () => debounce((code: string) => checkReferCodeExist(code), 500),
    [checkReferCodeExist],
  )

  const onChangeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setInputEmail(value)
    validateInput(value)
  }

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
      if (hasErrorInput || !inputEmail || checkingInput.current) return
      if (userInfo?.email) {
        await requestWaitList({ referredByCode }).unwrap()
      }
      showVerify(inputEmail || userInfo?.email || '', referredByCode, !!userInfo?.email)
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
          <Tooltip text={errorInput.email} show={!!errorInput.email} placement="top">
            <Input
              disabled={!!userInfo?.email}
              $borderColor={errorInput.email ? theme.red : theme.border}
              value={inputEmail}
              placeholder={t`Email Address`}
              onChange={onChangeInput}
            />
          </Tooltip>
          <Text fontSize={10} color={theme.subText}>
            <Trans>We will never share your email with third parties.</Trans>
          </Text>
        </Column>

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

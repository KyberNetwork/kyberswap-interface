import { Trans, t } from '@lingui/macro'
import { debounce } from 'lodash'
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useLazyCheckReferralCodeQuery, useRequestWhiteListMutation } from 'services/kyberAISubscription'
import { useLazyGetConnectedWalletQuery } from 'services/notification'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Tooltip from 'components/Tooltip'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { getErrorMessage, isReferrerCodeInvalid } from 'pages/TrueSightV2/utils'
import { useSessionInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isEmailValid } from 'utils/string'

import { FormWrapper, Input, Label } from './styled'

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
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { userInfo } = useSessionInfo()
  const [requestWaitList] = useRequestWhiteListMutation()

  const [getConnectedWallet, { isFetching }] = useLazyGetConnectedWalletQuery()
  const [checkReferalCode] = useLazyCheckReferralCodeQuery()
  const checkingInput = useRef(false)

  const checkEmailExist = useCallback(
    async (email: string) => {
      try {
        if (!isEmailValid(email) || (userInfo?.email && userInfo.email === email)) return
        const { data: walletAddress } = await getConnectedWallet(email)
        if (walletAddress) {
          setErrorInput(prev => ({ ...prev, email: t`This email address is already registered` }))
        }
      } catch (error) {
      } finally {
        checkingInput.current = false
      }
    },
    [getConnectedWallet, userInfo?.email],
  )

  const checkReferCodeExist = useCallback(
    async (code: string) => {
      try {
        if (!code) return
        const { data } = await checkReferalCode(code)
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

  const debouncedCheckEmail = useMemo(() => debounce((email: string) => checkEmailExist(email), 500), [checkEmailExist])
  const debouncedCheckReferCode = useMemo(
    () => debounce((code: string) => checkReferCodeExist(code), 500),
    [checkReferCodeExist],
  )

  const onChangeInput = (e: React.FormEvent<HTMLInputElement>) => {
    checkingInput.current = true
    const value = e.currentTarget.value
    setInputEmail(value)
    validateInput(value)
    debouncedCheckEmail(value)
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
      if (hasErrorInput || !inputEmail || isFetching || checkingInput.current) return
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
        <Column style={{ width: isMobile ? '100%' : '70%' }} gap="6px">
          <Label>
            <Trans>Your Email*</Trans>
          </Label>
          <Tooltip text={errorInput.email} show={!!errorInput.email} placement="top">
            <Input
              disabled={!!userInfo?.email}
              $borderColor={errorInput.email ? theme.red : theme.border}
              value={inputEmail}
              placeholder="Enter your email address"
              onChange={onChangeInput}
            />
          </Tooltip>
          <Text fontSize={10} color={theme.subText}>
            <Trans>We will never share your email with third parties</Trans>
          </Text>
        </Column>
        <Column gap="6px" style={{ width: isMobile ? '100%' : undefined }}>
          <Label>
            <Trans>Referral Code (Optional)</Trans>
          </Label>
          <Tooltip text={errorInput.referredByCode} show={!!errorInput.referredByCode} placement="top">
            <Input
              $borderColor={errorInput.referredByCode ? theme.red : theme.border}
              value={referredByCode}
              placeholder="Enter your Code"
              onChange={onChangeCode}
            />
          </Tooltip>
        </Column>
      </FormWrapper>

      <ButtonPrimary width="230px" height="36px" onClick={joinWaitList}>
        <Trans>Join KyberAI Waitlist</Trans>
      </ButtonPrimary>
    </>
  )
}

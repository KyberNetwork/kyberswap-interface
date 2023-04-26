import { Trans, t } from '@lingui/macro'
import { debounce } from 'lodash'
import { useCallback, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { useLazyGetConnectedWalletQuery } from 'services/notification'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Tooltip from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useRequestWhiteListMutation } from 'pages/TrueSightV2/hooks/useKyberAIData'
import VerifyCodeModal from 'pages/TrueSightV2/pages/RegisterWhitelist/VerifyCodeModal'
import { isEmailValid } from 'utils/string'

import { FormWrapper, Input, Label } from './styled'

export default function EmailForm() {
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [inputEmail, setInputEmail] = useState('')
  const [referCode, setCode] = useState('')
  const [errorInput, setErrorInput] = useState<string>('')
  const { account } = useActiveWeb3React()
  const [requestWhiteList] = useRequestWhiteListMutation()

  const [getConnectedWallet, { isFetching }] = useLazyGetConnectedWalletQuery()
  const checkEmailExist = useCallback(
    async (email: string) => {
      try {
        if (!isEmailValid(email)) return
        const { data: walletAddress } = await getConnectedWallet(email)
        if (walletAddress && walletAddress !== account?.toLowerCase()) {
          setErrorInput(t`This email address is already registered`)
        }
      } catch (error) {}
    },
    [account, getConnectedWallet],
  )

  const validateInput = useCallback((value: string, required = false) => {
    const isValid = isEmailValid(value)
    const errMsg = t`Please input a valid email address`
    const msg = (value.length && !isValid) || (required && !value.length) ? errMsg : ''
    setErrorInput(msg ? msg : '')
  }, [])

  const debouncedCheckEmail = useMemo(() => debounce((email: string) => checkEmailExist(email), 500), [checkEmailExist])
  const onChangeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setInputEmail(value)
    validateInput(value)
    debouncedCheckEmail(value)
  }

  const joinWaitList = async () => {
    try {
      if (errorInput || !inputEmail || isFetching) return
      await requestWhiteList({ email: inputEmail, referredByCode: 'string', referralProgramId: 1 })
      console.log(inputEmail, referCode)
      if (true) setErrorInput(t`This email address is already registered`)
      else setShowVerifyModal(true)
    } catch (error) {
      console.error('isFetching', error)
    }
  }
  const theme = useTheme()
  return (
    <>
      <FormWrapper>
        <Column style={{ width: '70%' }} gap="6px">
          <Label>
            <Trans>Your Email*</Trans>
          </Label>
          <Tooltip text={errorInput} show={!!errorInput} placement="top">
            <Input
              $borderColor={errorInput ? theme.red : theme.border}
              value={inputEmail}
              placeholder="Enter your email address"
              onChange={onChangeInput}
            />
          </Tooltip>
          <Text fontSize={10} color={theme.subText}>
            <Trans>We will never share your email with third parties</Trans>
          </Text>
        </Column>
        <Column gap="6px">
          <Label>
            <Trans>Referral Code (Optional)</Trans>
          </Label>
          <Input
            $borderColor={theme.border}
            value={referCode}
            placeholder="Enter your Code"
            onChange={e => setCode(e.currentTarget.value)}
          />
        </Column>
      </FormWrapper>

      <ButtonPrimary width="230px" height="36px" onClick={joinWaitList}>
        <Trans>Join KyberAI Waitlist</Trans>
      </ButtonPrimary>

      <VerifyCodeModal isOpen={showVerifyModal} onDismiss={() => setShowVerifyModal(false)} />
    </>
  )
}

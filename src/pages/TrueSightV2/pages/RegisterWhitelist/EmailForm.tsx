import { Trans, t } from '@lingui/macro'
import { debounce } from 'lodash'
import { useCallback, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { useLazyGetConnectedWalletQuery } from 'services/notification'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import VerifyCodeModal from 'pages/TrueSightV2/pages/RegisterWhitelist/VerifyCodeModal'
import { isEmailValid } from 'utils/string'

const FormWrapper = styled.div`
  width: 500px;
  display: flex;
  gap: 1rem;
`
const Label = styled.label`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
`

const Input = styled.input<{ $borderColor: string }>`
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: none;
  outline: none;
  border-radius: 20px;
  width: 100%;
  padding: 10px 14px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  background-color: ${({ theme }) => theme.buttonBlack};
  transition: border 0.5s;
  border: ${({ theme, $borderColor }) => `1px solid ${$borderColor || theme.border}`};
  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 12px;
  }
`

export default function EmailForm() {
  const [showVerifyModal, setShowVerifyModal] = useState(true)
  const [inputEmail, setInputEmail] = useState('')
  const [referCode, setCode] = useState('')
  const [errorInput, setErrorInput] = useState<string>('')
  const { account } = useActiveWeb3React()

  const [getConnectedWallet] = useLazyGetConnectedWalletQuery()
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

  const joinWaitList = () => {
    if (errorInput) return
    console.log(inputEmail, referCode)
  }
  const theme = useTheme()
  return (
    <>
      <FormWrapper>
        <Column style={{ width: '70%' }} gap="6px">
          <Label>
            <Trans>Your Email*</Trans>
          </Label>
          <Input
            $borderColor={errorInput ? theme.red : theme.border}
            value={inputEmail}
            placeholder="Enter your email address"
            onChange={onChangeInput}
          />
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

      <ButtonPrimary width="230px" height="36px">
        <Trans>Join KyberAI Waitlist</Trans>
      </ButtonPrimary>

      <VerifyCodeModal isOpen={showVerifyModal} />
    </>
  )
}

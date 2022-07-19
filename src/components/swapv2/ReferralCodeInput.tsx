import React from 'react'
import styled from 'styled-components'

import { useSwapActionHandlers } from 'state/swap/hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'

const Input = styled.input`
  border: none;
  outline: none;
  height: 44px;
  border-radius: 4px;
  padding: 5px;
  padding-left: 10px;
  ${({ theme }) => `
    color: ${theme.text};
    background-color: ${theme.buttonBlack};
  `}
`

const ReferralCodeInput = () => {
  const { referralCode }: { referralCode?: string } = useParsedQueryString()
  const { onReferralCodeChange } = useSwapActionHandlers()

  return <Input value={referralCode} onChange={(e) => onReferralCodeChange(e.target.value)} />
}

export default ReferralCodeInput

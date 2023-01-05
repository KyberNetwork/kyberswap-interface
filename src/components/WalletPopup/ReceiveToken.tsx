import { Trans } from '@lingui/macro'
import { Check } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { AddressInput } from 'components/AddressInputPanel'
import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import { useActiveWeb3React } from 'hooks'
import useCopyClipboard from 'hooks/useCopyClipboard'

const Label = styled.label<{ color?: string }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, color }) => color ?? theme.subText};
`
const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
`

export default function SendToken() {
  const { account = '' } = useActiveWeb3React()

  const [isCopied, setCopied] = useCopyClipboard(2000)

  const onCopy = async () => {
    setCopied(account)
  }

  return (
    <Wrapper>
      <Flex flexDirection={'column'} style={{ gap: 18 }}>
        <Label>
          <Trans>Your Wallet Address</Trans>
        </Label>

        <AddressInput
          value={account}
          onChange={() => {
            //
          }}
          icon={<CopyHelper toCopy={account} />}
        />
      </Flex>
      <ButtonPrimary height="44px" onClick={onCopy}>
        {isCopied ? (
          <Trans>
            <Trans>Copied Address</Trans>&nbsp;
            <Check size={16} />
          </Trans>
        ) : (
          <Trans>Copy Address</Trans>
        )}
      </ButtonPrimary>
    </Wrapper>
  )
}

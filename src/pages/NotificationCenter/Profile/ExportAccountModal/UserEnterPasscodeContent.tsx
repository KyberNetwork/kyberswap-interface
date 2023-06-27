import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Input from 'components/Input'
import useTheme from 'hooks/useTheme'
import { ButtonExport } from 'pages/NotificationCenter/Profile/buttons'
import { ExternalLink } from 'theme'

import { Label } from './styled'

const ButtonNext = styled(ButtonPrimary)`
  flex: 1;
  height: 36px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
`

const ButtonCancel = styled(ButtonExport)`
  flex: 1;
  height: 36px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
`

type Props = {
  dismissModal: () => void
  onEnterPasscode: (v: string) => void
}
const UserEnterPasscodeContent: React.FC<Props> = ({ onEnterPasscode, dismissModal }) => {
  const [passcode, setPasscode] = useState('')
  const theme = useTheme()

  return (
    <Flex
      sx={{
        width: '100%',
        gap: '16px',
        flexDirection: 'column',
      }}
    >
      <Text
        sx={{
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '20px',
        }}
      >
        <Trans>
          Exported profiles will not be associated with your wallet. Your export code is unique. Learn more about
          profile <ExternalLink href="/todo">here</ExternalLink>. {/** // todo */}
        </Trans>
      </Text>
      <Text
        sx={{
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '20px',
        }}
      >
        <Trans>First, you will need to create a passcode</Trans>
      </Text>

      <Flex
        sx={{
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <Label>
          <Trans>Your passcode</Trans>
        </Label>

        <Input
          type="password"
          color={theme.text}
          maxLength={50}
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          placeholder="Enter your passcode"
        />

        <Text
          sx={{
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px',
            fontStyle: 'italic',
          }}
        >
          <Trans>Your passcode must be at least 6 characters long</Trans>
        </Text>
      </Flex>

      <Flex
        width="100%"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          gap: '16px',
        }}
      >
        <ButtonCancel onClick={dismissModal}>Cancel</ButtonCancel>
        <ButtonNext
          disabled={!passcode || passcode.length < 6}
          onClick={() => {
            onEnterPasscode(passcode)
          }}
        >
          <Trans>Next</Trans>
        </ButtonNext>
      </Flex>
    </Flex>
  )
}

export default UserEnterPasscodeContent

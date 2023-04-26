import { Trans, t } from '@lingui/macro'
import { debounce } from 'lodash'
import { rgba } from 'polished'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { Users } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useSendOtpMutation } from 'services/identity'
import { useLazyGetConnectedWalletQuery } from 'services/notification'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { ShareGroupButtons } from 'components/ShareModal'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useGetParticipantInfoQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import VerifyCodeModal from 'pages/TrueSightV2/pages/RegisterWhitelist/VerifyCodeModal'
import { useSessionInfo } from 'state/authen/hooks'
import { isEmailValid } from 'utils/string'

import { FormWrapper, Input, InputWithCopy, Label } from './styled'

const Wrapper = styled(FormWrapper)`
  flex-direction: column;
`

const Icon = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 30px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`

export default function EmailForm() {
  const [{ profile }] = useSessionInfo()
  const [referCode, setCode] = useState('12332323')
  const { account } = useActiveWeb3React()
  const { data } = useGetParticipantInfoQuery({ account: account ?? '' }, { skip: !account })

  const theme = useTheme()

  return (
    <>
      <Wrapper>
        <Text fontSize={12} color={theme.subText} lineHeight={'16px'}>
          <Trans>
            Hey! You&apos;re on our waitlist but your slot hasn&apos;t opened up yet. Jump the queue by referring others
            to KyberAI.
          </Trans>
        </Text>

        <Column gap="6px">
          <Label>
            <Trans>Your Email</Trans>
          </Label>
          <Input $borderColor={theme.border} value={profile?.email} />
        </Column>

        <RowBetween>
          <Column gap="6px">
            <Label>
              <Trans>Your Referral Link</Trans>
            </Label>
            <InputWithCopy disabled $borderColor={theme.border} value={referCode} />
          </Column>

          <Column gap="6px">
            <Label>
              <Trans>Your Referral Code</Trans>
            </Label>
            <InputWithCopy disabled $borderColor={theme.border} value={referCode} />
          </Column>
        </RowBetween>

        <RowBetween>
          <Column gap="6px">
            <Flex fontSize={14} color={theme.text} style={{ gap: '6px' }}>
              <Users size={16} />
              <Trans>1,200 users are ahead of you!</Trans>
            </Flex>
            <Text fontSize={12} color={theme.subText}>
              <Trans>The more you share, the sooner you&apos;ll get access!</Trans>
            </Text>
          </Column>
          <Row gap="12px" width={'fit-content'}>
            <ShareGroupButtons
              shareUrl=""
              showLabel={false}
              size={20}
              renderItem={({ children, color, ...props }) => <Icon {...props}>{children(color ?? '')}</Icon>}
            />
          </Row>
        </RowBetween>
      </Wrapper>
    </>
  )
}

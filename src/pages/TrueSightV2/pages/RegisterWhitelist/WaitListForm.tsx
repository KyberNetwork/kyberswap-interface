import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode } from 'react'
import { Users } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { ShareGroupButtons } from 'components/ShareModal'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useSessionInfo } from 'state/authen/hooks'
import { useGetParticipantKyberAIInfo } from 'state/user/hooks'
import { formattedNum } from 'utils'

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

export default function EmailForm({
  style,
  desc,
  showRanking = true,
}: {
  style?: CSSProperties
  desc: ReactNode
  showRanking?: boolean
}) {
  const { userInfo } = useSessionInfo()
  const { rankNo, referralCode } = useGetParticipantKyberAIInfo()

  const theme = useTheme()
  const shareLink = `${window.location.origin}${APP_PATHS.KYBERAI_ABOUT}?referrer=${referralCode}`

  return (
    <Wrapper style={style}>
      {desc}

      <Column gap="6px">
        <Label>
          <Trans>Your Email</Trans>
        </Label>
        <Input $borderColor={theme.border} value={userInfo?.email} disabled />
      </Column>

      <RowBetween gap="12px">
        <Column gap="6px" style={{ width: '70%' }}>
          <Label>
            <Trans>Your Referral Link</Trans>
          </Label>
          <InputWithCopy disabled $borderColor={theme.border} value={shareLink} />
        </Column>

        <Column gap="6px">
          <Label>
            <Trans>Your Referral Code</Trans>
          </Label>
          <InputWithCopy disabled $borderColor={theme.border} value={referralCode} />
        </Column>
      </RowBetween>

      <RowBetween flexWrap={'wrap'} gap="12px">
        <Column gap="6px">
          {showRanking && (
            <>
              <Flex fontSize={14} color={theme.text} style={{ gap: '6px' }}>
                <Users size={16} />
                <Trans>{rankNo ? formattedNum(rankNo - 1 + '') : t`Many`} users are ahead of you!</Trans>
              </Flex>
              <Text fontSize={12} color={theme.subText}>
                <Trans>The more you share, the sooner you&apos;ll get access!</Trans>
              </Text>
            </>
          )}
        </Column>
        <Row gap="12px" width={'fit-content'}>
          <ShareGroupButtons
            shareUrl={shareLink}
            showLabel={false}
            size={20}
            renderItem={({ children, color, ...props }) => <Icon {...props}>{children(color ?? '')}</Icon>}
          />
        </Row>
      </RowBetween>
    </Wrapper>
  )
}

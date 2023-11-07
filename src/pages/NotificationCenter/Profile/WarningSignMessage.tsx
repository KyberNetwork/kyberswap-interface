import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import React, { ReactNode } from 'react'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { useSessionInfo } from 'state/authen/hooks'
import { useSignedAccountInfo } from 'state/profile/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

const WarningWrapper = styled.div`
  border-radius: 24px;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 14px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px;
  `}
`
const DOC_URL = 'https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/profiles'
const WarningSignMessage = ({ msg, outline }: { msg: ReactNode; outline?: boolean }) => {
  const { signIn } = useLogin()
  const { pendingAuthentication } = useSessionInfo()
  const { isSigInGuest } = useSignedAccountInfo()
  const { account, isSolana } = useActiveWeb3React()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const btnWidth = upToMedium ? '45%' : '110px'
  const theme = useTheme()

  if (pendingAuthentication || !isSigInGuest || isSolana) return null

  const propsBtn = {
    fontSize: '14px',
    width: btnWidth,
    height: '30px',
    onClick: () => signIn({ account }),
    children: <Trans>Sign-in</Trans>,
  }
  return (
    <WarningWrapper>
      <Row style={{ gap: '12px' }}>
        {!upToMedium && <Info color={theme.subText} size={18} style={{ minWidth: '18px' }} />}
        <Text fontSize={'12px'} lineHeight={'16px'}>
          <Trans>
            {msg}{' '}
            {!upToMedium && (
              <>
                Read more <ExternalLink href={DOC_URL}>here ↗</ExternalLink>
              </>
            )}
          </Trans>
        </Text>
      </Row>
      <Row justify="space-between" width={upToMedium ? '100%' : 'fit-content'}>
        {upToMedium && (
          <ButtonOutlined width={btnWidth} height={'30px'} fontSize={'14px'} onClick={() => window.open(DOC_URL)}>
            <Trans>Read More</Trans>
          </ButtonOutlined>
        )}
        {React.createElement(outline && !upToMedium ? ButtonOutlined : ButtonPrimary, propsBtn)}
      </Row>
    </WarningWrapper>
  )
}
export default WarningSignMessage

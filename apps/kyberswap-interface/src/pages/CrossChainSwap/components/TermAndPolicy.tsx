import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { TERM_FILES_PATH } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`

const UpperSection = styled.div`
  position: relative;
  padding: 24px;
`

const CloseIcon = styled.div`
  height: 24px;
  align-self: flex-end;
  color: ${({ theme }) => theme.text};
  cursor: pointer;

  &:hover {
    opacity: 0.6;
  }
`

const TermAndCondition = styled.div`
  padding: 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.35)};
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary : 'inherit')};
  accent-color: ${({ theme }) => theme.primary};
  border-radius: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;

  :hover {
    background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.5)};
  }
`

const ButtonWrapper = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: center;
`

export default function TermAndPolicy({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const theme = useTheme()
  const [isAcceptedTerm, setIsAcceptedTerm] = useState(true)

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      minHeight={false}
      maxHeight={90}
      maxWidth={430}
      bypassScrollLock
      bypassFocusLock
      zindex={99999}
    >
      <Wrapper>
        <UpperSection>
          <RowBetween marginBottom="26px" gap="20px">
            <Text>{t`Connect your Wallet`}</Text>
            <CloseIcon onClick={onClose}>
              <Close />
            </CloseIcon>
          </RowBetween>
          <TermAndCondition onClick={() => setIsAcceptedTerm(!isAcceptedTerm)}>
            <input
              type="checkbox"
              checked={isAcceptedTerm}
              onChange={() => {}}
              data-testid="accept-term"
              style={{ marginRight: '12px', height: '14px', width: '14px', minWidth: '14px', cursor: 'pointer' }}
            />
            <Text color={theme.subText}>
              <span>{t`Accept`}</span>{' '}
              <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
                <span>{t`KyberSwap's Terms of Use`}</span>
              </ExternalLink>{' '}
              <span>{t`and`}</span>{' '}
              <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
                <span>{t`Privacy Policy`}</span>
              </ExternalLink>
              {'. '}
              <Text fontSize={10} as="span">
                {t`Last updated:`} {dayjs(TERM_FILES_PATH.VERSION).format('DD MMM YYYY')}
              </Text>
            </Text>
          </TermAndCondition>
          <ButtonWrapper>
            <ButtonPrimary width={'120px'} disabled={!isAcceptedTerm} onClick={onConfirm}>{t`Continue`}</ButtonPrimary>
          </ButtonWrapper>
        </UpperSection>
      </Wrapper>
    </Modal>
  )
}

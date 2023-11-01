import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CheckBox from 'components/CheckBox'
import ModalTemplate from 'components/Modal/ModalTemplate'
import { TutorialKeys } from 'components/Tutorial/TutorialSwap'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`
const TextWrapper = styled.div`
  line-height: 20px;
  font-size: 14px;
`

const Disclaimer = styled.div`
  padding: 12px;

  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 10px;
  line-height: 14px;
  font-weight: 400;

  border-radius: 16px;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  color: ${({ theme }) => theme.text};

  cursor: pointer;
  transition: background-color 100ms linear;
`

export default function DisclaimerPortfolio() {
  const showed = localStorage.getItem(TutorialKeys.SHOWED_PORTFOLIO_DISCLAIMER)
  const [show, setShow] = useState(!showed)
  const handleClickUnderstand = () => {
    localStorage.setItem(TutorialKeys.SHOWED_PORTFOLIO_DISCLAIMER, '1')
    setShow(false)
  }
  const [accepted, setAccepted] = useState(false)

  const handleClickDisclaimer = useCallback(() => {
    const newValue = !accepted
    setAccepted(newValue)
  }, [accepted])

  return (
    <ModalTemplate isOpen={show} title={t`Disclaimer`} width="480px" showCloseButton={false}>
      <Container>
        <TextWrapper>
          <Trans>
            My Portfolio enables users to manage decentralized assets across all KyberSwap supported chains.
          </Trans>
        </TextWrapper>
        <TextWrapper>
          <Trans>
            Note that asset values can fluctuate greatly according to market conditions. While KyberSwap strives to
            provide accurate and timely data, we are unable to guarantee its accuracy nor completeness.
          </Trans>
        </TextWrapper>

        <TextWrapper>
          <Trans>
            Users should conduct their own due diligence before investing based on the provided information.
          </Trans>
        </TextWrapper>

        <Disclaimer role="button" onClick={handleClickDisclaimer}>
          <CheckBox checked={accepted} style={{ maxHeight: 12, maxWidth: 12 }} />
          <Text as="span" fontSize={'12px'}>
            <Trans>
              By using our platform, you accept these risks and are solely responsible for any investment decisions.
            </Trans>
          </Text>
        </Disclaimer>

        <ButtonPrimary
          height={'36px'}
          disabled={!accepted}
          onClick={handleClickUnderstand}
          data-testid="understand-button"
        >
          <Trans>Agree</Trans>
        </ButtonPrimary>
      </Container>
    </ModalTemplate>
  )
}

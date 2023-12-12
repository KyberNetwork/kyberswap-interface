import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CheckBox from 'components/CheckBox'
import ModalTemplate from 'components/Modal/ModalTemplate'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`
const TextWrapper = styled.div`
  line-height: 20px;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
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

export default function DisclaimerPortfolio({ onConfirm }: { onConfirm: () => void }) {
  const [accepted, setAccepted] = useState(false)

  const handleClickDisclaimer = useCallback(() => {
    const newValue = !accepted
    setAccepted(newValue)
  }, [accepted])

  return (
    <ModalTemplate isOpen={true} title={t`Disclaimer`} width="480px" closeButton={false}>
      <Container>
        <TextWrapper>
          <Trans>
            My Portfolio enables users to manage decentralized assets across all KyberSwap supported chains.
          </Trans>
        </TextWrapper>
        <TextWrapper>
          <Trans>Note that asset values can experience significant fluctuations due to market conditions.</Trans>
        </TextWrapper>

        <TextWrapper>
          <Trans>
            While KyberSwap strives to provide accurate and timely data, it&apos;s essential for users to conduct their
            own research and due diligence before making investment decisions based on the provided information.
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

        <ButtonPrimary height={'36px'} disabled={!accepted} onClick={onConfirm} data-testid="understand-button">
          <Trans>Agree</Trans>
        </ButtonPrimary>
      </Container>
    </ModalTemplate>
  )
}

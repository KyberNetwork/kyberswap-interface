import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode } from 'react'
import { Check } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import BackgroundImage from 'assets/images/limit_order_pnl.png'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import { DOCS_LINKS } from 'components/swapv2/LimitOrder/const'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const Wrapper = styled.div`
  width: 100%;
  height: 424px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px;
  background-image: url(${BackgroundImage});
  background-repeat: no-repeat;
  background-size: 100%;
`

const CheckIcon = styled.div`
  background-color: ${({ theme }) => rgba(theme.primary, 0.3)};
  border-radius: 100%;
  padding: 2px;
  display: flex;
  align-items: center;
`

const ContentItem = ({ text }: { text: ReactNode }) => {
  const theme = useTheme()
  return (
    <Row gap="8px">
      <CheckIcon>
        <Check color={theme.primary} size={14} />
      </CheckIcon>
      <Text fontSize={'14px'} color={theme.text}>
        {text}
      </Text>
    </Row>
  )
}
export default function Tutorial({ onClose }: { onClose: () => void }) {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const onGetStart = () => {
    mixpanelHandler(MIXPANEL_TYPE.LO_CLICK_GET_STARTED)
    onClose()
  }

  return (
    <Wrapper>
      <Column gap="40px">
        <Column gap="10px" alignItems="center">
          <Text textAlign={'center'} fontWeight={'500'} fontSize={'24px'} color={theme.text}>
            <Trans>Want to try our Limit Orders?</Trans>
          </Text>
          <Text fontWeight={'700'} fontSize={'24px'} color={theme.text}>
            <Trans>Get started!</Trans>
          </Text>
        </Column>

        <Column gap="12px">
          <ContentItem text={t`Buy or sell tokens at the price you want.`} />
          <ContentItem
            text={
              <Text>
                <Trans>Place orders on thousands of tokens for</Trans>{' '}
                <Text as="span" fontWeight={'500'} color={theme.primary}>
                  <Trans>Free</Trans>!
                </Text>
              </Text>
            }
          />
          <ContentItem text={t`Get your orders filled without paying any gas fees.`} />
          <ContentItem
            text={
              <Text>
                <Trans>Cancel and edit orders for</Trans>{' '}
                <Text as="span" fontWeight={'500'} color={theme.primary}>
                  <Trans>Free</Trans>!
                </Text>
              </Text>
            }
          />
        </Column>
      </Column>

      <Column gap="16px" width={'100%'}>
        <Text fontSize={'14px'} textAlign={'center'} color={theme.text}>
          <Trans>
            Learn more about our limit orders <ExternalLink href={DOCS_LINKS.USER_GUIDE}>here</ExternalLink>.
          </Trans>
        </Text>
        <ButtonPrimary height="40px" width={'100%'} onClick={onGetStart} data-testid="get-started-button">
          <Trans>Get Started</Trans>
        </ButtonPrimary>
      </Column>
    </Wrapper>
  )
}

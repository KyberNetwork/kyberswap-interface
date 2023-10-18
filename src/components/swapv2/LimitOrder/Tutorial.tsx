import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode } from 'react'
import { Check } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import { DOCS_LINKS } from 'components/swapv2/LimitOrder/const'
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
  background: var(--overlay-oapy-20, rgba(15, 170, 162, 0.2)); // todo
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
      <Text fontSize={'14px'} color={theme.subText}>
        {text}
      </Text>
    </Row>
  )
}
export default function Tutorial({ onClose }: { onClose: () => void }) {
  const theme = useTheme()

  return (
    <Wrapper>
      <Column gap="40px">
        <Column gap="10px" alignItems="center">
          <Text textAlign={'center'} fontWeight={'500'} fontSize={'24px'} color={theme.subText}>
            <Trans>Want to try our Limit Orders?</Trans>
          </Text>
          <Text fontWeight={'700'} fontSize={'24px'} color={theme.subText}>
            <Trans>Get started!</Trans>
          </Text>
        </Column>

        <Column gap="12px">
          <ContentItem text={t`Place limit orders on thousands of tokens`} />
          <ContentItem text={t`Get your orders filled without paying any gas fees`} />
          <ContentItem
            text={
              <Trans>
                Cancel and edit orders for{' '}
                <Text as="span" fontWeight={'500'} color={theme.primary}>
                  <Trans>FREE</Trans>
                </Text>
              </Trans>
            }
          />
        </Column>
      </Column>

      <Column gap="16px" width={'100%'}>
        <Text fontSize={'14px'} textAlign={'center'} color={theme.subText}>
          <Trans>
            Learn more about <ExternalLink href={DOCS_LINKS.USER_GUIDE}>KyberSwap Limit Order</ExternalLink>
          </Trans>
        </Text>
        <ButtonPrimary height="40px" width={'100%'} onClick={onClose}>
          <Trans>Get started with limit orders</Trans>
        </ButtonPrimary>
      </Column>
    </Wrapper>
  )
}

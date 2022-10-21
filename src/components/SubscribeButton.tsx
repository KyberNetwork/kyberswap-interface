import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Text } from 'rebass'
import styled from 'styled-components'

import { Spinner } from 'components/Header/Polling'
import NotificationIcon from 'components/Icons/NotificationIcon'
import useTheme from 'hooks/useTheme'
import { checkChrome } from 'utils/checkChrome'

import { ButtonEmpty, ButtonPrimary } from './Button'

const SubscribeBtn = styled(ButtonPrimary)<{ isDisabled: boolean }>`
  overflow: hidden;
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  background: ${({ theme, isDisabled }) => (isDisabled ? theme.buttonGray : theme.primary)};
  color: ${({ theme, isDisabled }) => (isDisabled ? theme.border : theme.textReverse)};

  ${({ theme, isDisabled }) => theme.mediaWidth.upToExtraSmall`
    width: 36px;
    min-width: 36px;
    padding: 6px;
    background: ${isDisabled ? theme.buttonGray : rgba(theme.primary, 0.2)};
    color: ${isDisabled ? theme.border : theme.primary};
  `}
`

const UnSubscribeButton = styled(ButtonEmpty)`
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 36px;
    min-width: 36px;
    padding: 6px;
  `}
`

const StyledSpinner = styled(Spinner)<{ color: string }>`
  border-left: ${({ color }) => `1px solid  ${color}`};
  width: 16px;
  height: 16px;
  top: 0px;
  left: 0px;
`
const ButtonText = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  margin-left: 6px !important;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`
export default function SubscribeButton({
  isLoading,
  hasSubscribed,
  handleUnSubscribe,
  handleSubscribe,
}: {
  isLoading: boolean
  hasSubscribed: boolean | undefined
  handleUnSubscribe: () => void
  handleSubscribe?: () => void
}) {
  const theme = useTheme()
  const isChrome = checkChrome()
  return hasSubscribed ? (
    <UnSubscribeButton disabled={!isChrome || isLoading} onClick={handleUnSubscribe}>
      {isLoading ? <StyledSpinner color={theme.primary} /> : <NotificationIcon color={theme.primary} />}

      <ButtonText color="primary">
        <Trans>Unsubscribe</Trans>
      </ButtonText>
    </UnSubscribeButton>
  ) : (
    <SubscribeBtn isDisabled={!isChrome || isLoading} onClick={handleSubscribe}>
      {isLoading ? <StyledSpinner color={theme.primary} /> : <NotificationIcon />}

      <ButtonText>
        <Trans>Subscribe</Trans>
      </ButtonText>
    </SubscribeBtn>
  )
}

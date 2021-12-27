import React, { useContext } from 'react'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Discord from 'components/Icons/Discord'
import { Telegram } from 'components/Icons'
import Facebook from 'components/Icons/Facebook'
import { ExternalLink } from 'theme'
import { KYBER_NETWORK_DISCORD_URL, KYBER_NETWORK_TWITTER_URL } from 'constants/index'
import Modal from 'components/Modal'
import { Text, Flex, Box } from 'rebass'
import { RowBetween } from '../../components/Row'
import { ButtonText } from '../../theme'
import { t, Trans } from '@lingui/macro'
import { X } from 'react-feather'
import styled, { ThemeContext } from 'styled-components'
import { ButtonPrimary } from '../../components/Button'

const ButtonWrapper = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;

  a {
    width: 64px;
    height: 64px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 8px;
    &:hover {
      background-color: ${({ theme }) => theme.bg12};
    }
  }
`

const InputWrapper = styled.div`
  background-color: ${({ theme }) => theme.bg12};
  border-radius: 4px;
  display: flex;
  width: 100%;
  input {
    border: none;
    outline: none;
    color: ${({ theme }) => theme.text};
    font-size: 14px;
    background: transparent;
    flex: 1;
    padding-left: 10px;
  }
`

export default function ShareModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const theme = useContext(ThemeContext)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <Flex flexDirection="column" alignItems="center" padding="25px" width="100%">
        <RowBetween>
          <Text fontSize={18} fontWeight={500}>
            <Trans>Share this token with your friends!</Trans>
          </Text>
          <ButtonText onClick={onDismiss}>
            <X color={theme.text} />
          </ButtonText>
        </RowBetween>
        <Flex justifyContent="space-between" padding="32px 0" width="100%">
          <ButtonWrapper>
            <ExternalLink href="https://t.me/kybernetwork">
              <Telegram size={36} color={theme.subText} />
            </ExternalLink>
            <Text>Telegram</Text>
          </ButtonWrapper>
          <ButtonWrapper>
            <ExternalLink href={KYBER_NETWORK_TWITTER_URL}>
              <TwitterIcon width={36} height={36} color={theme.subText} />
            </ExternalLink>
            <Text>Twitter</Text>
          </ButtonWrapper>
          <ButtonWrapper>
            <ExternalLink href={'https://www.facebook.com/KyberVietnam/'}>
              <Facebook color={theme.subText} />
            </ExternalLink>
            <Text>Facebook</Text>
          </ButtonWrapper>
          <ButtonWrapper>
            <ExternalLink href={KYBER_NETWORK_DISCORD_URL}>
              <Discord width={36} height={36} color={theme.subText} />
            </ExternalLink>
            <Text>Discord</Text>
          </ButtonWrapper>
        </Flex>
        <InputWrapper>
          <input type="text" value={window.location.href} />
          <ButtonPrimary
            fontSize={14}
            padding="12px"
            width="auto"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
            }}
          >
            Copy Link
          </ButtonPrimary>
        </InputWrapper>
      </Flex>
    </Modal>
  )
}

import React, { useContext, useState } from 'react'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Discord from 'components/Icons/Discord'
import { Telegram } from 'components/Icons'
import Facebook from 'components/Icons/Facebook'
import { ExternalLink } from 'theme'
import { KYBER_NETWORK_DISCORD_URL, KYBER_NETWORK_TWITTER_URL } from 'constants/index'
import Modal from 'components/Modal'
import { Text, Flex } from 'rebass'
import { RowBetween } from '../../components/Row'
import { ButtonText } from '../../theme'
import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import styled, { ThemeContext } from 'styled-components'
import { ButtonPrimary } from '../../components/Button'
import { currencyId } from 'utils/currencyId'
import { Field } from 'state/swap/actions'
import { Currency } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from 'hooks'
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
const AlertMessage = styled.span`
  position: absolute;
  top: -25px;
  background: #fff;
  border-radius: 5px;
  font-size: 12px;
  padding: 3px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  &.show {
    visibility: visible;
    opacity: 0.9;
  }
`
export default function ShareModal({
  isOpen,
  onDismiss,
  currencies
}: {
  isOpen: boolean
  onDismiss: () => void
  currencies: { [field in Field]?: Currency }
}) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  const shareUrl =
    currencies && currencies[Field.INPUT] && currencies[Field.OUTPUT]
      ? window.location.origin +
        `/#/swap?inputCurrency=${currencyId(currencies[Field.INPUT] as Currency, chainId)}&outputCurrency=${currencyId(
          currencies[Field.OUTPUT] as Currency,
          chainId
        )}&networkId=${chainId}`
      : window.location.href
  const [showAlert, setShowAlert] = useState(false)
  const handleCopyClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShowAlert(true)
        setTimeout(() => setShowAlert(false), 2000)
      })
    }
  }

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
            <ExternalLink href={'https://telegram.me/share/url?url=' + encodeURIComponent(shareUrl)}>
              <Telegram size={36} color={theme.subText} />
            </ExternalLink>
            <Text>Telegram</Text>
          </ButtonWrapper>
          <ButtonWrapper>
            <ExternalLink href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareUrl)}>
              <TwitterIcon width={36} height={36} color={theme.subText} />
            </ExternalLink>
            <Text>Twitter</Text>
          </ButtonWrapper>
          <ButtonWrapper>
            <ExternalLink href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl)}>
              <Facebook color={theme.subText} />
            </ExternalLink>
            <Text>Facebook</Text>
          </ButtonWrapper>
          <ButtonWrapper onClick={handleCopyClick}>
            <ExternalLink href={'https://discord.com/app/'}>
              <Discord width={36} height={36} color={theme.subText} />
            </ExternalLink>
            <Text>Discord</Text>
          </ButtonWrapper>
        </Flex>
        <InputWrapper>
          <input type="text" value={shareUrl} />
          <ButtonPrimary fontSize={14} padding="12px" width="auto" onClick={handleCopyClick}>
            Copy Link
            <AlertMessage className={showAlert ? 'show' : ''}>Copied!</AlertMessage>
          </ButtonPrimary>
        </InputWrapper>
      </Flex>
    </Modal>
  )
}

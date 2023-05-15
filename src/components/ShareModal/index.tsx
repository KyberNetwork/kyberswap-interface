import { t } from '@lingui/macro'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Share2, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { Telegram } from 'components/Icons'
import Discord from 'components/Icons/Discord'
import Facebook from 'components/Icons/Facebook'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ButtonText, ExternalLink } from 'theme'

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
      background-color: ${({ theme }) => theme.buttonBlack};
    }
  }
`

const InputWrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 999px;
  padding: 4px;
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
  background: #ddd;
  color: #222;
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

const ButtonWithHoverEffect = ({ children, onClick }: { children: (color: string) => any; onClick: () => void }) => {
  const theme = useTheme()
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const handleMouseEnter = () => {
    setIsHovering(true)
  }
  const handleMouseLeave = () => {
    setIsHovering(false)
  }
  return (
    <ButtonWrapper onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={onClick}>
      {children(isHovering ? theme.text : theme.subText)}
    </ButtonWrapper>
  )
}

export const getSocialShareUrls = (shareUrl: string) => {
  return {
    telegram: 'https://telegram.me/share/url?url=' + encodeURIComponent(shareUrl),
    twitter: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareUrl),
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl),
    discord: 'https://discord.com/app/',
  }
}

const noop = () => {
  // empty
}

export default function ShareModal({
  title,
  url,
  onShared = noop,
  onDismiss = noop,
}: {
  title: string
  url?: string
  onShared?: () => void
  onDismiss?: () => void
}) {
  const isOpen = useModalOpen(ApplicationModal.SHARE)
  const toggle = useToggleModal(ApplicationModal.SHARE)
  const theme = useTheme()

  const [isCopied, setCopied] = useCopyClipboard()
  const shareUrl = url || window.location.href
  const handleCopyClick = () => {
    onShared()
    setCopied(shareUrl)
  }

  const { telegram, twitter, facebook, discord } = getSocialShareUrls(shareUrl)

  const handleDismissModal = () => {
    onDismiss()
    toggle()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismissModal}>
      <Flex flexDirection="column" alignItems="center" padding="25px" width="100%">
        <RowBetween>
          <Text fontSize={18} fontWeight={500}>
            {title}
          </Text>
          <ButtonText onClick={handleDismissModal} style={{ lineHeight: '0' }}>
            <X color={theme.text} />
          </ButtonText>
        </RowBetween>
        <Flex justifyContent="space-between" padding="32px 0" width="100%">
          <ButtonWithHoverEffect onClick={onShared}>
            {(color: string) => (
              <>
                <ExternalLink href={telegram}>
                  <Telegram size={36} color={color} />
                </ExternalLink>
                <Text>Telegram</Text>
              </>
            )}
          </ButtonWithHoverEffect>
          <ButtonWithHoverEffect onClick={onShared}>
            {(color: string) => (
              <>
                <ExternalLink href={twitter}>
                  <TwitterIcon width={36} height={36} color={color} />
                </ExternalLink>
                <Text>Twitter</Text>
              </>
            )}
          </ButtonWithHoverEffect>
          <ButtonWithHoverEffect onClick={onShared}>
            {(color: string) => (
              <>
                <ExternalLink href={facebook}>
                  <Facebook color={color} />
                </ExternalLink>
                <Text>Facebook</Text>
              </>
            )}
          </ButtonWithHoverEffect>
          <ButtonWithHoverEffect onClick={onShared}>
            {(color: string) => (
              <>
                <ExternalLink href={discord}>
                  <Discord width={36} height={36} color={color} />
                </ExternalLink>
                <Text>Discord</Text>
              </>
            )}
          </ButtonWithHoverEffect>
        </Flex>
        <InputWrapper>
          <input type="text" value={shareUrl} onChange={noop} />
          <ButtonPrimary onClick={handleCopyClick} fontSize={14} padding="8px 12px" width="auto">
            Copy Link
            <AlertMessage className={isCopied ? 'show' : ''}>Copied!</AlertMessage>
          </ButtonPrimary>
        </InputWrapper>
      </Flex>
    </Modal>
  )
}

type Props = { url?: string; onShared?: () => void; color?: string; title: string }

export const ShareButtonWithModal: React.FC<Props> = ({ url, onShared, color, title }) => {
  const theme = useTheme()
  const toggle = useToggleModal(ApplicationModal.SHARE)

  return (
    <>
      <StyledActionButtonSwapForm onClick={toggle}>
        <MouseoverTooltip text={t`Share`} placement="top" width="fit-content" disableTooltip={isMobile}>
          <Share2 size={18} color={color || theme.subText} />
        </MouseoverTooltip>
      </StyledActionButtonSwapForm>
      <ShareModal url={url} onShared={onShared} title={title} />
    </>
  )
}

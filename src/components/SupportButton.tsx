import { Trans } from '@lingui/macro'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { HelpCircle } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DiscordIcon } from 'assets/svg/discord_color.svg'
import { ReactComponent as EmailIcon } from 'assets/svg/email_color.svg'
import { ReactComponent as TeleIcon } from 'assets/svg/tele_color.svg'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

import { ButtonPrimary } from './Button'

const SubMenu = styled(motion.div)`
  position: absolute;
  top: 0;
  right: 0;
  transform: translateY(-100%) !important;
  padding-bottom: 10px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    right: -10px;
  `}
`
const SubMenuBackground = styled.div`
  border-radius: 12px;
  position: absolute;
  top: -10px;
  right: 0;
  bottom: 0;
  left: 0;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: -1;
`

const SubMenuContent = styled(Flex)`
  background: ${({ theme }) => theme.tableHeader};
  padding: 12px 24px;
  border-radius: 12px;
  margin-bottom: -10px;

  :after {
    bottom: 100%;
    right: 20px;
    top: calc(100% - 10px);
    border: solid transparent;
    content: '';
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
    border-bottom-color: ${({ theme }) => theme.tableHeader};
    border-width: 10px;
    margin-left: -10px;
    border-top-color: ${({ theme }) => theme.tableHeader};
    border-bottom-color: transparent;
    border-width: 10px;
    margin-left: -10px;
  }
`

const Wrapper = styled(motion.div)`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    bottom: 75px;
  `};
`

export default function SupportButton() {
  const [isHover, setIsHover] = useState(false)
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const toggleHover = () => !isMobile && setIsHover(prev => !prev)

  const subMenuAnimate = {
    enter: {
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: 0.3,
      },
      display: 'block',
    },
    exit: {
      opacity: 0,
      rotateX: -15,
      transition: {
        duration: 0.3,
        delay: 0.2,
      },
      transitionEnd: {
        display: 'none',
      },
    },
  }

  const ref = useRef(null)
  useOnClickOutside(ref, () => {
    setIsHover(false)
  })

  if (window.location.href.includes('/partner-swap')) return null

  return (
    <Wrapper onHoverStart={toggleHover} onHoverEnd={toggleHover} onClick={() => isMobile && setIsHover(true)} ref={ref}>
      <ButtonPrimary
        style={{ height: '36px', width: upToSmall ? '36px' : undefined, padding: upToSmall ? 0 : undefined }}
      >
        <HelpCircle size={18} />
        {!upToSmall && (
          <Text marginLeft="0.5rem">
            <Trans>Support</Trans>
          </Text>
        )}
      </ButtonPrimary>

      <SubMenu initial="exit" animate={isHover ? 'enter' : 'exit'} variants={subMenuAnimate}>
        <SubMenuContent flexDirection="column" sx={{ gap: '1rem' }}>
          <ExternalLink
            href="https://discord.com/channels/608934314960224276/1192426056183972010"
            style={{ textDecoration: 'none' }}
          >
            <Flex alignItems="center" sx={{ gap: '6px' }}>
              <DiscordIcon />
              <Text fontSize="14px" fontWeight="500" color={theme.text}>
                Discord
              </Text>
            </Flex>
          </ExternalLink>
          <ExternalLink href="https://t.me/kybernetwork" style={{ textDecoration: 'none' }}>
            <Flex alignItems="center" sx={{ gap: '6px' }}>
              <TeleIcon />
              <Text fontSize="14px" fontWeight="500" color={theme.text}>
                Telegram
              </Text>
            </Flex>
          </ExternalLink>
          <a href="mailto:support@kyberswap.com">
            <Flex alignItems="center" sx={{ gap: '6px' }}>
              <EmailIcon />
              <Text fontSize="14px" fontWeight="500" color={theme.text}>
                Email Us
              </Text>
            </Flex>
          </a>
        </SubMenuContent>
        <SubMenuBackground />
      </SubMenu>
    </Wrapper>
  )
}

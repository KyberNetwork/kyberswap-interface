import { Trans } from '@lingui/macro'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { HelpCircle } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as DiscordIcon } from 'assets/svg/discord_color.svg'
import { ReactComponent as EmailIcon } from 'assets/svg/email_color.svg'
import { ReactComponent as TeleIcon } from 'assets/svg/tele_color.svg'
import { KYBER_NETWORK_TELEGRAM_URL } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

export default function SupportButton() {
  const [isHover, setIsHover] = useState(false)
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

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

  if (window.location.href.includes('/partner-swap')) return null

  return (
    <motion.div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className="fixed bottom-4 right-4 z-[1] max-lg:bottom-[75px]"
    >
      <Flex
        backgroundColor={theme.primary}
        alignItems="center"
        justifyContent="center"
        sx={{
          height: '36px',
          width: upToSmall ? '36px' : 'max-content',
          padding: upToSmall ? 0 : '0 12px',
          borderRadius: '999px',
          color: theme.textReverse,
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        <HelpCircle size={18} />
        {!upToSmall && (
          <Text marginLeft="0.5rem">
            <Trans>Support</Trans>
          </Text>
        )}
      </Flex>

      <motion.div
        initial="exit"
        animate={isHover ? 'enter' : 'exit'}
        variants={subMenuAnimate}
        className="absolute right-0 top-0 !-translate-y-full pb-2.5 max-sm:-right-2.5"
      >
        <Flex
          flexDirection="column"
          sx={{ gap: '1rem' }}
          // ::after is a small triangle pointing down toward the button from inside the popover.
          // `after:-ml-2.5` matches the original `margin-left: -10px` so the triangle stays
          // centered on the calculated `right: 20px` anchor.
          className="relative -mb-2.5 rounded-xl bg-tableHeader px-6 py-3 after:pointer-events-none after:absolute after:bottom-full after:right-5 after:top-[calc(100%-10px)] after:-ml-2.5 after:size-0 after:border-[10px] after:border-solid after:border-transparent after:border-t-tableHeader after:content-['']"
        >
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
          <ExternalLink href={KYBER_NETWORK_TELEGRAM_URL} style={{ textDecoration: 'none' }}>
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
        </Flex>
        <div className="absolute inset-x-0 -top-2.5 bottom-0 z-[-1] rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]" />
      </motion.div>
    </motion.div>
  )
}

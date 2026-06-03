import { Trans } from '@lingui/macro'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { HelpCircle } from 'react-feather'
import { useMedia } from 'react-use'

import { ReactComponent as DiscordIcon } from 'assets/svg/discord_color.svg'
import { ReactComponent as EmailIcon } from 'assets/svg/email_color.svg'
import { ReactComponent as TeleIcon } from 'assets/svg/tele_color.svg'
import { KYBER_NETWORK_TELEGRAM_URL } from 'constants/index'
import usePageLocation from 'hooks/usePageLocation'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

export default function SupportButton() {
  const [isHover, setIsHover] = useState(false)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { isPartnerSwap } = usePageLocation()

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

  if (isPartnerSwap) return null

  return (
    <motion.div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className="fixed bottom-4 right-4 z-[1] max-lg:bottom-[75px]"
    >
      <div
        className={cn(
          'flex h-9 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-medium text-textReverse',
          upToSmall ? 'w-9 p-0' : 'w-max px-3 py-0',
        )}
      >
        <HelpCircle size={18} />
        {!upToSmall && (
          <span className="ml-2">
            <Trans>Support</Trans>
          </span>
        )}
      </div>

      <motion.div
        initial="exit"
        animate={isHover ? 'enter' : 'exit'}
        variants={subMenuAnimate}
        className="absolute right-0 top-0 !-translate-y-full pb-2.5 max-sm:-right-2.5"
      >
        <div className="relative -mb-2.5 flex flex-col gap-4 rounded-xl bg-tableHeader px-6 py-3 after:pointer-events-none after:absolute after:bottom-full after:right-5 after:top-[calc(100%-10px)] after:-ml-2.5 after:size-0 after:border-[10px] after:border-solid after:border-transparent after:border-t-tableHeader after:content-['']">
          <ExternalLink
            href="https://discord.com/channels/608934314960224276/1192426056183972010"
            className="no-underline"
          >
            <div className="flex items-center gap-1.5">
              <DiscordIcon />
              <span className="text-sm font-medium text-text">Discord</span>
            </div>
          </ExternalLink>
          <ExternalLink href={KYBER_NETWORK_TELEGRAM_URL} className="no-underline">
            <div className="flex items-center gap-1.5">
              <TeleIcon />
              <span className="text-sm font-medium text-text">Telegram</span>
            </div>
          </ExternalLink>
          <a href="mailto:support@kyberswap.com">
            <div className="flex items-center gap-1.5">
              <EmailIcon />
              <span className="text-sm font-medium text-text">Email Us</span>
            </div>
          </a>
        </div>
        <div className="absolute inset-x-0 -top-2.5 bottom-0 z-[-1] rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]" />
      </motion.div>
    </motion.div>
  )
}

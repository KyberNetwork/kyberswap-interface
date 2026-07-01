import { Trans } from '@lingui/macro'
import { motion } from 'framer-motion'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { HelpCircle } from 'react-feather'
import { useMedia } from 'react-use'

import { ReactComponent as DiscordIcon } from 'assets/svg/discord_color.svg'
import { ReactComponent as EmailIcon } from 'assets/svg/email_color.svg'
import { ReactComponent as TeleIcon } from 'assets/svg/tele_color.svg'
import { KYBER_NETWORK_DISCORD_URL, KYBER_NETWORK_TELEGRAM_URL } from 'constants/index'
import usePageLocation from 'hooks/usePageLocation'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

type SupportItemProps = {
  children: ReactNode
  href: string
  external?: boolean
}

const SupportItem = ({ children, href, external = true }: SupportItemProps) => {
  if (!external) {
    return (
      <a
        href={href}
        className="no-underline transition hover:no-underline hover:brightness-75 [@media(hover:hover)]:hover:no-underline"
      >
        <div className="flex items-center gap-1.5">{children}</div>
      </a>
    )
  }

  return (
    <ExternalLink
      href={href}
      className="no-underline transition hover:no-underline hover:brightness-75 [@media(hover:hover)]:hover:no-underline"
    >
      <div className="flex items-center gap-1.5">{children}</div>
    </ExternalLink>
  )
}

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const supportButtonRef = useRef<HTMLDivElement>(null)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { isEmbeddedSwap } = usePageLocation()

  useEffect(() => {
    if (!isOpen) return

    const closeOnClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!supportButtonRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnClickOutside)
    document.addEventListener('touchstart', closeOnClickOutside)

    return () => {
      document.removeEventListener('mousedown', closeOnClickOutside)
      document.removeEventListener('touchstart', closeOnClickOutside)
    }
  }, [isOpen])

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

  if (isEmbeddedSwap) return null

  return (
    <motion.div ref={supportButtonRef} className="fixed bottom-4 right-4 z-[1] max-lg:bottom-[75px]">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Support"
        onClick={() => setIsOpen(open => !open)}
        className={cn(
          'flex h-9 cursor-pointer items-center justify-center rounded-full border-0 bg-primary text-sm font-medium text-textReverse',
          upToSmall ? 'w-9 p-0' : 'w-max px-3 py-0',
        )}
      >
        <HelpCircle size={18} />
        {!upToSmall && (
          <span className="ml-2">
            <Trans>Support</Trans>
          </span>
        )}
      </button>

      <motion.div
        initial="exit"
        animate={isOpen ? 'enter' : 'exit'}
        variants={subMenuAnimate}
        className="absolute bottom-[calc(100%+2px)] right-0 pb-2 max-sm:-right-2.5"
      >
        <div className="relative flex flex-col gap-4 rounded-xl bg-tableHeader px-5 py-3 after:pointer-events-none after:absolute after:right-8 after:top-full after:size-0 after:border-x-8 after:border-b-0 after:border-t-8 after:border-solid after:border-x-transparent after:border-t-tableHeader after:content-[''] max-sm:after:right-5">
          <SupportItem href={KYBER_NETWORK_DISCORD_URL}>
            <DiscordIcon />
            <span className="text-sm font-medium text-text">Discord</span>
          </SupportItem>
          <SupportItem href={KYBER_NETWORK_TELEGRAM_URL}>
            <TeleIcon />
            <span className="text-sm font-medium text-text">Telegram</span>
          </SupportItem>
          <SupportItem href="mailto:support@kyberswap.com" external={false}>
            <EmailIcon />
            <span className="text-sm font-medium text-text">Email Us</span>
          </SupportItem>
        </div>
        <div className="absolute inset-x-0 -top-2.5 bottom-2 z-[-1] rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]" />
      </motion.div>
    </motion.div>
  )
}

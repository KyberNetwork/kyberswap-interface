import { type ReactNode } from 'react'
import { X } from 'react-feather'

import AboutBackground from 'assets/images/about_background.png'
import { Center, HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

export const KyberDAOPage = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Center
    className="w-full animate-[fadeInUp_0.5s_ease-out_both] bg-transparent bg-[length:100%_auto] bg-top bg-repeat-y motion-reduce:animate-none"
    style={{ backgroundImage: `url(${AboutBackground})` }}
  >
    <Stack
      className={cn('min-h-[calc(100vh-80px-68px)] w-full max-w-[1228px] gap-8 px-4 py-10 sm:px-6 lg:py-16', className)}
    >
      {children}
    </Stack>
  </Center>
)

export const KyberDAOPageHeader = ({ children, title }: { children?: ReactNode; title: ReactNode }) => (
  <HStack className="items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
    <h1 className="text-2xl font-medium sm:text-3xl">{title}</h1>
    {children}
  </HStack>
)

type KyberDAOTextProps = {
  children: ReactNode
  className?: string
  id?: string
}

export const KyberDAOSectionTitle = ({ children, className, id }: KyberDAOTextProps) => (
  <h2 id={id} className={cn('text-xl font-medium text-text sm:text-2xl', className)}>
    {children}
  </h2>
)

export const KyberDAOCardTitle = ({ children, className, id }: KyberDAOTextProps) => (
  <h3 id={id} className={cn('text-lg font-medium text-text', className)}>
    {children}
  </h3>
)

export const KyberDAOValue = ({ children, className }: KyberDAOTextProps) => (
  <span className={cn('text-xl font-medium text-text', className)}>{children}</span>
)

export const KyberDAOBodyText = ({ children, className }: KyberDAOTextProps) => (
  <p className={cn('text-base text-text', className)}>{children}</p>
)

export const KyberDAOSupportingText = ({ children, className }: KyberDAOTextProps) => (
  <p className={cn('text-sm text-subText', className)}>{children}</p>
)

export const KyberDAOCaption = ({ children, className }: KyberDAOTextProps) => (
  <span className={cn('text-xs text-subText', className)}>{children}</span>
)

export const KyberDAOCardDivider = () => <div className="h-px w-full shrink-0 bg-darkBorder" />

export const KyberDAOModalCloseButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    aria-label="Close"
    onClick={onClick}
    className="flex cursor-pointer border-none bg-transparent text-subText hover:brightness-125"
  >
    <X size={20} />
  </button>
)

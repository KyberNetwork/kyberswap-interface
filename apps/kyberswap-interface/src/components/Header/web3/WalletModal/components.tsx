import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import React, { useRef } from 'react'
import { ChevronLeft } from 'react-feather'
import { Connector, useConnect, useSwitchChain } from 'wagmi'

import { NotificationType } from 'components/Announcement/type'
import { RowBetween } from 'components/Row'
import { CONNECTION, CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { TERM_FILES_PATH } from 'constants/index'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useCloseModal, useNotify } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { CloseIcon, ExternalLink } from 'theme'
import { cn } from 'utils/cn'

export const Shell = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col flex-nowrap p-0', className)} {...rest}>
    {children}
  </div>
)

export const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('relative flex flex-col gap-6 p-5', className)}>{children}</div>
)

export const Content = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-b-[20px]', className)}>{children}</div>
)

export const Header = ({
  title,
  onBack,
  onClose,
}: {
  title: React.ReactNode
  onBack?: () => void
  onClose: () => void
}) => (
  <RowBetween className="gap-2">
    {onBack && (
      <div onClick={onBack} className="flex cursor-pointer items-center gap-1 text-xl font-medium hover:brightness-75">
        <ChevronLeft className="text-primary" />
      </div>
    )}
    <div className="flex flex-1 items-center gap-1 text-xl font-medium">{title}</div>
    <CloseIcon onClick={onClose} />
  </RowBetween>
)

type TermsProps =
  | {
      checked: boolean
      onChange: (checked: boolean) => void
      className?: string
    }
  | {
      children: React.ReactNode
      onClick?: () => void
      className?: string
      style?: React.CSSProperties
    }

export const Terms = (props: TermsProps) => {
  const isControlled = 'checked' in props

  return (
    <div
      onClick={isControlled ? () => props.onChange(!props.checked) : props.onClick}
      style={isControlled ? undefined : props.style}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-2xl bg-buttonBlack/30 px-3 py-2 text-xs font-medium leading-4 accent-primary hover:bg-buttonBlack/50',
        props.className,
      )}
    >
      {isControlled ? (
        <>
          <input
            type="checkbox"
            checked={props.checked}
            onChange={() => {}}
            data-testid="accept-term"
            className="size-3.5 min-w-3.5 cursor-pointer"
          />
          <span className="text-subText">
            <Trans>Accept </Trans>{' '}
            <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
              <Trans>KyberSwap&lsquo;s Terms of Use</Trans>
            </ExternalLink>{' '}
            <Trans>and</Trans>{' '}
            <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
              <Trans>Privacy Policy</Trans>
            </ExternalLink>
            {'. '}
            <span className="text-[10px]">
              <Trans>Last updated: {dayjs(TERM_FILES_PATH.VERSION).format('DD MMM YYYY')}</Trans>
            </span>
          </span>
        </>
      ) : (
        props.children
      )}
    </div>
  )
}

export const Options = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('grid grid-cols-2 items-center gap-4 max-sm:grid-cols-1', className)}>{children}</div>
)

export const Icon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      'flex items-center justify-center bg-transparent max-md:items-end',
      '[&>img]:size-5 [&>img]:rounded [&>span]:size-5 [&>span]:rounded',
      className,
    )}
  >
    {children}
  </div>
)

type OptionButtonProps = React.HTMLAttributes<HTMLDivElement> & {
  connected: boolean
  installLink?: string
  isDisabled?: boolean
  overridden?: boolean
}

export const OptionButton = ({
  connected,
  installLink,
  isDisabled,
  overridden,
  className,
  children,
  ...props
}: OptionButtonProps) => {
  const disabled = isDisabled || installLink || overridden
  return (
    <div
      {...props}
      data-disabled={disabled || undefined}
      data-connected={!isDisabled && connected ? true : undefined}
      className={cn(
        'flex h-9 w-full flex-row items-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-transparent px-2.5 py-2 text-sm font-medium text-subText',
        'cursor-pointer hover:bg-buttonBlack-60 hover:text-text hover:no-underline',
        'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-border data-[disabled=true]:grayscale',
        'data-[connected=true]:!bg-primary data-[connected=true]:!text-darkText',
        className,
      )}
    >
      {children}
    </div>
  )
}

export const WalletOption = React.memo(({ connector }: { connector: Connector }) => {
  const [isAcceptedTerm] = useIsAcceptedTerm()

  const { chainId } = useActiveWeb3React()
  const notify = useNotify()

  const { name } = connector
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector.id] ?? connector.icon

  const closeWalletModal = useCloseModal(ApplicationModal.WALLET)
  const { switchChainAsync } = useSwitchChain()
  // Capture at click-time — watchChainId rewrites Redux right after the WC
  // session resolves, so reading useActiveWeb3React in onSuccess would race.
  const intendedChainIdRef = useRef<number | undefined>(undefined)
  const {
    variables,
    isPending: isSomeOptionPending,
    connect,
  } = useConnect({
    mutation: {
      onSuccess: async data => {
        closeWalletModal()
        if (connector.id !== CONNECTION.WALLET_CONNECT_CONNECTOR_ID) return
        const intended = intendedChainIdRef.current
        if (!intended || !isSupportedChainId(intended) || data.chainId === intended) return
        // switchChain in a separate phase so failures don't roll back the
        // connection (wagmi's internal post-pair switchChain rethrows
        // UserRejectedRequestError, which leaves wagmi state half-set).
        await switchChainAsync({ chainId: intended as any }).catch(() => {
          // Stay on the session chain — NetworkModal handles manual recovery.
        })
      },
      onError: e => {
        console.log(e)
        // Surface a user-friendly notification when the wallet can't be used
        // on the current chain. Two known patterns:
        //   - Porto throws "Could not find a compatible Porto chain on the
        //     given chain configuration" — its supported chain list is
        //     hardcoded in the SDK.
        //   - Compass (and similar Cosmos-EVM extensions) throw "Compass does
        //     not support 'wallet_addEthereumChain' method as of now" — they
        //     can't add a new chain because they only target one chain.
        // Walk the error chain so we catch the reason even when wagmi wraps
        // it inside a UserRejectedRequestError.
        const extractErrorText = (err: unknown): string => {
          if (!err) return ''
          if (typeof err === 'string') return err
          const e = err as { message?: string; details?: string; cause?: unknown }
          return [e.message, e.details, extractErrorText(e.cause)].filter(Boolean).join(' ')
        }
        const text = extractErrorText(e)
        const isChainIncompatible =
          /compatible .* chain on the given chain configuration/i.test(text) ||
          /does not support .*wallet_(add|switch)ethereumchain/i.test(text)
        if (isChainIncompatible) {
          const walletName = connector.name
          const chainName = isSupportedChainId(chainId) ? NETWORKS_INFO[chainId]?.name : ''
          notify({
            type: NotificationType.ERROR,
            title: t`Wallet not supported on this chain`,
            summary: chainName
              ? t`${walletName} does not support ${chainName} yet. Please switch chain or try a different wallet.`
              : t`${walletName} does not support the selected chain. Please switch chain or try a different wallet.`,
          })
        }
      },
    },
  })

  const isCurrentOptionPending = isSomeOptionPending && variables.connector === connector

  return (
    <OptionButton
      role="button"
      id={`connect-${name}`}
      onClick={() => {
        if (!isAcceptedTerm) return
        intendedChainIdRef.current = chainId
        // Skip the chainId hint for WalletConnect — wagmi's post-pair
        // switchChain rethrows UserRejectedRequestError, which rolls back the
        // whole connect mutation and leaves the WC session orphaned in its
        // own storage. Realigned in onSuccess instead.
        if (connector.id === CONNECTION.WALLET_CONNECT_CONNECTOR_ID) {
          connect({ connector })
        } else {
          connect({ connector, chainId: chainId as any })
        }
      }}
      connected={isCurrentOptionPending}
      isDisabled={!isAcceptedTerm}
    >
      <Icon>
        <img src={icon} alt={'Icon'} />
      </Icon>
      <span>{name}</span>
    </OptionButton>
  )
})

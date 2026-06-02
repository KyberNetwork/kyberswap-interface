import { t } from '@lingui/macro'
import React, { useRef } from 'react'
import { Connector, useConnect, useSwitchChain } from 'wagmi'

import { NotificationType } from 'components/Announcement/type'
import { CONNECTION, CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useCloseModal, useNotify } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { cn } from 'utils/cn'

export const IconWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
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

export const HeaderText = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex flex-row flex-nowrap font-medium text-subText', className)}>{children}</div>
)

type OptionCardClickableProps = React.HTMLAttributes<HTMLDivElement> & {
  connected: boolean
  installLink?: string
  isDisabled?: boolean
  overridden?: boolean
}

export const OptionCardClickable = ({
  connected,
  installLink,
  isDisabled,
  overridden,
  className,
  children,
  ...props
}: OptionCardClickableProps) => {
  const disabled = isDisabled || installLink || overridden
  return (
    <div
      {...props}
      data-disabled={disabled || undefined}
      data-connected={!isDisabled && connected ? true : undefined}
      className={cn(
        'group flex h-9 w-full flex-row items-center gap-2 overflow-hidden whitespace-nowrap rounded-[18px] bg-tableHeader px-2.5 py-2 text-sm',
        'cursor-pointer hover:no-underline hover:brightness-90',
        'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:grayscale',
        'data-[connected=true]:!bg-primary',
        className,
      )}
    >
      {children}
    </div>
  )
}

export const OptionCardLeft = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex h-full flex-col flex-nowrap justify-center', className)}>{children}</div>
)

const Option = ({ connector }: { connector: Connector }) => {
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
    <OptionCardClickable
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
      <IconWrapper>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <OptionCardLeft>
        <HeaderText className="group-hover:!text-text group-data-[connected=true]:!text-darkText group-data-[disabled=true]:!text-border">
          {name}
        </HeaderText>
      </OptionCardLeft>
    </OptionCardClickable>
  )
}

export default React.memo(Option)

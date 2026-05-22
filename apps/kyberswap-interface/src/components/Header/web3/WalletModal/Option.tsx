import React from 'react'
import { Connector, useConnect } from 'wagmi'

import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { useActiveWeb3React } from 'hooks'
import { useCloseModal } from 'state/application/hooks'
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
      className={cn(
        'flex h-9 w-full flex-row items-center gap-2 overflow-hidden whitespace-nowrap rounded-[18px] bg-tableHeader px-2.5 py-2 text-sm',
        disabled ? 'cursor-not-allowed grayscale [&_.option-header-text]:!text-border' : 'cursor-pointer',
        !disabled && 'hover:no-underline hover:brightness-90 [&:hover_.option-header-text]:!text-text',
        !isDisabled && connected && '!bg-primary [&_.option-header-text]:!text-darkText',
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

  const { name } = connector
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector.id] ?? connector.icon

  const closeWalletModal = useCloseModal(ApplicationModal.WALLET)
  const {
    variables,
    isPending: isSomeOptionPending,
    connect,
  } = useConnect({
    mutation: {
      onSuccess: () => {
        closeWalletModal()
      },
      onError: e => {
        console.log(e)
      },
    },
  })

  const isCurrentOptionPending = isSomeOptionPending && variables.connector === connector

  return (
    <OptionCardClickable
      role="button"
      id={`connect-${name}`}
      onClick={() => {
        if (isAcceptedTerm) {
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
        <HeaderText className="option-header-text">{name}</HeaderText>
      </OptionCardLeft>
    </OptionCardClickable>
  )
}

export default React.memo(Option)

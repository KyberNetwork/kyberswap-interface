import { HTMLAttributes } from 'react'

import { cn } from 'utils/cn'

export { PartnerVaultsList } from 'pages/Earns/Landing/styles'

export const VaultCard = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-2 rounded-xl bg-[rgba(54,39,86,0.2)] p-4 transition-colors duration-200',
      'hover:bg-[rgba(91,58,164,0.32)]',
      'max-sm:p-3',
      className,
    )}
    {...rest}
  />
)

export const VaultProtocolTag = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center gap-1 whitespace-nowrap rounded-lg bg-white-08 px-2 py-0.5', className)}
    {...rest}
  />
)

type VaultDepositButtonProps = HTMLAttributes<HTMLDivElement> & { $disabled?: boolean }
export const VaultDepositButton = ({ $disabled, className, ...rest }: VaultDepositButtonProps) => (
  <div
    className={cn(
      'flex items-center justify-center rounded-xl border border-solid border-primary px-3 py-1',
      'text-xs font-medium leading-4 text-primary transition-[opacity,background] duration-150',
      $disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer opacity-100 hover:bg-primary-10 hover:opacity-85',
      className,
    )}
    {...rest}
  />
)

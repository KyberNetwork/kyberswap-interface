import { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { ChevronDown, X } from 'react-feather'

import { TextHelper } from 'components/Text'
import { cn } from 'utils/cn'

export const Field = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-4 rounded-xl bg-black-20 px-4 py-3', className)} {...rest} />
)

export const FieldRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full items-center justify-between gap-2', className)} {...rest} />
)

export const PillRange = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center', className)} {...rest} />
)

type PillProps = ButtonHTMLAttributes<HTMLButtonElement> & { $active?: boolean }

export const Pill = ({ $active, className, ...rest }: PillProps) => (
  <button
    type="button"
    className={cn(
      'flex h-5 w-[42px] items-center justify-center rounded-xl text-xs leading-4 text-gray',
      'transition-colors duration-200 hover:text-subText',
      $active && 'bg-white-04 text-subText',
      'motion-reduce:transition-none',
      className,
    )}
    {...rest}
  />
)

/** The wallet balance, which doubles as the control that spends all of it. */
export const BalanceButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'flex items-center justify-end gap-1 p-0 text-sm leading-5 text-subText',
      'transition-colors duration-200 hover:text-text',
      'disabled:cursor-default disabled:hover:text-subText',
      'motion-reduce:transition-none',
      className,
    )}
    {...rest}
  />
)

export const AmountInput = ({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    inputMode="decimal"
    autoComplete="off"
    autoCorrect="off"
    spellCheck="false"
    placeholder="0.0"
    className={cn(
      'min-w-0 flex-1 border-none bg-transparent p-0 text-2xl font-medium leading-7 text-white outline-none',
      'placeholder:text-gray disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...rest}
  />
)

export const TokenButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white-04 px-4 py-2',
      'text-lg leading-6 text-white/70 transition-colors duration-200 hover:bg-white-08',
      'disabled:cursor-default disabled:hover:bg-white-04',
      'motion-reduce:transition-none',
      className,
    )}
    {...rest}
  />
)

export const InfoList = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-2', className)} {...rest} />
)

export const InfoRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full items-start justify-between gap-3', className)} {...rest} />
)

/** A label with an explanation gets the dashed underline and a tooltip, the way the zap flows mark
 *  theirs; one without stays plain so it does not look interactive. */
export const InfoLabel = ({
  tooltip,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tooltip?: ReactNode }) =>
  tooltip ? (
    <TextHelper tooltip={tooltip} placement="top" fontSize={14} className={cn('text-subText', className)}>
      {children}
    </TextHelper>
  ) : (
    <span className={cn('text-sm leading-5 text-subText', className)} {...rest}>
      {children}
    </span>
  )

export const InfoValue = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('flex items-center gap-1 text-right text-sm leading-5 text-white', className)} {...rest} />
)

export const PrimaryButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[20px] bg-primary px-[18px] py-2.5',
      'text-sm font-medium leading-5 text-textReverse transition-[filter,opacity] duration-200 hover:brightness-110',
      'disabled:cursor-not-allowed disabled:bg-buttonGray disabled:text-subText disabled:hover:brightness-100',
      'motion-reduce:transition-none',
      className,
    )}
    {...rest}
  />
)

export const OutlinedButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[20px] border border-white/70 px-[18px] py-2.5',
      'text-sm font-medium leading-5 text-white/70 transition-colors duration-200 hover:bg-white-04',
      'motion-reduce:transition-none',
      className,
    )}
    {...rest}
  />
)

export const ButtonGroup = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full items-start gap-5', className)} {...rest} />
)

export const ModalWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-4 rounded-xl bg-tableHeader p-4', className)} {...rest} />
)

export const ModalHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-1', className)} {...rest} />
)

export const ModalTitleRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full items-start justify-between gap-2', className)} {...rest} />
)

export const ModalTitle = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('m-0 text-xl font-medium leading-6 text-white', className)} {...rest} />
)

export const ModalSubtitle = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('m-0 text-xs leading-4 text-gray', className)} {...rest} />
)

export const SummaryLabel = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-sm leading-5 text-subText', className)} {...rest} />
)

export const SummaryRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full items-center gap-2 rounded-xl bg-black-20 px-4 py-2', className)} {...rest} />
)

export const SummaryAmount = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-base leading-6 text-white2', className)} {...rest} />
)

export const SummaryUsd = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-sm leading-5 text-subText', className)} {...rest} />
)

export const DetailsBox = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-2 rounded-xl border border-white-08 p-3', className)} {...rest} />
)

/** Carries the tone in the background alone, the way the zap flows' own notes do. */
export const ErrorNote = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('w-full rounded-xl bg-red-20 px-3 py-2 text-sm text-white', className)} {...rest} />
)

/** The same note in the tone the zap flows give a setting that is unusual but still workable. */
export const WarningNote = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('w-full rounded-xl bg-warning-20 px-3 py-2 text-sm text-white', className)} {...rest} />
)

export const SegmentedTabs = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex w-full items-center gap-0 rounded-xl border border-white-08 bg-white-04 p-0.5', className)}
    {...rest}
  />
)

type SegmentedTabProps = ButtonHTMLAttributes<HTMLButtonElement> & { $active?: boolean }

export const SegmentedTab = ({ $active, className, ...rest }: SegmentedTabProps) => (
  <button
    type="button"
    className={cn(
      'flex h-8 min-w-0 flex-1 items-center justify-center rounded-[10px] px-3 py-1',
      'text-sm leading-5 transition-colors duration-200',
      $active ? 'bg-white-08 text-white2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.32)]' : 'text-subText hover:text-white2',
      'motion-reduce:transition-none',
      className,
    )}
    {...rest}
  />
)

/** Stacks one `Field` per token the deposit spends. */
export const TokenRowList = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-2', className)} {...rest} />
)

/** Drops a token from the list; only offered while more than one is listed. The field squares off
 *  its top-right corner to make room, the way the zap-in fields do. */
export const RemoveTokenButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'absolute right-0 top-0 flex size-4 items-center justify-center p-0 leading-none',
      'text-subText transition-colors duration-200 hover:text-text',
      'motion-reduce:transition-none',
      className,
    )}
    {...rest}
  >
    <X size={14} />
  </button>
)

export const AddTokenButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'self-start text-sm text-primary transition-opacity duration-200 hover:opacity-80',
      'disabled:cursor-default disabled:text-subText disabled:hover:opacity-100',
      'motion-reduce:transition-none',
      className,
    )}
    {...rest}
  />
)

/** The share amount the route is quoting, in the same card shape as the amount fields. */
export const ReceiveField = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-1 rounded-xl bg-white-04 px-4 py-3', className)} {...rest} />
)

export const ReceiveAmount = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-2xl font-medium leading-8 text-white', className)} {...rest} />
)

/** Stacks the fields either side of a `FieldSeam`, which needs the gap between them to itself. */
export const FieldStack = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col items-stretch', className)} {...rest} />
)

/** Marks the seam between what goes in and what comes back out. Decorative — nothing to press. */
export const FieldSeam = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div aria-hidden className={cn('relative z-10 -my-2 flex justify-center', className)} {...rest}>
    <span className="flex size-6 items-center justify-center rounded-full border border-white-08 bg-tableHeader text-subText">
      <ChevronDown size={14} />
    </span>
  </div>
)

/** A term that qualifies the field above it rather than standing on its own line of detail. */
export const FieldCaption = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full items-center gap-2 px-1 text-xs leading-4 text-subText', className)} {...rest} />
)

/** The note explaining what the selected withdrawal route does. */
export const FieldNote = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('m-0 text-xs italic leading-4 text-subText', className)} {...rest} />
)

/** Names the token an amount is denominated in, without offering a choice of token. */
export const TokenTag = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white-04 px-4 py-2 text-lg leading-6 text-white/70',
      className,
    )}
    {...rest}
  />
)

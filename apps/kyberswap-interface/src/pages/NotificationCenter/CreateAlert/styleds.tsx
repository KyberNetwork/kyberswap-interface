import { ButtonPrimary } from 'components/Button'
import NumericalInput from 'components/NumericalInput'
import Select from 'components/Select'
import { cn } from 'utils/cn'

const SHARE_INPUT_CLASS = 'h-9 rounded-[44px] border border-solid border-border px-3 py-2 text-sm text-text flex-grow-0'

const SHARE_BTN_CLASS = 'h-9 w-[140px] max-md:w-[164px]'

export const Label = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-xs text-text', className)} {...rest}>
    {children}
  </div>
)

export const MiniLabel = ({ children, className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-sm text-subText', className)} {...rest}>
    {children}
  </span>
)

export const Form = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex rounded-3xl bg-buttonBlack px-4 py-5 max-md:flex-col max-md:rounded-none', className)}
    {...rest}
  >
    {children}
  </div>
)

export const LeftColumn = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex w-3/5 flex-col gap-3 border-r border-solid border-border pr-4',
      'max-md:w-full max-md:border-0 max-md:border-b max-md:border-solid max-md:border-border max-md:pb-4 max-md:pr-0',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const RightColumn = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-1 flex-col gap-3 pl-4 max-md:w-full max-md:pl-0 max-md:pt-4', className)} {...rest}>
    {children}
  </div>
)

export const StyledInputNumber = ({ className, ...rest }: React.ComponentProps<typeof NumericalInput>) => (
  <NumericalInput className={cn(SHARE_INPUT_CLASS, 'w-[100px]', className)} {...rest} />
)

export const StyledInput = ({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(SHARE_INPUT_CLASS, 'h-9 max-h-[50px] w-[200px] resize-none bg-transparent outline-none', className)}
    {...rest}
  />
)

export const StyledSelect = ({ className, ...rest }: React.ComponentProps<typeof Select>) => (
  <Select className={cn(SHARE_INPUT_CLASS, 'min-w-[132px]', className)} {...rest} />
)

export const FormControl = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-wrap items-center gap-3', className)} {...rest}>
    {children}
  </div>
)

export const ActionGroup = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex justify-end gap-3 max-md:justify-center', className)} {...rest}>
    {children}
  </div>
)

export const ButtonSubmit = ({ children, className, ...rest }: React.ComponentProps<typeof ButtonPrimary>) => (
  <ButtonPrimary className={cn('flex gap-1', SHARE_BTN_CLASS, className)} {...rest}>
    {children}
  </ButtonPrimary>
)

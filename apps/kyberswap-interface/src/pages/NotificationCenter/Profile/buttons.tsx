import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { cn } from 'utils/cn'

const SHARE_BUTTON_CLASS = 'h-9 w-[120px] text-sm max-sm:w-[164px] max-sm:max-w-[45%]'

export const ButtonLogout = ({
  children,
  className,
  onClick,
  ...rest
}: React.ComponentProps<typeof ButtonOutlined>) => (
  <ButtonOutlined className={cn('whitespace-nowrap', SHARE_BUTTON_CLASS, className)} onClick={onClick} {...rest}>
    {children}
  </ButtonOutlined>
)

export const ButtonSave = ({ children, className, onClick, ...rest }: React.ComponentProps<typeof ButtonPrimary>) => (
  <ButtonPrimary className={cn(SHARE_BUTTON_CLASS, className)} onClick={onClick} {...rest}>
    {children}
  </ButtonPrimary>
)

export const ButtonExport = ({
  children,
  className,
  onClick,
  ...rest
}: React.ComponentProps<typeof ButtonOutlined>) => (
  <ButtonOutlined className={cn(SHARE_BUTTON_CLASS, className)} onClick={onClick} {...rest}>
    {children}
  </ButtonOutlined>
)

import kyberBanner from 'assets/banners/kyber-banner.png'
import { ButtonPrimary } from 'components/Button'
import Input from 'components/Input'
import { ButtonText } from 'theme'
import { cn } from 'utils/cn'

export const ModalContent = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'relative z-[1] flex min-h-full w-full flex-col items-start justify-center gap-6 overflow-hidden bg-cover bg-no-repeat p-6 max-[640px]:p-4 max-[480px]:p-3.5',
      className,
    )}
    style={{ backgroundImage: `url(${kyberBanner})` }}
    {...rest}
  >
    {children}
  </div>
)

export const BackgroundOverlay = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('pointer-events-none absolute inset-0 z-[1] bg-black/60', className)} {...rest} />
)

export const TitleWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('z-[2] flex w-full flex-col gap-2', className)} {...rest}>
    {children}
  </div>
)

export const Title = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-left text-lg font-medium leading-6 text-primary', className)} {...rest}>
    {children}
  </div>
)

export const Description = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('self-stretch text-left text-sm font-normal italic text-white/[0.48]', className)} {...rest}>
    {children}
  </div>
)

export const InputWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('z-[2] flex w-full flex-col gap-1', className)} {...rest}>
    {children}
  </div>
)

export const InputLabel = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('w-full self-stretch text-base font-normal leading-6 text-text', className)} {...rest}>
    {children}
  </div>
)

export const StyledInput = ({ className, ...rest }: React.ComponentProps<typeof Input>) => (
  <Input
    className={cn(
      'w-full self-stretch rounded-2xl border-0 bg-black/[0.64] px-4 py-3 text-base leading-6 text-text [font-feature-settings:"liga"_off,"clig"_off] placeholder:text-base placeholder:text-border',
      className,
    )}
    {...rest}
  />
)

export const ViewButton = ({ children, className, ...rest }: React.ComponentProps<typeof ButtonPrimary>) => (
  <ButtonPrimary
    className={cn(
      'z-[2] mx-auto -mt-1 flex w-fit items-center justify-center gap-1 px-[18px] py-2.5 text-sm font-medium leading-5 transition-all duration-200 ease-out',
      className,
    )}
    style={{ color: '#0f0f0f' }}
    {...rest}
  >
    {children}
  </ButtonPrimary>
)

export const CloseButton = ({ children, className, ...rest }: React.ComponentProps<typeof ButtonText>) => (
  <ButtonText
    className={cn(
      'absolute right-6 top-6 z-[3] p-0 leading-none text-subText max-[640px]:right-4 max-[640px]:top-4 max-[480px]:right-3 max-[480px]:top-3',
      className,
    )}
    {...rest}
  >
    {children}
  </ButtonText>
)

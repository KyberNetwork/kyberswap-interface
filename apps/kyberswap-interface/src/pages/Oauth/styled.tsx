import { ReactNode } from 'react'

import Loader from 'components/Loader'
import { cn } from 'utils/cn'

import backgroundImage from './background-gradient.png'

export const Container = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex w-full flex-1 flex-col items-center justify-center bg-[length:100%] bg-repeat-y py-5',
      className,
    )}
    style={{ backgroundImage: `url(${backgroundImage})` }}
    {...rest}
  >
    {children}
  </div>
)

export const Content = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col items-center gap-[30px] max-sm:gap-4', className)} {...rest}>
    {children}
  </div>
)

export const TextDesc = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('text-center text-xl leading-6 text-subText max-sm:text-base max-sm:leading-5', className)}
    {...rest}
  >
    {children}
  </div>
)

export const KyberLogo = () => {
  return <img src={'/logo-dark.svg'} alt="loading-icon" className="w-[230px] max-w-[90vw]" />
}

export function PageContainer({ msg }: { msg: ReactNode }) {
  return (
    <Container>
      <Content>
        <KyberLogo />
        <TextDesc className="flex items-center gap-2.5">
          <Loader size="20px" /> {msg}
        </TextDesc>
      </Content>
    </Container>
  )
}

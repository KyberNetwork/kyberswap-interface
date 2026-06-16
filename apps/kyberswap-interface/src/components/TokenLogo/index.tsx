import { CSSProperties } from 'react'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import { cn } from 'utils/cn'
import { getProxyTokenLogo } from 'utils/tokenInfo'

const TokenLogo = ({
  src,
  alt,
  className,
  size = 24,
  boxShadowColor,
  translateLeft,
  translateTop,
  style,
}: {
  src?: string
  alt?: string
  className?: string
  size?: number
  boxShadowColor?: string
  translateLeft?: boolean
  translateTop?: boolean
  style?: CSSProperties
}) => (
  <img
    width={size}
    height={size}
    src={src || UnknownToken}
    alt={alt || ''}
    onError={({ currentTarget }) => {
      const hasTriedProxy = currentTarget.getAttribute('data-tried-proxy') === 'true'
      if (!hasTriedProxy) {
        currentTarget.setAttribute('data-tried-proxy', 'true')
        currentTarget.src = getProxyTokenLogo(currentTarget.src)
      } else {
        currentTarget.onerror = null // prevents looping
        currentTarget.src = UnknownToken
      }
    }}
    className={cn('rounded-full', translateLeft && '-ml-2', translateTop && 'relative top-0.5', className)}
    style={{
      filter: boxShadowColor ? `drop-shadow(0px 4px 8px ${boxShadowColor})` : undefined,
      ...style,
    }}
  />
)

export default TokenLogo

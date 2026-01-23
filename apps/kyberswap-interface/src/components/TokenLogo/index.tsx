import styled from 'styled-components'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import { getProxyTokenLogo } from 'utils/tokenInfo'

const Image = styled.img<{ boxShadowColor?: string; translateLeft?: boolean; translateTop?: boolean }>`
  border-radius: 50%;
  filter: drop-shadow(0px 4px 8px ${({ boxShadowColor }) => (boxShadowColor ? boxShadowColor : 'none')});

  ${({ translateLeft }) =>
    translateLeft &&
    `{
      margin-left: -8px;
    }`}

  ${({ translateTop }) =>
    translateTop &&
    `{
      top: 2px;
      position: relative;
    }`}
`

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
  style?: React.CSSProperties
}) => (
  <Image
    style={style}
    className={className}
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
    boxShadowColor={boxShadowColor}
    translateLeft={translateLeft}
    translateTop={translateTop}
  />
)

export default TokenLogo

import styled from 'styled-components'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'

const Image = styled.img<{ boxShadowColor?: string; translateLeft?: boolean }>`
  border-radius: 50%;
  filter: drop-shadow(0px 4px 8px ${({ boxShadowColor }) => (boxShadowColor ? boxShadowColor : 'none')});

  ${({ translateLeft }) =>
    translateLeft &&
    `{
      margin-left: -8px;
    }`}
`

const TokenLogo = ({
  src,
  alt,
  className,
  size = 24,
  boxShadowColor,
  translateLeft,
  style,
}: {
  src?: string
  alt?: string
  className?: string
  size?: number
  boxShadowColor?: string
  translateLeft?: boolean
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
      currentTarget.onerror = null // prevents looping
      currentTarget.src = UnknownToken
    }}
    boxShadowColor={boxShadowColor}
    translateLeft={translateLeft}
  />
)

export default TokenLogo

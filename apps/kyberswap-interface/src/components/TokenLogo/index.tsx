import styled from 'styled-components'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'

const Image = styled.img<{ primaryBoxShadow?: boolean }>`
  border-radius: 50%;
  filter: drop-shadow(0px 4px 8px ${props => (props.primaryBoxShadow ? '#0b2e24' : 'none')});

  & ~ & {
    margin-left: -8px;
  }
`

const TokenLogo = ({
  src,
  alt,
  className,
  width = 24,
  height = 24,
  primaryBoxShadow = false,
  style,
}: {
  src?: string
  alt?: string
  className?: string
  width?: number
  height?: number
  primaryBoxShadow?: boolean
  style?: React.CSSProperties
}) => (
  <Image
    style={style}
    className={className}
    width={width}
    height={height}
    src={src || UnknownToken}
    alt={alt || ''}
    onError={({ currentTarget }) => {
      currentTarget.onerror = null // prevents looping
      currentTarget.src = UnknownToken
    }}
    primaryBoxShadow={primaryBoxShadow}
  />
)

export default TokenLogo

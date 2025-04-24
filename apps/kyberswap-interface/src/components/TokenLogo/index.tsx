import UnknownToken from 'assets/svg/unknown-token.svg'
import styled from 'styled-components'

const Image = styled.img`
  border-radius: 50%;
  filter: drop-shadow(0px 4px 8px #0b2e24);

  &:nth-child(1) {
    margin-right: -8px;
  }
`

const TokenLogo = ({
  src,
  alt,
  className,
  width = 24,
  height = 24,
  style,
}: {
  src?: string
  alt?: string
  className?: string
  width?: number
  height?: number
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
  />
)

export default TokenLogo

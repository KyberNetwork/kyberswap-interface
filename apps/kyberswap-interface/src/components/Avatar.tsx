import { rgba } from 'polished'
import styled, { CSSProperties } from 'styled-components'

import Profile from 'components/Icons/Profile'
import Loader from 'components/Loader'

const StyledAvatar = styled.img<{ $size: number }>`
  height: ${({ $size }) => $size}px;
  width: ${({ $size }) => $size}px;
  object-fit: cover;
  border-radius: 100%;
`
const Wrapper = styled.div<{ $size: number }>`
  position: relative;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
`

const LoadingWrapper = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.6)};
  border-radius: 100%;
`
export default function Avatar({
  url,
  size,
  color,
  onClick,
  style,
  loading,
}: {
  url: string | undefined
  size: number
  color?: string
  onClick?: () => void
  style?: CSSProperties
  loading?: boolean
}) {
  return (
    <Wrapper $size={size}>
      {url ? (
        <StyledAvatar $size={size} src={url} onClick={onClick} style={style} />
      ) : (
        <Profile size={size} color={color} style={{ ...style, minHeight: size, minWidth: size }} onClick={onClick} />
      )}
      {loading && (
        <LoadingWrapper style={{ width: size, height: size }}>
          <Loader />
        </LoadingWrapper>
      )}
    </Wrapper>
  )
}

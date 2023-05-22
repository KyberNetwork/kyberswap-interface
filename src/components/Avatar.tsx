import styled from 'styled-components'

import Profile from 'components/Icons/Profile'

const StyledAvatar = styled.img<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 100%;
`

export default function Avatar({ url, size, color }: { url: string | undefined; size: number; color?: string }) {
  return url ? <StyledAvatar size={size} src={url} /> : <Profile size={size} color={color} />
}

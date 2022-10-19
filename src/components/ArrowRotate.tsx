import styled from 'styled-components'

import { Swap as SwapIcon } from 'components/Icons'
import useTheme from 'hooks/useTheme'

export const ArrowWrapper = styled.div<{ rotated?: boolean; isVertical?: boolean }>`
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${({ theme }) => theme.buttonBlack};
  width: fit-content;
  height: fit-content;
  cursor: pointer;
  border-radius: 999px;

  transform: rotate(
    ${({ rotated, isVertical }) => {
      if (isVertical) return rotated ? '270deg' : '90deg'
      return rotated ? '180deg' : '0'
    }}
  );
  transition: transform 300ms;
  width: 40px;
  height: 40px;
  :hover {
    opacity: 0.8;
  }
`

export default function ArrowRotate({
  rotate,
  onClick,
  isVertical = false,
}: {
  rotate: boolean
  onClick: () => void
  isVertical?: boolean
}) {
  const theme = useTheme()
  return (
    <ArrowWrapper rotated={rotate} isVertical={isVertical} onClick={onClick}>
      <SwapIcon size={24} color={theme.subText} />
    </ArrowWrapper>
  )
}

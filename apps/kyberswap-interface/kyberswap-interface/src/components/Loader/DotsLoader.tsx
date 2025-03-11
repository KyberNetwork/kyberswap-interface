import styled, { css, keyframes } from 'styled-components'

const dotFlashing = keyframes`
  0% {
    background-color: #31CB9E;
  }
  80%, 100% {
    background-color: rgba(121, 121, 121, 0.301);
  }
`

const DotFlashing = styled.div<{ size: number }>`
  position: relative;
  ${({ size }) => css`
    width: ${size}px;
    height: ${size}px;
    margin-left: ${size * 1.5}px;
  `}
  border-radius: 50%;
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  animation: ${dotFlashing} 0.6s infinite ease alternate;
  animation-delay: 0.2s;
  ::before,
  ::after {
    content: '';
    display: inline-block;
    position: absolute;
    top: 0;
    ${({ size }) => css`
      width: ${size}px;
      height: ${size}px;
    `}
    border-radius: 50%;
    background-color: ${({ theme }) => theme.primary};
    color: ${({ theme }) => theme.primary};
  }
  ::before {
    ${({ size }) => css`
      left: ${-1.4 * size}px;
    `}
    animation: ${dotFlashing} 0.6s infinite ease alternate;
    animation-delay: 0s;
  }
  ::after {
    ${({ size }) => css`
      left: ${1.4 * size}px;
    `}
    animation: ${dotFlashing} 0.6s infinite ease alternate;
    animation-delay: 0.4s;
  }
`

export const DotsLoader = ({ size }: { size?: number }) => {
  return (
    <div style={{ width: `${(size || 6) * 4}px` }}>
      <DotFlashing size={size || 6}></DotFlashing>
    </div>
  )
}

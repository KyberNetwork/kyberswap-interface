import styled, { keyframes } from 'styled-components'

const rotate = keyframes`
  100% {
    transform: rotate(360deg);
  }
`
const dash = keyframes`
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124px;
  }
`
const Loader = styled.div`
  position: relative;
  margin: 0 auto;
  &:before {
    content: '';
    display: block;
    padding-top: 100%;
  }
`
const Circular = styled.svg`
  animation: ${rotate} 2s linear infinite;
  height: 100%;
  transform-origin: center center;
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
`
const Circle = styled.circle`
  stroke-dasharray: 1, 200;
  stroke-dashoffset: 0;
  animation: ${dash} 1.5s ease-in-out infinite;
  stroke-linecap: round;
  stroke: ${({ theme }) => theme.primary};
  stroke-opacity: 1;
  stroke-width: 4px;
`
export default function AnimatedSpinLoader({ size = 20 }: { size: number }) {
  return (
    <Loader style={{ width: size + 'px' }}>
      <Circular viewBox="25 25 50 50">
        <Circle cx="50" cy="50" r="20" fill="none" strokeMiterlimit="10" shapeRendering="geometricPrecision" />
      </Circular>
    </Loader>
  )
}

import styled, { keyframes } from 'styled-components'

const bounce = keyframes`
  15%,
  35%,
  100% {
      transform: translateY(0);
  }
  25% {
      transform: translateY(-10px);
      color: #31CB9E;
  }
`
const Wrapper = styled.div`
  font-size: 16px;
  width: 100%;
  display: inline-flex;
  justify-content: center;
  text-align: center;
  flex-wrap: wrap;
  gap: 1px;
  span {
    display: inline-flex;
    color: ${({ theme }) => theme.text};
    animation: ${bounce} 3s infinite ease;
    min-width: 10px;
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
  }

  span:nth-of-type(1) {
    animation-delay: 0.05s;
  }
  span:nth-of-type(2) {
    animation-delay: 0.1s;
  }
  span:nth-of-type(3) {
    animation-delay: 0.15s;
  }
  span:nth-of-type(4) {
    animation-delay: 0.2s;
  }
  span:nth-of-type(5) {
    animation-delay: 0.25s;
  }
  span:nth-of-type(6) {
    animation-delay: 0.3s;
  }
  span:nth-of-type(7) {
    animation-delay: 0.35s;
  }
  span:nth-of-type(8) {
    animation-delay: 0.4s;
  }
  span:nth-of-type(9) {
    animation-delay: 0.45s;
  }
  span:nth-of-type(10) {
    animation-delay: 0.5s;
  }
  span:nth-of-type(11) {
    animation-delay: 0.55s;
  }
  span:nth-of-type(12) {
    animation-delay: 0.6s;
  }
  span:nth-of-type(13) {
    animation-delay: 0.65s;
  }
  span:nth-of-type(14) {
    animation-delay: 0.7s;
  }
  span:nth-of-type(15) {
    animation-delay: 0.75s;
  }
  span:nth-of-type(16) {
    animation-delay: 0.8s;
  }
  span:nth-of-type(17) {
    animation-delay: 0.85s;
  }
  span:nth-of-type(18) {
    animation-delay: 0.9s;
  }
  span:nth-of-type(19) {
    animation-delay: 0.95s;
  }
  span:nth-of-type(20) {
    animation-delay: 1s;
  }
  span:nth-of-type(21) {
    animation-delay: 1.05s;
  }
  span:nth-of-type(22) {
    animation-delay: 1.15s;
  }
  span:nth-of-type(23) {
    animation-delay: 1.2s;
  }
  span:nth-of-type(24) {
    animation-delay: 1.25s;
  }
  span:nth-of-type(25) {
    animation-delay: 1.3s;
  }
  span:nth-of-type(26) {
    animation-delay: 1.35s;
  }
  span:nth-of-type(27) {
    animation-delay: 1.4s;
  }
  span:nth-of-type(28) {
    animation-delay: 1.45s;
  }
  span:nth-of-type(29) {
    animation-delay: 1.5s;
  }
  span:nth-of-type(30) {
    animation-delay: 1.55s;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `}
`

export default function LoadingTextAnimation() {
  return (
    <Wrapper>
      {'Crafting your screenshot...'.split('').map((w, index) => (
        <span key={index}>{w}</span>
      ))}
    </Wrapper>
  )
}

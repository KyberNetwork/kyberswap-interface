import styled, { css, keyframes } from 'styled-components'

export const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

export const Wrapper = styled.div`
  width: 100%;
  border-radius: 16px;
  background: #1d5b49cc;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 4px;
  flex-shrink: 0;
  border: 1px solid #196750;
  background: rgba(29, 91, 73, 0.8);
  backdrop-filter: blur(2px);
  cursor: pointer;
`

export const PoolWrapper = styled.div<{ animate: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;

  ${({ animate }) =>
    animate &&
    css`
      animation: ${pulse} 0.6s;
    `}

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: unset;
  `}
`

export const PoolAprWrapper = styled.div`
  border-radius: 20px;
  box-shadow: 0 8px 8px 0 rgba(0, 0, 0, 0.3);
  padding-bottom: 1px;
  width: auto;
  overflow: hidden;
  background-image: linear-gradient(to right, #66666600, #66666600, #a2e9d4, #66666600, #66666600);
`

export const AprText = styled.span`
  margin-left: 6px;

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    display: none;
  `}
`

export const PoolApr = styled.div`
  display: flex;
  font-weight: 600;
  background-color: #000;
  color: ${({ theme }) => theme.primary};
  padding: 4px 16px;
  width: max-content;
`

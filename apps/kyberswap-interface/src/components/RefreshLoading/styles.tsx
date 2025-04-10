import styled, { css, keyframes } from 'styled-components'

const spin = keyframes`
    from {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(360deg);
    }
`

export const WrappedSvg = styled.svg<{ spinning: boolean }>`
  ${({ spinning }) =>
    spinning
      ? css`
          animation-name: ${spin};
          animation-duration: 696ms;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        `
      : ''}
`

export const SpinWrapper = styled.div<{ clickable?: boolean }>`
  display: flex;
  align-items: center;
  position: relative;
  width: fit-content;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
`

export const CountDown = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  position: absolute;
  margin-left: auto;
  margin-right: auto;
  left: 0;
  right: 0;
  text-align: center;
  color: ${({ theme }) => theme.primary};
`

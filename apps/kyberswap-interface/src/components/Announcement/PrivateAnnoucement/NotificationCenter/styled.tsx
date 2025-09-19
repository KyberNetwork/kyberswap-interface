import styled from 'styled-components'

export const Wrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  font-size: 12px;
  padding: 20px 0px;
  gap: 12px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  width: 100%;
  cursor: pointer;
  :last-child {
    border: none;
  }
`

export const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 6px;
`

export const Desc = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  word-break: break-word;
  display: block;
  max-width: 100%;
  line-height: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

export const Time = styled.div<{ isLeft?: boolean }>`
  color: ${({ theme }) => theme.subText};
  text-align: ${({ isLeft }) => (isLeft ? 'left' : 'right')};
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 10px;
  `}
`

export const ArrowWrapper = styled.div`
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.subText};
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    transition: all 150ms ease-in-out;
  }
  &[data-expanded='true'] {
    svg {
      transform: rotate(180deg);
    }
  }
`

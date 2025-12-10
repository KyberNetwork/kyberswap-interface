import styled, { css } from 'styled-components'

export const StyledMenuButton = styled.button<{ active?: boolean }>`
  border: none;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.subText};
  border-radius: 999px;
  position: relative;
  outline: none;
  background-color: transparent;
  border: 1px solid transparent;
  :hover {
    cursor: pointer;
  }
  ${({ active }) =>
    active &&
    css`
      color: ${({ theme }) => theme.text};
    `}
`

export const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

export const Badge = styled.div<{ isOverflow: boolean }>`
  border-radius: 16px;
  position: absolute;
  top: -6px;
  right: ${({ isOverflow }) => (isOverflow ? -16 : -10)}px;
  background-color: ${({ theme }) => theme.primary};
  padding: 2px 4px 1px 4px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
  z-index: 1;
`

export const browserCustomStyle = css`
  padding: 0;
  border-radius: 12px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`

export const Wrapper = styled.div`
  width: 380px;
  display: flex;
  flex-direction: column;
  height: 600px;
  max-height: 80vh;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    min-width: 380px;
  `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    min-width: 0px;
    height: unset;
  `};
`

export const Container = styled.div`
  gap: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
`

export const Title = styled.div`
  font-size: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`

export const ContentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
  min-height: 48px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  :hover {
    background-color: ${({ theme }) => theme.buttonBlack};
  }
`

export const BackButton = styled.button`
  display: inline-flex;
  color: ${({ theme }) => theme.subText};
  background: transparent;
  border: none;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`

export const HeaderTitle = styled.div`
  flex: 1;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-transform: uppercase;
`

export const HeaderAction = styled.button`
  display: inline-flex;
  gap: 4px;
  color: ${({ theme }) => theme.primary};
  background: transparent;
  border: none;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

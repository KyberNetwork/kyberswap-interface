import styled, { css } from 'styled-components'

export const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 200px;
  min-width: 200px;
  padding: 24px 12px 12px;
  flex-shrink: 0;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

export const MobileNavContainer = styled.div`
  display: none;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: flex;
    align-items: center;
    overflow-x: auto;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 16px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  `}
`

export const MobileNavItem = styled.div<{ $active?: boolean }>`
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 400;
  white-space: nowrap;
  cursor: pointer;
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  border-bottom: 2px solid ${({ theme, $active }) => ($active ? theme.primary : 'transparent')};
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`

export const MobileNavDivider = styled.div`
  width: 1px;
  height: 19px;
  background: ${({ theme }) => theme.border};
  flex-shrink: 0;
`

export const SidebarItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  color: ${({ theme, $active }) => ($active ? theme.subText : '#737373')};
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.04)' : 'transparent')};
  transition: color 0.15s ease, background 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.subText};
    background: rgba(255, 255, 255, 0.04);
  }
`

export const SidebarGroupLabel = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  color: ${({ theme }) => theme.subText};
`

const activeSubItemStyles = css`
  color: ${({ theme }) => theme.subText};
`

const inactiveSubItemStyles = css`
  color: #737373;
`

export const SidebarSubItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 2px;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  ${({ $active }) => ($active ? activeSubItemStyles : inactiveSubItemStyles)};
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.subText};
  }
`

export const SubItemLine = styled.div`
  width: 0;
  height: 16px;
  border-left: 1px solid ${({ theme }) => theme.border};
`

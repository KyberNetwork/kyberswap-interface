import { motion } from 'framer-motion'
import { rgba } from 'polished'
import styled, { css } from 'styled-components'

export const SIDEBAR_WIDTH_EXPANDED = 220
export const SIDEBAR_WIDTH_COLLAPSED = 64

export const SidebarContainer = styled.div<{ $collapsed?: boolean; $inDrawer?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: ${({ $collapsed }) => ($collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED)}px;
  min-width: ${({ $collapsed }) => ($collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED)}px;
  padding: 24px 12px 12px;
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: width 0.2s ease, min-width 0.2s ease;

  ${({ $inDrawer }) =>
    $inDrawer
      ? css`
          width: 100%;
          min-width: 0;
          overflow: visible;
        `
      : css`
          ${({ theme }) => theme.mediaWidth.upToMedium`
            display: none;
          `}
        `}
`

export const SidebarHeader = styled.div<{ $collapsed?: boolean; $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'space-between')};
  gap: 4px;
  padding: ${({ $collapsed }) => ($collapsed ? '2px' : '4px 4px 4px 16px')};
  min-height: 40px;
  border-radius: 12px;
  background: ${({ theme, $active }) => ($active ? rgba(theme.white, 0.06) : 'transparent')};
  transition: padding 0.2s ease, background 0.15s ease;

  &:hover,
  &:focus-within {
    background: ${({ theme }) => rgba(theme.white, 0.06)};
  }
`

export const SidebarHeaderLabel = styled.button<{ $active?: boolean }>`
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  flex: 1;
  min-width: 0;
  text-align: left;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  transition: color 0.15s ease;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.primary};
    outline: none;
  }
`

export const CollapseToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  transition: color 0.15s ease, background 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => rgba(theme.white, 0.04)};
  }
`

export const SidebarGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const SidebarGroupLabel = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  background: ${({ theme, $active }) => ($active ? rgba(theme.white, 0.06) : 'transparent')};
`

const activeItemStyles = css`
  color: ${({ theme }) => theme.primary};
  font-weight: 500;
`

const inactiveItemStyles = css`
  color: ${({ theme }) => theme.gray};
  font-weight: 400;
`

export const SidebarNavItem = styled.button<{ $active?: boolean; $collapsed?: boolean }>`
  appearance: none;
  border: none;
  font: inherit;
  text-align: left;
  background: transparent;
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: ${({ $collapsed }) => ($collapsed ? '10px 11px' : '10px 16px 10px 24px')};
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  ${({ $active }) => ($active ? activeItemStyles : inactiveItemStyles)};
  transition: color 0.15s ease, background 0.15s ease, padding 0.2s ease;

  > svg {
    flex-shrink: 0;
  }

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.primary};
    background: ${({ theme }) => rgba(theme.white, 0.04)};
    outline: none;
  }

  ${({ $active, $collapsed, theme }) =>
    $active
      ? css`
          &::before {
            content: '';
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            width: 2px;
            height: 18px;
            border-radius: 2px;
            background: ${theme.primary};
            opacity: ${$collapsed ? 0 : 1};
            transition: opacity 0.15s ease;
          }
        `
      : ''}
`

export const GroupDivider = styled.div`
  height: 1px;
  margin: 4px 12px;
  background: ${({ theme }) => rgba(theme.white, 0.06)};
`

export const BreadcrumbsContainer = styled.div`
  display: none;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  min-width: 0;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: flex;
  `}
`

export const BreadcrumbsToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  flex-shrink: 0;
  transition: color 0.15s ease, background 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => rgba(theme.white, 0.08)};
  }
`

export const BreadcrumbsTrail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
`

export const BreadcrumbsItem = styled.span<{ $current?: boolean; $clickable?: boolean }>`
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 14px;
  color: ${({ theme, $current }) => ($current ? theme.text : theme.subText)};
  font-weight: ${({ $current }) => ($current ? 500 : 400)};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  pointer-events: ${({ $clickable }) => ($clickable ? 'auto' : 'none')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s ease;

  ${({ $clickable, theme }) =>
    $clickable &&
    css`
      &:hover,
      &:focus-visible {
        color: ${theme.primary};
        outline: none;
      }
    `}
`

export const BreadcrumbsSeparator = styled.span`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  flex-shrink: 0;
`

export const MobileDrawerOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => rgba(theme.black, 0.6)};
  z-index: 9998;
`

export const MobileDrawerPanel = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  max-width: 85vw;
  background: ${({ theme }) => theme.background};
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => `4px 0 16px ${rgba(theme.black, 0.4)}`};
  overflow-y: auto;
`

import { rgba } from 'polished'
import styled, { css } from 'styled-components'

export const ItemActionWrapper = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  z-index: 2;
  gap: 12px;
  padding: 4px 4px;
  background: ${({ theme }) => rgba(theme.tableHeader, 0.9)};
  border-radius: 8px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 150ms ease-in-out, transform 150ms ease-in-out;
`

export const ItemActionButton = styled.button<{ $active?: boolean }>`
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  padding: 0;
  cursor: pointer;
  &:hover {
    color: ${({ theme, $active }) => ($active ? theme.primary : theme.text)};
  }
  svg {
    width: 16px;
    height: 16px;
  }
`

export const PinnedBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  color: ${({ theme }) => theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  svg {
    width: 16px;
    height: 16px;
  }
`

export const InboxItemWrapper = styled.div<{ isRead: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  font-size: 12px;
  padding: 20px 16px;
  gap: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  position: relative;
  ${({ isRead }) =>
    !isRead
      ? css`
          background-color: ${({ theme }) => rgba(theme.primary, 0.12)};
          :hover {
            background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
          }
        `
      : css`
          :hover {
            background-color: ${({ theme }) => theme.buttonBlack};
          }
        `};

  &:hover ${ItemActionWrapper} {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  &:hover ${PinnedBadge} {
    opacity: 0;
  }
`

export const Title = styled.div<{ isRead: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme, isRead }) => (isRead ? theme.text : theme.primary)};
`

export const StatusTitle = styled(Title)<{ $color?: string }>`
  color: ${({ theme, isRead, $color }) => $color ?? (isRead ? theme.text : theme.primary)};
  display: flex;
  align-items: center;
  gap: 6px;
`

export const PrimaryText = styled.div<{ color?: string }>`
  font-size: 12px;
  color: ${({ theme, color }) => color ?? theme.text};
`
export const InboxItemTime = styled.span<{ color?: string }>`
  color: ${({ theme, color }) => color ?? theme.subText};
`
export const Dot = styled.span`
  background-color: ${({ theme }) => theme.primary};
  border-radius: 100%;
  height: 8px;
  width: 8px;
`

export const InboxItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`
export const RowItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const StatusBadge = styled.div<{ color: string }>`
  background-color: ${({ color }) => rgba(color, 0.1)};
  color: ${({ color }) => color};
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
`

export const AmountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: ${({ theme }) => theme.text};
  font-size: 13px;
  font-weight: 600;
`

export const AmountItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const DetailList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const DetailItem = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

export const DetailValue = styled.span`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

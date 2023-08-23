import { rgba } from 'polished'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'

export const DownIcon = styled(DropdownSVG)<{ isOpen: boolean }>`
  transform: rotate(${({ isOpen }) => (!isOpen ? '-90deg' : '0')});
  transition: transform 0.3s;
`

export const Wrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};

  :last-child {
    border-bottom: none;
  }
`

export const MobileStatWrapper = styled(Flex)`
  flex-direction: column;
  gap: 1rem;
`

export const MobileStat = styled.div<{ mobileView: boolean }>`
  display: flex;
  justify-content: space-between;

  ${({ mobileView }) =>
    mobileView &&
    css`
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;

      > *:nth-child(2n) {
        align-items: flex-end;
      }
    `}
`

export const Row = styled.div`
  align-items: center;
  padding: 12px;
  font-size: 14px;
  font-weight: 500;
  gap: 8px;
  display: grid;
  grid-template-columns: 3fr repeat(7, 1fr);

  :hover {
    cursor: pointer;
    background: ${({ theme }) => rgba(theme.primary, 0.15)};
  }
`

export const Badge = styled.div<{ $color?: string }>`
  display: flex;
  align-items: center;
  gap: 4px;

  padding: 2px 8px;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  border-radius: 16px;

  user-select: none;

  color: ${({ $color, theme }) => $color || theme.subText};
  background: ${({ $color, theme }) => rgba($color || theme.subText, 0.3)};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    height: 16px;
    padding: 0 4px;
  `}
`

export const ClassicRow = styled(Row)`
  grid-template-columns: 3fr 2fr repeat(6, 1.3fr);
`

import styled from 'styled-components'

import { ReactComponent as IconArrowLeftSvg } from 'assets/svg/ic_left_arrow.svg'

export const IconArrowLeft = styled(IconArrowLeftSvg)`
  cursor: pointer;
  position: relative;
  top: 5px;
  color: rgba(250, 250, 250, 1);

  :hover {
    filter: brightness(1.5);
  }
`

export const DexInfo = styled.div<{ openable: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.text};

  ${({ openable }) => openable && 'cursor: pointer;'}
  :hover {
    ${({ openable }) => openable && 'filter: brightness(1.2);'}
  }
`

export const PositionDetailWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 36px;
  padding: 36px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.background};
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 24px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    border-radius: 0;
    margin: 0 -16px;
    width: calc(100% + 32px);
    padding: 20px 16px;
  `}
`

export const MainSection = styled.div`
  display: flex;
  gap: 36px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
  `}
`

export const InfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const InfoLeftColumn = styled(InfoColumn)`
  flex: 0 1 35%;
`

export const InfoRightColumn = styled(InfoColumn)`
  flex: 1 1 65%;
`

export const InfoSection = styled.div`
  border-radius: 16px;
  padding: 16px 24px;
  border: 1px solid ${({ theme }) => theme.tabActive};
`

export const InfoSectionFirstFormat = styled(InfoSection)`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`

export const InfoSectionSecondFormat = styled(InfoSection)`
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

export const InfoRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`

export const VerticalDivider = styled.div`
  width: 1px;
  height: 32px;
  background: ${({ theme }) => theme.tabActive};
`

export const RevertIconWrapper = styled.div`
  cursor: pointer;

  :hover {
    filter: brightness(0.9);
  }
`

export const PositionActionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 16px;
  `}
`

export const PositionAction = styled.button<{ outline?: boolean }>`
  border-radius: 24px;
  padding: 10px 18px;
  background-color: ${({ theme }) => theme.primary};
  border: 1px solid ${({ theme }) => theme.primary};
  cursor: pointer;

  ${({ outline }) => outline && 'background-color: transparent;'}
  ${({ outline, theme }) => outline && `color: ${theme.primary};`}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}

  :hover {
    filter: brightness(1.2);
  }
`

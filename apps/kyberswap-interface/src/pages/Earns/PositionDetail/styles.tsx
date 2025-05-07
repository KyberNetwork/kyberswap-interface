import { rgba } from 'polished'
import styled from 'styled-components'

import { ReactComponent as IconArrowLeftSvg } from 'assets/svg/ic_left_arrow.svg'

export const IconArrowLeft = styled(IconArrowLeftSvg)`
  cursor: pointer;
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
    flex-direction: column;
  `}
`

export const InfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const InfoLeftColumn = styled(InfoColumn)<{ halfWidth?: boolean }>`
  flex: ${({ halfWidth }) => (!halfWidth ? '1 1 35%' : '1 1 50%')};
`

export const InfoRightColumn = styled(InfoColumn)<{ halfWidth?: boolean }>`
  flex: ${({ halfWidth }) => (!halfWidth ? '1 1 65%' : '1 1 50%')};
`

export const InfoSection = styled.div`
  border-radius: 16px;
  padding: 16px 24px;
  border: 1px solid ${({ theme }) => theme.tabActive};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `}
`

export const PriceInfoSection = styled(InfoSection)`
  padding: 8px 16px;
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

const PriceRangeInfoSection = styled(InfoSectionSecondFormat)`
  padding: 12px 24px;
`

export const MinPriceInfoSection = styled(PriceRangeInfoSection)`
  border-color: rgba(49, 203, 158, 0.4);
`

export const MaxPriceInfoSection = styled(PriceRangeInfoSection)`
  border-color: rgba(143, 146, 255, 0.6);
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
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  aspect-ratio: 1/1;
  border-radius: 50%;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
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
  margin-top: 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 16px;
  `}
`

export const PositionAction = styled.button<{
  outline?: boolean
  outlineDefault?: boolean
  small?: boolean
  disabled?: boolean
  load?: boolean
  mobileAutoWidth?: boolean
}>`
  border-radius: 24px;
  padding: 10px 18px;
  background-color: ${({ theme }) => theme.primary};
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.black};
  display: flex;
  gap: 6px;
  align-items: center;
  cursor: pointer;

  ${({ small }) => small && 'padding: 6px 16px;'}
  ${({ outline, outlineDefault }) => (outlineDefault || outline) && 'background-color: transparent;'}
  ${({ outline, theme }) => outline && `color: ${theme.primary};`}
  ${({ outlineDefault, theme }) =>
    outlineDefault && `color: ${rgba(theme.white, 0.7)}; border-color: ${rgba(theme.white, 0.7)};`}

  ${({ theme, mobileAutoWidth }) =>
    !mobileAutoWidth &&
    theme.mediaWidth.upToSmall`
      width: 100%;
      justify-content: center;
    `}

  :hover {
    filter: brightness(1.2);
  }

  ${({ disabled, theme }) =>
    disabled &&
    `cursor: not-allowed; color: ${theme.subText}; border-color: ${theme.subText}; filter: brightness(0.6) !important;`}
  ${({ load }) => load && `cursor: not-allowed; filter: brightness(0.6) !important;`}
`

export const ChartWrapper = styled.div`
  display: flex;
  width: 100%;
  padding: 0 32px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0;
  `}
`

export const PositionHeader = styled.div`
  display: flex;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `}
`

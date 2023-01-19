import { rgba } from 'polished'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import bgimg from 'assets/images/card-background.png'
import { ReactComponent as Down } from 'assets/svg/down.svg'
import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'

export const PageWrapper = styled(AutoColumn)`
  padding: 32px 24px 50px;
  width: 100%;
  max-width: 1500px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}
`

export const ProMMFarmGuideWrapper = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  line-height: 1.5;
  margin-top: 12px;
`

export const ProMMFarmGuide = styled.div`
  font-size: 12px;
`

export const ShowGuideBtn = styled.button<{ show: boolean }>`
  border: none;
  outline: none;
  line-height: 0;
  width: 36px;
  height: 36px;
  background: transparent;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  transform: rotate(${({ show }) => (show ? '-180deg' : 0)});
  transition: transform 0.2s;
`

export const GuideWrapper = styled.div<{ show?: boolean; numOfSteps: number }>`
  display: grid;
  ${({ numOfSteps }) =>
    // this is to generate 1fr auto 1fr auto 1fr ....
    css`
      grid-template-columns: ${Array(numOfSteps).fill('1fr').join(' auto ')};
    `}
  margin-top: ${({ show }) => (show ? '1rem' : 0)};
  height: ${({ show }) => (show ? 'auto' : 0)};
  max-height: ${({ show }) => (show ? '1000px' : 0)};
  transition: height 0.2s ease, margin 0.2s ease;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    gap: 8px;

    ${ChevronRight} {
      display: none;
    }
  `}
`
export const GuideItem = styled.div`
  padding: 1rem;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  border-radius: 20px;
  background: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    background: transparent;
    padding: 0;
  `}
`

export const ChevronRight = styled(Down)`
  transform: rotate(-90deg);
  margin: auto;
  color: ${({ theme }) => theme.primary};
`

export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
`

export const TabContainer = styled.div`
  display: flex;
  margin-bottom: 0;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToXL`
    flex-direction: column;
    align-items: flex-start;
  `};
`

export const PoolTitleContainer = styled.div`
  display: flex;
  align-items: center;
`

export const StakedOnlyToggleWrapper = styled.div`
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
    justify-content: space-between;
  `}
`

export const StakedOnlyToggleText = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  margin-right: 8px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-left: 4px;
  `}
`

export const AdContainer = styled.div`
  margin-bottom: 1.75rem;
  border-radius: 0.5rem;
  position: relative;
`

export const LearnMoreBtn = styled.a`
  outline: none;
  border: none;
  text-decoration: none;
  background-color: #244641;
  color: ${({ theme }) => theme.primary};
  position: absolute;
  bottom: 0.25rem;
  right: 0;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-top-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;

  :hover {
    text-decoration: underline;
  }
`

export const HeadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  ${({ theme }) => theme.mediaWidth.upToXL`
    width: 100%;
  `}

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    align-items: flex-start;
  `}
`
export const HeadingRight = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`
export const TotalRewardsContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  border-radius: 4px;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  background-color: ${({ theme }) => theme.apr};
  color: ${({ theme }) => theme.textReverse};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    justify-content: space-between
  `};

  ${({ disabled }) =>
    disabled &&
    css`
      background-color: ${({ theme }) => theme.buttonGray};
      color: ${({ theme }) => theme.disableText};
      cursor: not-allowed;
    `};
`

export const HarvestAllButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: flex-start;
  `}
`

export const HarvestAllInstruction = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: fit-content;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  font-weight: 500;
  color: ${({ theme }) => theme.text7};
  background-color: ${({ theme }) => theme.buttonBlack};
  padding: 20px;
  border-radius: 8px;
`

export const RewardNumberContainer = styled.div`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.text11};
  margin-right: 12px;
`

export const RewardToken = styled.span`
  @media (min-width: 1200px) {
    display: block;
    margin-bottom: 4px;
  }
`

export const HistoryButton = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  padding: 10px 14px;
  border-radius: 4px;
  margin-left: auto;
  cursor: pointer;
  white-space: nowrap;

  svg {
    vertical-align: bottom;
    margin-right: 8px;
  }
`

export const ClassicFarmWrapper = styled.div`
  border-radius: 24px;
  border: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  padding: 24px;
`

export const FairLaunchPoolsTitle = styled.div<{ justify?: string }>`
  display: flex;
  justify-content: ${({ justify }) => justify || 'space-between'};
  align-items: center;
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    align-items: flex-end;
    padding: 16px;
  `}
`

export const ListItemWrapper = styled.div`
  padding-top: 20px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
  `};

  div:last-child {
    border-radius: 0 0 16px 16px;
    border-bottom: none;
  }
`

export const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1.5fr 1fr 0.75fr 1fr 1.5fr 1fr 140px;
  grid-template-areas: 'pools liq apy vesting_duration reward staked_balance action';
  padding: 16px 24px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.buttonGray};
  border-top-left-radius: 1.25rem;
  border-top-right-radius: 1.25rem;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-gap: 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-gap: 1.5rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-gap: 1.5rem;
  `};
`

export const ProMMFarmTableHeader = styled(TableHeader)`
  padding: 16px;
  grid-template-columns: 230px 0.5fr 0.5fr 1fr 1fr 0.75fr 120px;
  grid-template-areas: 'token_pairs staked_tvl apr ending_in my_deposit reward action';
  grid-gap: 2rem;

  border-top-left-radius: 0;
  border-top-right-radius: 0;
  background-color: ${({ theme }) => theme.buttonGray};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 170px 0.5fr 0.75fr 1fr 1fr 0.75fr 120px;
    grid-gap: 1rem;
  `};
`

export const ProMMFarmTableRow = styled(ProMMFarmTableHeader)<{ isOpen: boolean }>`
  font-size: 14px;
  background-color: ${({ theme, isOpen }) => (isOpen ? theme.buttonGray : theme.buttonBlack)};
  border-radius: 0;
  box-shadow: none;
`

export const ClickableText = styled(Text)`
  display: flex;
  gap: 4px;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  user-select: none;
  text-transform: uppercase;

  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

export const MenuFlyout = styled.span`
  min-width: 14rem;
  background-color: ${({ theme }) => theme.background};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.2));
  border-radius: 5px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  position: absolute;
  top: 2.5rem !important;
  left: 0 !important;
  z-index: 10000;
`

export const Tag = styled.div<{ tag?: string }>`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 14px;
  color: ${({ tag }) => (tag === 'active' ? '#1f292e' : 'inherit')};
  background-color: ${({ theme, tag }) => (tag === 'active' ? '#4aff8c' : theme.bg11)};
  box-sizing: border-box;
  @media screen and (max-width: 500px) {
    box-shadow: none;
  }
`

export const TableRow = styled.div<{ fade?: boolean; isExpanded?: boolean }>`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1.5fr 1fr 0.75fr 1fr 1.5fr 1fr 140px;
  grid-template-areas: 'pools liq apy vesting_duration reward staked_balance action';
  padding: 14px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.buttonBlack};
  border: 1px solid transparent;
  border-bottom: 1px solid ${({ theme, isExpanded }) => (isExpanded ? 'transparent' : theme.border)};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-gap: 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-gap: 1.5rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-gap: 1.5rem;
  `};

  &:hover {
    cursor: pointer;
  }
`

export const GetLP = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
`

export const StyledItemCard = styled.div`
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
  margin-bottom: 24px;
  padding: 16px;
  background-color: ${({ theme }) => theme.background};

  :last-child {
    border-bottom: none;
    border-radius: 1rem;
  }
`

export const RewardBalanceWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  justify-content: center;
  padding: 0.75rem;
  border-radius: 1.25rem;
  gap: 8px;
  background-color: ${({ theme }) => theme.buttonBlack};
  margin-top: 0.75rem;
  margin-bottom: 1rem;
`

export const PoolRewardUSD = styled.div`
  color: ${({ theme }) => theme.subText};
`

export const DataText = styled(Flex)<{ align?: string }>`
  color: ${({ theme }) => theme.text};
  justify-content: ${({ align }) => (align === 'right' ? 'flex-end' : 'flex-start')};
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    font-size: 14px;
  `}
`

export const SearchContainer = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 999px;
  width: 280px;
  font-size: 12px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  height: 36px;
  gap: 8px;

  > svg {
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
  `}
`

export const SearchInput = styled.input`
  outline: none;
  border: none;
  flex: 1;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.background};
  :placeholder {
    color: ${({ theme }) => theme.disableText};
  }
`

export const ActionButton = styled(ButtonLight)<{ backgroundColor?: string }>`
  background-color: ${({ theme, backgroundColor }) => backgroundColor || theme.primary + '33'};
  width: 28px;
  height: 28px;

  :disabled {
    background: ${({ theme }) => theme.buttonGray};
    cursor: not-allowed;
    opacity: 0.4;
  }
`

export const ClassicFarmGridWrapper = styled.div`
  --gap: 24px;
  --card-per-row: 3;
  @media screen and (max-width: 1200px) {
    --card-per-row: 2;
  }
  @media screen and (max-width: 768px) {
    --card-per-row: 1;
  }

  display: flex;
  flex-wrap: wrap;
  padding-top: 20px;
  gap: var(--gap);
  & > * {
    flex: 0 0 calc((100% / var(--card-per-row)) - (var(--gap) * (var(--card-per-row) - 1) / var(--card-per-row)));
  }
`

export const FarmCard = styled.div<{ joined?: boolean }>`
  display: flex;
  background-color: ${({ theme }) => theme.buttonBlack};
  padding: 16px;
  flex-direction: column;
  height: fit-content;
  border-radius: 24px;

  ${({ joined = true }) =>
    joined &&
    css`
      background-image: ${({ theme }) =>
        `url(${bgimg}),
        linear-gradient(to right, ${rgba(theme.apr, 0.12)}, ${rgba(theme.apr, 0.12)}),
        linear-gradient(to right, ${theme.buttonBlack}, ${theme.buttonBlack})`};

      background-size: cover, cover, cover;
      background-repeat: no-repeat, no-repeat, no-repeat;
    `}
`

export const ToggleButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 36px;
  width: 36px;
  border-radius: 50%;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  cursor: pointer;
  &,
  * {
    transition: all 0.1s ease;
  }
  :hover {
    filter: brightness(0.9);
  }
  :active {
    filter: brightness(1.1);
    box-shadow: 0 0 0 1px ${({ theme }) => rgba(theme.subText, 0.2)};
  }
`

export const ExpandableWrapper = styled.div<{ expanded: boolean }>`
  overflow: hidden;
  max-height: ${({ expanded }) => (expanded ? `700px` : '0px')};
`

export const CardButton = styled(ButtonLight)<{ color?: string }>`
  height: 36px;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  color: ${({ color, theme }) => color || theme.primary};
  background-color: ${({ color, theme }) => (color || theme.primary) + '20'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
  outline: none;
  :hover:enabled {
    filter: brightness(0.9);
    background-color: ${({ color, theme }) => (color || theme.primary) + '20'};
  }
  :active:enabled {
    filter: brightness(1.1);
    box-shadow: 0 0 0 1px ${({ color, theme }) => (color || theme.primary) + '20'};
  }
`

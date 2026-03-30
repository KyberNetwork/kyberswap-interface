import { rgba } from 'polished'
import { Link } from 'react-router-dom'
import { Flex } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

import { ButtonPrimary } from 'components/Button'

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const fadeIn = (delay = 0) => css`
  opacity: 0;
  animation: ${fadeInUp} 0.5s ease-out ${delay}s forwards;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
  }
`

/* Spin animation */
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

export const BorderWrapper = styled.div`
  padding: 1px;
  position: relative;
  background-clip: padding-box;
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1px;
    background: linear-gradient(306.9deg, #262525 38.35%, rgba(49, 203, 158, 0.06) 104.02%),
      radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(49, 203, 158, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    border-radius: 20px;
    z-index: -1;
  }

  :hover::before {
    top: -50%;
    left: -50%;
    right: -50%;
    bottom: -50%;
    background: conic-gradient(from 0deg, transparent 0%, rgba(49, 203, 158, 0.8) 30%, transparent 50%);
    -webkit-mask: none;
    mask: none;
    animation: ${spin} 2s linear infinite;
  }
`

export const CardWrapper = styled.div`
  border-radius: 20px;

  background: linear-gradient(119.08deg, rgba(20, 29, 27, 1) -0.89%, rgba(14, 14, 14, 1) 132.3%);
  padding: 0 36px 44px 50px;
  text-align: left;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;

  cursor: pointer;
  button {
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 36px 40px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 20px 16px;
    min-height: unset;
    height: fit-content;
    flex-direction: row;
    gap: 12px;
  `}
`

export const ButtonPrimaryStyled = styled(ButtonPrimary)`
  margin-top: auto;
  width: fit-content;
  min-width: 132px;
  height: 36px;
  padding: 8px 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 20px;
  `}
`

export const PoolRow = styled(Flex)`
  gap: 12px;
  align-items: center;
  border-radius: 999px;
  padding: 8px 16px;
  transition: background 0.15s ease, transform 0.15s ease;

  :hover {
    background: #31cb9e1a;
    transform: translateX(2px);
  }
`

export const Tag = styled.div`
  border-radius: 999px;
  background: ${({ theme }) => rgba(theme.text, 0.1)};
  color: ${({ theme }) => theme.subText};
  padding: 4px 8px;
  font-size: 12px;
`

export const PageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 28px;
  row-gap: 40px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: repeat(2, 1fr);
    column-gap: 20px;
    row-gap: 28px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `}
`

export const GridSpan2 = styled.div`
  grid-column: 1 / 3;
  min-width: 0;
  ${fadeIn(0)}

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-column: auto;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    text-align: center;
    padding: 0 16px;
  `}
`

export const GridSpan3 = styled.div`
  grid-column: 1 / -1;
  ${fadeIn(0.4)}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-column: auto;
  `}
`

export const CardsRow = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;

  & > * {
    opacity: 0;
    animation: ${fadeInUp} 0.5s ease-out forwards;
  }

  & > *:nth-child(1) {
    animation-delay: 0.1s;
  }
  & > *:nth-child(2) {
    animation-delay: 0.2s;
  }
  & > *:nth-child(3) {
    animation-delay: 0.3s;
  }

  @media (prefers-reduced-motion: reduce) {
    & > * {
      opacity: 1;
      animation: none;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    gap: 20px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
    gap: 16px;
  `}
`

export const PoolsRow = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 28px;
  ${fadeIn(0.3)}

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
    gap: 16px;
  `}
`

export const SectionContainer = styled.div`
  padding: 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 14px;
  `}
`

export const RightColumnContainer = styled.div`
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  min-width: 0;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    border-radius: 0;
    background: none;
  `}
`

export const RightColumnSection = styled.div`
  padding: 20px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  & + & {
    border-top: 1px solid ${({ theme }) => rgba(theme.border, 0.4)};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);

    & + & {
      border-top: none;
      margin-top: 16px;
    }
  `}
`

export const RewardSectionContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: 20px;
  padding: 24px;
  border-radius: 12px;
  background: rgba(49, 203, 158, 0.06);
  ${fadeIn(0.1)}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 20px;
    gap: 16px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: center;
    padding: 0;
    background: none;
    border-radius: 0;
  `}
`

const borderRotate = keyframes`
  0% { --border-angle: 0deg; }
  100% { --border-angle: 360deg; }
`

// Total rewards
export const RewardsNavigateButton = styled(Link)`
  padding: 8px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  cursor: pointer;

  --border-angle: 0deg;
  animation: ${borderRotate} 2s infinite linear;
  border: 1px solid transparent;
  background: linear-gradient(161.87deg, #161f1c 8.13%, #182d27 99%) padding-box,
    conic-gradient(
        from var(--border-angle),
        ${({ theme }) => theme.primary} 0%,
        #196750 15%,
        #196750 35%,
        ${({ theme }) => theme.primary} 50%,
        #196750 65%,
        #196750 85%,
        ${({ theme }) => theme.primary} 100%
      )
      border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  transition: box-shadow 0.2s ease, filter 0.2s ease;

  &:hover {
    box-shadow: 0px 4px 16px rgba(49, 203, 158, 0.25);
    filter: brightness(1.2);
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    justify-content: center;
  `}
`

export const ExplorePoolsButton = styled(RewardsNavigateButton)`
  padding: 16px 32px;
  font-size: 16px;

  &:hover {
    box-shadow: 0px 6px 24px rgba(49, 203, 158, 0.3);
    filter: brightness(1.25);
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px 24px;
  `}
`

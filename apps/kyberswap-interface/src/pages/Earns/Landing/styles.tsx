import { rgba } from 'polished'
import { Link } from 'react-router-dom'
import { Flex } from 'rebass'
import styled, { keyframes } from 'styled-components'

import bg from 'assets/images/earn-bg.png'
import { ButtonPrimary } from 'components/Button'

export const WrapperBg = styled.div`
  background-image: url(${bg});
  background-size: 100% auto;
  background-repeat: repeat-y;
  width: 100vw;
`

export const Container = styled.div`
  max-width: 1152px;
  padding: 60px 16px;
  margin: auto;
  text-align: center;

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    padding: 36px 12px;
  `}
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

  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1px; /* Border width */
    background: linear-gradient(306.9deg, #262525 38.35%, rgba(49, 203, 158, 0.06) 104.02%),
      radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(49, 203, 158, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
    mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); /* Mask to avoid background bleed */
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); /* Mask to avoid background bleed */
    z-index: -1;
  }

  :hover::before {
    top: -20%;
    left: -20%;
    right: -20%;
    bottom: -20%;
    padding: 1px; /* Border width */
    background: linear-gradient(306.9deg, #262525 38.35%, rgba(49, 203, 158, 0.6) 104.02%),
      radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(49, 203, 158, 1) 0%, rgba(0, 0, 0, 0) 100%);

    animation: ${spin} 2s linear infinite; /* Spin animation */
  }
`

export const OverviewWrapper = styled.div`
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 64px;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: flex;
    flex-direction: column;
    margin-top: 20px;
  `}

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    gap: 16px;
  `}
`

export const PoolWrapper = styled.div`
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  padding: 1px;
  transition: box-shadow 0.3s ease, transform 0.3s ease, background 0.3s ease;

  :hover {
    box-shadow: 0px 12px 64px 0px rgba(71, 32, 139, 0.8);
    ::before {
      background: linear-gradient(215.58deg, #262525 -9.03%, rgba(148, 115, 221, 0.6) 59.21%),
        radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(130, 71, 229, 1) 0%, rgba(0, 0, 0, 0) 100%);
    }
  }

  /* Create the gradient border effect using ::before */
  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 20px;
    padding: 1px;

    background: linear-gradient(215.58deg, #262525 -9.03%, rgba(148, 115, 221, 0.2) 59.21%),
      radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(130, 71, 229, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
    mask-composite: destination-out;
    -webkit-mask-composite: destination-out;
    z-index: -1; /* Position behind the content */
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
  width: 132px;
  height: 36px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 20px;
  `}
`

export const ListPoolWrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  height: 100%;
  background: linear-gradient(119.08deg, rgba(20, 29, 27, 1) -0.89%, rgba(14, 14, 14, 1) 132.3%);
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 12px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 18px;
  `}
`

export const PoolRow = styled(Flex)`
  gap: 12px;
  align-items: center;
  border-radius: 999px;
  padding: 8px 16px;

  :hover {
    background: #31cb9e1a;
  }
`

export const Tag = styled.div`
  border-radius: 999px;
  background: ${({ theme }) => rgba(theme.text, 0.1)};
  color: ${({ theme }) => theme.subText};
  padding: 4px 8px;
  font-size: 12px;
`

const borderRotate = keyframes`
  0% { --border-angle: 0deg; }
  100% { --border-angle: 360deg; }
`

// Total rewards
export const RewardsNavigateButton = styled(Link)`
  padding: 2px 14px 2px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;

  --border-angle: 0deg;
  animation: ${borderRotate} 2s infinite linear;
  border: 1px solid transparent;
  background: linear-gradient(#1d5b49, #1d5b49) padding-box,
    conic-gradient(from var(--border-angle), #196750 50%, ${({ theme }) => theme.primary}) border-box;
  backdrop-filter: blur(2px);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    justify-content: center;
  `}
`

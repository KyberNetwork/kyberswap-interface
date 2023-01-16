import styled, { css } from 'styled-components'

import { ReactComponent as KyberLogo } from 'assets/svg/kyber_logo.svg'

const absoluteStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const BackgroundWrapper = styled.div`
  ${absoluteStyle}

  box-shadow: inset 0px 1px 1px rgba(255, 255, 255, 0.15), inset -1px -1px 1px rgba(0, 0, 0, 0.08);
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  backdrop-filter: blur(4px);
  mix-blend-mode: overlay;
`

const Layer1 = styled.div`
  ${absoluteStyle}

  background: linear-gradient(143.08deg, #31CB9E 41.26%, rgba(0, 0, 0, 0) 112.51%);
  opacity: 0.8;
`

const Layer2 = styled.div`
  ${absoluteStyle}

  background: linear-gradient(135.08deg, rgba(255, 255, 255, 0.6) -83%, rgba(0, 0, 0, 0) 118.53%);
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  opacity: 0.8;
`

const LogoWrapper = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
`
type Props = {
  noLogo: boolean
}
const CardBackground: React.FC<Props> = ({ noLogo }) => {
  return (
    <BackgroundWrapper>
      <Layer1 />
      <Layer2 />
      {!noLogo && (
        <LogoWrapper>
          <KyberLogo width="94px" height="auto" />
        </LogoWrapper>
      )}
    </BackgroundWrapper>
  )
}

export default CardBackground

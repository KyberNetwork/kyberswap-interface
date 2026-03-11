import { rgba } from 'polished'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import kyberBanner from 'assets/banners/kyber-banner.png'
import { ButtonPrimary } from 'components/Button'
import Input from 'components/Input'
import { ButtonText } from 'theme'

export const ModalContent = styled(Flex)`
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
  width: 100%;
  min-height: 100%;
  padding: 24px;
  position: relative;
  overflow: hidden;
  z-index: 1;
  background: url(${kyberBanner});
  background-size: cover;
  background-repeat: no-repeat;

  @media screen and (max-width: 640px) {
    padding: 16px;
  }

  @media screen and (max-width: 480px) {
    padding: 14px;
  }
`

export const BackgroundOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => rgba(theme.black, 0.6)};
  z-index: 1;
  pointer-events: none;
`

export const TitleWrapper = styled(Flex)`
  flex-direction: column;
  gap: 8px;
  width: 100%;
  z-index: 2;
`

export const Title = styled(Text)`
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  text-align: left;
  color: ${({ theme }) => theme.primary};
`

export const Description = styled(Text)`
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => rgba(theme.white, 0.48)};
  text-align: left;
  font-style: italic;
  align-self: stretch;
`

export const InputWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
`

export const InputLabel = styled(Text)`
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: ${({ theme }) => theme.text};
  width: 100%;
  align-self: stretch;
`

export const StyledInput = styled(Input)`
  width: 100%;
  padding: 12px 16px;
  align-self: stretch;
  border-radius: 16px;
  background: ${({ theme }) => rgba(theme.black, 0.64)};
  font-feature-settings: 'liga' off, 'clig' off;
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.text};
  border: none;

  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 16px;
  }
`

export const ViewButton = styled(ButtonPrimary)`
  width: fit-content;
  padding: 10px 18px;
  margin: -4px auto 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f0f0f;
  gap: 4px;
  z-index: 2;
  transition: all 0.2s ease-out;
`

export const CloseButton = styled(ButtonText)`
  line-height: 0;
  padding: 0;
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 3;
  color: ${({ theme }) => theme.subText};

  @media screen and (max-width: 640px) {
    top: 16px;
    right: 16px;
  }

  @media screen and (max-width: 480px) {
    top: 12px;
    right: 12px;
  }
`

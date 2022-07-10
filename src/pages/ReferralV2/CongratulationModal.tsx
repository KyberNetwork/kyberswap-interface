import Modal from 'components/Modal'
import React from 'react'
import styled, { keyframes } from 'styled-components'
import { Flex, Text } from 'rebass'
import { CloseIcon } from 'theme/components'
import { Trans } from '@lingui/macro'
import kncReward1 from 'assets/images/knc-reward1.png'
import kncReward2 from 'assets/images/knc-reward2.png'
import { ButtonPrimary } from 'components/Button'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import { animated, useTransition, useSpring } from 'react-spring'

const animateGlow = keyframes`
  from {
    background-position: 0% 50%;
  }
  to {
    background-position: 200% 50%;
  }
`

const StyledDialogOverlay = styled(animated(DialogOverlay))`
  z-index: 100;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.modalBG};
`
const StyledDialogContent = styled(animated(DialogContent))`
  &[data-reach-dialog-content] {
    background-color: transparent;
    width: 100%;
    margin: auto;
  }
`

const Wrapper = styled.div`
  padding: 24px;
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  position: relative;
  max-width: 422px;
  margin: auto;

  border-radius: 20px;
  /* box-shadow: inset 0 0 50px #fff, inset 20px 0 80px #f0f, inset -20px 0 80px #0ff, inset 20px 0 300px #00ff95,
    inset -20px 0 300px #0ff, 0 0 50px #fff, -10px 0 80px #09ff00, 10px 0 80px #0ff; */
  img {
    max-width: 100%;
    height: auto;
  }

  &::after {
    position: absolute;
    content: '';
    top: 10px;
    left: 0;
    right: 0;
    z-index: -1;
    height: 100%;
    width: 100%;
    //transform: scale(0.9) translateZ(0);
    filter: blur(15px);
    background: linear-gradient(60deg, #ff5770, #e4428d, #c42da8, #9e16c3, #6501de, #9e16c3, #c42da8, #e4428d, #ff5770);
    background-size: 200% 200%;
    animation: ${animateGlow} 2s linear infinite;
  }
`

export default function CongratulationModal({
  isOpen,
  onDismiss,
  onClaimClicked,
}: {
  isOpen: boolean
  onDismiss: () => void
  onClaimClicked: () => void
}) {
  const fadeInTransition = useTransition(isOpen, null, {
    config: { duration: 200 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  })
  const scaleInTransition = useTransition(isOpen, null, {
    config: { friction: 18, tension: 300 },
    from: { transform: 'scale(0.1)' },
    enter: { transform: 'scale(1)' },
    leave: { transform: 'scale(0.8)' },
  })
  return (
    <>
      {fadeInTransition.map(
        ({ item, key, props }) =>
          item && (
            <StyledDialogOverlay onDismiss={onDismiss} style={props}>
              {scaleInTransition.map(
                ({ item: item2, key: key2, props: props2 }) =>
                  item2 && (
                    <StyledDialogContent key={key2} style={props2}>
                      <Wrapper>
                        <Flex width="100%" justifyContent="space-between" height="40px" fontSize="20px">
                          <Text>
                            <Trans>Congratulations!</Trans>
                          </Text>
                          <CloseIcon onClick={onDismiss} />
                        </Flex>
                        <Flex flexDirection="column" alignItems="center">
                          <img src={kncReward1} />
                          <img src={kncReward2} />
                        </Flex>
                        <Flex alignItems="center" justifyContent="center" paddingTop="20px" paddingBottom="20px">
                          {/* <Trans>
            You have earned <img src={KNClogo} style={{ margin: '0 6px' }} /> 1 KNC
          </Trans> */}
                          <Trans>You have earned KNC rewards!</Trans>
                        </Flex>
                        <ButtonPrimary onClick={onClaimClicked}>
                          <Trans>Claim your reward!</Trans>
                        </ButtonPrimary>
                      </Wrapper>
                    </StyledDialogContent>
                  ),
              )}
            </StyledDialogOverlay>
          ),
      )}
    </>
  )
}

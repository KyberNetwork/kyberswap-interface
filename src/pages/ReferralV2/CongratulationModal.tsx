import Modal from 'components/Modal'
import React, { useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { Flex, Text } from 'rebass'
import { CloseIcon } from 'theme/components'
import { Trans } from '@lingui/macro'
import kncReward1 from 'assets/images/knc-reward1.png'
import kncReward2 from 'assets/images/knc-reward2.png'
import KNClogo from 'assets/images/KNC-logo.png'
import { ButtonPrimary } from 'components/Button'
const Wrapper = styled.div`
  padding: 24px;
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  position: relative;
  /* box-shadow: inset 0 0 50px #fff, inset 20px 0 80px #f0f, inset -20px 0 80px #0ff, inset 20px 0 300px #00ff95,
    inset -20px 0 300px #0ff, 0 0 50px #fff, -10px 0 80px #09ff00, 10px 0 80px #0ff; */

  img {
    max-width: 100%;
    height: auto;
  }

  /* &::before {
    content: '';
    width: 104%;
    height: 102%;
    border-radius: 50%;
    background-image: linear-gradient(120deg, #5ddcff, #3c67e3 43%, #4e00c2);
    position: fixed;
    z-index: -1;
    animation: spin 6.5s linear infinite;
  } */
`
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`

export default function CongratulationModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  // useEffect(() => {
  //   const colors = ['#FFBF00', '#FFCF40', '#ffffff', '#31CB9E', '#A67C00']
  //   const intervalA =
  //     isOpen &&
  //     setInterval(() => {
  //       confetti({
  //         particleCount: 5,
  //         angle: 60,
  //         spread: 100,
  //         origin: { x: 0 },
  //         colors: colors,
  //       })
  //       confetti({
  //         particleCount: 5,
  //         angle: 120,
  //         spread: 100,
  //         origin: { x: 1 },
  //         colors: colors,
  //       })
  //     }, 150)
  //   isOpen &&
  //     confetti({
  //       particleCount: 120,
  //       spread: 80,
  //       origin: { y: 0.6 },
  //     })
  //   return () => {
  //     intervalA && clearInterval(intervalA)
  //   }
  // }, [isOpen])
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} width="422px">
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
        <Flex alignItems="center" paddingTop="20px" paddingBottom="20px">
          {/* <Trans>
            You have earned <img src={KNClogo} style={{ margin: '0 6px' }} /> 1 KNC
          </Trans> */}
          <Trans>You have earned KNC rewards!</Trans>
        </Flex>
        <ButtonPrimary onClick={onDismiss}>
          <Trans>Claim your reward!</Trans>
        </ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}

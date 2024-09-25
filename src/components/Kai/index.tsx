import { motion } from 'framer-motion'
import { useState } from 'react'
import styled from 'styled-components'

import { ReactComponent as KaiAvatarSvg } from 'assets/svg/kai_avatar.svg'

import KaiContent from './KaiContent'

const Wrapper = styled(motion.div)`
  position: fixed;
  bottom: 1rem;
  right: 8rem;
  z-index: 1;
  height: 36px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    bottom: 120px;
    right: 1rem;
  `};
`

const KaiAvatar = styled(KaiAvatarSvg)`
  cursor: pointer;
`

const Modal = styled(motion.div)`
  position: fixed;
  bottom: 5.2rem;
  right: 1rem;
  z-index: 1;
  font-size: 14px;
  width: fit-content;
  height: fit-content;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  ${({ theme }) => theme.mediaWidth.upToLarge`
    bottom: 174px;
  `}
`

const ModalContent = styled.div`
  background: ${({ theme }) => theme.tableHeader};
  padding: 20px 24px 26px;
  border-radius: 12px;
  width: 320px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: calc(100vw - 2rem);
  `}
`

const kaiAnimate = {
  enter: {
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.3,
    },
    display: 'block',
  },
  exit: {
    opacity: 0,
    rotateX: -15,
    transition: {
      duration: 0.3,
      delay: 0.2,
    },
    transitionEnd: {
      display: 'none',
    },
  },
}

const Kai = () => {
  const [openKai, setOpenKai] = useState<boolean>(false)

  const onOpenKai = () => setOpenKai(!openKai)

  return (
    <>
      <Wrapper>
        <KaiAvatar onClick={onOpenKai} />
      </Wrapper>
      <Modal initial="exit" animate={openKai ? 'enter' : 'exit'} variants={kaiAnimate}>
        <ModalContent>
          <KaiContent />
        </ModalContent>
      </Modal>
    </>
  )
}

export default Kai

import { motion } from 'framer-motion'
import { forwardRef } from 'react'
import { isMobile } from 'react-device-detect'
import styled from 'styled-components'

export const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`

export const NetworkList = styled(motion.div)`
  min-height: 60px;
  display: flex;
  align-items: center;
  column-gap: 16px;
  row-gap: 6px;
  flex-wrap: wrap;
  width: 100%;
  & > * {
    width: calc(33% - 2 * 16px / 3);
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    column-gap: 8px;

    & > * {
      width: calc(50% - 8px / 2);
    }
  `}
`

const GhostOptionWrapper = styled(motion.div)`
  height: 60px;
  background-color: #33333380;
  border-radius: 16px;
  z-index: 0;
`

export const GhostOption = forwardRef<HTMLDivElement>(({}, ref) => {
  return <GhostOptionWrapper ref={ref} layout layoutId="ghost" />
})

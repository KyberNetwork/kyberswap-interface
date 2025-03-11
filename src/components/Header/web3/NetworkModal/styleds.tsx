import { motion } from 'framer-motion'
import styled from 'styled-components'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px;
  height: fit-content;
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

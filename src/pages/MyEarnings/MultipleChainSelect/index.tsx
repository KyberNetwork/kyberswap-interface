import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, useRef, useState } from 'react'
import { Flex } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { useOnClickOutside } from 'hooks/useOnClickOutside'

import PopoverBody from './PopoverBody'
import SelectButton from './SelectButton'

export const StyledLogo = styled.img`
  width: 20px;
  height: auto;
`

export type MultipleChainSelectProps = {
  className?: string
  comingSoonList?: ChainId[]
  chainIds: ChainId[]
  selectedChainIds: ChainId[]
  handleChangeChains: (v: ChainId[]) => void
  onTracking?: () => void
  menuStyle?: CSSProperties
  style?: CSSProperties
  activeStyle?: CSSProperties
  labelColor?: string
  activeRender?: (node: ReactNode) => ReactNode
}
const MultipleChainSelect: React.FC<MultipleChainSelectProps> = ({ className, style, ...props }) => {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const collapse = () => {
    setExpanded(false)
  }

  useOnClickOutside(ref, expanded ? collapse : undefined)

  return (
    <Flex
      ref={ref}
      sx={{
        flex: '0 0 150px',
        width: '150px',
        height: '36px',
        position: 'relative',
        zIndex: '3',
        ...style,
      }}
      className={className}
    >
      <SelectButton expanded={expanded} onClick={() => setExpanded(e => !e)} {...props} />

      {expanded && <PopoverBody onClose={() => setExpanded(false)} {...props} />}
    </Flex>
  )
}

export default styled(MultipleChainSelect)``

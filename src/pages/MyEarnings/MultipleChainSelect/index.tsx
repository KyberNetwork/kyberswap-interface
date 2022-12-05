import { useRef, useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { useOnClickOutside } from 'hooks/useOnClickOutside'

import PopoverBody from './PopoverBody'
import SelectButton from './SelectButton'

export const StyledLogo = styled.img`
  width: 20px;
  height: auto;
`

const MultipleChainSelect = () => {
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
        zIndex: '1',
      }}
    >
      <SelectButton expanded={expanded} onClick={() => setExpanded(e => !e)} />

      {expanded && (
        <PopoverBody
          onClose={() => {
            setExpanded(false)
          }}
        />
      )}
    </Flex>
  )
}

export default MultipleChainSelect

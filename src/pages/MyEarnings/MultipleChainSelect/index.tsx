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

type Props = {
  className?: string
}
const MultipleChainSelect: React.FC<Props> = ({ className }) => {
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
        zIndex: '2',
      }}
      className={className}
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

export default styled(MultipleChainSelect)``

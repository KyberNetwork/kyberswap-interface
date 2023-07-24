import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { MouseoverTooltip } from 'components/Tooltip'

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  color: ${({ theme }) => theme.text};
`

const Wrapper = styled(Flex)`
  align-items: center;

  &:hover {
    ${DropdownIcon} {
      transform: rotate(-180deg);
    }
  }
`

type Props = {
  text: React.ReactNode
  anchor: React.ReactNode
  disabled?: boolean
}
const HoverDropdown: React.FC<Props> = ({ anchor, text, disabled = false }) => {
  return (
    <MouseoverTooltip placement="bottom" width="fit-content" text={text} disableTooltip={disabled}>
      <Wrapper>
        {anchor}
        {!disabled && <DropdownIcon />}
      </Wrapper>
    </MouseoverTooltip>
  )
}

export default HoverDropdown

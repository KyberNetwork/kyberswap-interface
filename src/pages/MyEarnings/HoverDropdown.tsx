import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { MouseoverTooltip } from 'components/Tooltip'

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  color: ${({ theme }) => theme.subText};

  &[data-disabled='false'] {
    color: ${({ theme }) => theme.text};

    &:hover {
      transform: rotate(180deg);
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
    <Flex
      sx={{
        alignItems: 'center',
        gap: '4px',
        flex: '0 0 min-content',
      }}
    >
      {anchor}

      <MouseoverTooltip noArrow placement="bottom" width="fit-content" text={text} disableTooltip={disabled}>
        <DropdownIcon data-disabled={disabled} />
      </MouseoverTooltip>
    </Flex>
  )
}

export default HoverDropdown

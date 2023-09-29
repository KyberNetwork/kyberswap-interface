import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as LogoKyber } from 'assets/svg/logo_kyber.svg'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'

import { MultipleChainSelectProps, StyledLogo } from '.'

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  color: ${({ theme }) => theme.subText};
  &[data-flip='true'] {
    transform: rotate(180deg);
  }
`

const ButtonBodyWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Label = styled.span<{ labelColor?: string }>`
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme, labelColor }) => labelColor || theme.subText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
type Props = {
  expanded: boolean
  onClick: () => void
} & MultipleChainSelectProps
const SelectButton: React.FC<Props> = ({
  expanded,
  onClick,
  selectedChainIds,
  chainIds,
  activeRender,
  activeStyle,
  labelColor,
}) => {
  const theme = useTheme()

  const renderButtonBody = () => {
    if (selectedChainIds.length === chainIds.length) {
      return (
        <ButtonBodyWrapper>
          <LogoKyber color={theme.subText} />
          <Label labelColor={labelColor}>
            <Trans>All Chains</Trans>
          </Label>
        </ButtonBodyWrapper>
      )
    }

    if (selectedChainIds.length === 1) {
      const config = NETWORKS_INFO[selectedChainIds[0]]
      const iconSrc = theme.darkMode && config.iconDark ? config.iconDark : config.icon

      return (
        <ButtonBodyWrapper>
          <StyledLogo src={iconSrc} />
          <Label labelColor={labelColor}>{config.name}</Label>
        </ButtonBodyWrapper>
      )
    }

    return (
      <ButtonBodyWrapper>
        {selectedChainIds.slice(0, 3).map(chainId => {
          const config = NETWORKS_INFO[chainId]
          const iconSrc = theme.darkMode && config.iconDark ? config.iconDark : config.icon

          return <StyledLogo src={iconSrc} key={chainId} />
        })}

        {selectedChainIds.length > 3 && `+${selectedChainIds.length - 3}`}
      </ButtonBodyWrapper>
    )
  }

  return (
    <Flex
      sx={{
        width: '100%',
        height: '100%',
        paddingLeft: '12px',
        paddingRight: '8px',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '18px',
        background: theme.background,
        userSelect: 'none',
        cursor: 'pointer',
        ...activeStyle,
      }}
      onClick={onClick}
    >
      {activeRender ? activeRender(renderButtonBody()) : renderButtonBody()}
      <DropdownIcon data-flip={expanded} />
    </Flex>
  )
}

export default SelectButton

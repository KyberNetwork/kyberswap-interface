import { Trans } from '@lingui/macro'
import { useSelector } from 'react-redux'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as LogoKyber } from 'assets/svg/logo_kyber.svg'
import { NETWORKS_INFO, SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'

import { StyledLogo } from '.'

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

const Label = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.subText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const SelectButton: React.FC<{ expanded: boolean; onClick: () => void }> = ({ expanded, onClick }) => {
  const theme = useTheme()
  const selectedChains = useSelector((state: AppState) => state.myEarnings.selectedChains)

  const renderButtonBody = () => {
    if (selectedChains.length === SUPPORTED_NETWORKS_FOR_MY_EARNINGS.length) {
      return (
        <ButtonBodyWrapper>
          <LogoKyber color={theme.subText} />
          <Label>
            <Trans>All Chains</Trans>
          </Label>
        </ButtonBodyWrapper>
      )
    }

    if (selectedChains.length === 1) {
      const config = NETWORKS_INFO[selectedChains[0]]
      const iconSrc = theme.darkMode && config.iconDark ? config.iconDark : config.icon

      return (
        <ButtonBodyWrapper>
          <StyledLogo src={iconSrc} />
          <Label>{config.name}</Label>
        </ButtonBodyWrapper>
      )
    }

    return (
      <ButtonBodyWrapper>
        <Label>
          <Trans>Selected</Trans> {String(selectedChains.length).padStart(2, '0')}
        </Label>
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
      }}
      onClick={onClick}
    >
      {renderButtonBody()}
      <DropdownIcon data-flip={expanded} />
    </Flex>
  )
}

export default SelectButton

import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as LogoKyber } from 'assets/svg/logo_kyber.svg'
import Checkbox from 'components/CheckBox'
import Select from 'components/SelectV2'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import useChainsConfig from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'

import { ApplyButton } from './ApplyButton'
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
  const { comingSoonList = [], selectedChainIds = [], handleChangeChains, chainIds = [], onTracking } = props
  const options = chainIds.map(id => ({ value: id, label: id }))
  const theme = useTheme()
  const selectedChains = selectedChainIds.filter(item => !comingSoonList.includes(item))
  const [localSelectedChains, setLocalSelectedChains] = useState(() => selectedChains)
  const { activeChains } = useChainsConfig()
  const networkList = chainIds.filter(
    item => !comingSoonList.includes(item) && activeChains.some(e => e.chainId === item),
  )
  const isAllSelected = localSelectedChains.length === networkList.length

  const onChangeChain = () => {
    if (isAllSelected) {
      setLocalSelectedChains([])
    } else {
      onTracking?.()
      setLocalSelectedChains(networkList)
    }
  }

  return (
    <Select
      className={className}
      style={{ ...style, flex: '0 0 150px', width: '150px', position: 'relative', zIndex: '3' }}
      activeRender={_ => <SelectButton {...props} />}
      options={options}
      optionRender={item => {
        const network = Number(item?.value) as ChainId
        const config = NETWORKS_INFO[network]
        const isComingSoon = comingSoonList.includes(network)
        const isSelected = isComingSoon ? false : localSelectedChains.includes(network)
        const handleClick = (e: any) => {
          if (isComingSoon) return
          e.stopPropagation()
          if (isSelected) {
            setLocalSelectedChains(localSelectedChains.filter(chain => chain !== network))
          } else {
            setLocalSelectedChains([...localSelectedChains, network])
          }
        }

        return (
          <MouseoverTooltip
            text={isComingSoon ? 'Coming soon' : ''}
            width="fit-content"
            placement="top"
            containerStyle={{ width: 'fit-content' }}
          >
            <Flex
              onClick={handleClick}
              sx={{
                alignItems: 'center',
                gap: '8px',
                cursor: isComingSoon ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                opacity: isComingSoon ? 0.6 : 1,
              }}
            >
              <Checkbox type="checkbox" checked={isSelected} onChange={handleClick} />

              <StyledLogo src={theme.darkMode && config.iconDark ? config.iconDark : config.icon} />

              <Text
                as="span"
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: theme.text,
                }}
              >
                {config.name}
              </Text>
            </Flex>
          </MouseoverTooltip>
        )
      }}
      dropdownRender={menu => {
        return (
          <>
            <Flex
              onClick={e => e.stopPropagation()}
              sx={{
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
              }}
            >
              <Checkbox type="checkbox" checked={isAllSelected} onChange={onChangeChain} />

              <Flex width="20px" alignItems="center" justifyContent="center">
                <LogoKyber width="14px" height="auto" color={theme.primary} />
              </Flex>

              <Text
                as="span"
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: theme.text,
                }}
              >
                <Trans>All Chains</Trans>
              </Text>
            </Flex>
            {menu}
            <Box sx={{ margin: '10px 0', width: '100%', height: '0', borderBottom: `1px solid ${theme.border}` }} />
            <Flex padding={'0 22px'}>
              <ApplyButton
                disabled={!localSelectedChains.length}
                onClick={() => {
                  handleChangeChains(localSelectedChains)
                }}
                numOfChains={localSelectedChains.length}
              />
            </Flex>
          </>
        )
      }}
    />
  )
}

export default styled(MultipleChainSelect)``

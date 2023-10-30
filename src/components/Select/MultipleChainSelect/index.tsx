import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as LogoKyber } from 'assets/svg/logo_kyber.svg'
import Checkbox from 'components/CheckBox'
import Select from 'components/Select'
import { MouseoverTooltip } from 'components/Tooltip'
import useChainsConfig, { NETWORKS_INFO } from 'hooks/useChainsConfig'
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

const ChainWrapper = styled.div`
  max-height: 180px;
  overflow-y: scroll;
  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 8px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => rgba(theme.subText, 0.4)};
    border-radius: 999px;
  }
`

const Label = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 20x;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  user-select: none;
`

const StyledSelect = styled(Select)`
  flex: 0 0 150px;
  width: 150px;
  position: relative;
  border-radius: 18px;
  background-color: ${({ theme }) => theme.buttonGray};
`

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

  useEffect(() => {
    setLocalSelectedChains(selectedChains)
    // eslint-disable-next-line
  }, [selectedChains.length])

  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!selectAllRef.current) {
      return
    }
    selectAllRef.current.indeterminate =
      0 < localSelectedChains.length && localSelectedChains.length < networkList.length
  }, [localSelectedChains, networkList.length])

  const onHideMenu = useCallback(() => {
    setLocalSelectedChains(selectedChains)
  }, [selectedChains])

  return (
    <StyledSelect
      onHideMenu={onHideMenu}
      className={className}
      style={style}
      activeRender={_ => <SelectButton {...props} />}
      options={options}
      optionStyle={{ padding: 0 }}
      optionRender={item => {
        const network = Number(item?.value) as ChainId
        const config = NETWORKS_INFO[network]
        const isComingSoon = comingSoonList.includes(network)
        const isSelected = isComingSoon ? false : localSelectedChains.includes(network)
        const handleClick = (e: any) => {
          e.stopPropagation()
          if (isComingSoon) return
          if (isSelected) {
            setLocalSelectedChains(localSelectedChains.filter(chain => chain !== network))
          } else {
            setLocalSelectedChains([...localSelectedChains, network])
          }
        }

        return (
          <MouseoverTooltip
            text={isComingSoon ? 'Coming soon' : ''}
            placement="top"
            width={isComingSoon ? 'fit-content' : undefined}
          >
            <Flex
              onClick={handleClick}
              sx={{
                alignItems: 'center',
                gap: '8px',
                cursor: isComingSoon ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                opacity: isComingSoon ? 0.6 : 1,
                width: '100%',
                padding: '10px 18px',
              }}
            >
              <Checkbox type="checkbox" checked={isSelected} onChange={handleClick} />

              <StyledLogo src={config.icon} />

              <Label>{config.name}</Label>
            </Flex>
          </MouseoverTooltip>
        )
      }}
      dropdownRender={menu => {
        return (
          <>
            <Flex
              as="label"
              onClick={e => e.stopPropagation()}
              sx={{
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                cursor: 'pointer',
              }}
            >
              <Checkbox
                ref={selectAllRef}
                type="checkbox"
                id="checkAllChain"
                checked={isAllSelected}
                onChange={onChangeChain}
              />

              <Flex width="20px" alignItems="center" justifyContent="center">
                <LogoKyber width="14px" height="auto" color={theme.primary} />
              </Flex>

              <Label>
                <Trans>All Chains</Trans>
              </Label>
            </Flex>
            <ChainWrapper>{menu}</ChainWrapper>

            <Box sx={{ margin: '10px 0', width: '100%', height: '0', borderBottom: `1px solid ${theme.border}` }} />

            <Flex padding={'0 18px'}>
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

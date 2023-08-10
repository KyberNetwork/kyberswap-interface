import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { MouseEventHandler, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as LogoKyber } from 'assets/svg/logo_kyber.svg'
import { ButtonPrimary } from 'components/Button'
import Checkbox from 'components/CheckBox'
import { MouseoverTooltip } from 'components/Tooltip'
import {
  COMING_SOON_NETWORKS_FOR_MY_EARNINGS,
  COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC,
  COMING_SOON_NETWORKS_FOR_MY_EARNINGS_LEGACY,
  NETWORKS_INFO,
  SUPPORTED_NETWORKS_FOR_MY_EARNINGS,
} from 'constants/networks'
import { VERSION } from 'constants/v2'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { useAppSelector } from 'state/hooks'
import { selectChains } from 'state/myEarnings/actions'

import { StyledLogo } from '.'

const ChainListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 180px;
  overflow: auto;

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
    background: ${({ theme }) => theme.buttonBlack};
    border-radius: 999px;
  }
`

type ApplyButtonProps = {
  disabled: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
  numOfChains: number
}

const ApplyButton: React.FC<ApplyButtonProps> = ({ disabled, onClick, numOfChains }) => {
  const theme = useTheme()
  return (
    <ButtonPrimary
      disabled={disabled}
      style={{
        height: '40px',
        padding: '0 12px',
      }}
      onClick={onClick}
    >
      <Flex
        as="span"
        sx={{
          width: '100%',
          display: 'inline-flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Trans>View Selected Chains</Trans>
        <Flex
          as="span"
          sx={{
            width: '22px',
            height: '22px',
            borderRadius: '999px',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: disabled ? undefined : theme.darkText,
            color: disabled ? theme.border : theme.primary,
          }}
        >
          {numOfChains ? String(numOfChains).padStart(2, '0') : 0}
        </Flex>
      </Flex>
    </ButtonPrimary>
  )
}

type Props = { onClose: () => void }
const PopoverBody: React.FC<Props> = ({ onClose }) => {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const selectAllRef = useRef<HTMLInputElement>(null)
  const selectedChains = useSelector((state: AppState) => state.myEarnings.selectedChains)
  const dispatch = useDispatch()

  const isLegacy = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)
  const isClassic = useAppSelector(state => state.myEarnings.activeTab === VERSION.CLASSIC)

  const comingSoonList = isLegacy
    ? COMING_SOON_NETWORKS_FOR_MY_EARNINGS_LEGACY
    : isClassic
    ? COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC
    : COMING_SOON_NETWORKS_FOR_MY_EARNINGS

  const [localSelectedChains, setLocalSelectedChains] = useState(() =>
    selectedChains.filter(item => !comingSoonList.includes(item)),
  )

  const networkList = SUPPORTED_NETWORKS_FOR_MY_EARNINGS.filter(item => !comingSoonList.includes(item))

  const isAllSelected = localSelectedChains.length === networkList.length
  const handleChangeChains = (chains: ChainId[]) => {
    dispatch(selectChains(chains))
  }

  useEffect(() => {
    setLocalSelectedChains(selectedChains)
  }, [selectedChains])

  useEffect(() => {
    if (!selectAllRef.current) {
      return
    }

    const indeterminate =
      0 < localSelectedChains.length && localSelectedChains.length < SUPPORTED_NETWORKS_FOR_MY_EARNINGS.length
    selectAllRef.current.indeterminate = indeterminate
  }, [localSelectedChains])

  const allNetworks = [...networkList, ...comingSoonList]

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        borderRadius: '20px',
        background: theme.tableHeader,
        width: '250px',
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: '0',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
          gap: '8px',
          padding: '4px',
        }}
      >
        <Checkbox
          type="checkbox"
          checked={isAllSelected}
          ref={selectAllRef}
          onChange={() => {
            if (isAllSelected) {
              setLocalSelectedChains([])
            } else {
              mixpanelHandler(MIXPANEL_TYPE.EARNING_DASHBOARD_CLICK_ALL_CHAINS_BUTTON)
              setLocalSelectedChains(networkList)
            }
          }}
        />

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

      <ChainListWrapper>
        {allNetworks.map((network, i) => {
          const config = NETWORKS_INFO[network]

          const isComingSoon = comingSoonList.includes(network)
          const isSelected = isComingSoon ? false : localSelectedChains.includes(network)

          const handleClick = () => {
            if (isComingSoon) return
            if (isSelected) {
              setLocalSelectedChains(localSelectedChains.filter(chain => chain !== network))
            } else {
              setLocalSelectedChains([...localSelectedChains, network])
            }
          }

          return (
            <MouseoverTooltip
              key={i}
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
                  padding: '4px',
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
        })}
      </ChainListWrapper>

      <Box
        sx={{
          width: '100%',
          height: '0',
          borderBottom: `1px solid ${theme.border}`,
        }}
      />

      <ApplyButton
        disabled={!localSelectedChains.length}
        onClick={() => {
          handleChangeChains(localSelectedChains)
          onClose()
        }}
        numOfChains={localSelectedChains.length}
      />
    </Flex>
  )
}

export default PopoverBody

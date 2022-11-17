import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { stringify } from 'qs'
import React from 'react'
import { useHistory } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { MouseoverTooltip } from 'components/Tooltip'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'

const NewLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.red};
  margin-left: 2px;
  margin-top: -10px;
`

const ListItem = styled.div<{ selected?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 8px;
  border-radius: 999px;
  ${({ theme, selected }) =>
    selected
      ? css`
          background-color: ${theme.primary};
          & > div {
            color: ${theme.background};
          }
        `
      : css`
          background-color: ${theme.buttonBlack};
        `}
`

const SelectNetworkButton = styled(ButtonEmpty)<{ disabled: boolean }>`
  background-color: transparent;
  color: ${({ theme }) => theme.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  height: fit-content;
  &:focus {
    text-decoration: none;
  }
  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.primary};
  }
  &:active {
    text-decoration: none;
  }
  &:disabled {
    opacity: 50%;
    cursor: not-allowed;
    &:hover {
      border: 1px solid transparent;
    }
  }
`

const NetworkList = styled.div<{ width: number; mt: number; mb: number }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  margin-top: ${({ mt }) => mt}px;
  margin-bottom: ${({ mb }) => mb}px;
  & > * {
    width: calc(20% - 1rem);
  }
  ${({ theme }) => theme.mediaWidth.upToXXL`
    & > * {
      width: calc(25% - 1rem);
    }
  `}
  ${({ theme }) => theme.mediaWidth.upToXL`
    & > * {
      width: calc(33% - 1rem);
    }
  `}
`

const Networks = ({
  onChangedNetwork,
  width = 3,
  mt = 30,
  mb = 0,
  isAcceptedTerm = true,
  activeChainIds,
  selectedId,
  customOnSelectNetwork,
  customToggleModal,
  disabledMsg,
  disabledAll,
  disabledAllMsg,
}: {
  onChangedNetwork?: () => any
  width: number
  mt?: number
  mb?: number
  isAcceptedTerm?: boolean
  activeChainIds?: ChainId[]
  selectedId?: ChainId | undefined
  customOnSelectNetwork?: (chainId: ChainId) => void
  customToggleModal?: () => void
  disabledMsg?: string
  disabledAll?: boolean
  disabledAllMsg?: string
}) => {
  const changeNetwork = useChangeNetwork()
  const qs = useParsedQueryString()
  const history = useHistory()
  const isDarkMode = useIsDarkMode()
  const theme = useTheme()

  const onSelect = (chainId: ChainId) => {
    customToggleModal?.()
    if (customOnSelectNetwork) {
      customOnSelectNetwork(chainId)
    } else {
      changeNetwork(chainId, () => {
        const { networkId, inputCurrency, outputCurrency, ...rest } = qs
        history.replace({
          search: stringify(rest),
        })
        onChangedNetwork?.()
      })
    }
  }

  return (
    <NetworkList width={width} mt={mt} mb={mb}>
      {MAINNET_NETWORKS.map((key: ChainId, i: number) => {
        const { iconDark, icon, iconDarkSelected, iconSelected, name } = NETWORKS_INFO[key]
        const disabled = !isAcceptedTerm || (activeChainIds ? !activeChainIds?.includes(key) : false)
        const selected = selectedId === key

        const imgSrc = selected
          ? isDarkMode
            ? iconDarkSelected || iconSelected || iconDark || icon
            : iconSelected || icon
          : (isDarkMode && iconDark) || icon

        return (
          <MouseoverTooltip
            style={{ zIndex: Z_INDEXS.MODAL + 1 }}
            key={key}
            text={disabled ? disabledMsg : disabledAll ? disabledAllMsg : ''}
          >
            <SelectNetworkButton
              key={i}
              padding="0"
              onClick={() => !selected && onSelect(key)}
              disabled={disabledAll || disabled}
            >
              <ListItem selected={selected}>
                <img src={imgSrc} alt="Switch Network" style={{ height: '20px', width: '20px', marginRight: '8px' }} />
                <Text fontSize={14} color={theme.subText}>
                  {name}
                </Text>
                {key === ChainId.SOLANA && (
                  <NewLabel>
                    <Trans>New</Trans>
                  </NewLabel>
                )}
              </ListItem>
            </SelectNetworkButton>
          </MouseoverTooltip>
        )
      })}
    </NetworkList>
  )
}

export default React.memo(Networks)

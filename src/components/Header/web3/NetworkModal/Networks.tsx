import { ChainId } from '@namgold/ks-sdk-core'
import { stringify } from 'qs'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useIsDarkMode } from 'state/user/hooks'

const ListItem = styled.div<{ selected?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 8px;
  border-radius: 999px;
  ${({ theme, selected }) =>
    selected
      ? `
        background-color: ${theme.primary};
        & ${NetworkLabel} {
          color: ${theme.background};
        }
      `
      : `
        background-color : ${theme.buttonBlack};
      `}
`

const SelectNetworkButton = styled(ButtonEmpty)`
  background-color: transparent;
  color: ${({ theme }) => theme.primary};
  display: flex;
  justify-content: center;
  align-items: center;
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
  }
`

const NetworkLabel = styled.span`
  color: ${({ theme }) => theme.text13};
  font-size: 12px;
`

const NetworkList = styled.div<{ width: number; mt: number; mb: number }>`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(${({ width }) => width}, 1fr);
  width: 100%;
  margin-top: ${({ mt }) => mt}px;
  margin-bottom: ${({ mb }) => mb}px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 1fr;
  `}
`

const Networks = ({
  onChangedNetwork,
  width = 3,
  mt = 30,
  mb = 0,
}: {
  onChangedNetwork?: () => any
  width: number
  mt?: number
  mb?: number
}) => {
  const { chainId } = useActiveWeb3React()
  const changeNetwork = useChangeNetwork()
  const qs = useParsedQueryString()
  const history = useHistory()
  const isDarkMode = useIsDarkMode()

  return (
    <NetworkList width={width} mt={mt} mb={mb}>
      {MAINNET_NETWORKS.map((key: ChainId, i: number) => {
        if (chainId === key) {
          return (
            <SelectNetworkButton key={i} padding="0">
              <ListItem selected>
                <img
                  src={
                    isDarkMode && !!NETWORKS_INFO[key].iconDark ? NETWORKS_INFO[key].iconDark : NETWORKS_INFO[key].icon
                  }
                  alt="Switch Network"
                  style={{ height: '20px', marginRight: '4px' }}
                />
                <NetworkLabel>{NETWORKS_INFO[key].name}</NetworkLabel>
              </ListItem>
            </SelectNetworkButton>
          )
        }

        return (
          <SelectNetworkButton
            key={i}
            padding="0"
            onClick={() => {
              changeNetwork(key, () => {
                const { networkId, inputCurrency, outputCurrency, ...rest } = qs
                history.replace({
                  search: stringify(rest),
                })
                onChangedNetwork?.()
              })
            }}
          >
            <ListItem>
              <img
                src={
                  isDarkMode && !!NETWORKS_INFO[key].iconDark ? NETWORKS_INFO[key].iconDark : NETWORKS_INFO[key].icon
                }
                alt="Switch Network"
                style={{ height: '20px', marginRight: '4px' }}
              />
              <NetworkLabel>{NETWORKS_INFO[key].name}</NetworkLabel>
            </ListItem>
          </SelectNetworkButton>
        )
      })}
    </NetworkList>
  )
}

export default Networks

import { t } from '@lingui/macro'
import { darken, lighten } from 'polished'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import Profile from 'components/Icons/Profile'
import { useActiveWeb3React } from 'hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'

const Web3StatusGeneric = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  align-items: center;
  padding: 10px 12px;
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{ pending?: boolean }>`
  background-color: ${({ pending, theme }) => (pending ? theme.primary : theme.buttonGray)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.primary : theme.buttonGray)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.subText)};
  font-weight: 500;
  :hover,
  :focus {
    background-color: ${({ pending, theme }) =>
      pending ? darken(0.05, theme.primary) : lighten(0.05, theme.buttonGray)};
    border: 1px solid ${({ theme }) => theme.primary};
  }
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.25rem 0 0.5rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
`

const AccountElement = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 999px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;
  pointer-events: auto;
  height: 42px;
`

export default function SelectWallet() {
  const { chainId, account } = useActiveWeb3React()
  const { isLogin } = useSessionInfo()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  if (!account) return null
  return (
    <AccountElement>
      <Web3StatusConnected>
        <Profile size={18} />
        {!isMobile && <Text>{isLogin ? shortenAddress(chainId, account ?? '') : t`Guest`}</Text>}
      </Web3StatusConnected>
    </AccountElement>
  )
}

import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled, { keyframes } from 'styled-components'

import { ReactComponent as WalletIcon } from 'assets/svg/wallet_icon.svg'
import Row from 'components/Row'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'

const slideInFromBottom = keyframes`
  0%{
    transform: translateY(100%)
  }
  100%{
    transform: translateY(0)

  }
`
const Wrapper = styled(Row)`
  background-color: ${({ theme }) => theme.background};
  height: 44px;
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  justify-content: center;
  gap: 8px;
  z-index: ${Z_INDEXS.TRUE_SIGHT_FOOTER};
  padding: 0px 20px;
  animation: ${slideInFromBottom} 1s ease-out forwards;
  animation-delay: 3s;
  transform: translateY(100%);
  ${({ theme }) => theme.mediaWidth.upToLarge`
    display:none;
  `};
`
export default function TruesightFooter() {
  const toggle = useWalletModalToggle()
  const { account } = useActiveWeb3React()
  if (account) return <></>
  return (
    <Wrapper>
      <Flex onClick={toggle} alignItems={'center'} style={{ gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
        <WalletIcon />
        <Text fontSize={'14px'} fontWeight={'500'}>
          <Trans>Connect your wallet to start trading</Trans>
        </Text>
      </Flex>
    </Wrapper>
  )
}

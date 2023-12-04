import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import { PrimaryText } from 'components/WalletPopup/Transactions/TransactionItem'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'

const StyledLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
  :hover {
    text-decoration: none;
    color: ${({ theme }) => theme.text};
  }
`
const ContractAddress = ({ contract }: { contract: string }) => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  return contract ? (
    <PrimaryText style={{ display: 'flex', color: theme.text, gap: 4, alignItems: 'center' }}>
      <StyledLink href={getEtherscanLink(chainId, contract, 'address')}>{getShortenAddress(contract)}</StyledLink>
      <CopyHelper toCopy={contract} margin="0" />
    </PrimaryText>
  ) : null
}
export default ContractAddress

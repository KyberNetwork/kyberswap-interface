import { t } from '@lingui/macro'

import CopyHelper from 'components/Copy'
import { PrimaryText } from 'components/WalletPopup/Transactions/TransactionItem'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'

const ContractAddress = ({ transaction }: { transaction: TransactionDetails }) => {
  const { extraInfo = {}, type } = transaction
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  const prefix = type === TRANSACTION_TYPE.TRANSFER_TOKEN ? t`to` : t`contract`

  return extraInfo.contract ? (
    <PrimaryText style={{ display: 'flex', color: theme.text, gap: 4, alignItems: 'center' }}>
      <ExternalLink
        href={getEtherscanLink(chainId, extraInfo.contract, 'address')}
        className="!text-text hover:!text-text hover:!no-underline"
      >
        {prefix}: {getShortenAddress(extraInfo.contract)}
      </ExternalLink>
      <CopyHelper toCopy={extraInfo.contract} margin="0" />
    </PrimaryText>
  ) : null
}
export default ContractAddress

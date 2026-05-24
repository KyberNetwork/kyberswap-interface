import { t } from '@lingui/macro'

import CopyHelper from 'components/Copy'
import { PrimaryText } from 'components/WalletPopup/Transactions/TransactionItem'
import { useActiveWeb3React } from 'hooks'
import { TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'

const ContractAddress = ({ transaction }: { transaction: TransactionDetails }) => {
  const { extraInfo = {}, type } = transaction
  const { chainId } = useActiveWeb3React()

  const prefix = type === TRANSACTION_TYPE.TRANSFER_TOKEN ? t`to` : t`contract`

  return extraInfo.contract ? (
    <PrimaryText className="!text-text" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
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

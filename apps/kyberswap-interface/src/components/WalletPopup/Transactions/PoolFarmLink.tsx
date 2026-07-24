import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import SendIcon from 'components/Icons/SendIcon'
import { getTokenLogo } from 'components/WalletPopup/Transactions/helper'
import { LEGACY_POOL_APP_PATHS } from 'constants/legacyPools'
import { TRANSACTION_TYPE, TransactionDetails, TransactionExtraInfo2Token } from 'state/transactions/type'
import { ExternalLink } from 'theme'

const PoolFarmLink = ({ transaction }: { transaction: TransactionDetails }) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbolIn, tokenSymbolOut, tokenAddressIn, tokenAddressOut, contract } =
    extraInfo as TransactionExtraInfo2Token

  if (!contract || !(tokenSymbolIn && tokenSymbolOut)) return null

  const isFarm = [TRANSACTION_TYPE.HARVEST].includes(type)
  const isElastic = [
    TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.COLLECT_FEE,
    TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_ZAP_IN_LIQUIDITY,
    TRANSACTION_TYPE.HARVEST,
  ].includes(type)

  const logoUrlIn = getTokenLogo(tokenAddressIn)
  const logoUrlOut = getTokenLogo(tokenAddressOut)
  return (
    <ExternalLink
      href={`${window.location.origin}${
        isFarm ? LEGACY_POOL_APP_PATHS.FARMS : LEGACY_POOL_APP_PATHS.MY_POOLS
      }?search=${contract}&tab=${isElastic ? 'elastic' : 'classic'}`}
    >
      <span className="flex items-center gap-1">
        <DoubleCurrencyLogoV2 style={{ marginRight: 12 }} logoUrl1={logoUrlIn} logoUrl2={logoUrlOut} size={16} />
        <span className="text-xs">
          {tokenSymbolIn}/{tokenSymbolOut}
        </span>
        <SendIcon size={10} />
      </span>
    </ExternalLink>
  )
}
export default PoolFarmLink

import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import IconFailure from 'assets/svg/notification_icon_failure.svg'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NotificationType } from 'state/application/hooks'
import { useAllTransactions } from 'state/transactions/hooks'
import {
  TRANSACTION_TYPE,
  TransactionDetails,
  TransactionExtraBaseInfo,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
} from 'state/transactions/type'
import { ExternalLink, HideSmall } from 'theme'
import { findTx, getEtherscanLink } from 'utils'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

type SummaryFunction = (summary: TransactionDetails) => { success: string; error: string } | string

const summaryBasic = (txs: TransactionDetails) => {
  const { summary = '' } = (txs.extraInfo || {}) as TransactionExtraBaseInfo
  return `${txs.type} ${summary}`
}

// ex: approve 3 knc
const summary1Token = (txs: TransactionDetails) => {
  const { tokenAmount, tokenSymbol } = (txs.extraInfo || {}) as TransactionExtraInfo1Token
  return `${txs.type} ${tokenAmount} ${tokenSymbol}`
}

// ex: swap 2knc to 3eth
const summary2Token = (txs: TransactionDetails, withType = true) => {
  const { tokenAmountIn, tokenSymbolIn, tokenAmountOut, tokenSymbolOut } = (txs.extraInfo ||
    {}) as TransactionExtraInfo2Token
  return `${withType ? txs.type : ''} ${tokenAmountIn} ${tokenSymbolIn} to ${tokenAmountOut} ${tokenSymbolOut}`
}

// ex: approve knc, approve elastic farm, claim rewards
const summaryApproveOrClaim = (txs: TransactionDetails) => {
  const { tokenSymbol } = (txs.extraInfo || {}) as TransactionExtraInfo1Token
  const { summary } = (txs.extraInfo || {}) as TransactionExtraBaseInfo
  return `${txs.type} ${summary ?? tokenSymbol}`
}

// ex: elastic add liquidity 30 knc and 40 usdt
const summaryLiquidity = (txs: TransactionDetails) => {
  const extraInfo = txs.extraInfo || {}
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut } = extraInfo as TransactionExtraInfo2Token
  const { tokenSymbol, tokenAmount } = extraInfo as TransactionExtraInfo1Token
  return `${txs.type} ${
    tokenSymbol && tokenAmount
      ? `${tokenAmount} ${tokenSymbol}`
      : `${tokenAmountIn} ${tokenSymbolIn} and ${tokenAmountOut} ${tokenSymbolOut}`
  }`
}

const summaryBridge = (txs: TransactionDetails) => {
  const {
    tokenAmountIn,
    tokenAmountOut,
    tokenSymbolIn,
    tokenSymbolOut,
    chainIdIn = ChainId.MAINNET,
    chainIdOut = ChainId.MAINNET,
  } = (txs.extraInfo || {}) as TransactionExtraInfo2Token
  const summary = `Your bridge transaction from ${tokenAmountIn} ${tokenSymbolIn} (${NETWORKS_INFO[chainIdIn].name}}) to ${tokenAmountOut} ${tokenSymbolOut} (${NETWORKS_INFO[chainIdOut].name}})`
  return { success: `${summary} is being processed`, error: `${summary} failed` }
}

const summaryDelegateDao = (txs: TransactionDetails) => {
  const { contract = '' } = (txs.extraInfo || {}) as TransactionExtraBaseInfo
  const summary =
    txs.type === TRANSACTION_TYPE.KYBERDAO_UNDELEGATE
      ? t`undelegated your voting power`
      : t`delegated voting power to ${contract.slice(0, 6)}...${contract.slice(-4)}`

  return { success: t`You have successfully ${summary}`, error: t`Error ${summary}` }
}

const summaryCancelLimitOrder = (txs: TransactionDetails) => {
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut } = (txs.extraInfo ||
    {}) as TransactionExtraInfo2Token
  const summary = txs.extraInfo
    ? t`order to pay ${tokenAmountIn} ${tokenSymbolIn} and receive ${tokenAmountOut} ${tokenSymbolOut}`
    : t`all orders`
  return { success: `Your cancellation ${summary} has been submitted`, error: `Error cancel ${summary}` }
}

const summaryTypeOnly = (txs: TransactionDetails) => `${txs.type}`

// to render summary in notify transaction
const SUMMARY: { [type in TRANSACTION_TYPE]: SummaryFunction } = {
  [TRANSACTION_TYPE.WRAP_TOKEN]: summary2Token,
  [TRANSACTION_TYPE.UNWRAP_TOKEN]: summary2Token,
  [TRANSACTION_TYPE.APPROVE]: summaryApproveOrClaim,
  [TRANSACTION_TYPE.SWAP]: summary2Token,

  [TRANSACTION_TYPE.BRIDGE]: summaryBridge,

  [TRANSACTION_TYPE.CREATE_POOL]: summaryLiquidity,
  [TRANSACTION_TYPE.ELASTIC_CREATE_POOL]: summaryLiquidity,
  [TRANSACTION_TYPE.ADD_LIQUIDITY]: summaryLiquidity,
  [TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY]: summaryLiquidity,
  [TRANSACTION_TYPE.REMOVE_LIQUIDITY]: summaryLiquidity,
  [TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY]: summaryLiquidity,
  [TRANSACTION_TYPE.INCREASE_LIQUIDITY]: summaryLiquidity,
  [TRANSACTION_TYPE.COLLECT_FEE]: summaryLiquidity,

  [TRANSACTION_TYPE.STAKE]: summaryBasic,
  [TRANSACTION_TYPE.UNSTAKE]: summaryBasic,
  [TRANSACTION_TYPE.HARVEST]: () => 'Harvested rewards',
  [TRANSACTION_TYPE.CLAIM_REWARD]: summaryApproveOrClaim,
  [TRANSACTION_TYPE.DEPOSIT]: summaryBasic,
  [TRANSACTION_TYPE.WITHDRAW]: summaryBasic,

  [TRANSACTION_TYPE.FORCE_WITHDRAW]: summaryTypeOnly,
  [TRANSACTION_TYPE.SETUP_SOLANA_SWAP]: summaryTypeOnly,
  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: summaryCancelLimitOrder,
  [TRANSACTION_TYPE.TRANSFER_TOKEN]: summary1Token,

  [TRANSACTION_TYPE.KYBERDAO_CLAIM]: summaryBasic,
  [TRANSACTION_TYPE.KYBERDAO_UNDELEGATE]: summaryDelegateDao,
  [TRANSACTION_TYPE.KYBERDAO_MIGRATE]: summary2Token,
  [TRANSACTION_TYPE.KYBERDAO_STAKE]: summary1Token,
  [TRANSACTION_TYPE.KYBERDAO_UNSTAKE]: summary1Token,
  [TRANSACTION_TYPE.KYBERDAO_VOTE]: summaryTypeOnly,
  [TRANSACTION_TYPE.KYBERDAO_DELEGATE]: summaryDelegateDao,
}

const CUSTOM_STATUS: { [key in string]: string } = {
  [TRANSACTION_TYPE.BRIDGE]: '- Processing',
  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: 'Submitted',
}

const getTitle = (type: string, success: boolean) => {
  const statusText = success ? 'Success' : 'Error'
  if (success && CUSTOM_STATUS[type]) {
    return `${type} ${CUSTOM_STATUS[type]}!`
  }
  return `${type} - ${statusText}!`
}

export const getTransactionStatus = (transaction: TransactionDetails) => {
  const pending = !transaction?.receipt
  const success =
    !pending && transaction && (transaction.receipt?.status === 1 || typeof transaction.receipt?.status === 'undefined')
  return { pending, success }
}

const getSummary = (transaction: TransactionDetails) => {
  const type = transaction?.type
  const { success } = getTransactionStatus(transaction)

  const shortHash = 'Hash: ' + transaction.hash.slice(0, 8) + '...' + transaction.hash.slice(58, 65)

  const summary = transaction.group ? SUMMARY[type]?.(transaction) ?? shortHash : shortHash

  let formatSummary
  if (summary === shortHash) {
    formatSummary = summary
  } else if (typeof summary === 'string') {
    formatSummary = success ? summary : `Error ${summary}`
  } else {
    formatSummary = success ? summary.success : summary.error
  }

  return { title: getTitle(type, success), summary: formatSummary }
}

export default function TransactionPopup({ hash, notiType }: { hash: string; notiType: NotificationType }) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const success = notiType === NotificationType.SUCCESS
  const transactions = useAllTransactions()
  const transaction = findTx(transactions, hash)
  const color = success ? theme.primary : theme.red

  if (!transaction) return null
  const { title, summary } = getSummary(transaction)

  return (
    <Box>
      <RowNoFlex>
        <div style={{ paddingRight: 16 }}>
          <img src={success ? IconSuccess : IconFailure} alt="Icon status" style={{ display: 'block' }} />
        </div>
        <AutoColumn gap="8px">
          <Text fontSize="16px" fontWeight={500} color={color}>
            {title}
          </Text>
          <Text fontSize="14px" fontWeight={400} color={theme.text} lineHeight={1.6}>
            {summary}
          </Text>
        </AutoColumn>
      </RowNoFlex>
      <HideSmall style={{ margin: '8px 0 0 40px', display: 'block' }}>
        <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')} style={{ color: color, fontSize: 14 }}>
          <Trans>View transaction</Trans>
        </ExternalLink>
      </HideSmall>
    </Box>
  )
}

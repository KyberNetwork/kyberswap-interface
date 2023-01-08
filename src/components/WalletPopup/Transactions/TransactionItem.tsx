import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import Logo, { NetworkLogo } from 'components/Logo'
import Row from 'components/Row'
import { NETWORKS_INFO } from 'constants/networks'
import { findCacheToken } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import {
  TRANSACTION_TYPE,
  TransactionDetails,
  TransactionExtraBaseInfo,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
} from 'state/transactions/type'
import { ExternalLinkIcon } from 'theme'
import { getEtherscanLink } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'

const ItemWrapper = styled(Column)`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 16px 0px;
  width: 100%;
  gap: 4px;
`

const TokenLogo = styled(Logo)`
  width: 16px;
  height: 16px;
  border-radius: 100%;
`

const ColumGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const PrimaryText = styled(Text)`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

const SecondaryText = styled.span`
  color: ${({ theme }) => theme.border};
  font-size: 12px;
`

const DeltaAmount = ({
  symbol,
  amount,
  tokenAddress,
  plus,
}: {
  symbol?: string
  amount?: string
  tokenAddress?: string
  plus?: boolean
}) => {
  const withSign = plus !== undefined
  const theme = useTheme()
  const sign = amount === undefined || !withSign ? null : plus ? '+' : '-'
  const color = plus ? theme.primary : theme.subText
  const logoUrl = findCacheToken(tokenAddress ?? '')?.logoURI
  return (
    <Flex fontSize={12} alignItems="center" style={{ gap: 4 }}>
      {logoUrl && <TokenLogo srcs={[logoUrl]} />}
      <PrimaryText style={{ color: withSign ? color : theme.subText }}>
        {sign} {amount} {symbol}
      </PrimaryText>
    </Flex>
  )
}

const ContractAddress = ({ transaction }: { transaction: TransactionDetails }) => {
  const { extraInfo = {}, type } = transaction
  return extraInfo.contract ? (
    <SecondaryText style={{ display: 'flex' }}>
      {type === TRANSACTION_TYPE.TRANSFER_TOKEN ? t`to` : t`contract`}: {getShortenAddress(extraInfo.contract)}
      <CopyHelper toCopy={extraInfo.contract} />
    </SecondaryText>
  ) : null
}

const renderDescriptionLiquidity = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const {
    tokenAmountIn,
    tokenAmountOut,
    tokenSymbolIn,
    tokenSymbolOut,
    contract = '',
  } = extraInfo as TransactionExtraInfo2Token
  const { tokenSymbol, tokenAmount, contract: contract2 = '' } = extraInfo as TransactionExtraInfo1Token
  return (
    <>
      <PrimaryText>
        {tokenSymbol && tokenAmount
          ? `${tokenAmount} ${tokenSymbol}`
          : `${tokenAmountIn} ${tokenSymbolIn} and ${tokenAmountOut} ${tokenSymbolOut}`}
      </PrimaryText>
      <PrimaryText>
        <Trans>Pool address</Trans>: {getShortenAddress(contract || contract2)}
      </PrimaryText>
    </>
  )
}

const renderDescriptionCreatePool = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut } = extraInfo as TransactionExtraInfo2Token
  return (
    <>
      <PrimaryText>
        {tokenAmountIn} {tokenSymbolIn} and {tokenAmountOut} {tokenSymbolOut}
      </PrimaryText>
    </>
  )
}

const renderDescriptionBridge = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const {
    tokenAmountIn,
    tokenAmountOut,
    tokenSymbolIn,
    tokenSymbolOut,
    chainIdIn = ChainId.MAINNET,
    chainIdOut = ChainId.MAINNET,
    tokenAddressIn,
    tokenAddressOut,
  } = extraInfo as TransactionExtraInfo2Token
  return (
    <>
      <DeltaAmount
        tokenAddress={tokenAddressOut}
        symbol={`${tokenSymbolOut} (${NETWORKS_INFO[chainIdOut].name})`}
        amount={tokenAmountOut}
        plus
      />
      <DeltaAmount
        tokenAddress={tokenAddressIn}
        symbol={`${tokenSymbolIn} (${NETWORKS_INFO[chainIdIn].name})`}
        amount={tokenAmountIn}
        plus={false}
      />
    </>
  )
}

// ex: approve elastic farm, approve knc
const renderDescriptionApproveClaim = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  const { summary = '' } = extraInfo as TransactionExtraBaseInfo
  const plus = [TRANSACTION_TYPE.CLAIM_REWARD].includes(type)
  return (
    <>
      {summary ? (
        <PrimaryText>{summary}</PrimaryText>
      ) : (
        <DeltaAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
      )}
      <ContractAddress transaction={transaction} />
    </>
  )
}

const renderDescriptionLimitOrder = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut } = extraInfo as TransactionExtraInfo2Token
  if (!tokenAmountIn)
    return (
      <PrimaryText>
        <Trans>Cancel all orders</Trans>
      </PrimaryText>
    )
  return (
    <Row gap="5px">
      <DeltaAmount symbol={tokenSymbolIn} amount={tokenAmountIn} />
      <PrimaryText>
        <Trans>to</Trans>
      </PrimaryText>
      <DeltaAmount symbol={tokenSymbolOut} amount={tokenAmountOut} />
    </Row>
  )
}

// ex: stake -3knc
const renderDescription1Token = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  const plus = [TRANSACTION_TYPE.KYBERDAO_UNSTAKE].includes(type)
  return (
    <>
      <DeltaAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
      <ContractAddress transaction={transaction} />
    </>
  )
}

//ex: +3knc -2usdt
const renderDescription2Token = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut, tokenAddressIn, tokenAddressOut } =
    extraInfo as TransactionExtraInfo2Token
  return (
    <>
      <DeltaAmount tokenAddress={tokenAddressOut} symbol={tokenSymbolOut} amount={tokenAmountOut} plus />
      <DeltaAmount tokenAddress={tokenAddressIn} symbol={tokenSymbolIn} amount={tokenAmountIn} plus={false} />
    </>
  )
}

const renderDescriptionBasic = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { summary = '' } = extraInfo as TransactionExtraBaseInfo
  return (
    <>
      <PrimaryText>{summary}</PrimaryText>
      <ContractAddress transaction={transaction} />
    </>
  )
}

const RENDER_DESCRIPTION_MAP: { [type in TRANSACTION_TYPE]: null | ((txs: TransactionDetails) => ReactNode) } = {
  [TRANSACTION_TYPE.FORCE_WITHDRAW]: renderDescriptionBasic,
  [TRANSACTION_TYPE.STAKE]: renderDescriptionBasic,
  [TRANSACTION_TYPE.DEPOSIT]: renderDescriptionBasic,
  [TRANSACTION_TYPE.WITHDRAW]: renderDescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_CLAIM]: renderDescriptionBasic,
  [TRANSACTION_TYPE.UNSTAKE]: renderDescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_VOTE]: renderDescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_DELEGATE]: renderDescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_UNDELEGATE]: renderDescriptionBasic,

  [TRANSACTION_TYPE.APPROVE]: renderDescriptionApproveClaim,
  [TRANSACTION_TYPE.CLAIM_REWARD]: renderDescriptionApproveClaim,

  [TRANSACTION_TYPE.KYBERDAO_STAKE]: renderDescription1Token,
  [TRANSACTION_TYPE.KYBERDAO_UNSTAKE]: renderDescription1Token,
  [TRANSACTION_TYPE.TRANSFER_TOKEN]: renderDescription1Token,

  [TRANSACTION_TYPE.UNWRAP_TOKEN]: renderDescription2Token,
  [TRANSACTION_TYPE.WRAP_TOKEN]: renderDescription2Token,
  [TRANSACTION_TYPE.SWAP]: renderDescription2Token,
  [TRANSACTION_TYPE.KYBERDAO_MIGRATE]: renderDescription2Token,

  [TRANSACTION_TYPE.BRIDGE]: renderDescriptionBridge,

  [TRANSACTION_TYPE.CREATE_POOL]: renderDescriptionCreatePool,
  [TRANSACTION_TYPE.ELASTIC_CREATE_POOL]: renderDescriptionCreatePool,

  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: renderDescriptionLimitOrder,

  [TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.REMOVE_LIQUIDITY]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.INCREASE_LIQUIDITY]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.COLLECT_FEE]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.ADD_LIQUIDITY]: renderDescriptionLiquidity,

  // to make sure you don't forgot setup
  [TRANSACTION_TYPE.HARVEST]: null,
  [TRANSACTION_TYPE.SETUP_SOLANA_SWAP]: null, // todo danh test it" popup and noti, send token solana
}

function TransactionItem({ transaction, style }: { transaction: TransactionDetails; style: CSSProperties }) {
  const { type, addedTime, hash, chainId } = transaction
  const theme = useTheme()

  return (
    <ItemWrapper style={style}>
      <Row justify="space-between" align="flex-start">
        <ColumGroup>
          <Row gap="5px">
            <NetworkLogo chainId={chainId} style={{ width: 19, height: 19 }} />{' '}
            <Text color={theme.subText}>{type}</Text>{' '}
            <ExternalLinkIcon color={theme.subText} href={getEtherscanLink(chainId, hash, 'transaction')} />
          </Row>
          <SecondaryText>{dayjs(addedTime).format('DD/MM/YYYY HH:mm:ss')}</SecondaryText>
        </ColumGroup>
        <ColumGroup style={{ alignItems: 'flex-end' }}>{RENDER_DESCRIPTION_MAP?.[type]?.(transaction)}</ColumGroup>
      </Row>
    </ItemWrapper>
  )
}
export default TransactionItem

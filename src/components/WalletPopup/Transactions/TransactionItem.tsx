import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, forwardRef } from 'react'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as IconFailure } from 'assets/svg/notification_icon_failure.svg'
import { ReactComponent as IconSuccess } from 'assets/svg/notification_icon_success.svg'
import { ReactComponent as IconWarning } from 'assets/svg/notification_icon_warning.svg'
import CopyHelper from 'components/Copy'
import SendIcon from 'components/Icons/SendIcon'
import Logo from 'components/Logo'
import { getTransactionStatus } from 'components/Popups/TransactionPopup'
import Row from 'components/Row'
import Icon from 'components/WalletPopup/Transactions/Icon'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { findCacheToken } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import {
  TRANSACTION_TYPE,
  TransactionDetails,
  TransactionExtraBaseInfo,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
} from 'state/transactions/type'
import { ExternalLink, ExternalLinkIcon } from 'theme'
import { getEtherscanLink } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'

const ItemWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 16px 0px;
  width: 100%;
  gap: 4px;
  height: 100%;
  justify-content: space-between;
  align-items: flex-start;
  display: flex;
  :last-child {
    border-bottom: none;
  }
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
  height: 100%;
`

const PrimaryText = styled(Text)`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

const SecondaryText = styled.span`
  color: ${({ theme }) => theme.border};
  font-size: 12px;
`

const StyledLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.text};
  :hover {
    text-decoration: none;
    color: ${({ theme }) => theme.text};
  }
`

const DeltaTokenAmount = ({
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
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  const poolTypes = [
    TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.INCREASE_LIQUIDITY,
    TRANSACTION_TYPE.COLLECT_FEE,
    TRANSACTION_TYPE.ADD_LIQUIDITY,
  ]

  const prefix = poolTypes.includes(type)
    ? t`pool address`
    : type === TRANSACTION_TYPE.TRANSFER_TOKEN
    ? t`to`
    : t`contract`

  return extraInfo.contract ? (
    <SecondaryText style={{ display: 'flex', color: theme.text, gap: 4, alignItems: 'center' }}>
      <StyledLink href={getEtherscanLink(chainId, extraInfo.contract, 'address')}>
        {prefix}: {getShortenAddress(extraInfo.contract)}
      </StyledLink>
      {poolTypes.includes(type) ? <SendIcon size={10} /> : <CopyHelper toCopy={extraInfo.contract} margin="0" />}
    </SecondaryText>
  ) : null
}

const renderDescriptionBasic = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { summary = '' } = extraInfo as TransactionExtraBaseInfo
  return <PrimaryText>{summary}</PrimaryText>
}

// ex: stake -3knc
const renderDescription1Token = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  const plus = [TRANSACTION_TYPE.KYBERDAO_UNSTAKE].includes(type)
  return <DeltaTokenAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
}

//ex: +3knc -2usdt
const renderDescription2Token = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut, tokenAddressIn, tokenAddressOut } =
    extraInfo as TransactionExtraInfo2Token
  return (
    <>
      <DeltaTokenAmount tokenAddress={tokenAddressOut} symbol={tokenSymbolOut} amount={tokenAmountOut} plus />
      <DeltaTokenAmount tokenAddress={tokenAddressIn} symbol={tokenSymbolIn} amount={tokenAmountIn} plus={false} />
    </>
  )
}

const renderDescriptionLiquidity = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { tokenSymbol, tokenAmount } = extraInfo as TransactionExtraInfo1Token
  if (tokenSymbol && tokenAmount) {
    return renderDescription2Token(transaction)
  }
  return renderDescription1Token(transaction)
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
      <DeltaTokenAmount
        tokenAddress={tokenAddressOut}
        symbol={`${tokenSymbolOut} (${NETWORKS_INFO[chainIdOut].name})`}
        amount={tokenAmountOut}
        plus
      />
      <DeltaTokenAmount
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
  return summary ? (
    <PrimaryText>{summary}</PrimaryText>
  ) : (
    <DeltaTokenAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
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
    <Row gap="4px">
      <DeltaTokenAmount symbol={tokenSymbolIn} amount={tokenAmountIn} />
      <PrimaryText>
        <Trans>to</Trans>
      </PrimaryText>
      <DeltaTokenAmount symbol={tokenSymbolOut} amount={tokenAmountOut} />
    </Row>
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

  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: renderDescriptionLimitOrder,

  [TRANSACTION_TYPE.CREATE_POOL]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_CREATE_POOL]: renderDescriptionLiquidity,
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
type Prop = {
  transaction: TransactionDetails
  style: CSSProperties
  isMinimal: boolean
}
export default forwardRef<HTMLDivElement, Prop>(function TransactionItem({ transaction, style, isMinimal }: Prop, ref) {
  const { type, addedTime, hash, chainId } = transaction
  const theme = useTheme()
  const { pending, success } = getTransactionStatus(transaction)

  return (
    <ItemWrapper style={style} ref={ref}>
      <ColumGroup>
        <Row gap="8px">
          {!isMinimal && (
            <Flex alignItems="center" color={theme.text}>
              <Icon txs={transaction} />
            </Flex>
          )}
          <Text color={theme.text} fontSize="14px">
            {type}
          </Text>{' '}
          <ExternalLinkIcon color={theme.subText} href={getEtherscanLink(chainId, hash, 'transaction')} />
        </Row>
        {RENDER_DESCRIPTION_MAP?.[type]?.(transaction)}
      </ColumGroup>
      <ColumGroup style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Flex style={{ gap: '4px' }} alignItems={'center'}>
          <PrimaryText color={theme.text}> {pending ? t`Pending` : success ? t`Completed` : t`Error`}</PrimaryText>
          {pending ? (
            <IconWarning width={'14px'} />
          ) : success ? (
            <IconSuccess width={'15px'} height="15px" />
          ) : (
            <IconFailure width={'15px'} />
          )}
        </Flex>
        <ContractAddress transaction={transaction} />
        <SecondaryText>{dayjs(addedTime).format('DD/MM/YYYY HH:mm:ss')}</SecondaryText>
      </ColumGroup>
    </ItemWrapper>
  )
})

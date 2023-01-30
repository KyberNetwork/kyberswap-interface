import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import axios from 'axios'
import dayjs from 'dayjs'
import { debounce } from 'lodash'
import { ReactNode, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Repeat } from 'react-feather'
import { useDispatch } from 'react-redux'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as ArrowDown } from 'assets/svg/arrow_down.svg'
import { ReactComponent as IconFailure } from 'assets/svg/notification_icon_failure.svg'
import { ReactComponent as IconSuccess } from 'assets/svg/notification_icon_success.svg'
import { ReactComponent as IconWarning } from 'assets/svg/notification_icon_warning.svg'
import CopyHelper from 'components/Copy'
import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import SendIcon from 'components/Icons/SendIcon'
import Loader from 'components/Loader'
import Logo, { NetworkLogo } from 'components/Logo'
import { getTransactionStatus } from 'components/Popups/TransactionPopup'
import Row from 'components/Row'
import Icon from 'components/WalletPopup/Transactions/Icon'
import { CancellingOrderInfo } from 'components/swapv2/LimitOrder/useCancellingOrders'
import { KS_SETTING_API } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { findCacheToken } from 'hooks/Tokens'
import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { AppDispatch } from 'state'
import { modifyTransaction } from 'state/transactions/actions'
import {
  TRANSACTION_TYPE,
  TransactionDetails,
  TransactionExtraBaseInfo,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token, // TransactionExtraInfoHarvestFarm,
  // TransactionExtraInfoStakeFarm,
} from 'state/transactions/type'
import { ExternalLink, ExternalLinkIcon } from 'theme'
import { getEtherscanLink } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'

const ItemWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 14px 0px;
  width: 100%;
  gap: 10px;
  height: 100%;
  justify-content: space-between;
  display: flex;
  flex-direction: column;
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

const StyledLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.text};
  :hover {
    text-decoration: none;
    color: ${({ theme }) => theme.text};
  }
`

const TokenAmountWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
`

const getTokenLogo = (address: string | undefined) => findCacheToken(address ?? '')?.logoURI ?? ''

const DeltaTokenAmount = ({
  symbol,
  amount,
  tokenAddress,
  plus,
  whiteColor,
}: {
  symbol?: string
  amount?: string
  tokenAddress?: string
  plus?: boolean
  whiteColor?: boolean
}) => {
  const withSign = plus !== undefined
  const theme = useTheme()
  const sign = amount === undefined || !withSign ? null : plus ? '+' : '-'
  const color = whiteColor ? theme.text : plus ? theme.primary : theme.subText
  const logoUrl = getTokenLogo(tokenAddress)
  return (
    <TokenAmountWrapper>
      {logoUrl && <TokenLogo srcs={[logoUrl]} />}
      <PrimaryText style={{ color }}>
        {sign} {amount} {symbol}
      </PrimaryText>
    </TokenAmountWrapper>
  )
}

const ContractAddress = ({ transaction }: { transaction: TransactionDetails }) => {
  const { extraInfo = {}, type } = transaction
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  const prefix = type === TRANSACTION_TYPE.TRANSFER_TOKEN ? t`to` : t`contract`

  return extraInfo.contract ? (
    <PrimaryText style={{ display: 'flex', color: theme.text, gap: 4, alignItems: 'center' }}>
      <StyledLink href={getEtherscanLink(chainId, extraInfo.contract, 'address')}>
        {prefix}: {getShortenAddress(extraInfo.contract)}
      </StyledLink>
      <CopyHelper toCopy={extraInfo.contract} margin="0" />
    </PrimaryText>
  ) : null
}

const renderDescriptionBasic = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { summary = '' } = extraInfo as TransactionExtraBaseInfo
  return <PrimaryText>{summary}</PrimaryText>
}

// ex: claim 3knc
const renderDescription1Token = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  // +10KNC or -10KNC
  const plus = [TRANSACTION_TYPE.KYBERDAO_CLAIM].includes(type)
  return <DeltaTokenAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
}

// ex: stake -3knc
const renderDescriptionKyberDaoStake = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  const votingPower = extraInfo?.tracking?.votingPower
  const isUnstake = type === TRANSACTION_TYPE.KYBERDAO_UNSTAKE

  return (
    <>
      {isUnstake ? null : <DeltaTokenAmount symbol={t`voting power`} amount={votingPower + '%'} plus={!isUnstake} />}
      <DeltaTokenAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={isUnstake} />
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
      <DeltaTokenAmount tokenAddress={tokenAddressOut} symbol={tokenSymbolOut} amount={tokenAmountOut} plus />
      <DeltaTokenAmount tokenAddress={tokenAddressIn} symbol={tokenSymbolIn} amount={tokenAmountIn} plus={false} />
    </>
  )
}

const PoolFarmLink = ({ transaction }: { transaction: TransactionDetails }) => {
  const { extraInfo = {}, type } = transaction
  const { contract, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  if (!contract) return null

  const { tokenSymbolIn, tokenSymbolOut, tokenAddressIn, tokenAddressOut } = extraInfo as TransactionExtraInfo2Token
  const isFarm = [TRANSACTION_TYPE.HARVEST].includes(type)
  const isElastic = [
    TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_COLLECT_FEE,
    TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY,
    TRANSACTION_TYPE.HARVEST,
  ].includes(type)
  const logoUrlIn = getTokenLogo(tokenAddressIn ?? tokenAddress)
  const logoUrlOut = getTokenLogo(tokenAddressOut ?? tokenAddress)
  return (
    <ExternalLink
      href={`${window.location.origin}${isFarm ? APP_PATHS.FARMS : APP_PATHS.MY_POOLS}?search=${contract}&tab=${
        isElastic ? 'elastic' : 'classic'
      }`}
    >
      <Flex alignItems="center" style={{ gap: 4 }}>
        <DoubleCurrencyLogoV2 style={{ marginRight: 12 }} logoUrl1={logoUrlIn} logoUrl2={logoUrlOut} size={16} />
        <Text fontSize={12}>
          {tokenSymbolIn}/{tokenSymbolOut}
        </Text>
        <SendIcon size={10} />
      </Flex>
    </ExternalLink>
  )
}

const renderDescriptionLiquidity = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { tokenSymbol, tokenAmount } = extraInfo as TransactionExtraInfo1Token
  return {
    leftComponent:
      tokenSymbol && tokenAmount ? renderDescription1Token(transaction) : renderDescription2Token(transaction),
    rightComponent: <PoolFarmLink transaction={transaction} />,
  }
}

const renderDescriptionBridge = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const {
    tokenAmountIn,
    tokenSymbolIn,
    chainIdIn = ChainId.MAINNET,
    chainIdOut = ChainId.MAINNET,
    tokenAddressIn,
  } = extraInfo as TransactionExtraInfo2Token

  return {
    leftComponent: (
      <>
        <div style={{ position: 'relative' }}>
          <TokenAmountWrapper>
            <NetworkLogo chainId={chainIdIn} style={{ width: 12, height: 12 }} />
            <PrimaryText>{NETWORKS_INFO[chainIdIn].name}</PrimaryText>
          </TokenAmountWrapper>
          <ArrowDown style={{ position: 'absolute', left: 4, height: 10 }} />
        </div>
        <TokenAmountWrapper>
          <NetworkLogo chainId={chainIdOut} style={{ width: 12, height: 12 }} />
          <PrimaryText>{NETWORKS_INFO[chainIdOut].name}</PrimaryText>
        </TokenAmountWrapper>
      </>
    ),
    rightComponent: (
      <DeltaTokenAmount whiteColor symbol={tokenSymbolIn} amount={tokenAmountIn} tokenAddress={tokenAddressIn} />
    ),
  }
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

function useCheckPendingTransaction(transactions: TransactionDetails[]) {
  //
}

const isTxsPendingTooLong = (txs: TransactionDetails) => {
  const { pending: pendingTxsStatus } = getTransactionStatus(txs)
  return pendingTxsStatus && Date.now() - txs.addedTime > 5 * 60_1000 // 5 mins
}

const StatusIcon = ({
  transaction,
  cancellingOrderInfo,
}: {
  transaction: TransactionDetails
  cancellingOrderInfo: CancellingOrderInfo
}) => {
  const { type, hash, extraInfo, chainId } = transaction
  const { pending: pendingTxsStatus, success } = getTransactionStatus(transaction)
  const needCheckPending =
    [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER, TRANSACTION_TYPE.BRIDGE].includes(type) &&
    success &&
    !extraInfo?.tracking?.actuallySuccess
  const isPendingTooLong = isTxsPendingTooLong(transaction)
  const [isPendingState, setIsPendingState] = useState<boolean | null>(null)
  const dispatch = useDispatch<AppDispatch>()
  const { cancellingOrdersIds, cancellingOrdersNonces, loading } = cancellingOrderInfo

  const pending = isPendingState

  const interval = useRef<NodeJS.Timeout>()

  const checkStatus = useCallback(async () => {
    try {
      const actuallySuccess = extraInfo?.tracking?.actuallySuccess
      if (actuallySuccess && interval.current) {
        clearInterval(interval.current)
        return
      }
      const orderId = extraInfo?.tracking?.order_id

      let isPending = false
      const hasLoading = type === TRANSACTION_TYPE.CANCEL_LIMIT_ORDER && loading
      switch (type) {
        case TRANSACTION_TYPE.CANCEL_LIMIT_ORDER:
          isPending = cancellingOrdersIds.includes(orderId) || cancellingOrdersNonces.length > 0
          break
        case TRANSACTION_TYPE.BRIDGE: {
          const { data: response } = await axios.get(`${KS_SETTING_API}/v1/multichain-transfers/${hash}`)
          isPending = response?.data?.status === MultichainTransferStatus.Processing
          break
        }
      }
      if (!isPending && !hasLoading) {
        dispatch(
          modifyTransaction({
            chainId,
            hash,
            extraInfo: { ...extraInfo, tracking: { ...(extraInfo?.tracking ?? {}), actuallySuccess: true } },
          }),
        )
      }
      setIsPendingState(isPending)
    } catch (error) {
      console.log(error)
      interval.current && clearInterval(interval.current)
    }
  }, [cancellingOrdersIds, cancellingOrdersNonces, chainId, dispatch, extraInfo, hash, type, loading])

  const checkStatusDebound = useMemo(() => debounce(checkStatus, 1000), [checkStatus])

  useEffect(() => {
    const invertalTypes = [TRANSACTION_TYPE.BRIDGE]
    if (!needCheckPending) {
      setIsPendingState(pendingTxsStatus)
      return
    }
    checkStatusDebound()
    if (invertalTypes.includes(type)) interval.current = setInterval(checkStatusDebound, 5000)
    return () => interval.current && clearInterval(interval.current)
  }, [needCheckPending, pendingTxsStatus, checkStatusDebound, type])

  const theme = useTheme()
  const checkingStatus = pending === null
  return (
    <Flex style={{ gap: '4px', minWidth: 'unset' }} alignItems={'center'}>
      <PrimaryText color={theme.text}>
        {checkingStatus
          ? t`Checking`
          : pending
          ? isPendingTooLong
            ? t`Pending`
            : t`Processing`
          : success
          ? t`Completed`
          : t`Failed`}
      </PrimaryText>
      {checkingStatus ? (
        <Loader size={'12px'} />
      ) : pending ? (
        isPendingTooLong ? (
          <IconWarning width={'14px'} />
        ) : (
          <Repeat size={14} color={theme.warning} />
        )
      ) : success ? (
        <IconSuccess width={'15px'} height="15px" />
      ) : (
        <IconFailure width={'15px'} />
      )}
    </Flex>
  )
}

const RENDER_DESCRIPTION_MAP: {
  [type in TRANSACTION_TYPE]: (
    txs: TransactionDetails,
  ) => null | JSX.Element | { leftComponent: ReactNode; rightComponent: ReactNode }
} = {
  [TRANSACTION_TYPE.STAKE]: renderDescriptionBasic,
  [TRANSACTION_TYPE.ELASTIC_FORCE_WITHDRAW_LIQUIDITY]: renderDescriptionBasic,
  [TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY]: renderDescriptionBasic,
  [TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY]: renderDescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_CLAIM]: renderDescription1Token,
  [TRANSACTION_TYPE.UNSTAKE]: renderDescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_VOTE]: renderDescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_DELEGATE]: renderDescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_UNDELEGATE]: renderDescriptionBasic,

  [TRANSACTION_TYPE.APPROVE]: renderDescriptionApproveClaim,
  [TRANSACTION_TYPE.CLAIM_REWARD]: renderDescriptionApproveClaim,

  [TRANSACTION_TYPE.KYBERDAO_STAKE]: renderDescriptionKyberDaoStake,
  [TRANSACTION_TYPE.KYBERDAO_UNSTAKE]: renderDescriptionKyberDaoStake,
  [TRANSACTION_TYPE.TRANSFER_TOKEN]: renderDescription1Token,

  [TRANSACTION_TYPE.UNWRAP_TOKEN]: renderDescription2Token,
  [TRANSACTION_TYPE.WRAP_TOKEN]: renderDescription2Token,
  [TRANSACTION_TYPE.SWAP]: renderDescription2Token,
  [TRANSACTION_TYPE.KYBERDAO_MIGRATE]: renderDescription2Token,

  [TRANSACTION_TYPE.BRIDGE]: renderDescriptionBridge,

  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: renderDescriptionLimitOrder,

  [TRANSACTION_TYPE.CLASSIC_CREATE_POOL]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_CREATE_POOL]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY]: renderDescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_COLLECT_FEE]: renderDescriptionLiquidity,

  [TRANSACTION_TYPE.HARVEST]: renderDescriptionBasic,

  // to make sure you don't forgot setup
  [TRANSACTION_TYPE.SETUP_SOLANA_SWAP]: () => null, // todo danh test it" popup and noti, send token solana
}

function PendingWarning() {
  const theme = useTheme()
  return (
    <ErrorWarningPanel
      style={{ borderRadius: 20, padding: '10px 14px' }}
      type="error"
      title={
        <Text color={theme.red}>
          <Trans>
            Transaction stuck?{' '}
            <ExternalLink href="https://support.kyberswap.com/hc/en-us/articles/13785666409881-Why-is-my-transaction-stuck-in-Pending-state-">
              See here
            </ExternalLink>
          </Trans>
        </Text>
      }
    />
  )
}

type Prop = {
  transaction: TransactionDetails
  style: CSSProperties
  isMinimal: boolean
  cancellingOrderInfo: CancellingOrderInfo
}
export default forwardRef<HTMLDivElement, Prop>(function TransactionItem(
  { transaction, style, isMinimal, cancellingOrderInfo }: Prop,
  ref,
) {
  const { type, addedTime, hash, chainId } = transaction
  const theme = useTheme()

  const info: any = RENDER_DESCRIPTION_MAP?.[type]?.(transaction) ?? { leftComponent: null, rightComponent: null }
  const leftComponent: ReactNode = info.leftComponent !== undefined ? info.leftComponent : info
  const rightComponent: ReactNode = info.rightComponent
  const isPendingTooLong = isTxsPendingTooLong(transaction)

  return (
    <ItemWrapper style={style} ref={ref} data-stalled={isPendingTooLong}>
      {isPendingTooLong && <PendingWarning />}
      <Flex justifyContent="space-between" alignItems="flex-end">
        <Row gap="6px">
          {!isMinimal && (
            <Flex alignItems="center" color={theme.text}>
              <Icon txs={transaction} />
            </Flex>
          )}
          <Text color={theme.text} fontSize="14px">
            {type}
          </Text>
          <ExternalLinkIcon color={theme.subText} href={getEtherscanLink(chainId, hash, 'transaction')} />
        </Row>
        <StatusIcon transaction={transaction} cancellingOrderInfo={cancellingOrderInfo} />
      </Flex>

      <Flex justifyContent="space-between">
        <ColumGroup>{leftComponent}</ColumGroup>
        <ColumGroup style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
          {rightComponent || <ContractAddress transaction={transaction} />}
          <PrimaryText>{dayjs(addedTime).format('DD/MM/YYYY HH:mm:ss')}</PrimaryText>
        </ColumGroup>
      </Flex>
    </ItemWrapper>
  )
})

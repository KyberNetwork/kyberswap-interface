import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { CSSProperties, ReactNode, forwardRef } from 'react'

import { ReactComponent as NftIcon } from 'assets/svg/nft_icon.svg'
import SendIcon from 'components/Icons/SendIcon'
import Row from 'components/Row'
import ContractAddress from 'components/WalletPopup/Transactions/ContractAddress'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import AddLiquidityDescription from 'components/WalletPopup/Transactions/Earn/AddLiquidityDescription'
import MigrateLiquidityDescription from 'components/WalletPopup/Transactions/Earn/MigrateLiquidityDescription'
import RemoveLiquidityDescription from 'components/WalletPopup/Transactions/Earn/RemoveLiquidityDescription'
import Icon from 'components/WalletPopup/Transactions/Icon'
import PendingWarning from 'components/WalletPopup/Transactions/PendingWarning'
import PoolFarmLink from 'components/WalletPopup/Transactions/PoolFarmLink'
import Status from 'components/WalletPopup/Transactions/Status'
import { isTxsPendingTooLong } from 'components/WalletPopup/Transactions/helper'
import { CancellingOrderInfo } from 'components/swapv2/LimitOrder/hooks/useCancellingOrders'
import { APP_PATHS, ETHER_ADDRESS } from 'constants/index'
import {
  TRANSACTION_TYPE,
  TransactionDetails,
  TransactionExtraBaseInfo,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
  TransactionExtraInfoHarvestFarm,
  TransactionExtraInfoStakeFarm,
} from 'state/transactions/type'
import { ExternalLink, ExternalLinkIcon } from 'theme'
import { getEtherscanLink, getNativeTokenLogo } from 'utils'
import { cn } from 'utils/cn'

type PrimaryTextProps = React.HTMLAttributes<HTMLSpanElement> & { color?: string }

export const PrimaryText = ({ color, style, className, children, ...rest }: PrimaryTextProps) => (
  <span className={cn('text-xs text-subText', className)} style={color ? { ...style, color } : style} {...rest}>
    {children}
  </span>
)

const DescriptionBasic = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { summary = '' } = extraInfo as TransactionExtraBaseInfo
  return <PrimaryText>{summary}</PrimaryText>
}

const Description1Token = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  const plus = [TRANSACTION_TYPE.KYBERDAO_CLAIM, TRANSACTION_TYPE.KYBERDAO_CLAIM_GAS_REFUND].includes(type)
  return <DeltaTokenAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
}

const Description2Token = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type, chainId } = transaction
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut, tokenAddressIn, tokenAddressOut } =
    extraInfo as TransactionExtraInfo2Token

  const signTokenOut = ![
    TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.CLASSIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_ZAP_IN_LIQUIDITY,
  ].includes(type)

  const signTokenIn = [
    TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.COLLECT_FEE,
  ].includes(type)

  return (
    <>
      <DeltaTokenAmount
        tokenAddress={tokenAddressOut}
        symbol={tokenSymbolOut}
        amount={tokenAmountOut}
        plus={signTokenOut}
        logoURL={tokenAddressOut === ETHER_ADDRESS ? getNativeTokenLogo(chainId) : undefined}
      />
      <DeltaTokenAmount
        tokenAddress={tokenAddressIn}
        symbol={tokenSymbolIn}
        amount={tokenAmountIn}
        plus={signTokenIn}
        logoURL={tokenAddressIn === ETHER_ADDRESS ? getNativeTokenLogo(chainId) : undefined}
      />
    </>
  )
}

const DescriptionKyberDaoStake = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
  const votingPower = extraInfo?.arbitrary?.votingPower
  const isUnstake = type === TRANSACTION_TYPE.KYBERDAO_UNSTAKE
  return (
    <>
      {isUnstake ? null : <DeltaTokenAmount symbol={t`voting power`} amount={votingPower + '%'} plus={!isUnstake} />}
      <DeltaTokenAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={isUnstake} />
    </>
  )
}

const NftLink = ({
  nftId,
  canNavigate = true,
  type,
}: {
  nftId: string
  canNavigate?: boolean
  type: TRANSACTION_TYPE
}) => {
  const plus = [TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY, TRANSACTION_TYPE.UNSTAKE].includes(type)
  const icon = (
    <div className="flex h-3.5 items-center text-subText">
      <NftIcon />
      <PrimaryText>
        &nbsp;{plus ? '+' : '-'} #{nftId}
      </PrimaryText>
      &nbsp;{canNavigate && <SendIcon size={10} />}
    </div>
  )
  if (!canNavigate) return icon
  return (
    <ExternalLink key={nftId} href={`${APP_PATHS.MY_POOLS}?nftId=${nftId}`} className="hover:no-underline">
      {icon}
    </ExternalLink>
  )
}

const DescriptionLiquidity = (transaction: TransactionDetails) => {
  const { nftId } = (transaction.extraInfo ?? {}) as TransactionExtraInfo2Token
  return {
    leftComponent: Description2Token(transaction),
    rightComponent: nftId ? (
      <NftLink type={transaction.type} nftId={nftId} canNavigate={false} />
    ) : (
      <PoolFarmLink transaction={transaction} />
    ),
  }
}

const DescriptionHarvestFarmReward = (transaction: TransactionDetails) => {
  const { rewards = [] } = (transaction.extraInfo ?? {}) as TransactionExtraInfoHarvestFarm
  return (
    <>
      {rewards.map(item => (
        <DeltaTokenAmount
          plus
          amount={item.tokenAmount}
          symbol={item.tokenSymbol}
          tokenAddress={item.tokenAddress}
          key={item.tokenAddress}
        />
      ))}
    </>
  )
}

const DescriptionApproveClaim = (transaction: TransactionDetails) => {
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

const DescriptionLimitOrder = (transaction: TransactionDetails) => {
  const { extraInfo = {} } = transaction
  const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut } = extraInfo as TransactionExtraInfo2Token
  if (!tokenAmountIn)
    return (
      <PrimaryText>
        <Trans>Cancel all orders</Trans>
      </PrimaryText>
    )
  return (
    <Row className="gap-1">
      <DeltaTokenAmount symbol={tokenSymbolIn} amount={tokenAmountIn} />
      <PrimaryText>
        <Trans>to</Trans>
      </PrimaryText>
      <DeltaTokenAmount symbol={tokenSymbolOut} amount={tokenAmountOut} />
    </Row>
  )
}

const DescriptionStakeFarm = (transaction: TransactionDetails) => {
  const { extraInfo = {}, type } = transaction
  const { pairs = [] } = extraInfo as TransactionExtraInfoStakeFarm
  if (pairs?.length)
    return (
      <>
        {pairs.map(({ nftId }) => (
          <NftLink key={nftId} nftId={nftId} type={type} />
        ))}
      </>
    )
  const { tokenAmount, tokenSymbol } = extraInfo as TransactionExtraInfo1Token
  return <DeltaTokenAmount plus={type === TRANSACTION_TYPE.UNSTAKE} amount={tokenAmount} symbol={tokenSymbol} />
}

const DESCRIPTION_MAP: {
  [type in TRANSACTION_TYPE]: (
    txs: TransactionDetails,
  ) => null | JSX.Element | { leftComponent: ReactNode; rightComponent: ReactNode }
} = {
  [TRANSACTION_TYPE.ELASTIC_FORCE_WITHDRAW_LIQUIDITY]: DescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_VOTE]: DescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_DELEGATE]: DescriptionBasic,
  [TRANSACTION_TYPE.KYBERDAO_UNDELEGATE]: DescriptionBasic,

  [TRANSACTION_TYPE.UNSTAKE]: DescriptionStakeFarm,
  [TRANSACTION_TYPE.STAKE]: DescriptionStakeFarm,
  [TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY]: DescriptionStakeFarm,
  [TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY]: DescriptionStakeFarm,

  [TRANSACTION_TYPE.APPROVE]: DescriptionApproveClaim,
  [TRANSACTION_TYPE.CLAIM_REWARD]: DescriptionApproveClaim,

  [TRANSACTION_TYPE.KYBERDAO_STAKE]: DescriptionKyberDaoStake,
  [TRANSACTION_TYPE.KYBERDAO_UNSTAKE]: DescriptionKyberDaoStake,
  [TRANSACTION_TYPE.KYBERDAO_CLAIM]: Description1Token,
  [TRANSACTION_TYPE.KYBERDAO_CLAIM_GAS_REFUND]: Description1Token,

  [TRANSACTION_TYPE.TRANSFER_TOKEN]: Description1Token,

  [TRANSACTION_TYPE.UNWRAP_TOKEN]: Description2Token,
  [TRANSACTION_TYPE.WRAP_TOKEN]: Description2Token,
  [TRANSACTION_TYPE.SWAP]: Description2Token,
  [TRANSACTION_TYPE.KYBERDAO_MIGRATE]: Description2Token,

  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: DescriptionLimitOrder,

  [TRANSACTION_TYPE.CLASSIC_CREATE_POOL]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_CREATE_POOL]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.ELASTIC_ZAP_IN_LIQUIDITY]: DescriptionLiquidity,
  [TRANSACTION_TYPE.COLLECT_FEE]: DescriptionLiquidity,

  [TRANSACTION_TYPE.HARVEST]: DescriptionHarvestFarmReward,
  [TRANSACTION_TYPE.CLAIM]: DescriptionApproveClaim,

  [TRANSACTION_TYPE.EARN_ADD_LIQUIDITY]: AddLiquidityDescription,
  [TRANSACTION_TYPE.EARN_INCREASE_LIQUIDITY]: AddLiquidityDescription,
  [TRANSACTION_TYPE.EARN_REMOVE_LIQUIDITY]: RemoveLiquidityDescription,
  [TRANSACTION_TYPE.EARN_MIGRATE_LIQUIDITY]: MigrateLiquidityDescription,
  [TRANSACTION_TYPE.EARN_REPOSITION]: MigrateLiquidityDescription,
  [TRANSACTION_TYPE.EARN_COMPOUND_FEE]: AddLiquidityDescription,
  [TRANSACTION_TYPE.EARN_COMPOUND_REWARD]: AddLiquidityDescription,
}

type Prop = {
  transaction: TransactionDetails
  style: CSSProperties
  isMinimal: boolean
  cancellingOrderInfo: CancellingOrderInfo
}

const TransactionItem = forwardRef<HTMLDivElement, Prop>(function TransactionItem(
  { transaction, style, isMinimal, cancellingOrderInfo }: Prop,
  ref,
) {
  const { type, addedTime, hash, chainId } = transaction

  const info: any = DESCRIPTION_MAP?.[type]?.(transaction)
  const leftComponent: ReactNode = info?.leftComponent !== undefined ? info?.leftComponent : info
  const rightComponent: ReactNode = info?.rightComponent
  const isStalled = isTxsPendingTooLong(transaction)

  return (
    <div
      className="flex size-full flex-col justify-between gap-2.5 border-b border-border py-3.5 last:border-b-0"
      style={style}
      ref={ref}
      data-stalled={isStalled}
    >
      {isStalled && <PendingWarning />}

      <div className="flex items-end justify-between">
        <Row className="gap-1.5">
          {!isMinimal && (
            <div className="flex items-center text-text">
              <Icon txs={transaction} />
            </div>
          )}
          <span className="text-sm text-text">{type}</span>
          <ExternalLinkIcon color="var(--ks-subText)" href={getEtherscanLink(chainId, hash, 'transaction')} />
        </Row>
        <Status transaction={transaction} cancellingOrderInfo={cancellingOrderInfo} />
      </div>

      <div className="flex justify-between">
        <div className="left-column flex h-full flex-col gap-2.5">{leftComponent}</div>
        <div className="right-column flex h-full flex-col items-end justify-end gap-2.5">
          {rightComponent || <ContractAddress transaction={transaction} />}
          <PrimaryText>{dayjs(addedTime).format('DD/MM/YYYY HH:mm:ss')}</PrimaryText>
        </div>
      </div>
    </div>
  )
})

export default TransactionItem

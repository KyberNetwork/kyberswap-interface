import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
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

function TransactionItem({ transaction, style }: { transaction: TransactionDetails; style: CSSProperties }) {
  const { type, addedTime, hash, extraInfo = {}, chainId } = transaction
  const theme = useTheme()

  const contractComponent = extraInfo.contract ? (
    <SecondaryText style={{ display: 'flex' }}>
      {type === TRANSACTION_TYPE.TRANSFER_TOKEN ? t`to` : t`contract`}: {getShortenAddress(extraInfo.contract)}
      <CopyHelper toCopy={extraInfo.contract} />
    </SecondaryText>
  ) : null

  const renderDescription = () => {
    // todo danh alert missing type this
    switch (type) {
      case TRANSACTION_TYPE.FORCE_WITHDRAW: // xong chưa test
      case TRANSACTION_TYPE.STAKE: // xong chưa test
      case TRANSACTION_TYPE.DEPOSIT: // xong chưa test
      case TRANSACTION_TYPE.WITHDRAW: // xong chưa test
      case TRANSACTION_TYPE.KYBERDAO_CLAIM: // xong chưa test
      case TRANSACTION_TYPE.UNSTAKE: // xong chưa test
      case TRANSACTION_TYPE.KYBERDAO_VOTE: // xong chưa test
      case TRANSACTION_TYPE.KYBERDAO_DELEGATE: // xong chưa test
      case TRANSACTION_TYPE.KYBERDAO_UNDELEGATE: {
        // xong chưa test
        const { summary = '' } = extraInfo as TransactionExtraBaseInfo // approve elastic farm, ...
        return (
          <>
            <PrimaryText>{summary}</PrimaryText>
            {contractComponent}
          </>
        )
      }
      case TRANSACTION_TYPE.APPROVE:
      case TRANSACTION_TYPE.CLAIM_REWARD: {
        // xong chưa test
        const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
        const { summary = '' } = extraInfo as TransactionExtraBaseInfo // approve elastic farm, ...
        const plus = [TRANSACTION_TYPE.CLAIM_REWARD].includes(type)
        return (
          <>
            {summary ? (
              <PrimaryText>{summary}</PrimaryText>
            ) : (
              <DeltaAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
            )}
            {contractComponent}
          </>
        )
      }

      // ex: stake -3knc
      case TRANSACTION_TYPE.KYBERDAO_STAKE:
      case TRANSACTION_TYPE.KYBERDAO_UNSTAKE:
      case TRANSACTION_TYPE.TRANSFER_TOKEN: // xong chưa test
        const { tokenSymbol, tokenAmount, tokenAddress } = extraInfo as TransactionExtraInfo1Token
        const plus = [TRANSACTION_TYPE.KYBERDAO_UNSTAKE].includes(type)
        return (
          <>
            <DeltaAmount tokenAddress={tokenAddress} symbol={tokenSymbol} amount={tokenAmount} plus={plus} />
            {contractComponent}
          </>
        )

      //ex: +3knc -2usdt
      case TRANSACTION_TYPE.UNWRAP_TOKEN:
      case TRANSACTION_TYPE.WRAP_TOKEN:
      case TRANSACTION_TYPE.SWAP: // chưa test
      case TRANSACTION_TYPE.KYBERDAO_MIGRATE: {
        const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut, tokenAddressIn, tokenAddressOut } =
          extraInfo as TransactionExtraInfo2Token
        return (
          <>
            <DeltaAmount tokenAddress={tokenAddressOut} symbol={tokenSymbolOut} amount={tokenAmountOut} plus />
            <DeltaAmount tokenAddress={tokenAddressIn} symbol={tokenSymbolIn} amount={tokenAmountIn} plus={false} />
          </>
        )
      }
      case TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY: // chưa test
      case TRANSACTION_TYPE.REMOVE_LIQUIDITY: // chưa test
      case TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY: // chưa test
      case TRANSACTION_TYPE.INCREASE_LIQUIDITY: // chưa test
      case TRANSACTION_TYPE.COLLECT_FEE: // chưa test
      case TRANSACTION_TYPE.ADD_LIQUIDITY: {
        // chưa test
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
      case TRANSACTION_TYPE.ELASTIC_CREATE_POOL:
      case TRANSACTION_TYPE.CREATE_POOL: {
        // chưa test
        const { tokenAmountIn, tokenAmountOut, tokenSymbolIn, tokenSymbolOut } = extraInfo as TransactionExtraInfo2Token
        return (
          <>
            <PrimaryText>
              {tokenAmountIn} {tokenSymbolIn} and {tokenAmountOut} {tokenSymbolOut}
            </PrimaryText>
          </>
        )
      }
      case TRANSACTION_TYPE.BRIDGE: {
        const {
          tokenAmountIn,
          tokenAmountOut,
          tokenSymbolIn,
          tokenSymbolOut,
          chainIdIn = chainId,
          chainIdOut = chainId,
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
      case TRANSACTION_TYPE.CANCEL_LIMIT_ORDER: {
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
      case TRANSACTION_TYPE.HARVEST:
      case TRANSACTION_TYPE.SETUP_SOLANA_SWAP:
        // to make sure you don't forget set up a new type
        return null // don't show
      default:
        throw new Error(`Please make sure add config for this transaction => ${type}`)
    }
  }
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
        <ColumGroup style={{ alignItems: 'flex-end' }}>{renderDescription()}</ColumGroup>
      </Row>
    </ItemWrapper>
  )
}
export default TransactionItem

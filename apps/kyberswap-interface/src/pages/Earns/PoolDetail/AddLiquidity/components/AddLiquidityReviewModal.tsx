import { StatusDialog, StatusDialogType, translateFriendlyErrorMessage, translateZapMessage } from '@kyber/ui'
import { t } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { AddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityReviewData'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CloseIcon } from 'theme/components'
import { formatDisplayNumber } from 'utils/numbers'

interface AddLiquidityReviewModalProps {
  isOpen?: boolean
  exchange?: string
  data?: AddLiquidityReviewData | null
  confirmText?: string
  confirmDisabled?: boolean
  confirmLoading?: boolean
  txHash?: string
  txStatus?: 'success' | 'failed' | 'cancelled' | ''
  txError?: string | null
  slippage?: number
  suggestedSlippage?: number
  transactionExplorerUrl?: string
  onDismiss?: () => void
  onConfirm?: () => void
  onUseSuggestedSlippage?: () => void
  onRevertPriceToggle?: () => void
  onViewPosition?: () => void
}

const ModalContent = styled(Stack)`
  width: 100%;
  padding: 24px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 20px;
  `}
`

const Card = styled(Stack)`
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(34, 34, 38, 0.92) 0%, rgba(28, 28, 31, 0.92) 100%);
`

const HeaderTitle = styled(Text)`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

const PairText = styled(Text)`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
`

const LabelText = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  line-height: 1.4;
`

const BodyText = styled(Text)`
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
`

const ValueText = styled(Text)`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
`

const TotalText = styled(Text)`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
`

const Badge = styled(HStack)`
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
`

const RangeBox = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
`

const EstimateTokenBox = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 4px;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
`

const MetricCard = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
`

const MetricTitle = styled(Text)`
  margin: 0;
  width: fit-content;
  border-bottom: 1px dotted rgba(255, 255, 255, 0.22);
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  line-height: 1.2;
`

const DisclaimerText = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-style: italic;
  line-height: 1.5;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  height: 28px;
  justify-content: center;
  width: 28px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
`

const ConfirmButton = styled.button`
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border: 0;
  border-radius: 14px;
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.buttonBlack};
  cursor: pointer;
`

const ProtocolLogo = styled.img`
  height: 14px;
  object-fit: contain;
  width: 14px;
`

const WarningCard = styled(Stack)<{ $tone: 'info' | 'warning' | 'error' }>`
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'error' ? `${theme.red}40` : $tone === 'warning' ? `${theme.warning}40` : `${theme.primary}26`};
  background: ${({ theme, $tone }) =>
    $tone === 'error' ? `${theme.red}14` : $tone === 'warning' ? `${theme.warning}1f` : `${theme.primary}14`};
  color: ${({ theme }) => theme.text};
  font-size: 13px;
  line-height: 1.5;
`

const formatBpsLabel = (value?: number) => {
  if (value === undefined) return '--'
  return `${parseFloat((((value || 0) * 100) / 10_000).toFixed(2)).toString()}%`
}

export default function AddLiquidityReviewModal({
  isOpen = false,
  exchange,
  data,
  confirmText = 'Add Liquidity',
  confirmDisabled = false,
  confirmLoading = false,
  txHash,
  txStatus = '',
  txError,
  slippage,
  suggestedSlippage,
  transactionExplorerUrl,
  onDismiss,
  onConfirm,
  onUseSuggestedSlippage,
  onRevertPriceToggle,
  onViewPosition,
}: AddLiquidityReviewModalProps) {
  const theme = useTheme()
  const protocol = exchange ? EARN_DEXES[exchange as Exchange] : undefined
  const header = data?.header
  const zapInItems = data?.zapInItems || []
  const estimate = data?.estimate
  const priceInfo = data?.priceInfo
  const warnings = data?.warnings || []

  if (confirmLoading || txHash || txError || txStatus) {
    const translatedErrorMessage = txError ? translateFriendlyErrorMessage(txError) : undefined
    const errorMessage = txError?.toLowerCase() || ''
    const isSlippageError = errorMessage.includes('slippage')

    return (
      <StatusDialog
        type={
          txStatus === 'success'
            ? StatusDialogType.SUCCESS
            : txStatus === 'cancelled'
            ? StatusDialogType.CANCELLED
            : txStatus === 'failed' || txError
            ? StatusDialogType.ERROR
            : txHash
            ? StatusDialogType.PROCESSING
            : StatusDialogType.WAITING
        }
        description={
          !txHash && !txError && txStatus !== 'success' ? 'Confirm this transaction in your wallet' : undefined
        }
        errorMessage={translatedErrorMessage}
        transactionExplorerUrl={transactionExplorerUrl}
        action={
          <>
            <button className="ks-outline-btn flex-1" onClick={onDismiss}>
              {txStatus === 'success' && onViewPosition ? 'Close' : 'Close'}
            </button>
            {txStatus === 'success' && onViewPosition ? (
              <button className="ks-primary-btn flex-1" onClick={onViewPosition}>
                View position
              </button>
            ) : isSlippageError ? (
              <button className="ks-primary-btn flex-1" onClick={onUseSuggestedSlippage || onDismiss}>
                {slippage !== suggestedSlippage ? t`Use Suggested Slippage` : t`Set Custom Slippage`}
              </button>
            ) : null}
          </>
        }
        onClose={onDismiss || (() => {})}
      />
    )
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={440} mobileFullWidth>
      <ModalContent gap={20}>
        <HStack align="center" justify="space-between" width="100%">
          <HeaderTitle color={theme.text}>Add Liquidity via Zap</HeaderTitle>
          <CloseIcon color={theme.subText} onClick={onDismiss} />
        </HStack>

        {header && (
          <HStack align="center" gap={12}>
            <HStack align="center" gap={0}>
              <TokenLogo src={header.token0.logo} size={32} />
              <TokenLogo src={header.token1.logo} size={32} translateLeft />
            </HStack>
            <Stack gap={4} minWidth={0}>
              <PairText color={theme.text}>{header.pairLabel}</PairText>
              <HStack align="center" gap={8} wrap="wrap">
                {protocol ? (
                  <HStack align="center" gap={6}>
                    {protocol.logo ? <ProtocolLogo alt={protocol.name} src={protocol.logo} /> : null}
                    <LabelText color={theme.subText}>{protocol.name}</LabelText>
                  </HStack>
                ) : null}
                {header.feeLabel ? (
                  <Badge align="center" gap={4}>
                    <LabelText color={theme.subText}>Fee {header.feeLabel}</LabelText>
                  </Badge>
                ) : null}
              </HStack>
            </Stack>
          </HStack>
        )}

        <Card gap={12}>
          <HStack align="center" justify="space-between">
            <BodyText color={theme.subText}>Zap-in Amount</BodyText>
            <TotalText color={theme.text}>
              {formatDisplayNumber(data?.totalInputUsd || 0, { style: 'currency', significantDigits: 6 })}
            </TotalText>
          </HStack>
          <Stack gap={8}>
            {zapInItems.map(item => (
              <HStack key={item.token.address} align="center" gap={12} justify="space-between">
                <HStack align="center" gap={8} minWidth={0}>
                  <TokenLogo src={item.token.logo} size={18} />
                  <BodyText color={theme.text}>
                    {formatDisplayNumber(item.amount, { significantDigits: 6 })} {item.token.symbol}
                  </BodyText>
                </HStack>
                <LabelText color={theme.subText}>
                  ~{formatDisplayNumber(item.usdValue, { style: 'currency', significantDigits: 6 })}
                </LabelText>
              </HStack>
            ))}
          </Stack>
        </Card>

        {priceInfo && (
          <Card gap={12}>
            <HStack align="center" gap={12} justify="space-between">
              <HStack align="center" gap={6} wrap="wrap">
                <BodyText color={theme.subText}>Current Price</BodyText>
                <BodyText color={theme.text}>
                  1 {priceInfo.baseToken?.symbol || '--'} ={' '}
                  {formatDisplayNumber(priceInfo.currentPrice, { significantDigits: 8 })}{' '}
                  {priceInfo.quoteToken?.symbol || '--'}
                </BodyText>
              </HStack>
              <IconButton type="button" onClick={onRevertPriceToggle}>
                <RevertPriceIcon width={12} height={12} />
              </IconButton>
            </HStack>

            {priceInfo.isUniV3 && (
              <HStack gap={12}>
                <RangeBox gap={4}>
                  <LabelText color={theme.subText}>MIN</LabelText>
                  <ValueText color={theme.text}>{priceInfo.minPrice || '--'}</ValueText>
                </RangeBox>
                <RangeBox gap={4}>
                  <LabelText color={theme.subText}>MAX</LabelText>
                  <ValueText color={theme.text}>{priceInfo.maxPrice || '--'}</ValueText>
                </RangeBox>
              </HStack>
            )}
          </Card>
        )}

        {estimate && (
          <Card gap={14}>
            <HStack align="center" justify="space-between">
              <BodyText color={theme.subText}>Est. Liquidity Value</BodyText>
              <TotalText color={theme.text}>
                {formatDisplayNumber(estimate.totalUsd || 0, { style: 'currency', significantDigits: 6 })}
              </TotalText>
            </HStack>

            <HStack align="flex-start" gap={12}>
              {estimate.items?.map(item => (
                <EstimateTokenBox key={item.token.address}>
                  <HStack align="center" gap={6} minWidth={0}>
                    <TokenLogo src={item.token.logo} size={16} />
                    <ValueText color={theme.text}>
                      {formatDisplayNumber(item.amount, { significantDigits: 8 })} {item.token.symbol}
                    </ValueText>
                  </HStack>
                  <LabelText color={theme.subText}>
                    ~{formatDisplayNumber(item.usdValue, { style: 'currency', significantDigits: 6 })}
                  </LabelText>
                </EstimateTokenBox>
              ))}
            </HStack>

            <Divider />

            <HStack align="center" justify="space-between">
              <BodyText color={theme.subText}>Max Slippage</BodyText>
              <ValueText color={theme.text}>{formatBpsLabel(estimate.slippage)}</ValueText>
            </HStack>

            <HStack align="stretch" gap={10}>
              <MetricCard>
                <MetricTitle color={theme.subText}>Est. Remaining</MetricTitle>
                <ValueText color={theme.text}>
                  {formatDisplayNumber(estimate.remainingUsd || 0, { style: 'currency', significantDigits: 6 })}
                </ValueText>
              </MetricCard>
              <MetricCard>
                <MetricTitle color={theme.subText}>Zap Impact</MetricTitle>
                <ValueText color={theme.text}>{estimate.zapImpact?.display || '--'}</ValueText>
              </MetricCard>
              <MetricCard>
                <MetricTitle color={theme.subText}>Zap Fee</MetricTitle>
                <ValueText color={theme.text}>
                  {estimate.zapFeePercent !== undefined
                    ? `${parseFloat(estimate.zapFeePercent.toFixed(2)).toString()}%`
                    : '--'}
                </ValueText>
              </MetricCard>
            </HStack>
          </Card>
        )}

        {warnings.length ? (
          <Stack gap={10}>
            {warnings.map((warning, index) => (
              <WarningCard key={`${warning.tone}-${index}`} $tone={warning.tone}>
                {translateZapMessage(warning.message)}
              </WarningCard>
            ))}
          </Stack>
        ) : null}

        <DisclaimerText color={theme.subText}>
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </DisclaimerText>

        <ConfirmButton disabled={confirmDisabled} onClick={onConfirm} type="button">
          {confirmLoading ? 'Building...' : confirmText}
        </ConfirmButton>
      </ModalContent>
    </Modal>
  )
}

import { StatusDialog, StatusDialogType, translateFriendlyErrorMessage, translateZapMessage } from '@kyber/ui'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { AddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useReviewData'
import { CloseIcon } from 'theme/components'
import { formatDisplayNumber } from 'utils/numbers'

interface AddLiquidityReviewModalProps {
  isOpen?: boolean
  review?: AddLiquidityReviewData
  confirmText?: string
  confirmDisabled?: boolean
  confirmLoading?: boolean
  txHash?: string
  txStatus?: 'success' | 'failed' | 'cancelled' | ''
  txError?: string | null
  transactionExplorerUrl?: string
  onDismiss?: () => void
  onConfirm?: () => void
  onUseSuggestedSlippage?: () => void
  onRevertPriceToggle?: () => void
  onViewPosition?: () => void
}

const ModalContent = styled(Stack)`
  width: 100%;
  padding: 16px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `}
`

const Card = styled(Stack)`
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.buttonGray};
`

const HeaderTitle = styled(Text)`
  font-weight: 500;
`

const PairText = styled(Text)`
  font-weight: 500;
`

const LabelText = styled(Text)`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

const BodyText = styled(Text)`
  font-size: 14px;
`

const ValueText = styled(Text)`
  font-size: 14px;
  font-weight: 500;
`

const TotalText = styled(Text)`
  font-weight: 500;
`

const Badge = styled(HStack)`
  min-height: 28px;
  padding: 4px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabActive};
`

const RangeBox = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.tabActive};
`

const EstimateTokenBox = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 4px;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.border};
`

const MetricCard = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.tabActive};
`

const MetricTitle = styled(Text)`
  width: fit-content;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  border-bottom: 1px dotted ${({ theme }) => rgba(theme.border, 0.24)};
`

const DisclaimerText = styled(Text)`
  font-size: 12px;
  font-style: italic;
  color: ${({ theme }) => theme.subText};
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabActive};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    filter: brightness(1.12);
  }
`

const ConfirmButton = styled.button`
  width: 100%;
  height: 44px;
  font-weight: 500;
  border: 0;
  border-radius: 14px;
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.buttonBlack};
  cursor: pointer;

  :hover {
    filter: brightness(1.12);
  }
`

const ProtocolLogo = styled.img`
  height: 14px;
  object-fit: contain;
  width: 14px;
`

const WarningCard = styled(Stack)<{ $tone: 'info' | 'warning' | 'error' }>`
  padding: 12px 14px;
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'error'
        ? rgba(theme.red, 0.24)
        : $tone === 'warning'
        ? rgba(theme.warning, 0.24)
        : rgba(theme.primary, 0.24)};
  border-radius: 12px;
  background: ${({ theme, $tone }) =>
    $tone === 'error'
      ? rgba(theme.red, 0.12)
      : $tone === 'warning'
      ? rgba(theme.warning, 0.12)
      : rgba(theme.primary, 0.12)};
  color: ${({ theme }) => theme.text};
  font-size: 14px;
`

const formatBpsLabel = (value?: number) => {
  if (value === undefined) return '--'
  return `${parseFloat((((value || 0) * 100) / 10_000).toFixed(2)).toString()}%`
}

const AddLiquidityReviewModal = ({
  isOpen = false,
  review,
  confirmText = 'Add Liquidity',
  confirmDisabled = false,
  confirmLoading = false,
  txHash,
  txStatus = '',
  txError,
  transactionExplorerUrl,
  onDismiss,
  onConfirm,
  onUseSuggestedSlippage,
  onRevertPriceToggle,
  onViewPosition,
}: AddLiquidityReviewModalProps) => {
  const theme = useTheme()

  const header = review?.header
  const estimate = review?.estimate
  const priceInfo = review?.priceInfo
  const warnings = review?.warnings || []
  const zapInItems = review?.zapInItems || []

  const totalInputUsd = review?.totalInputUsd || 0
  const slippage = estimate?.slippage
  const suggestedSlippage = estimate?.suggestedSlippage

  if (confirmLoading || txHash || txError || txStatus) {
    const translatedErrorMessage = txError ? translateFriendlyErrorMessage(txError) : undefined
    const errorMessage = txError?.toLowerCase() || ''

    const isSlippageError = errorMessage.includes('slippage')
    const canViewPosition = txStatus === 'success' && Boolean(onViewPosition)
    const statusType =
      txStatus === 'success'
        ? StatusDialogType.SUCCESS
        : txStatus === 'cancelled'
        ? StatusDialogType.CANCELLED
        : txStatus === 'failed' || txError
        ? StatusDialogType.ERROR
        : txHash
        ? StatusDialogType.PROCESSING
        : StatusDialogType.WAITING

    const statusAction = (
      <>
        <button className="ks-outline-btn flex-1" onClick={onDismiss}>
          Close
        </button>
        {canViewPosition ? (
          <button className="ks-primary-btn flex-1" onClick={onViewPosition}>
            View position
          </button>
        ) : isSlippageError ? (
          <button className="ks-primary-btn flex-1" onClick={onUseSuggestedSlippage || onDismiss}>
            {slippage !== suggestedSlippage ? t`Use Suggested Slippage` : t`Set Custom Slippage`}
          </button>
        ) : null}
      </>
    )

    return (
      <StatusDialog
        type={statusType}
        description={
          !txHash && !txError && txStatus !== 'success' ? 'Confirm this transaction in your wallet' : undefined
        }
        errorMessage={translatedErrorMessage}
        transactionExplorerUrl={transactionExplorerUrl}
        action={statusAction}
        onClose={onDismiss || (() => {})}
      />
    )
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={440} mobileFullWidth>
      <ModalContent gap={16}>
        <HStack width="100%" align="center" justify="space-between">
          <HeaderTitle color={theme.text}>Add Liquidity via Zap</HeaderTitle>
          <CloseIcon color={theme.subText} onClick={onDismiss} />
        </HStack>

        {header && (
          <HStack align="center" gap={12}>
            <HStack align="center" gap={0}>
              <TokenLogo src={header.token0.logo} size={32} />
              <TokenLogo src={header.token1.logo} size={32} translateLeft />
            </HStack>
            <Stack minWidth={0} gap={4}>
              <PairText color={theme.text}>{header.pairLabel}</PairText>
              <HStack align="center" gap={8} wrap="wrap">
                {header.protocolName ? (
                  <HStack align="center" gap={6}>
                    {header.protocolLogo ? <ProtocolLogo alt={header.protocolName} src={header.protocolLogo} /> : null}
                    <LabelText color={theme.subText}>{header.protocolName}</LabelText>
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
              {formatDisplayNumber(totalInputUsd, { style: 'currency', significantDigits: 6 })}
            </TotalText>
          </HStack>
          <Stack gap={8}>
            {zapInItems.map(item => (
              <HStack key={item.token.address} align="center" justify="space-between" gap={12}>
                <HStack minWidth={0} align="center" gap={8}>
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
            <HStack align="center" justify="space-between" gap={12}>
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
          <Card gap={16}>
            <HStack align="center" justify="space-between">
              <BodyText color={theme.subText}>Est. Liquidity Value</BodyText>
              <TotalText color={theme.text}>
                {formatDisplayNumber(estimate.totalUsd || 0, { style: 'currency', significantDigits: 6 })}
              </TotalText>
            </HStack>

            <HStack align="flex-start" gap={12}>
              {estimate.items?.map(item => (
                <EstimateTokenBox key={item.token.address}>
                  <HStack minWidth={0} align="center" gap={6}>
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

            <HStack align="stretch" gap={12}>
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
          <Stack gap={12}>
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

export default AddLiquidityReviewModal

import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CloseIcon } from 'theme/components'
import { formatDisplayNumber } from 'utils/numbers'

interface ReviewTokenItem {
  token: {
    address: string
    symbol: string
    logo?: string
  }
  amount: number
  usdValue: number
}

interface AddLiquidityReviewModalProps {
  isOpen?: boolean
  exchange?: string
  data?: {
    header?: {
      pairLabel: string
      token0: { symbol: string; logo?: string }
      token1: { symbol: string; logo?: string }
      feeLabel?: string
    } | null
    totalInputUsd?: number
    zapInItems?: ReviewTokenItem[]
    priceInfo?: {
      isUniV3?: boolean
      currentPrice?: number | null
      baseToken?: { symbol: string }
      quoteToken?: { symbol: string }
      minPrice?: string | null
      maxPrice?: string | null
    } | null
    estimate?: {
      totalUsd?: number
      slippage?: number
      items?: ReviewTokenItem[]
    } | null
  } | null
  onDismiss?: () => void
  onConfirm?: () => void
  onRevertPriceToggle?: () => void
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
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
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

const IconButton = styled.button`
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: ${({ theme }) => theme.subText};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`

const ConfirmButton = styled.button`
  width: 100%;
  height: 44px;
  border: 0;
  border-radius: 14px;
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.buttonBlack};
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
`

const ProtocolLogo = styled.img`
  width: 14px;
  height: 14px;
  object-fit: contain;
`

const EstimateMetaRow = styled(HStack)`
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.tabActive};
`

export default function AddLiquidityReviewModal({
  isOpen = false,
  exchange,
  data,
  onDismiss,
  onConfirm,
  onRevertPriceToggle,
}: AddLiquidityReviewModalProps) {
  const theme = useTheme()
  const protocol = exchange ? EARN_DEXES[exchange as Exchange] : undefined
  const header = data?.header
  const zapInItems = data?.zapInItems || []
  const priceInfo = data?.priceInfo
  const estimate = data?.estimate

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
                    {protocol.logo ? <ProtocolLogo src={protocol.logo} alt={protocol.name} /> : null}
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
              <HStack key={item.token.address} align="center" justify="space-between" gap={12}>
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
          <Card gap={12}>
            <HStack align="center" justify="space-between">
              <BodyText color={theme.subText}>Est. Liquidity Value</BodyText>
              <TotalText color={theme.text}>
                {formatDisplayNumber(estimate.totalUsd || 0, { style: 'currency', significantDigits: 6 })}
              </TotalText>
            </HStack>

            <HStack align="flex-start" justify="space-between" gap={16}>
              {(estimate.items || []).map(item => (
                <Stack key={item.token.address} gap={4} flex="1 1 0" minWidth={0}>
                  <HStack align="center" gap={6} minWidth={0}>
                    <TokenLogo src={item.token.logo} size={18} />
                    <BodyText color={theme.text}>
                      {formatDisplayNumber(item.amount, { significantDigits: 6 })} {item.token.symbol}
                    </BodyText>
                  </HStack>
                  <LabelText color={theme.subText}>
                    ~{formatDisplayNumber(item.usdValue, { style: 'currency', significantDigits: 6 })}
                  </LabelText>
                </Stack>
              ))}
            </HStack>

            <EstimateMetaRow align="center" justify="space-between">
              <BodyText color={theme.subText}>Max Slippage</BodyText>
              <ValueText color={theme.text}>
                {formatDisplayNumber((estimate.slippage || 0) / 100, { style: 'percent', significantDigits: 2 })}
              </ValueText>
            </EstimateMetaRow>
          </Card>
        )}

        <ConfirmButton type="button" onClick={onConfirm}>
          Add Liquidity
        </ConfirmButton>
      </ModalContent>
    </Modal>
  )
}

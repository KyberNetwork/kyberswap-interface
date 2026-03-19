import { Text } from 'rebass'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import {
  type AddLiquidityReviewData,
  type ResolvedAddLiquidityReviewData,
} from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useReviewData'
import { CloseIcon } from 'theme/components'
import { formatDisplayNumber } from 'utils/numbers'

const Card = styled(Stack)`
  padding: 20px;
  border-radius: 20px;
  background: ${({ theme }) => theme.buttonGray};
`

const HeaderTitle = styled(Text)`
  font-weight: 500;
`

const PairText = styled(Text)`
  font-weight: 500;
`

const SectionLabel = styled(Text)`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
`

const TotalText = styled(Text)`
  font-weight: 500;
`

const Badge = styled(HStack)`
  min-height: 28px;
  padding: 4px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.background};
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    background: ${({ theme }) => theme.tabActive};
  }
`

const ProtocolLogo = styled.img`
  width: 14px;
  height: 14px;
  object-fit: contain;
`

type ReviewHeaderProps = {
  header: ResolvedAddLiquidityReviewData['header']
  address: string
  onDismiss?: () => void
}

type ZapInSectionProps = {
  items: AddLiquidityReviewData['zapInItems']
  totalInputUsd: number
}

export const ReviewHeader = ({ header, address, onDismiss }: ReviewHeaderProps) => {
  const theme = useTheme()

  return (
    <Stack gap={24}>
      <HStack width="100%" align="center" justify="space-between">
        <HeaderTitle color={theme.text}>Add Liquidity via Zap</HeaderTitle>
        <CloseButton aria-label="Close review" onClick={onDismiss} type="button">
          <CloseIcon color={theme.subText} size={28} />
        </CloseButton>
      </HStack>

      <HStack align="center" gap={16}>
        <HStack flex="0 0 auto" align="flex-end" gap={0}>
          <TokenLogo src={header.token0.logo} size={48} />
          <TokenLogo src={header.token1.logo} size={48} translateLeft />
        </HStack>

        <Stack minWidth={0} gap={8}>
          <HStack minWidth={0} align="center" gap={8} wrap="wrap">
            <PairText color={theme.text}>{header.pairLabel}</PairText>
            <CopyHelper color={theme.subText} margin="0" size={16} toCopy={address} />
          </HStack>

          <HStack align="center" gap={8} wrap="wrap">
            {header.protocolName ? (
              <HStack align="center" gap={6} minWidth={0}>
                {header.protocolLogo ? <ProtocolLogo alt={header.protocolName} src={header.protocolLogo} /> : null}
                <SectionLabel>{header.protocolName}</SectionLabel>
              </HStack>
            ) : null}

            {header.feeLabel ? (
              <Badge align="center" gap={4}>
                <SectionLabel>Fee {header.feeLabel}</SectionLabel>
              </Badge>
            ) : null}
          </HStack>
        </Stack>
      </HStack>
    </Stack>
  )
}

export const ZapInSection = ({ items, totalInputUsd }: ZapInSectionProps) => {
  const theme = useTheme()

  return (
    <Card gap={16}>
      <HStack align="center" justify="space-between">
        <SectionLabel>Zap-in Amount</SectionLabel>
        <TotalText color={theme.text}>
          {formatDisplayNumber(totalInputUsd, { style: 'currency', significantDigits: 6 })}
        </TotalText>
      </HStack>

      <Stack gap={12}>
        {items.map(item => (
          <HStack key={item.token.address} align="center" gap={12} wrap="wrap">
            <HStack minWidth={0} align="center" gap={8} wrap="wrap">
              <TokenLogo src={item.token.logo} size={18} />
              <Text color={theme.text}>
                {formatDisplayNumber(item.amount, { significantDigits: 6 })} {item.token.symbol}
              </Text>
            </HStack>

            <SectionLabel>
              ~{formatDisplayNumber(item.usdValue, { style: 'currency', significantDigits: 6 })}
            </SectionLabel>
          </HStack>
        ))}
      </Stack>
    </Card>
  )
}

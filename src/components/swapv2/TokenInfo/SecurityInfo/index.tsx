import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { AlertOctagon } from 'react-feather'
import { Flex } from 'rebass'
import { useGetSecurityTokenInfoQuery } from 'services/coingecko'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as ContractSecurity } from 'assets/svg/security_contract.svg'
import { ReactComponent as TreadingSecurity } from 'assets/svg/security_trading.svg'
import { CollapseItem } from 'components/Collapse'
import Loader from 'components/Loader'
import useTheme from 'hooks/useTheme'

import { Container } from '../index'
import Header from './Header'

const ContentWrapper = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  justify-content: space-between;
  flex-wrap: wrap;
  ${({ theme }) => theme.mediaWidth.upToMedium`
   flex-direction: column;
  `};
`

const Label = styled.span<{ color?: string }>`
  color: ${({ theme, color }) => color || theme.subText};
  font-size: 12px;
  font-weight: 400;
`

const ItemWrapper = styled.div`
  display: flex;
  gap: 6px;
  justify-content: space-between;
  align-items: center;
  flex-basis: 45%;
`

type ItemData = { label: string; value: string; type: WarningType; isNumber?: boolean }
const NO_DATA = '--'

const isValueDanger = ({ value, isNumber }: ItemData) =>
  value !== undefined && (value === '0' || (isNumber && +value > 0.05))
const reverse = (value: string | undefined) => (!value ? undefined : value === '0' ? '1' : '0')

const InfoItem = ({ data, loading }: { data: ItemData; loading: boolean }) => {
  const { label, value, type, isNumber } = data
  const theme = useTheme()
  const displayValue = loading ? (
    <Loader size="12px" />
  ) : isNumber && value ? (
    `${+value * 100}%`
  ) : value === '0' ? (
    t`No`
  ) : value === '1' ? (
    t`Yes`
  ) : (
    NO_DATA
  )
  return (
    <ItemWrapper>
      <Label>{label}</Label>
      <Label
        color={
          isValueDanger(data)
            ? type === WarningType.RISKY
              ? theme.red
              : theme.warning
            : displayValue === NO_DATA
            ? theme.subText
            : theme.primary
        }
        style={{ fontWeight: '500' }}
      >
        {displayValue}
      </Label>
    </ItemWrapper>
  )
}

const Content = ({
  data,
  totalRisk,
  totalWarning,
  loading,
}: {
  data: ItemData[]
  totalRisk: number
  totalWarning: number
  loading: boolean
}) => {
  const theme = useTheme()
  return (
    <ContentWrapper>
      <ItemWrapper>
        <Flex sx={{ gap: '6px', alignItems: 'center' }}>
          <AlertOctagon size={16} color={theme.red} />
          <Label>{totalRisk <= 1 ? <Trans>Risky Item</Trans> : <Trans>Risky Item(s)</Trans>}</Label>
        </Flex>
        <Label color={theme.red} style={{ fontWeight: '500' }}>
          {totalRisk}
        </Label>
      </ItemWrapper>

      <ItemWrapper>
        <Flex sx={{ gap: '6px', alignItems: 'center' }}>
          <AlertOctagon size={16} color={theme.warning} />
          <Label>{totalWarning <= 1 ? <Trans>Action Item</Trans> : <Trans>Action Item(s)</Trans>}</Label>
        </Flex>
        <Label color={theme.warning} style={{ fontWeight: '500' }}>
          {totalWarning}
        </Label>
      </ItemWrapper>

      {data.map(item => (
        <InfoItem key={item.label} data={item} loading={loading} />
      ))}
    </ContentWrapper>
  )
}

enum WarningType {
  RISKY,
  WARNING,
}
export default function SecurityInfo({ token }: { token: Token | undefined }) {
  const theme = useTheme()
  const style: CSSProperties = { background: rgba(theme.subText, 0.08), borderRadius: '16px', padding: '0' }
  const headerStyle: CSSProperties = { background: rgba(theme.subText, 0.08) }
  const arrowStyle: CSSProperties = { marginRight: '6px', color: theme.subText }
  const { data, isLoading } = useGetSecurityTokenInfoQuery(
    { chainId: token?.chainId as ChainId, address: token?.address ?? '' },
    { skip: !token?.address },
  )
  console.log(data)

  const contractData: ItemData[] = [
    {
      label: t`Open Source`,
      value: data?.is_open_source,
      type: WarningType.RISKY,
    },
    {
      label: t`Proxy Contract`,
      value: data?.is_proxy,
      type: WarningType.WARNING,
    },
    {
      label: t`Mint Function`,
      value: data?.is_mintable,
      type: WarningType.RISKY,
    },
    {
      label: t`Take Back Ownership`,
      value: data?.can_take_back_ownership,
      type: WarningType.RISKY,
    },
    {
      label: t`Can Change Balance`,
      value: data?.owner_change_balance,
      type: WarningType.WARNING,
    },
    {
      label: t`Self-destruct`,
      value: data?.selfdestruct,
      type: WarningType.RISKY,
    },
    {
      label: t`External Call`,
      value: data?.external_call,
      type: WarningType.RISKY,
    },
  ]

  const tradingData: ItemData[] = [
    {
      label: t`Buy Tax`,
      value: data?.buy_tax,
      type: WarningType.WARNING,
      isNumber: true,
    },
    {
      label: t`Sell Tax`,
      value: data?.sell_tax,
      type: WarningType.WARNING,
      isNumber: true,
    },
    {
      label: t`Modifiable Tax`,
      value: data?.slippage_modifiable,
      type: WarningType.WARNING,
    },
    {
      label: t`Honeypot`,
      value: data?.is_honeypot,
      type: WarningType.WARNING,
    },
    {
      label: t`Can be bought`,
      value: reverse(data?.cannot_buy),
      type: WarningType.WARNING,
    },
    {
      label: t`Can sell all`,
      value: reverse(data?.cannot_sell_all),
      type: WarningType.WARNING,
    },
    {
      label: t`Blacklisted Function`,
      value: data?.is_blacklisted,
      type: WarningType.WARNING,
    },
    {
      label: t`Whitelisted Function`,
      value: data?.is_whitelisted,
      type: WarningType.WARNING,
    },
    {
      label: t`Anti Whale`,
      value: data?.is_anti_whale,
      type: WarningType.WARNING,
    },
    {
      label: t`Modifiable Anti Whale`,
      value: data?.anti_whale_modifiable,
      type: WarningType.WARNING,
    },
  ]

  const calcTotalRisk = (total: { totalRisk: number; totalWarning: number }, item: ItemData) => {
    if (isValueDanger(item)) {
      if (item.type === WarningType.RISKY) total.totalRisk++
      else total.totalWarning++
    }
    return total
  }
  const { totalRisk: totalRiskContract, totalWarning: totalWarningContract } = contractData.reduce(calcTotalRisk, {
    totalRisk: 0,
    totalWarning: 0,
  })
  const { totalRisk: totalRiskTrading, totalWarning: totalWarningTrading } = tradingData.reduce(calcTotalRisk, {
    totalRisk: 0,
    totalWarning: 0,
  })

  return (
    <Container>
      <CollapseItem
        arrowStyle={arrowStyle}
        headerStyle={headerStyle}
        style={style}
        headerBorderRadius="16px"
        header={
          <Header
            icon={<ContractSecurity />}
            title={t`Contract Security`}
            warning={totalWarningContract}
            danger={totalRiskContract}
          />
        }
        arrowComponent={<DropdownSVG />}
      >
        <Content
          loading={isLoading}
          data={contractData}
          totalRisk={totalRiskContract}
          totalWarning={totalWarningContract}
        />
      </CollapseItem>
      <CollapseItem
        arrowStyle={arrowStyle}
        headerStyle={headerStyle}
        style={style}
        headerBorderRadius="16px"
        header={
          <Header
            icon={<TreadingSecurity />}
            title={t`Trading Security`}
            warning={totalWarningTrading}
            danger={totalRiskTrading}
          />
        }
        arrowComponent={<DropdownSVG />}
      >
        <Content
          loading={isLoading}
          data={tradingData}
          totalRisk={totalRiskTrading}
          totalWarning={totalWarningTrading}
        />
      </CollapseItem>
    </Container>
  )
}

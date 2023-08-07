import { Trans, t } from '@lingui/macro'
import { AlertOctagon } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import Loader from 'components/Loader'
import { isItemRisky } from 'components/swapv2/TokenInfo/SecurityInfo/utils'
import useTheme from 'hooks/useTheme'

export enum WarningType {
  RISKY,
  WARNING,
}

export type ItemData = {
  label: string
  value: string | undefined
  type: WarningType
  isNumber?: boolean
  riskyReverse?: boolean
}

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

const NO_DATA = '--'
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
  ) : isNumber ? (
    t`Unknown`
  ) : (
    NO_DATA
  )
  return (
    <ItemWrapper>
      <Label>{label}</Label>
      <Label
        color={
          isItemRisky(data)
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
          <Label>{totalWarning <= 1 ? <Trans>Attention Item</Trans> : <Trans>Attention Item(s)</Trans>}</Label>
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
export default Content

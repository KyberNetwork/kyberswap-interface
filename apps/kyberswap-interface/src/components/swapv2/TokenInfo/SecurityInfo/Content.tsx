import { Trans, t } from '@lingui/macro'
import { AlertOctagon } from 'react-feather'

import Loader from 'components/Loader'
import { RISKY_THRESHOLD, isItemRisky } from 'components/swapv2/TokenInfo/utils'
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

const Label = ({ children, color, fontWeight }: { children: React.ReactNode; color?: string; fontWeight?: string }) => (
  <span className="text-xs font-normal text-subText" style={{ color, fontWeight }}>
    {children}
  </span>
)

const ItemWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex basis-[45%] items-center justify-between gap-1.5">{children}</div>
)

const NO_DATA = '--'
const InfoItem = ({ data, loading }: { data: ItemData; loading: boolean }) => {
  const { label, value, type, isNumber } = data
  const theme = useTheme()
  const displayValue = loading ? (
    <Loader size="10px" />
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
  const colorRiskyByType = type === WarningType.RISKY ? theme.red : theme.warning
  const colorRiskyByAmount = Number(value) > RISKY_THRESHOLD.RISKY ? theme.red : theme.warning
  return (
    <ItemWrapper>
      <Label>{label}</Label>
      <Label
        color={
          isItemRisky(data)
            ? isNumber
              ? colorRiskyByAmount
              : colorRiskyByType
            : displayValue === NO_DATA
            ? theme.subText
            : theme.primary
        }
        fontWeight="500"
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
    <div className="flex flex-wrap justify-between gap-3 px-5 py-4 max-md:flex-col">
      <ItemWrapper>
        <div className="flex items-center gap-1.5">
          <AlertOctagon size={16} color={theme.red} />
          <Label>{totalRisk <= 1 ? <Trans>Risky Item</Trans> : <Trans>Risky Item(s)</Trans>}</Label>
        </div>
        <Label color={theme.red} fontWeight="500">
          {totalRisk}
        </Label>
      </ItemWrapper>

      <ItemWrapper>
        <div className="flex items-center gap-1.5">
          <AlertOctagon size={16} color={theme.warning} />
          <Label>{totalWarning <= 1 ? <Trans>Attention Item</Trans> : <Trans>Attention Item(s)</Trans>}</Label>
        </div>
        <Label color={theme.warning} fontWeight="500">
          {totalWarning}
        </Label>
      </ItemWrapper>

      {data.map(item => (
        <InfoItem key={item.label} data={item} loading={loading} />
      ))}
    </div>
  )
}
export default Content

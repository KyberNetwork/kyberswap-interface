import { Trans, t } from '@lingui/macro'
import { PropsWithChildren } from 'react'
import { AlertOctagon } from 'react-feather'

import Loader from 'components/Loader'
import { RISKY_THRESHOLD, isItemRisky } from 'components/TokenInfo/utils'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'

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

type LabelProps = PropsWithChildren<{
  color?: string
  className?: string
  fontWeight?: string
}>

export const Label = ({ children, color, className, fontWeight }: LabelProps) => (
  <span className={cn('text-xs font-normal text-subText', className)} style={{ color, fontWeight }}>
    {children}
  </span>
)

export const ItemWrapper = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-7 basis-[48%] items-center justify-between gap-1.5 rounded px-2 py-1 hover:bg-tabActive">
    {children}
  </div>
)

const NO_DATA = '--'
export const InfoItem = ({ data, loading }: { data: ItemData; loading: boolean }) => {
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

export type ContentProps = {
  data: ItemData[]
  totalRisk: number
  totalWarning: number
  loading: boolean
}

const Content = ({ data, totalRisk, totalWarning, loading }: ContentProps) => {
  return (
    <div className="flex flex-wrap justify-between gap-y-2 px-4 py-3 max-md:flex-col">
      <ItemWrapper>
        <div className="flex items-center gap-1.5">
          <AlertOctagon size={16} className="text-red" />
          <Label>{totalRisk <= 1 ? <Trans>Risky Item</Trans> : <Trans>Risky Item(s)</Trans>}</Label>
        </div>
        <Label className="text-red" fontWeight="500">
          {totalRisk}
        </Label>
      </ItemWrapper>

      <ItemWrapper>
        <div className="flex items-center gap-1.5">
          <AlertOctagon size={16} className="text-warning" />
          <Label>{totalWarning <= 1 ? <Trans>Attention Item</Trans> : <Trans>Attention Item(s)</Trans>}</Label>
        </div>
        <Label className="text-warning" fontWeight="500">
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

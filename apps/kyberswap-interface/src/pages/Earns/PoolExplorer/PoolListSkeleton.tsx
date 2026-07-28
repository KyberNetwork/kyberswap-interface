import { useMedia } from 'react-use'

import { HStack, Stack } from 'components/Stack'
import {
  MobileTableBottomRow,
  MobileTableCell,
  MobileTableRow as MobileTableRowComponent,
  TableCell,
  TableRow,
} from 'pages/Earns/PoolExplorer/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { MEDIA_WIDTHS } from 'theme'

const Circle = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <PositionSkeleton width={size} height={size} style={{ borderRadius: '50%', ...style }} />
)

// Mirrors DesktopTableRow's cells via the shared TableRow/TableCell grid, so the skeleton lines up under
// the column headers (Pair | APR | Fee | TVL | Volume | Rewards | Pool Price | ★). Grid columns follow
// showRewards/showPoolPrice exactly like the real rows + header.
const DesktopRowSkeleton = ({ showRewards, showPoolPrice }: { showRewards?: boolean; showPoolPrice?: boolean }) => (
  <TableRow showRewards={showRewards} showPoolPrice={showPoolPrice} className="cursor-default hover:!bg-transparent">
    <TableCell>
      <HStack className="items-center gap-2">
        <HStack className="relative items-end gap-0">
          <Circle size={24} />
          <Circle size={24} style={{ marginLeft: -8 }} />
        </HStack>
        <PositionSkeleton width={88} height={16} />
        <PositionSkeleton width={34} height={14} />
      </HStack>
      <HStack className="items-center gap-1">
        <Circle size={18} />
        <PositionSkeleton width={64} height={12} />
      </HStack>
    </TableCell>

    <TableCell>
      <PositionSkeleton width={56} height={16} />
    </TableCell>
    <TableCell>
      <PositionSkeleton width={60} height={16} />
    </TableCell>
    <TableCell>
      <PositionSkeleton width={64} height={16} />
    </TableCell>
    <TableCell>
      <PositionSkeleton width={64} height={16} />
    </TableCell>

    {showRewards && (
      <TableCell>
        <PositionSkeleton width={70} height={16} />
      </TableCell>
    )}
    {showPoolPrice && (
      // alignItems="stretch" so the react-loading-skeleton wrapper (a shrink-to-fit flex item) fills the
      // flex-column cell — otherwise a width="100%" child collapses to ~0 and the bar disappears.
      <TableCell alignItems="stretch">
        <PositionSkeleton width="100%" height={32} />
      </TableCell>
    )}

    <TableCell justifyContent="flex-start" pt={16}>
      <PositionSkeleton width={16} height={16} />
    </TableCell>
  </TableRow>
)

// Mirrors MobileTableRow's card: header (token pair · fee · dex · favorite) + a stacked list of
// label/value rows (APR, Fee, TVL, Volume, optional Rewards) and a sparkline placeholder.
const MOBILE_FIELDS: Array<{ label: number; value: number }> = [
  { label: 32, value: 56 }, // APR
  { label: 28, value: 64 }, // Fee
  { label: 28, value: 64 }, // TVL
  { label: 52, value: 64 }, // Volume
]
const MOBILE_REWARDS_FIELD = { label: 58, value: 70 } // Rewards

const MobileCardSkeleton = ({ showRewards }: { showRewards?: boolean }) => {
  const fields = showRewards ? [...MOBILE_FIELDS, MOBILE_REWARDS_FIELD] : MOBILE_FIELDS

  return (
    <MobileTableRowComponent className="cursor-default hover:!bg-background">
      <MobileTableCell alignItems="flex-start" justifyContent="space-between">
        <Stack className="items-start gap-2">
          <HStack className="items-center gap-2">
            <HStack className="items-end gap-0">
              <Circle size={24} />
              <Circle size={24} style={{ marginLeft: -8 }} />
            </HStack>
            <PositionSkeleton width={84} height={16} />
            <PositionSkeleton width={40} height={20} />
          </HStack>
          <HStack className="items-center gap-1">
            <Circle size={16} />
            <PositionSkeleton width={72} height={14} />
          </HStack>
        </Stack>
        <PositionSkeleton width={16} height={16} />
      </MobileTableCell>
      <MobileTableBottomRow>
        {fields.map((field, i) => (
          <MobileTableCell key={i} justifyContent="space-between" className="gap-1">
            <PositionSkeleton width={field.label} height={14} />
            <PositionSkeleton width={field.value} height={14} />
          </MobileTableCell>
        ))}
        <MobileTableCell alignItems="stretch" className="flex-col">
          <PositionSkeleton width="100%" height={48} />
        </MobileTableCell>
      </MobileTableBottomRow>
    </MobileTableRowComponent>
  )
}

const PoolListSkeleton = ({
  rows = 8,
  showRewards = true,
  showPoolPrice = true,
}: {
  rows?: number
  showRewards?: boolean
  showPoolPrice?: boolean
}) => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  if (upToMedium) {
    return (
      <Stack className="gap-4">
        {Array.from({ length: rows }, (_, i) => (
          <MobileCardSkeleton key={i} showRewards={showRewards} />
        ))}
      </Stack>
    )
  }

  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <DesktopRowSkeleton key={i} showRewards={showRewards} showPoolPrice={showPoolPrice} />
      ))}
    </>
  )
}

export default PoolListSkeleton

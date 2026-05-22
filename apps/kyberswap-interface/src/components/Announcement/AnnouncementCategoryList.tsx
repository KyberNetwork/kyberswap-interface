import React, { CSSProperties } from 'react'

import { ReactComponent as AnnouncementSvg } from 'assets/svg/ic_announcement.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/kyber/limit_order.svg'
import { ReactComponent as SmartExitIcon } from 'assets/svg/kyber/smart_exit.svg'
import { Category } from 'components/Announcement/AnnoucementList'
import { PoolPositionAnnouncement } from 'components/Announcement/type'
import { getTokenId } from 'pages/Earns/utils/position'
import { cn } from 'utils/cn'

const SubLine = ({ children, maxLine = 1 }: { children: React.ReactNode; maxLine?: number }) => (
  <div
    className="overflow-hidden text-subText [-webkit-box-orient:vertical] [display:-webkit-box]"
    style={{ WebkitLineClamp: maxLine }}
  >
    {children}
  </div>
)

type CategoryItemProps = {
  title?: string
  icon?: React.ReactNode
  subLine1?: React.ReactNode
  subLine2?: React.ReactNode
  counter?: number
  style?: CSSProperties
  onClick?: () => void
}

const CategoryItem = ({ onClick, style, title, icon, subLine1, subLine2, counter }: CategoryItemProps) => (
  <div
    onClick={onClick}
    style={style}
    className={cn(
      'flex cursor-pointer items-center gap-3.5 border-b border-solid border-border bg-background px-5 py-4 text-sm hover:bg-buttonBlack',
    )}
  >
    <div className="bg-white/[0.1] flex size-8 items-center justify-center rounded-lg">{icon}</div>
    <div className="flex flex-1 flex-col gap-0.5">
      <span className="font-medium text-white">{title}</span>
      {!!subLine1 && (typeof subLine1 === 'string' ? <SubLine maxLine={2}>{subLine1}</SubLine> : subLine1)}
      {!!subLine2 && (typeof subLine2 === 'string' ? <SubLine>{subLine2}</SubLine> : subLine2)}
    </div>
    <div className="flex h-6 min-w-[24px] items-center justify-center rounded-xl bg-green px-1.5 text-xs font-medium text-black">
      {counter}
    </div>
  </div>
)

type LimitOrderPreview = { pair?: string; status?: string }
type SmartExitPreview = { pair?: string; note?: string }

type Props = {
  earnUnread?: number
  limitOrderUnread?: number
  smartExitUnread?: number
  announcementCount?: number
  previewPosition?: PoolPositionAnnouncement
  previewLimitOrder?: LimitOrderPreview
  previewSmartExit?: SmartExitPreview
  announcementName?: string
  onSelectCategory?: (category: Category) => void
}

export default function AnnouncementCategoryList({
  earnUnread,
  limitOrderUnread,
  smartExitUnread,
  announcementCount,
  previewPosition,
  previewLimitOrder,
  previewSmartExit,
  announcementName,
  onSelectCategory,
}: Props) {
  return (
    <div>
      <CategoryItem
        title="Earn Position"
        counter={earnUnread}
        subLine1={previewPosition ? `${previewPosition.token0Symbol}/${previewPosition.token1Symbol}` : undefined}
        subLine2={previewPosition?.positionId ? `#${getTokenId(previewPosition.positionId)}` : undefined}
        icon={<FarmingIcon />}
        onClick={() => onSelectCategory?.(Category.EARN_POSITION)}
      />
      <CategoryItem
        title="Limit Orders"
        counter={limitOrderUnread}
        subLine1={previewLimitOrder?.pair}
        subLine2={previewLimitOrder?.status}
        icon={<LimitOrderIcon />}
        onClick={() => onSelectCategory?.(Category.LIMIT_ORDER)}
      />
      <CategoryItem
        title="Smart Exit"
        counter={smartExitUnread}
        subLine1={previewSmartExit?.pair}
        subLine2={previewSmartExit?.note}
        icon={<SmartExitIcon />}
        onClick={() => onSelectCategory?.(Category.SMART_EXIT)}
      />
      <CategoryItem
        title="Announcements"
        counter={announcementCount}
        subLine1={announcementName}
        icon={<AnnouncementSvg />}
        onClick={() => onSelectCategory?.(Category.ANNOUNCEMENTS)}
      />
    </div>
  )
}

import { ShareOption } from '@kyber/ui'
import { t } from '@lingui/macro'
import { useState } from 'react'

import EarningsTab from 'pages/Earns/PositionDetail/EarningsTab'
import HistoryTab from 'pages/Earns/PositionDetail/HistoryTab'
import InformationTab from 'pages/Earns/PositionDetail/InformationTab'
import { RightColumn, TabDivider, TabItem, TabMenu } from 'pages/Earns/PositionDetail/styles'
import { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import { ParsedPosition } from 'pages/Earns/types'

type TabType = 'information' | 'earnings' | 'history'

const RightSection = ({
  position,
  initialLoading,
  isNotAccountOwner,
  positionOwnerAddress,
  triggerClose,
  hasActiveSmartExitOrder,
  onOpenZapMigration,
  onRefreshPosition,
  setTriggerClose,
  setReduceFetchInterval,
  onReposition,
  aprInterval,
  setAprInterval,
  isUnfinalized,
  isWaitingForRewards,
  shareBtn,
}: {
  position?: ParsedPosition
  initialLoading: boolean
  isNotAccountOwner: boolean
  positionOwnerAddress?: string | null
  triggerClose: boolean
  hasActiveSmartExitOrder: boolean
  onOpenZapMigration: (props: ZapMigrationInfo) => void
  onRefreshPosition: (props: CheckClosedPositionParams) => void
  setTriggerClose: (value: boolean) => void
  setReduceFetchInterval: (value: boolean) => void
  onReposition: (e: React.MouseEvent, position: ParsedPosition) => void
  aprInterval: '24h' | '7d'
  setAprInterval: (value: '24h' | '7d') => void
  isUnfinalized?: boolean
  isWaitingForRewards?: boolean
  shareBtn?: (size?: number, defaultOptions?: ShareOption[]) => React.ReactNode
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('information')

  return (
    <RightColumn>
      {/* Tab Menu */}
      <TabMenu>
        <TabItem active={activeTab === 'information'} onClick={() => setActiveTab('information')}>
          {t`Information`}
        </TabItem>
        <TabDivider />
        <TabItem active={activeTab === 'earnings'} onClick={() => setActiveTab('earnings')}>
          {t`Earning(s)`}
        </TabItem>
        <TabDivider />
        <TabItem active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
          {t`History`}
        </TabItem>
      </TabMenu>

      {/* Tab Content */}
      {activeTab === 'information' && (
        <InformationTab
          position={position}
          initialLoading={initialLoading}
          isNotAccountOwner={isNotAccountOwner}
          positionOwnerAddress={positionOwnerAddress}
          triggerClose={triggerClose}
          hasActiveSmartExitOrder={hasActiveSmartExitOrder}
          onOpenZapMigration={onOpenZapMigration}
          onRefreshPosition={onRefreshPosition}
          setTriggerClose={setTriggerClose}
          setReduceFetchInterval={setReduceFetchInterval}
          onReposition={onReposition}
          aprInterval={aprInterval}
          setAprInterval={setAprInterval}
          isUnfinalized={isUnfinalized}
          isWaitingForRewards={isWaitingForRewards}
          shareBtn={shareBtn}
        />
      )}
      {activeTab === 'earnings' && <EarningsTab position={position} initialLoading={initialLoading} />}
      {activeTab === 'history' && <HistoryTab position={position} initialLoading={initialLoading} />}
    </RightColumn>
  )
}

export default RightSection

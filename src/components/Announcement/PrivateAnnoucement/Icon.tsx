import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode } from 'react'
import { Bell } from 'react-feather'
import styled from 'styled-components'

import { ReactComponent as AlarmIcon } from 'assets/svg/alarm.svg'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as CrossChainIcon } from 'assets/svg/cross_chain_icon.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { PrivateAnnouncementType } from 'components/Announcement/type'
import ApeIcon from 'components/Icons/ApeIcon'
import { NetworkLogo } from 'components/Logo'

const IconWrapper = styled.div<{ hasNetwork: boolean }>`
  position: relative;
  ${({ hasNetwork }) => hasNetwork && `margin-right: 4px;`}
`
const mapPosition: Partial<{ [type in PrivateAnnouncementType]: { top: number; right: number } }> = {
  [PrivateAnnouncementType.ELASTIC_POOLS]: { top: -6, right: -10 },
}
const mapIcon: Partial<{ [type in PrivateAnnouncementType]: ReactNode }> = {
  [PrivateAnnouncementType.BRIDGE_ASSET]: <BridgeIcon />,
  [PrivateAnnouncementType.CROSS_CHAIN]: <CrossChainIcon />,
  [PrivateAnnouncementType.LIMIT_ORDER]: <LimitOrderIcon />,
  [PrivateAnnouncementType.ELASTIC_POOLS]: <LiquidityIcon />,
  [PrivateAnnouncementType.KYBER_AI]: <ApeIcon size={18} />,
  [PrivateAnnouncementType.KYBER_AI_WATCH_LIST]: <ApeIcon size={18} />,
  [PrivateAnnouncementType.PRICE_ALERT]: <AlarmIcon style={{ width: 17, height: 17 }} />,
  [PrivateAnnouncementType.DIRECT_MESSAGE]: <Bell style={{ width: 17, height: 17 }} />,
}

export default function InboxIcon({ type, chainId }: { type: PrivateAnnouncementType; chainId?: ChainId }) {
  const icon = mapIcon[type]
  return (
    <IconWrapper hasNetwork={!!chainId}>
      {icon}
      {chainId && (
        <NetworkLogo
          chainId={chainId}
          style={{
            width: 12,
            height: 12,
            position: 'absolute',
            ...(mapPosition[type] || { top: -8, right: -8 }),
          }}
        />
      )}
    </IconWrapper>
  )
}

import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'

import { ReactComponent as GridViewIcon } from 'assets/svg/grid_view.svg'
import { ReactComponent as ListViewIcon } from 'assets/svg/list_view.svg'
import Icon from 'components/Icons/Icon'
import { VERSION } from 'constants/v2'
import { VIEW_MODE } from 'state/user/reducer'

export enum PoolType {
  STABLES = 'stable',
  LSDS = 'lsd',
  FARMING_POOLS = 'farm',
  MY_POSITIONS = 'my-positions',
}

export const poolTypeText: { [type in PoolType]: ReactNode } & { '': ReactNode } = {
  ['']: t`All Pools`,
  [PoolType.STABLES]: t`Stables`,
  [PoolType.LSDS]: t`LSDs`,
  [PoolType.FARMING_POOLS]: t`Farming Pools`,
  [PoolType.MY_POSITIONS]: (
    <>
      <Icon id="liquid-outline" size={16} />
      &nbsp;<Trans>My Positions</Trans>
    </>
  ),
}

export const poolProtocolText: { [protocol in VERSION]: ReactNode } & { '': ReactNode } = {
  ['']: t`All`,
  [VERSION.ELASTIC]: t`Elastic Pools`,
  [VERSION.ELASTIC_LEGACY]: t`Elastic Legacy Pools`,
  [VERSION.CLASSIC]: t`Classic Pools`,
}

export const poolViewIcon: { [view in VIEW_MODE]: ReactNode } = {
  [VIEW_MODE.LIST]: <ListViewIcon width={20} height={20} />,
  [VIEW_MODE.GRID]: <GridViewIcon width={20} height={20} />,
}

export enum PoolTimeframe {
  D1 = '24h',
  D7 = '7d',
  D30 = '30d',
}

export const poolTimeframeText: { [view in PoolTimeframe]: ReactNode } = {
  [PoolTimeframe.D1]: t`24H`,
  [PoolTimeframe.D7]: t`7D`,
  [PoolTimeframe.D30]: t`30D`,
}

export const ITEM_PER_PAGE = 12

export enum SORT_FIELD {
  TVL = 'tvl',
  APR = 'apr',
  VOLUME = 'volume',
  FEE = 'fees',
}

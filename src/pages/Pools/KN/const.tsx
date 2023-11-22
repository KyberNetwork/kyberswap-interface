import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { Flex } from 'rebass'

import { ReactComponent as GridViewIcon } from 'assets/svg/grid_view.svg'
import { ReactComponent as ListViewIcon } from 'assets/svg/list_view.svg'
import Icon from 'components/Icons/Icon'
import { VERSION } from 'constants/v2'
import { VIEW_MODE } from 'state/user/reducer'

export enum POOL_TYPE {
  STABLES = 'stable',
  LSDS = 'lsd',
  FARMING_POOLS = 'farming',
  MY_POSITIONS = 'mine',
}

export const poolTypeText: { [type in POOL_TYPE]: ReactNode } & { '': ReactNode } = {
  ['']: t`All Pools`,
  [POOL_TYPE.STABLES]: t`Stables`,
  [POOL_TYPE.LSDS]: t`LSDs`,
  [POOL_TYPE.FARMING_POOLS]: t`Farming Pools`,
  [POOL_TYPE.MY_POSITIONS]: (
    <Flex flexDirection="row" alignItems="center">
      <Icon id="liquid-outline" size={16} />
      &nbsp;<Trans>My Positions</Trans>
    </Flex>
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

export enum POOL_TIMEFRAME {
  D1 = '24h',
  D7 = '7d',
  D30 = '30d',
}

export const poolTimeframeText: { [view in POOL_TIMEFRAME]: ReactNode } = {
  [POOL_TIMEFRAME.D1]: t`24H`,
  [POOL_TIMEFRAME.D7]: t`7D`,
  [POOL_TIMEFRAME.D30]: t`30D`,
}

export const ITEM_PER_PAGE = 12

export enum SORT_FIELD {
  TVL = 'tvl',
  APR = 'apr',
  VOLUME = 'volume',
  FEE = 'fees',
  MY_LIQUIDITY = 'myLiquidity',
}

export const poolSortText: { [protocol in SORT_FIELD]: ReactNode } = {
  [SORT_FIELD.TVL]: t`TVL`,
  [SORT_FIELD.APR]: t`APR`,
  [SORT_FIELD.VOLUME]: t`Volume`,
  [SORT_FIELD.FEE]: t`Fee`,
  [SORT_FIELD.MY_LIQUIDITY]: t`My liquidity`,
}

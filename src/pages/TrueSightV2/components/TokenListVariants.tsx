import { useTheme } from 'styled-components'

import Icon from 'components/Icons/Icon'
import Row from 'components/Row'
import { ICON_ID } from 'constants/index'

const VARIANTS: { [key: string]: { icon_id: ICON_ID; title: string } } = {
  ethereum: { icon_id: 'eth-mono', title: 'Ethereum' },
  bsc: { icon_id: 'bnb-mono', title: 'Binance' },
  avalanche: { icon_id: 'ava-mono', title: 'Avalanche' },
  polygon: { icon_id: 'matic-mono', title: 'Polygon' },
  arbitrum: { icon_id: 'arbitrum-mono', title: 'Arbitrum' },
  fantom: { icon_id: 'fantom-mono', title: 'Fantom' },
  optimism: { icon_id: 'optimism-mono', title: 'Optimism' },
}

const MAX_ICONS_SHOWING = 8

export default function TokenListVariants({
  tokens,
  iconSize = 12,
}: {
  tokens: Array<{ address: string; logo: string; chain: string }>
  iconSize?: number
}) {
  const theme = useTheme()
  return (
    <Row gap="4px">
      {tokens.map((item, index) => {
        if (index > MAX_ICONS_SHOWING) return
        if (index === MAX_ICONS_SHOWING) return <span style={{ color: theme.subText, marginLeft: '-4px' }}>...</span>
        const key = item.address + '_' + index
        const variant = VARIANTS[item.chain]
        return <Icon key={key} id={variant.icon_id} title={variant.title} size={iconSize} />
      })}
    </Row>
  )
}

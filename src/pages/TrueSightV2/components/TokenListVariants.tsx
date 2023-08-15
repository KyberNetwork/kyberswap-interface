import Icon from 'components/Icons/Icon'

export default function TokenListVariants({
  tokens,
  iconSize = 12,
}: {
  tokens: Array<{ address: string; logo: string; chain: string }>
  iconSize?: number
}) {
  return (
    <>
      {tokens.map((item, index) => {
        const key = item.address + '_' + index
        switch (item.chain) {
          case 'ethereum':
            return <Icon key={key} id="eth-mono" size={iconSize} title="Ethereum" />
          case 'bsc':
            return <Icon key={key} id="bnb-mono" size={iconSize} title="Binance" />
          case 'avalanche':
            return <Icon key={key} id="ava-mono" size={iconSize} title="Avalanche" />
          case 'polygon':
            return <Icon key={key} id="matic-mono" size={iconSize} title="Polygon" />
          case 'arbitrum':
            return <Icon key={key} id="arbitrum-mono" size={iconSize} title="Arbitrum" />
          case 'fantom':
            return <Icon key={key} id="fantom-mono" size={iconSize} title="Fantom" />
          case 'optimism':
            return <Icon key={key} id="optimism-mono" size={iconSize} title="Optimism" />
          default:
            return <></>
        }
      })}
    </>
  )
}

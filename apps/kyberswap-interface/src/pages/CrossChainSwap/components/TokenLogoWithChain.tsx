import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import CurrencyLogo from 'components/CurrencyLogo'
import { NETWORKS_INFO } from 'constants/networks'
import { Flex } from 'rebass'

export const TokenLogoWithChain = ({
  currency,
  chainId,
  size = 16,
  chainLogoStyle = {},
}: {
  currency?: Currency
  chainId: ChainId
  size?: number
  chainLogoStyle?: React.CSSProperties
}) => {
  return (
    <Flex sx={{ position: 'relative', marginRight: '4px' }}>
      <CurrencyLogo currency={currency} size={`${size}px`} />
      <img
        src={NETWORKS_INFO[chainId].icon}
        width={size / 2 + 'px'}
        height={size / 2 + 'px'}
        style={{
          position: 'absolute',
          top: 0,
          right: '-4px',
          ...chainLogoStyle,
        }}
      />
    </Flex>
  )
}

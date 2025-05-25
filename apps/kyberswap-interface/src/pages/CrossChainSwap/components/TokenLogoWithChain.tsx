import { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Flex } from 'rebass'

import CurrencyLogo from 'components/CurrencyLogo'
import { isEvmChain } from 'utils'

import { Chain, Currency } from '../adapters'
import { getNetworkInfo } from '../utils'

export const TokenLogoWithChain = ({
  currency,
  chainId,
  size = 16,
  chainLogoStyle = {},
}: {
  currency?: Currency
  chainId: Chain
  size?: number
  chainLogoStyle?: React.CSSProperties
}) => {
  return (
    <Flex sx={{ position: 'relative', marginRight: '4px' }}>
      {isEvmChain(chainId) ? (
        <CurrencyLogo currency={currency as EvmCurrency} size={`${size}px`} />
      ) : (
        <img
          src={(currency as any)?.logo}
          width={size}
          height={size}
          style={{ borderRadius: '50%' }}
          alt={currency?.symbol}
        />
      )}
      <img
        src={getNetworkInfo(chainId).icon}
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

import { ethCall } from '@kyber/rpc-client/fetch'
import { useEffect, useState } from 'react'

import { TokenInfo } from '../constants'
import { useActiveWeb3 } from './useWeb3Provider'

const ERC20_ABI = {
  name: '0x06fdde03', // keccak256("name()").slice(0, 4)
  symbol: '0x95d89b41', // keccak256("symbol()").slice(0, 4)
  decimals: '0x313ce567', // keccak256("decimals()").slice(0, 4)
}

const decodeString = (hex: string) => {
  if (!hex || hex === '0x') return ''
  const bytes = Uint8Array.from(
    hex
      .slice(2)
      .match(/.{1,2}/g)!
      .map(byte => parseInt(byte, 16)),
  )
  return new TextDecoder().decode(bytes).replace(/\0/g, '')
}

const decodeUint = (hex: string) => {
  if (!hex || hex === '0x') return 0
  return parseInt(hex, 16)
}

export const useToken = (address: string) => {
  const { chainId } = useActiveWeb3()
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!address || !chainId) return

      try {
        // Use RPC client with automatic rotation
        const [nameHex, symbolHex, decimalsHex] = await Promise.all([
          ethCall(chainId, address, ERC20_ABI.name),
          ethCall(chainId, address, ERC20_ABI.symbol),
          ethCall(chainId, address, ERC20_ABI.decimals),
        ])

        const name = decodeString(nameHex)
        const symbol = decodeString(symbolHex)
        const decimals = decodeUint(decimalsHex)

        setTokenInfo({
          address,
          name,
          symbol,
          decimals,
          chainId,
          logoURI: '',
        })
      } catch (error) {
        console.error('Failed to fetch token info:', error)
        setTokenInfo(null)
      }
    }

    fetchTokenInfo()
  }, [address, chainId])

  return tokenInfo
}

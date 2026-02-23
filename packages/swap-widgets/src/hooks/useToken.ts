import { useEffect, useState } from 'react'
import { TokenInfo } from '../constants'
import { useActiveWeb3 } from './useWeb3Provider'

const ERC20_ABI = {
  name: '0x06fdde03', // keccak256("name()").slice(0, 4)
  symbol: '0x95d89b41', // keccak256("symbol()").slice(0, 4)
  decimals: '0x313ce567', // keccak256("decimals()").slice(0, 4)
}

const callRPC = async (rpcUrl: string, data: string, to: string) => {
  const body = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{ to, data }, 'latest'],
    id: 1,
  }

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const result = await response.json()
  if (result.error) {
    throw new Error(result.error.message)
  }

  return result.result
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
  const { chainId, rpcUrl } = useActiveWeb3()
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!address || !rpcUrl) return

      try {
        const [nameHex, symbolHex, decimalsHex] = await Promise.all([
          callRPC(rpcUrl, ERC20_ABI.name, address),
          callRPC(rpcUrl, ERC20_ABI.symbol, address),
          callRPC(rpcUrl, ERC20_ABI.decimals, address),
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
  }, [address, rpcUrl, chainId])

  return tokenInfo
}

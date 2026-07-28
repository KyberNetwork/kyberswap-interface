import { useEffect, useState } from 'react'
import { directRpcFetch, ethCall } from '@kyber/rpc-client'
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
  const { chainId, rpcUrl, hasIntegratorRpcUrl } = useActiveWeb3()
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!address) return

      try {
        const call = (data: string) =>
          hasIntegratorRpcUrl
            ? directRpcFetch<string>(rpcUrl, 'eth_call', [{ to: address, data }, 'latest'])
            : ethCall(chainId, address, data)

        const [nameHex, symbolHex, decimalsHex] = await Promise.all([
          call(ERC20_ABI.name),
          call(ERC20_ABI.symbol),
          call(ERC20_ABI.decimals),
        ])

        setTokenInfo({
          address,
          name: decodeString(nameHex),
          symbol: decodeString(symbolHex),
          decimals: decodeUint(decimalsHex),
          chainId,
          logoURI: '',
        })
      } catch (error) {
        console.error('[swap-widgets] Failed to fetch token info:', error)
        setTokenInfo(null)
      }
    }

    fetchTokenInfo()
  }, [address, rpcUrl, hasIntegratorRpcUrl, chainId])

  return tokenInfo
}

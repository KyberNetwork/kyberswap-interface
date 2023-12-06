import { Token } from '@kyberswap/ks-sdk-core'

import { MultiChainTokenInfo } from 'pages/Bridge/type'
import { isAddress } from 'utils/address'

export interface TokenInfo {
  readonly chainId: number
  readonly address: string
  readonly name: string
  readonly decimals: number
  readonly symbol: string
  readonly logoURI?: string
  readonly isWhitelisted?: boolean // from backend
  readonly multichainInfo?: MultiChainTokenInfo // from multichain api
  readonly domainSeparator?: string
  readonly isStandardERC20?: boolean
}

export class WrappedTokenInfo extends Token {
  public readonly isNative: false = false as const
  public readonly isToken: true = true as const

  public readonly logoURI: string | undefined
  public readonly isWhitelisted: boolean = false
  public readonly multichainInfo: MultiChainTokenInfo | undefined

  public readonly domainSeparator?: string

  constructor(tokenInfo: TokenInfo) {
    const { isWhitelisted, multichainInfo, chainId, decimals, symbol, name, address, logoURI, domainSeparator } =
      tokenInfo
    super(chainId, isAddress(chainId, address) || address, decimals, symbol, name)

    this.multichainInfo = multichainInfo
    this.isWhitelisted = !!isWhitelisted
    this.logoURI = logoURI
    this.domainSeparator = domainSeparator
  }

  equals(other: Token): boolean {
    return other.chainId === this.chainId && other.isToken && other.address.toLowerCase() === this.address.toLowerCase()
  }

  sortsBefore(other: Token): boolean {
    if (this.equals(other)) throw new Error('Addresses should not be equal')
    return this.address.toLowerCase() < other.address.toLowerCase()
  }

  public get wrapped(): Token {
    return this
  }
}

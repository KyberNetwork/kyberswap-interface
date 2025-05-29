import { Token } from '@kyberswap/ks-sdk-core'

import { isAddress } from 'utils/address'

export interface TokenInfo {
  readonly chainId: number
  readonly address: string
  readonly name: string
  readonly decimals: number
  readonly symbol: string
  readonly logoURI?: string
  readonly isWhitelisted?: boolean // from backend
  readonly domainSeparator?: string
  readonly permitType?: 'AMOUNT' | 'SALT'
  readonly permitVersion?: '1' | '2'
  readonly isStandardERC20?: boolean
  readonly isStable?: boolean
  readonly cgkRank?: number
  readonly cmcRank?: number
}

export class WrappedTokenInfo extends Token {
  public readonly isNative: false = false as const
  public readonly isToken: true = true as const

  public readonly logoURI: string | undefined
  public readonly isWhitelisted: boolean = false

  public readonly domainSeparator?: string
  public readonly permitType?: 'AMOUNT' | 'SALT'
  public readonly permitVersion?: '1' | '2'
  public readonly cgkRank?: number
  public readonly cmcRank?: number
  public readonly isStable?: boolean

  constructor(tokenInfo: TokenInfo) {
    const {
      isWhitelisted,
      chainId,
      decimals,
      symbol,
      name,
      address,
      logoURI,
      domainSeparator,
      permitType,
      permitVersion,
      cmcRank,
      cgkRank,
      isStable,
    } = tokenInfo
    super(chainId, isAddress(chainId, address) || address, decimals, symbol, name)

    this.isWhitelisted = !!isWhitelisted
    this.logoURI = logoURI
    this.domainSeparator = domainSeparator
    this.permitType = permitType
    this.permitVersion = permitVersion
    this.cmcRank = cmcRank
    this.cgkRank = cgkRank
    this.isStable = isStable
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

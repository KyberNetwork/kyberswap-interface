import { ChainId } from '@kyberswap/ks-sdk-core'

export enum PermitType {
  AMOUNT = 1,
  SALT = 2,
}

export interface PermitInfo {
  type: PermitType
  // version is optional, and if omitted, will not be included in the domain
  version?: string
}

export const PERMITTABLE_TOKENS: {
  [chainId: number]: {
    [checksummedTokenAddress: string]: PermitInfo
  }
} = {
  [ChainId.MAINNET]: {
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { type: PermitType.SALT, version: '1' }, // USDC
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': { type: PermitType.SALT, version: '1' }, // DAI
  },
  [ChainId.MATIC]: {
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': { type: PermitType.SALT, version: '1' }, // USDC
  },
  [ChainId.OASIS]: {
    '0x32847e63E99D3a044908763056e25694490082F8': { type: PermitType.SALT, version: '1' },
    '0xd79Ef9A91b56c690C7b80570a3c060678667f469': { type: PermitType.SALT, version: '1' },
    '0x4cA2A3De42eabC8fd8b0AC46127E64DB08b9150e': { type: PermitType.SALT, version: '1' },
    '0x366EF31C8dc715cbeff5fA54Ad106dC9c25C6153': { type: PermitType.SALT, version: '1' },
    '0x3223f17957Ba502cbe71401D55A0DB26E5F7c68F': { type: PermitType.SALT, version: '1' },
    '0xE8A638b3B7565Ee7c5eb9755E58552aFc87b94DD': { type: PermitType.SALT, version: '1' },
    '0xdC19A122e268128B5eE20366299fc7b5b199C8e3': { type: PermitType.SALT, version: '1' },
    '0xd43ce0aa2a29DCb75bDb83085703dc589DE6C7eb': { type: PermitType.SALT, version: '1' },
    '0x3E62a9c3aF8b810dE79645C4579acC8f0d06a241': { type: PermitType.SALT, version: '1' },
    '0xFffD69E757d8220CEA60dc80B9Fe1a30b58c94F3': { type: PermitType.SALT, version: '1' },
    '0x1d1149a53deB36F2836Ae7877c9176413aDfA4A8': { type: PermitType.SALT, version: '1' },
    '0x24285C5232ce3858F00bacb950Cae1f59d1b2704': { type: PermitType.SALT, version: '1' },
    '0xa1E73c01E0cF7930F5e91CB291031739FE5Ad6C2': { type: PermitType.SALT, version: '1' },
    '0x4F43717B20ae319Aa50BC5B2349B93af5f7Ac823': { type: PermitType.SALT, version: '1' },
  },
  [ChainId.ARBITRUM]: {
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': { type: PermitType.SALT, version: '1' },
  },
  [ChainId.BSCMAINNET]: {
    '0xD6Cce248263ea1e2b8cB765178C944Fc16Ed0727': { type: PermitType.SALT, version: '1' },
  },
  [ChainId.VELAS]: {
    '0xcD7509b76281223f5B7d3aD5d47F8D7Aa5C2B9bf': { type: PermitType.SALT, version: '1' },
  },
  [ChainId.OPTIMISM]: {
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': { type: PermitType.SALT, version: '1' },
    '0xbfD291DA8A403DAAF7e5E9DC1ec0aCEaCd4848B9': { type: PermitType.SALT, version: '1' },
  },
  [ChainId.AVAXMAINNET]: {
    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E': { type: PermitType.SALT, version: '1' },
    '0xb599c3590F42f8F995ECfa0f85D2980B76862fc1': { type: PermitType.SALT, version: '1' },
  },
}

export const EIP712_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

export const EIP712_DOMAIN_TYPE_SALT = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'salt', type: 'bytes32' },
]

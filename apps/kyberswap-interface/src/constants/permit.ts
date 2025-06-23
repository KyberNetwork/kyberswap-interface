export enum PermitType {
  AMOUNT = 'AMOUNT',
  SALT = 'SALT',
}

export interface PermitInfo {
  type: PermitType
  // version is optional, and if omitted, will not be included in the domain
  version?: string
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

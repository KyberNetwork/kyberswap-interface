// Central re-exports of viem primitives used across the app. Import from here
// instead of `viem` directly so the surface area stays auditable in one place.

export {
  decodeAbiParameters,
  decodeEventLog,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  formatEther,
  formatUnits,
  getAddress,
  getContractAddress,
  hexToString,
  isAddress,
  keccak256,
  namehash,
  parseAbi,
  parseAbiItem,
  parseAbiParameters,
  parseEther,
  parseSignature,
  parseUnits,
  stringToHex,
  toBytes,
  toEventSelector,
  toHex,
} from 'viem'

export { maxUint256, zeroAddress, zeroHash } from 'viem'

export type { Abi, Address, Hash, Hex, PublicClient, WalletClient } from 'viem'

// Central re-exports of viem primitives used across the app.
//
// Import from here instead of `viem` directly so the migration off ethers.js
// can be tracked, audited, and eventually unified through a single module.
// New code should reach for these helpers; legacy ethers utilities are being
// retired phase-by-phase (see docs around feat/wagmi-migration).

export {
  decodeAbiParameters,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  formatEther,
  formatUnits,
  getAddress,
  getContractAddress,
  hexToString,
  isAddress,
  keccak256,
  namehash,
  parseAbi,
  parseAbiParameters,
  parseEther,
  parseUnits,
  stringToHex,
  toBytes,
  toHex,
} from 'viem'

export type { Abi, Address, Hash, Hex, PublicClient, WalletClient } from 'viem'

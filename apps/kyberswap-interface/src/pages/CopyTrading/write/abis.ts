import type { Abi } from 'utils/viem'

/**
 * Minimal ABIs for the copy-trade smart-contract wallet, transcribed from the
 * on-chain interfaces (`IKSFollowerAccountFactory`, `IKSFollowerAccount`).
 * Only the user-callable write surface needed by the front-end is included.
 */

export const FOLLOWER_FACTORY_ABI: Abi = [
  {
    type: 'function',
    name: 'createFollowerAccount',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'owner', type: 'address' },
          { name: 'leader', type: 'address' },
          { name: 'initialKSSigners', type: 'address[]' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
    ],
    outputs: [{ name: 'account', type: 'address' }],
  },
  {
    type: 'function',
    name: 'IMPLEMENTATION',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'event',
    name: 'CreateFollowerAccount',
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      {
        name: 'params',
        type: 'tuple',
        indexed: false,
        components: [
          { name: 'owner', type: 'address' },
          { name: 'leader', type: 'address' },
          { name: 'initialKSSigners', type: 'address[]' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
    ],
  },
]

export const FOLLOWER_ACCOUNT_ABI: Abi = [
  // FollowerPause enum: 0 NO_PAUSE, 1 PAUSE_BUY, 2 PAUSE_ALIGNED, 3 PAUSE_PERMANENTLY
  {
    type: 'function',
    name: 'updatePauseState',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newPauseState', type: 'uint8' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdrawQuoteToken',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeFollowerUnalignedSell',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'positionId', type: 'bytes32' },
          { name: 'swapper', type: 'address' },
          { name: 'encodedAmountIn', type: 'uint256' },
          { name: 'swapperData', type: 'bytes' },
          { name: 'minQuoteTokenReceived', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'signature', type: 'bytes' },
        ],
      },
    ],
    outputs: [],
  },
]

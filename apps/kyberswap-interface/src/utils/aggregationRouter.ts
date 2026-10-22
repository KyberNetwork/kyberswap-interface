import { Address, encodeAbiParameters, parseAbiParameters } from 'utils/viem'

export const AGGREGATION_ROUTER_V2 = '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5'
export const AGGREGATION_ROUTER_V3 = '0x6868D319c8c9A78F7d39DC3602C5c917315132D7'

// Identify the API-selected router; these addresses never override the route's spender or target.
export const isAggregationRouterV3 = (address?: string) =>
  address?.toLowerCase() === AGGREGATION_ROUTER_V3.toLowerCase()

export function encodeRouterPermit({
  owner,
  spender,
  value,
  deadline,
  v,
  r,
  s,
}: {
  owner: Address
  spender: Address
  value: bigint
  deadline: bigint
  v: number
  r: `0x${string}`
  s: `0x${string}`
}) {
  // V3 omits owner/spender from calldata, but both remain in the signed EIP-2612 message.
  return isAggregationRouterV3(spender)
    ? encodeAbiParameters(parseAbiParameters('uint256, uint256, uint8, bytes32, bytes32'), [value, deadline, v, r, s])
    : encodeAbiParameters(parseAbiParameters('address, address, uint256, uint256, uint8, bytes32, bytes32'), [
        owner,
        spender,
        value,
        deadline,
        v,
        r,
        s,
      ])
}

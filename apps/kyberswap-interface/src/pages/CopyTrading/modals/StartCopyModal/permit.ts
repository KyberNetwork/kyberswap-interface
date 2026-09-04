import { Buffer } from 'buffer'

import type { StartCopyAllowanceAuthorization } from 'pages/CopyTrading/modals/StartCopyModal/authorization'
import { type Address, encodeAbiParameters, isAddress, parseAbiParameters, parseSignature, toHex } from 'utils/viem'

const EIP712_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

const EIP712_DOMAIN_TYPE_SALT = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'salt', type: 'bytes32' },
]

const EIP2612_PERMIT_TYPE = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
]

const DAI_LIKE_PERMIT_TYPE = [
  { name: 'holder', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
  { name: 'allowed', type: 'bool' },
]

type PermitValues = {
  account: Address
  authorization: StartCopyAllowanceAuthorization
  deadline: number
  nonce: bigint
}

export const buildStartCopyPermitTypedData = ({ account, authorization, deadline, nonce }: PermitValues) => {
  if (!isAddress(account) || !Number.isSafeInteger(deadline) || deadline <= 0 || nonce < 0n) {
    throw new Error('The Start Copy permit values are invalid.')
  }
  if (
    authorization.permitScheme === 'START_COPY_PERMIT_SCHEME_ALLOWANCE_ONLY' ||
    !authorization.domainKind ||
    !authorization.domainName ||
    !authorization.domainVersion
  ) {
    throw new Error('This Start Copy authorization does not support a native permit.')
  }

  const domain =
    authorization.domainKind === 'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID_SALT'
      ? {
          name: authorization.domainName,
          version: authorization.domainVersion,
          verifyingContract: authorization.quoteTokenAddress,
          salt: toHex(authorization.chainId, { size: 32 }),
        }
      : {
          name: authorization.domainName,
          version: authorization.domainVersion,
          chainId: authorization.chainId,
          verifyingContract: authorization.quoteTokenAddress,
        }
  const EIP712Domain =
    authorization.domainKind === 'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID_SALT'
      ? EIP712_DOMAIN_TYPE_SALT
      : EIP712_DOMAIN_TYPE

  if (authorization.permitScheme === 'START_COPY_PERMIT_SCHEME_ERC20_EIP2612') {
    return {
      types: { EIP712Domain, Permit: EIP2612_PERMIT_TYPE },
      domain,
      primaryType: 'Permit',
      message: {
        owner: account,
        spender: authorization.spenderAddress,
        value: authorization.requiredAllowanceRaw,
        nonce: nonce.toString(),
        deadline,
      },
    }
  }

  return {
    types: { EIP712Domain, Permit: DAI_LIKE_PERMIT_TYPE },
    domain,
    primaryType: 'Permit',
    message: {
      holder: account,
      spender: authorization.spenderAddress,
      nonce: nonce.toString(),
      expiry: deadline,
      allowed: true,
    },
  }
}

export const encodeStartCopyPermitData = ({
  authorization,
  deadline,
  nonce,
  rawSignature,
}: Omit<PermitValues, 'account'> & { rawSignature: string }) => {
  if (authorization.permitScheme === 'START_COPY_PERMIT_SCHEME_ALLOWANCE_ONLY') {
    throw new Error('The allowance-only Start Copy flow cannot encode permit data.')
  }

  let signature: ReturnType<typeof parseSignature>
  try {
    signature = parseSignature(rawSignature as `0x${string}`)
  } catch {
    throw new Error('Invalid Start Copy permit signature.')
  }

  const v = Number(signature.v ?? (signature.yParity === 0 ? 27 : 28))
  if (v !== 27 && v !== 28) throw new Error('Invalid Start Copy permit signature.')

  const encoded =
    authorization.permitScheme === 'START_COPY_PERMIT_SCHEME_ERC20_EIP2612'
      ? encodeAbiParameters(parseAbiParameters('uint256, uint256, uint8, bytes32, bytes32'), [
          BigInt(authorization.requiredAllowanceRaw),
          BigInt(deadline),
          v,
          signature.r,
          signature.s,
        ])
      : encodeAbiParameters(parseAbiParameters('uint256, uint256, bool, uint8, bytes32, bytes32'), [
          nonce,
          BigInt(deadline),
          true,
          v,
          signature.r,
          signature.s,
        ])
  const expectedByteLength = authorization.permitScheme === 'START_COPY_PERMIT_SCHEME_ERC20_EIP2612' ? 160 : 192
  if ((encoded.length - 2) / 2 !== expectedByteLength) {
    throw new Error('The Start Copy permit payload has an invalid length.')
  }

  return Buffer.from(encoded.slice(2), 'hex').toString('base64')
}

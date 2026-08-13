import { Buffer } from 'buffer'
import type {
  PreparedAction,
  StartCopyApprovalScheme,
  StartCopyEip712DomainKind,
  StartCopyPermitScheme,
} from 'services/copyTrading/types'

import {
  type Address,
  encodeAbiParameters,
  isAddress,
  maxUint256,
  parseAbiParameters,
  parseSignature,
  toHex,
} from 'utils/viem'

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

type SupportedApprovalScheme = Extract<
  StartCopyApprovalScheme,
  'START_COPY_APPROVAL_SCHEME_STANDARD' | 'START_COPY_APPROVAL_SCHEME_ZERO_THEN_SET'
>

type SupportedPermitScheme = Extract<
  StartCopyPermitScheme,
  | 'START_COPY_PERMIT_SCHEME_ALLOWANCE_ONLY'
  | 'START_COPY_PERMIT_SCHEME_ERC20_EIP2612'
  | 'START_COPY_PERMIT_SCHEME_ERC20_DAI_LIKE'
>

type PermitDomainKind = Extract<
  StartCopyEip712DomainKind,
  'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID' | 'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID_SALT'
>

export type StartCopyAllowanceAuthorization = {
  approvalScheme: SupportedApprovalScheme
  chainId: number
  createAmountRaw: string
  currentAllowanceRaw: string
  domainKind?: PermitDomainKind
  domainName?: string
  domainVersion?: string
  permitScheme: SupportedPermitScheme
  quoteTokenAddress: Address
  requiredAllowanceRaw: string
  spenderAddress: Address
}

const isUint256String = (value?: string) => !!value && /^\d{1,78}$/.test(value) && BigInt(value) <= maxUint256

export const getStartCopyAllowanceAuthorization = (action: PreparedAction): StartCopyAllowanceAuthorization => {
  if (
    action.status !== 'PREPARED_ACTION_STATUS_UNAVAILABLE' ||
    action.reason !== 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE'
  ) {
    throw new Error('The preparation does not require Start Copy token authorization.')
  }
  if (action.call) throw new Error('The unavailable Start Copy authorization unexpectedly returned a call.')

  const chainId = Number(action.chainId)
  const preview = action.startCopy
  const requirement = preview?.allowanceRequirement
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error('The Start Copy authorization returned an invalid chain.')
  }
  if (preview?.stage !== 'START_COPY_STAGE_CREATE_REQUIRED' || !requirement) {
    throw new Error('The Start Copy authorization returned an unexpected stage.')
  }
  const quoteTokenAddress = preview.quoteToken?.address
  if (!isAddress(quoteTokenAddress || '')) {
    throw new Error('The Start Copy authorization returned an invalid quote token.')
  }
  if (preview.quoteToken?.chainId && Number(preview.quoteToken.chainId) !== chainId) {
    throw new Error('The Start Copy authorization quote token is on a different chain.')
  }
  const spenderAddress = requirement.spenderAddress
  if (!isAddress(spenderAddress || '')) {
    throw new Error('The Start Copy authorization returned an invalid spender.')
  }
  const createAmountRaw = preview.createAmountRaw
  const currentAllowanceRaw = requirement.currentAllowanceRaw
  const requiredAllowanceRaw = requirement.requiredAllowanceRaw
  if (
    !isUint256String(createAmountRaw) ||
    !isUint256String(currentAllowanceRaw) ||
    !isUint256String(requiredAllowanceRaw)
  ) {
    throw new Error('The Start Copy authorization returned inconsistent allowance amounts.')
  }
  const validatedCreateAmountRaw = createAmountRaw as string
  const validatedCurrentAllowanceRaw = currentAllowanceRaw as string
  const validatedRequiredAllowanceRaw = requiredAllowanceRaw as string
  if (BigInt(validatedRequiredAllowanceRaw) === 0n || validatedRequiredAllowanceRaw !== validatedCreateAmountRaw) {
    throw new Error('The Start Copy authorization returned inconsistent allowance amounts.')
  }
  if (BigInt(validatedCurrentAllowanceRaw) >= BigInt(validatedRequiredAllowanceRaw)) {
    throw new Error('The Start Copy authorization reason conflicts with its allowance values.')
  }

  const approvalScheme = requirement.approvalScheme
  if (
    approvalScheme !== 'START_COPY_APPROVAL_SCHEME_STANDARD' &&
    approvalScheme !== 'START_COPY_APPROVAL_SCHEME_ZERO_THEN_SET'
  ) {
    throw new Error('The Start Copy authorization returned an unsupported approval scheme.')
  }

  const permitScheme = requirement.permitScheme
  if (
    permitScheme !== 'START_COPY_PERMIT_SCHEME_ALLOWANCE_ONLY' &&
    permitScheme !== 'START_COPY_PERMIT_SCHEME_ERC20_EIP2612' &&
    permitScheme !== 'START_COPY_PERMIT_SCHEME_ERC20_DAI_LIKE'
  ) {
    throw new Error('The Start Copy authorization returned an unsupported permit scheme.')
  }
  const validatedApprovalScheme = approvalScheme as SupportedApprovalScheme
  const validatedPermitScheme = permitScheme as SupportedPermitScheme
  const validatedQuoteTokenAddress = quoteTokenAddress as Address
  const validatedSpenderAddress = spenderAddress as Address

  if (permitScheme === 'START_COPY_PERMIT_SCHEME_ALLOWANCE_ONLY') {
    if (
      requirement.eip712DomainName ||
      requirement.eip712DomainVersion ||
      (requirement.eip712DomainKind && requirement.eip712DomainKind !== 'START_COPY_EIP712_DOMAIN_KIND_UNSPECIFIED')
    ) {
      throw new Error('The allowance-only Start Copy authorization unexpectedly returned a permit domain.')
    }

    return {
      approvalScheme: validatedApprovalScheme,
      chainId,
      createAmountRaw: validatedCreateAmountRaw,
      currentAllowanceRaw: validatedCurrentAllowanceRaw,
      permitScheme: validatedPermitScheme,
      quoteTokenAddress: validatedQuoteTokenAddress,
      requiredAllowanceRaw: validatedRequiredAllowanceRaw,
      spenderAddress: validatedSpenderAddress,
    }
  }

  if (!requirement.eip712DomainName || !requirement.eip712DomainVersion) {
    throw new Error('The Start Copy permit authorization is missing its EIP-712 domain.')
  }
  if (
    requirement.eip712DomainKind !== 'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID' &&
    requirement.eip712DomainKind !== 'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID_SALT'
  ) {
    throw new Error('The Start Copy permit authorization returned an unsupported EIP-712 domain.')
  }
  const domainKind = requirement.eip712DomainKind as PermitDomainKind

  return {
    approvalScheme: validatedApprovalScheme,
    chainId,
    createAmountRaw: validatedCreateAmountRaw,
    currentAllowanceRaw: validatedCurrentAllowanceRaw,
    domainKind,
    domainName: requirement.eip712DomainName,
    domainVersion: requirement.eip712DomainVersion,
    permitScheme: validatedPermitScheme,
    quoteTokenAddress: validatedQuoteTokenAddress,
    requiredAllowanceRaw: validatedRequiredAllowanceRaw,
    spenderAddress: validatedSpenderAddress,
  }
}

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

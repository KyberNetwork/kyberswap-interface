import type {
  PreparedAction,
  StartCopyApprovalScheme,
  StartCopyEip712DomainKind,
  StartCopyPermitScheme,
} from 'services/copyTrading/types/preparedActions'

import { type Address, isAddress, maxUint256 } from 'utils/viem'

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

export type StartCopyAuthorizationKind = 'approve' | 'permit'

export const getStartCopyAuthorizationKind = (
  action: PreparedAction,
  requiresApprovalFallback: boolean,
): StartCopyAuthorizationKind => {
  const permitScheme = action.startCopy?.allowanceRequirement?.permitScheme
  const supportsPermit =
    permitScheme === 'START_COPY_PERMIT_SCHEME_ERC20_EIP2612' ||
    permitScheme === 'START_COPY_PERMIT_SCHEME_ERC20_DAI_LIKE'

  return supportsPermit && !requiresApprovalFallback ? 'permit' : 'approve'
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

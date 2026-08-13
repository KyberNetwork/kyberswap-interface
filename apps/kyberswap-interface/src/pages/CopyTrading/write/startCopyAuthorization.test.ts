import { Buffer } from 'buffer'
import type { PreparedAction, StartCopyPermitScheme } from 'services/copyTrading/types'
import { describe, expect, it } from 'vitest'

import {
  buildStartCopyPermitTypedData,
  encodeStartCopyPermitData,
  getStartCopyAllowanceAuthorization,
} from 'pages/CopyTrading/write/startCopyAuthorization'
import { decodeAbiParameters, parseAbiParameters } from 'utils/viem'

const OWNER = '0x1111111111111111111111111111111111111111'
const TOKEN = '0x2222222222222222222222222222222222222222'
const SPENDER = '0x3333333333333333333333333333333333333333'
const SIGNATURE = `0x${'11'.repeat(32)}${'22'.repeat(32)}1b`

const startCopyAction = (
  permitScheme: StartCopyPermitScheme = 'START_COPY_PERMIT_SCHEME_ERC20_EIP2612',
): PreparedAction => ({
  status: 'PREPARED_ACTION_STATUS_UNAVAILABLE',
  reason: 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE',
  chainId: '8453',
  expectedAccount: OWNER,
  startCopy: {
    stage: 'START_COPY_STAGE_CREATE_REQUIRED',
    createAmountRaw: '50000000',
    quoteToken: { chainId: '8453', address: TOKEN },
    allowanceRequirement: {
      spenderAddress: SPENDER,
      currentAllowanceRaw: '0',
      requiredAllowanceRaw: '50000000',
      approvalScheme: 'START_COPY_APPROVAL_SCHEME_STANDARD',
      permitScheme,
      ...(permitScheme === 'START_COPY_PERMIT_SCHEME_ALLOWANCE_ONLY'
        ? {}
        : {
            eip712DomainName: 'USD Coin',
            eip712DomainVersion: '2',
            eip712DomainKind: 'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID',
          }),
    },
  },
})

describe('getStartCopyAllowanceAuthorization', () => {
  it('accepts an operator-authored funded allowance requirement', () => {
    expect(getStartCopyAllowanceAuthorization(startCopyAction())).toMatchObject({
      approvalScheme: 'START_COPY_APPROVAL_SCHEME_STANDARD',
      chainId: 8453,
      permitScheme: 'START_COPY_PERMIT_SCHEME_ERC20_EIP2612',
      quoteTokenAddress: TOKEN,
      requiredAllowanceRaw: '50000000',
      spenderAddress: SPENDER,
    })
  })

  it('rejects a requirement whose allowance does not match the funded create amount', () => {
    const action = startCopyAction()
    if (action.startCopy?.allowanceRequirement) {
      action.startCopy.allowanceRequirement.requiredAllowanceRaw = '49999999'
    }

    expect(() => getStartCopyAllowanceAuthorization(action)).toThrow('inconsistent allowance amounts')
  })
})

describe('Start Copy permit encoding', () => {
  it('builds and encodes the reviewed EIP-2612 five-argument payload', () => {
    const authorization = getStartCopyAllowanceAuthorization(startCopyAction())
    const typedData = buildStartCopyPermitTypedData({
      account: OWNER,
      authorization,
      deadline: 2_000_000_000,
      nonce: 7n,
    })

    expect(typedData).toMatchObject({
      domain: { chainId: 8453, name: 'USD Coin', version: '2', verifyingContract: TOKEN },
      message: { owner: OWNER, spender: SPENDER, value: '50000000', nonce: '7', deadline: 2_000_000_000 },
    })

    const base64 = encodeStartCopyPermitData({
      authorization,
      deadline: 2_000_000_000,
      nonce: 7n,
      rawSignature: SIGNATURE,
    })
    const permitHex = `0x${Buffer.from(base64, 'base64').toString('hex')}` as `0x${string}`
    const decoded = decodeAbiParameters(parseAbiParameters('uint256, uint256, uint8, bytes32, bytes32'), permitHex)

    expect(Buffer.from(base64, 'base64')).toHaveLength(160)
    expect(decoded.slice(0, 3)).toEqual([50_000_000n, 2_000_000_000n, 27])
  })

  it('builds the salt domain and reviewed DAI-like six-argument payload', () => {
    const action = startCopyAction('START_COPY_PERMIT_SCHEME_ERC20_DAI_LIKE')
    if (action.startCopy?.allowanceRequirement) {
      action.startCopy.allowanceRequirement.eip712DomainKind = 'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID_SALT'
    }
    const authorization = getStartCopyAllowanceAuthorization(action)
    const typedData = buildStartCopyPermitTypedData({
      account: OWNER,
      authorization,
      deadline: 2_000_000_000,
      nonce: 9n,
    })

    expect(typedData.domain).toMatchObject({
      name: 'USD Coin',
      version: '2',
      verifyingContract: TOKEN,
      salt: `0x${'0'.repeat(60)}2105`,
    })
    expect(typedData.message).toMatchObject({ holder: OWNER, spender: SPENDER, nonce: '9', allowed: true })

    const base64 = encodeStartCopyPermitData({
      authorization,
      deadline: 2_000_000_000,
      nonce: 9n,
      rawSignature: SIGNATURE,
    })
    const permitHex = `0x${Buffer.from(base64, 'base64').toString('hex')}` as `0x${string}`
    const decoded = decodeAbiParameters(
      parseAbiParameters('uint256, uint256, bool, uint8, bytes32, bytes32'),
      permitHex,
    )

    expect(Buffer.from(base64, 'base64')).toHaveLength(192)
    expect(decoded.slice(0, 4)).toEqual([9n, 2_000_000_000n, true, 27])
  })
})

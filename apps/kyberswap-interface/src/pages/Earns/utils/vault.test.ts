import {
  VaultApiStats,
  VaultBalanceHistory,
  VaultBalancePoint,
  VaultFinancialValue,
  VaultPositionItem,
  VaultPositionOwnedValue,
  VaultSupportedAsset,
  VaultWithdrawalRoute,
} from 'services/vault'
import { describe, expect, it } from 'vitest'

import {
  getNativeWithdrawal,
  toEarningSeries,
  toHeadlineRate,
  toUserVaultPosition,
  toWalletUsd,
} from 'pages/Earns/utils/vault'

const USDS = '0xdC035D45d973E3EC169d2276DDab16f1e407384F'
const WEETH = '0xCd5fE23C85820F7B72D0926fC9b05b43E359b7ee'

const financial = (value: string | null, status = 'COMPUTABLE'): VaultFinancialValue => ({
  value,
  status,
  reason: null,
  valuationQuality: 'OBSERVED',
  asOf: null,
})

const stats = (rateKind: string, current: VaultFinancialValue, apy7d: VaultFinancialValue): VaultApiStats => ({
  sharePrice: '1',
  canonicalMetrics: {
    rateKind,
    rateLookback: rateKind === 'forward_compounded' ? null : '7d',
    stepSeconds: 0,
    methodology: '',
    current: { timestamp: null, tvl: financial('1'), rate: current },
    apy1d: financial('0'),
    apy7d,
    apy30d: financial('0'),
    points: [],
  },
})

const route = (overrides: Partial<VaultWithdrawalRoute> = {}): VaultWithdrawalRoute => ({
  queueFamily: 'BORING_QUEUE',
  queueAddress: '0x0D2dF071207E18Ca8638b4f04E98c53155eC2cE0',
  available: true,
  reason: null,
  observedBlockNumber: 1,
  observedBlockHash: null,
  limits: {
    secondsToMaturity: 3600,
    minimumSecondsToDeadline: 259200,
    minDiscount: 1,
    maxDiscount: 10,
    minimumShares: '0',
  },
  ...overrides,
})

const asset = (overrides: Partial<VaultSupportedAsset> = {}): VaultSupportedAsset => ({
  withdrawalMode: 'QUEUED',
  assetAddress: WEETH,
  symbol: 'weETH',
  decimals: 18,
  supportsDeposit: true,
  supportsWithdraw: true,
  isActive: true,
  withdrawalRoutes: [route()],
  ...overrides,
})

describe('toHeadlineRate', () => {
  it('reads the forward rate of a vault quoted on one, not its trailing return', () => {
    expect(toHeadlineRate(stats('forward_compounded', financial('3.80000000'), financial('3.7309')))).toBe(3.8)
  })

  it('reads the trailing rate of a vault quoted on that', () => {
    expect(toHeadlineRate(stats('trailing_simple_annualized', financial('3.1722'), financial('3.1722')))).toBe(3.1722)
  })

  it('keeps a zero or negative rate, which is a figure and not an absence', () => {
    expect(toHeadlineRate(stats('trailing_simple_annualized', financial('0'), financial('1')))).toBe(0)
    expect(toHeadlineRate(stats('trailing_simple_annualized', financial('-0.5'), financial('1')))).toBe(-0.5)
  })

  it('has no figure while the rate is pending, and does not borrow the trailing one', () => {
    expect(toHeadlineRate(stats('forward_compounded', financial(null, 'PENDING'), financial('3.7309')))).toBeUndefined()
    expect(toHeadlineRate(undefined)).toBeUndefined()
  })
})

describe('getNativeWithdrawal', () => {
  const synchronous = asset({
    withdrawalMode: 'SYNCHRONOUS_ERC4626',
    assetAddress: USDS,
    symbol: 'USDS',
    withdrawalRoutes: [],
  })

  it('redeems on a synchronous vault that lists no route at all', () => {
    expect(getNativeWithdrawal(synchronous, USDS.toLowerCase())).toEqual({ kind: 'redeem' })
  })

  it('redeems only into the underlying, which is all a redemption pays', () => {
    expect(getNativeWithdrawal(synchronous, WEETH)).toBeUndefined()
    expect(getNativeWithdrawal(synchronous, undefined)).toBeUndefined()
  })

  it('queues on a queued vault through its open route', () => {
    const queued = asset()
    expect(getNativeWithdrawal(queued, WEETH)).toEqual({ kind: 'queue', route: queued.withdrawalRoutes?.[0] })
  })

  it('has no queue to offer when the route is closed, has no terms or is of another family', () => {
    expect(getNativeWithdrawal(asset({ withdrawalRoutes: [route({ available: false })] }), WEETH)).toBeUndefined()
    expect(getNativeWithdrawal(asset({ withdrawalRoutes: [route({ limits: null })] }), WEETH)).toBeUndefined()
    expect(
      getNativeWithdrawal(asset({ withdrawalRoutes: [route({ queueFamily: 'ATOMIC_QUEUE' })] }), WEETH),
    ).toBeUndefined()
    expect(getNativeWithdrawal(asset({ withdrawalRoutes: [] }), WEETH)).toBeUndefined()
  })

  it('infers nothing from a mode it does not recognise, whatever routes come with it', () => {
    expect(getNativeWithdrawal(asset({ withdrawalMode: 'UNKNOWN' }), WEETH)).toBeUndefined()
    expect(getNativeWithdrawal(asset({ withdrawalMode: 'SOMETHING_NEW' }), WEETH)).toBeUndefined()
  })

  it('offers nothing for an asset that is inactive or closed to withdrawals', () => {
    expect(getNativeWithdrawal(asset({ isActive: false }), WEETH)).toBeUndefined()
    expect(getNativeWithdrawal(asset({ supportsWithdraw: false }), WEETH)).toBeUndefined()
    expect(getNativeWithdrawal({ ...synchronous, supportsWithdraw: false }, USDS)).toBeUndefined()
    expect(getNativeWithdrawal(undefined, USDS)).toBeUndefined()
  })
})

const ownedValue = (walletUsd: VaultFinancialValue, totalUsd: VaultFinancialValue): VaultPositionOwnedValue => ({
  asOf: null,
  escrowedSharesRaw: null,
  walletUsd,
  pendingPayoutUsd: financial('0'),
  refundableSharesUsd: financial('0'),
  totalUsd,
})

const position = (owned: VaultPositionOwnedValue | null): VaultPositionItem => ({
  chain: { id: 1, name: 'Ethereum', logo: '' },
  wallet: '0x0000000000000000000000000000000000000001',
  vault: {
    id: '0x01',
    address: WEETH,
    shareToken: { address: WEETH, symbol: 'liquidETH', decimals: 18, logo: '' },
    underlyingToken: { address: WEETH, symbol: 'weETH', decimals: 18, logo: '' },
    provider: { key: 'etherfi', name: 'ether.fi', logo: '' },
    assetGroup: 'ETH',
    stats: stats('trailing_simple_annualized', financial('3.7'), financial('3.7')),
  },
  status: 'PositionStatusActive',
  shareBalanceRaw: '1000000000000000000',
  shareBalance: '1',
  underlyingEquivalentRaw: '1100000000000000000',
  underlyingEquivalent: '1.1',
  lastBalanceChangeAt: 0,
  ownedValue: owned,
})

describe('toWalletUsd', () => {
  it('reads what the shares in the wallet are worth', () => {
    expect(toWalletUsd(position(ownedValue(financial('120.5'), financial('300'))))).toBe(120.5)
  })

  it('is zero while that value is not computable or the position has not loaded', () => {
    expect(toWalletUsd(position(ownedValue(financial(null, 'PENDING'), financial('300'))))).toBe(0)
    expect(toWalletUsd(position(null))).toBe(0)
    expect(toWalletUsd(undefined)).toBe(0)
  })
})

describe('toUserVaultPosition', () => {
  it('values the position at its total, a withdrawal in flight included', () => {
    const mapped = toUserVaultPosition(position(ownedValue(financial('120.5'), financial('300'))))
    expect(mapped.balanceUsd).toBe(300)
    expect(mapped.shareBalanceUsd).toBe(120.5)
  })

  it('falls back to the wallet share when the total cannot be computed', () => {
    const mapped = toUserVaultPosition(position(ownedValue(financial('120.5'), financial(null, 'UNAVAILABLE'))))
    expect(mapped.balanceUsd).toBe(120.5)
  })

  it('reads zero when no owned value is reported at all', () => {
    const mapped = toUserVaultPosition(position(null))
    expect(mapped.balanceUsd).toBe(0)
    expect(mapped.shareBalanceUsd).toBe(0)
  })
})

const balancePoint = (
  timestamp: string,
  usdEquivalent: string | null,
  usdStatus = 'COMPUTABLE',
): VaultBalancePoint => ({
  timestamp,
  balance: financial('100'),
  vaultEarnings: {
    amount: '1',
    assetAddress: USDS,
    status: 'COMPUTABLE',
    reason: null,
    valuationQuality: 'OBSERVED',
    methodology: '',
    coverageStart: null,
    coverageEnd: null,
    asOf: null,
    usdEquivalent,
    usdStatus,
    usdReason: null,
    usdValuationQuality: 'OBSERVED',
    usdAsOf: null,
  },
})

const balanceHistory = (points: VaultBalancePoint[]): VaultBalanceHistory => ({
  metric: 'balance',
  currency: 'USDS',
  methodology: '',
  interval: '7d',
  stepSeconds: 3600,
  balanceScope: 'wallet',
  assetAddress: USDS,
  windowStart: null,
  windowEnd: null,
  accountingOrigin: null,
  current: points[points.length - 1],
  points,
})

describe('toEarningSeries', () => {
  it('plots the USD earnings carried by each balance point, not the balance', () => {
    const series = toEarningSeries(balanceHistory([balancePoint('t1', '0.10'), balancePoint('t2', '0.13')]))
    expect(series).toEqual([
      { value: 0.1, timestamp: 't1' },
      { value: 0.13, timestamp: 't2' },
    ])
  })

  it('drops the buckets before the first valued one and keeps a later gap as a gap', () => {
    const series = toEarningSeries(
      balanceHistory([
        balancePoint('t1', null, 'PENDING'),
        balancePoint('t2', '0.10'),
        balancePoint('t3', null, 'UNAVAILABLE'),
        balancePoint('t4', '-0.02'),
      ]),
    )
    expect(series).toEqual([
      { value: 0.1, timestamp: 't2' },
      { value: null, timestamp: 't3' },
      { value: -0.02, timestamp: 't4' },
    ])
  })

  it('is empty while the history has not loaded', () => {
    expect(toEarningSeries(undefined)).toEqual([])
  })
})

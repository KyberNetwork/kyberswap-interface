import { ChainId } from '@kyberswap/ks-sdk-core'
import { type ListOrdersParams, buildListOrdersSearchParams, transformListOrdersResponse } from 'services/limitOrder'
import { describe, expect, it } from 'vitest'

import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'

const baseParams: ListOrdersParams = {
  chainIds: [ChainId.MAINNET, ChainId.BSCMAINNET],
  maker: '0x1111111111111111111111111111111111111111',
  status: LimitOrderStatus.CLOSED,
  query: '',
  page: 1,
  pageSize: 10,
}

const makeOrder = (id: number, chainId: number) => {
  return { id, chainId } as LimitOrder
}

const envelope = (data: {
  orders?: LimitOrder[]
  pagination?: { totalItems?: number; hasMore?: boolean; nextCursor?: string }
}) => ({ code: 0, message: 'successfully', data })

describe('buildListOrdersSearchParams', () => {
  it('repeats chainIds once per chain', () => {
    const searchParams = buildListOrdersSearchParams(baseParams)

    expect(searchParams.getAll('chainIds')).toEqual(['1', '56'])
    expect(searchParams.get('maker')).toBe(baseParams.maker)
    expect(searchParams.get('status')).toBe('closed')
    expect(searchParams.get('page')).toBe('1')
    expect(searchParams.get('pageSize')).toBe('10')
  })

  it('omits chainIds entirely when the array is empty', () => {
    const searchParams = buildListOrdersSearchParams({ ...baseParams, chainIds: [] })

    expect(searchParams.has('chainIds')).toBe(false)
    expect(searchParams.toString()).not.toContain('chainIds')
  })

  it('omits page when a cursor is sent', () => {
    const searchParams = buildListOrdersSearchParams({ ...baseParams, page: 3, cursor: 'opaque-cursor' })

    expect(searchParams.has('page')).toBe(false)
    expect(searchParams.get('cursor')).toBe('opaque-cursor')
    expect(searchParams.get('pageSize')).toBe('10')
  })

  it('keeps page when there is no cursor', () => {
    expect(buildListOrdersSearchParams({ ...baseParams, page: 3 }).get('page')).toBe('3')
    expect(buildListOrdersSearchParams({ ...baseParams, page: 3, cursor: '' }).get('page')).toBe('3')
  })

  it('drops params the caller left undefined', () => {
    const searchParams = buildListOrdersSearchParams({ ...baseParams, maker: undefined, query: undefined })

    expect(searchParams.has('maker')).toBe(false)
    expect(searchParams.has('query')).toBe(false)
    expect(searchParams.has('cursor')).toBe(false)
  })
})

describe('transformListOrdersResponse', () => {
  it('passes hasMore and nextCursor through', () => {
    const result = transformListOrdersResponse(
      envelope({
        orders: [makeOrder(1, ChainId.MAINNET)],
        pagination: { totalItems: 1001, hasMore: true, nextCursor: 'opaque-cursor' },
      }),
    )

    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe('opaque-cursor')
    expect(result.totalOrder).toBe(1001)
  })

  it('reads a backend without cursor paging as the last page', () => {
    const result = transformListOrdersResponse(envelope({ orders: [makeOrder(1, ChainId.MAINNET)] }))

    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeUndefined()
  })

  it('keeps hasMore true when the backend has no cursor secret to hand one out', () => {
    const result = transformListOrdersResponse(
      envelope({ orders: [makeOrder(1, ChainId.MAINNET)], pagination: { totalItems: 20, hasMore: true } }),
    )

    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBeUndefined()
  })

  it('drops orders on unsupported chains and discounts them from the total', () => {
    const result = transformListOrdersResponse(
      envelope({
        orders: [makeOrder(1, ChainId.MAINNET), makeOrder(2, 999999), makeOrder(3, ChainId.BSCMAINNET)],
        pagination: { totalItems: 30 },
      }),
    )

    expect(result.orders.map(order => order.id)).toEqual([1, 3])
    expect(result.totalOrder).toBe(29)
  })

  it('never reports a total below the orders it kept', () => {
    const result = transformListOrdersResponse(
      envelope({ orders: [makeOrder(1, ChainId.MAINNET), makeOrder(2, ChainId.BSCMAINNET)] }),
    )

    expect(result.totalOrder).toBe(2)
  })

  it('handles an empty payload', () => {
    const result = transformListOrdersResponse(envelope({}))

    expect(result).toEqual({ orders: [], totalOrder: 0, hasMore: false, nextCursor: undefined })
  })

  it('normalizes a string chainId to a number', () => {
    const result = transformListOrdersResponse(envelope({ orders: [{ id: 1, chainId: '1' } as unknown as LimitOrder] }))

    expect(result.orders[0].chainId).toBe(1)
  })
})

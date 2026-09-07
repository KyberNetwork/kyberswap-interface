import { PUBLIC_RPC_ENDPOINTS, clearRpcClients } from '@kyber/rpc-client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { HttpRequestError, RpcRequestError } from 'viem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NETWORKS_INFO } from 'constants/networks'

import { rpcClientTransport } from './rpcClientTransport'

const CHAIN = ChainId.BASE
const KYBER = NETWORKS_INFO[CHAIN].defaultRpcUrl
const PUBLICS = PUBLIC_RPC_ENDPOINTS[CHAIN]
/** The client's own freshness probes use this method; they are not the transport's calls. */
const PROBE_METHOD = 'eth_blockNumber'

type Answer = {
  status?: number
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
  hang?: boolean
}

/** Hosts the transport's calls reached, in order. */
const hits: string[] = []
let answers: (url: string) => Answer

const stubFetch = () =>
  vi.stubGlobal('fetch', async (url: string, init: { body: string }) => {
    const { id, method } = JSON.parse(init.body)
    const reply = (body: object, status = 200) =>
      new Response(JSON.stringify({ jsonrpc: '2.0', id, ...body }), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    if (method === PROBE_METHOD) return reply({ result: '0x1' })
    hits.push(url)
    const answer = answers(url)
    if (answer.hang) return new Promise<Response>(() => undefined)
    return reply(answer.error ? { error: answer.error } : { result: answer.result ?? '0x1' }, answer.status)
  })

const transport = (retryCount = 0) => rpcClientTransport(CHAIN)({ chain: undefined, retryCount } as never)
const request = (method = 'eth_chainId', params: unknown[] = []) => transport().request({ method, params } as never)

describe('rpcClientTransport', () => {
  beforeEach(() => {
    hits.length = 0
    clearRpcClients()
    stubFetch()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('builds a transport that does not retry on its own', () => {
    expect(transport(3).config.retryCount).toBe(0)
  })

  it('reads a public endpoint first and answers with the node value', async () => {
    answers = () => ({ result: '0x42' })
    await expect(request()).resolves.toBe('0x42')
    expect(PUBLICS).toContain(hits[0])
    expect(hits).not.toContain(KYBER)
  })

  it('hands a revert to viem with its code and data, without rotating', async () => {
    const data = '0x08c379a0'
    answers = () => ({ error: { code: 3, message: 'execution reverted: Foo()', data } })
    const error = await request('eth_call', [{ to: '0x1', data: '0x' }, 'latest']).catch(e => e)
    expect(error).toBeInstanceOf(RpcRequestError)
    expect(error.code).toBe(3)
    expect(error.data).toBe(data)
    // A revert is the node's answer; asking another node cannot change it.
    expect(hits).toHaveLength(1)
  })

  it('walks the public endpoints once on rate limits and lands on the KyberSwap endpoint last', async () => {
    answers = url => (url === KYBER ? { result: '0x7' } : { status: 429 })
    await expect(request()).resolves.toBe('0x7')
    expect(hits.at(-1)).toBe(KYBER)
    // Every public once, KyberSwap once: no second pass over a list that has just refused the call.
    expect(hits).toHaveLength(PUBLICS.length + 1)
    expect(new Set(hits.slice(0, -1))).toEqual(new Set(PUBLICS))
  })

  it('reports a transport failure as one when every endpoint refuses', async () => {
    answers = () => ({ status: 503 })
    const error = await request().catch(e => e)
    expect(error).toBeInstanceOf(HttpRequestError)
  })

  it('gives a hanging endpoint three seconds, then moves on', async () => {
    vi.useFakeTimers()
    let calls = 0
    answers = () => (calls++ === 0 ? { hang: true } : { result: '0x9' })
    const pending = request()
    await vi.advanceTimersByTimeAsync(2_900)
    expect(hits).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(200)
    await expect(pending).resolves.toBe('0x9')
    expect(hits).toHaveLength(2)
  })
})

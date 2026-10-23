// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { useSwapReviewSession } from 'components/SwapForm/hooks/useSwapReviewSession'

const builtRoute: BuildRouteResult = {
  data: {
    data: '0x1234',
    routerAddress: '0xrouter',
    amountIn: '100',
    amountOut: '200',
    amountInUsd: '1',
    amountOutUsd: '2',
    feeUsd: '0',
    gas: '21000',
    gasUsd: '0.01',
  },
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}

let root: ReturnType<typeof createRoot>
let session: ReturnType<typeof useSwapReviewSession>

const Harness = ({ identity }: { identity: string }) => {
  session = useSwapReviewSession(identity)
  return null
}

const render = (identity = 'wallet:chain:pair:amount:recipient:mode') =>
  act(async () => root.render(<Harness identity={identity} />))

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  root = createRoot(document.createElement('div'))
  await render()
})

afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

describe('swap review lifecycle', () => {
  it('opens once and ignores a cancelled build after close and reopen', async () => {
    const oldBuild = deferred<BuildRouteResult>()
    const build = vi.fn((_signal: AbortSignal) => oldBuild.promise)

    await act(async () => {
      void session.openReview(build)
      void session.openReview(build)
    })
    expect(build).toHaveBeenCalledTimes(1)
    expect(session.review.phase).toBe('building')

    await act(async () => {
      session.dismissReview()
      await session.openReview(async () => builtRoute)
    })
    expect(build.mock.calls[0][0].aborted).toBe(true)

    await act(async () => oldBuild.resolve({ error: 'old build' }))
    expect(session.review).toEqual({ phase: 'review', buildResult: builtRoute })
  })

  it('rebuilds during loading and review, preserving the latest result and build-error retry', async () => {
    const oldBuild = deferred<BuildRouteResult>()
    const build = vi.fn((_signal: AbortSignal) => oldBuild.promise)
    await act(async () => {
      void session.openReview(build)
    })

    await act(async () => {
      await session.rebuildReview(async () => ({ error: 'Increase slippage', suggestedSlippage: 100 }))
    })
    expect(build.mock.calls[0][0].aborted).toBe(true)
    await act(async () => oldBuild.resolve(builtRoute))
    expect(session.review.buildResult).toEqual({ error: 'Increase slippage', suggestedSlippage: 100 })

    const submit = vi.fn()
    await act(async () => {
      await session.confirmReview(submit, vi.fn())
    })
    expect(submit).not.toHaveBeenCalled()

    await act(async () => {
      await session.rebuildReview(async () => builtRoute)
    })
    expect(session.review).toEqual({ phase: 'review', buildResult: builtRoute })
  })

  it.each(['identity change', 'unmount'])('cancels builds on %s', async change => {
    const pending = deferred<BuildRouteResult>()
    const build = vi.fn((_signal: AbortSignal) => pending.promise)
    await act(async () => {
      void session.openReview(build)
    })

    if (change === 'identity change') await render('another-wallet-or-trade')
    else await act(async () => root.render(null))

    expect(build.mock.calls[0][0].aborted).toBe(true)
    await act(async () => pending.resolve(builtRoute))
    await render('another-wallet-or-trade')
    expect(session.review).toEqual({ phase: 'closed' })
  })

  it('submits once, reports wallet rejection, and allows a new review after dismissal', async () => {
    await act(async () => {
      await session.openReview(async () => builtRoute)
    })
    const pending = deferred<string>()
    const submit = vi.fn((_onSignature: () => void) => pending.promise)
    const onError = vi.fn()

    await act(async () => {
      void session.confirmReview(submit, onError)
      void session.confirmReview(submit, onError)
    })
    expect(submit).toHaveBeenCalledTimes(1)
    expect(session.review.phase).toBe('preparing')

    await act(async () => submit.mock.calls[0][0]())
    expect(session.review.phase).toBe('signing')
    await act(async () => pending.reject(new Error('User rejected')))
    expect(session.review.error).toBe('User rejected')
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith('User rejected')

    await act(async () => {
      session.dismissReview()
      await session.openReview(async () => builtRoute)
      await session.confirmReview(async () => '0xnew', onError)
    })
    expect(session.review.phase).toBe('submitted')
    expect(session.review.txHash).toBe('0xnew')
  })

  it.each(['dismiss', 'unmount'])(
    'lets submitted work finish without replacing a new review after %s',
    async change => {
      await act(async () => {
        await session.openReview(async () => builtRoute)
      })
      const pending = deferred<string>()
      const persist = vi.fn()
      const submit = vi.fn(async (_onSignature: () => void) => {
        const hash = await pending.promise
        persist(hash)
        return hash
      })

      await act(async () => {
        void session.confirmReview(submit, vi.fn())
      })
      await act(async () => {
        if (change === 'dismiss') session.dismissReview()
        else root.render(null)
      })
      await render()
      await act(async () => {
        await session.openReview(async () => builtRoute)
      })

      await act(async () => {
        submit.mock.calls[0][0]()
        pending.resolve('0xsubmitted')
      })
      expect(persist).toHaveBeenCalledTimes(1)
      expect(persist).toHaveBeenCalledWith('0xsubmitted')
      expect(session.review).toEqual({ phase: 'review', buildResult: builtRoute })
    },
  )

  it('tracks late failure without changing the reopened review', async () => {
    await act(async () => {
      await session.openReview(async () => builtRoute)
    })
    const pending = deferred<string>()
    const onError = vi.fn()

    await act(async () => {
      void session.confirmReview(() => pending.promise, onError)
      session.dismissReview()
      await session.openReview(async () => builtRoute)
    })
    await act(async () => pending.reject(new Error('User denied')))

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith('User denied')
    expect(session.review).toEqual({ phase: 'review', buildResult: builtRoute })
  })
})

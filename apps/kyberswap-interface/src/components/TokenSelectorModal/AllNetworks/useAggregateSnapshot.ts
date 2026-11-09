import { Currency } from '@kyberswap/ks-sdk-core'
import { replaceEqualDeep } from '@tanstack/react-query'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { shallowEqual } from 'react-redux'

import { AggregateBalance, ChainSnapshot } from 'components/TokenSelectorModal/AllNetworks/types'
import { TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { getTokenAddress } from 'utils/tokenInfo'

// A fixed window, not a trailing debounce: a slow/continuous source cannot starve publication.
export const AGGREGATE_UPDATE_INTERVAL_MS = 250

export type CatalogSnapshot = { currencies: Currency[]; extras: TokenRowExtraMap; loading: boolean }

type Sources = { catalog: CatalogSnapshot; chains: Record<number, ChainSnapshot> }

const shareCurrencies = (previous: Currency[], next: Currency[]) => {
  const byKey = new Map(previous.map(currency => [tokenRowKey(currency.chainId, getTokenAddress(currency)), currency]))

  return replaceEqualDeep(
    previous,
    next.map(currency => {
      const old = byKey.get(tokenRowKey(currency.chainId, getTokenAddress(currency)))
      // Identity alone is insufficient: whitelist/permit/name/logo updates must reach the rows.
      return old && Object.getPrototypeOf(old) === Object.getPrototypeOf(currency) && shallowEqual(old, currency)
        ? old
        : currency
    }),
  )
}

const shareChain = (previous: ChainSnapshot | undefined, next: ChainSnapshot): ChainSnapshot => {
  if (!previous || previous === next) return next

  const balances = Object.fromEntries(
    Object.entries(next.balances).map(([key, row]) => {
      const old = previous.balances[key]?.balance
      const balance =
        old && row.balance && shallowEqual(old.currency, row.balance.currency) && old.equalTo(row.balance)
          ? old
          : row.balance
      return [key, { ...row, balance }]
    }),
  )

  return replaceEqualDeep(previous, {
    ...next,
    currencies: shareCurrencies(previous.currencies, next.currencies),
    balances,
  })
}

// Materialize one coherent display snapshot at publication, rather than merge maps during every
// parent render. Waiting/loading do not participate in the holding map used by the sorter.
const project = ({ catalog, chains }: Sources) => {
  const resolved = Object.keys(chains)
    .sort()
    .map(chainId => chains[Number(chainId)])
  const balances = Object.assign({}, ...resolved.map(chain => chain.balances)) as ChainSnapshot['balances']
  const holdings = Object.fromEntries(
    Object.entries(balances).map(([key, { waiting: _waiting, ...holding }]) => [key, holding]),
  )

  return {
    remote: catalog.currencies,
    catalogLoading: catalog.loading,
    local: resolved.flatMap(chain => chain.currencies),
    balances,
    holdings: holdings as Record<string, Omit<AggregateBalance, 'waiting'>>,
    extras: Object.assign({}, catalog.extras, ...resolved.map(chain => chain.extras)) as TokenRowExtraMap,
    pending: resolved.some(chain => chain.loading),
    resolvedCount: resolved.length,
  }
}

type Props = {
  identity: string
  catalogKey: string
  active: boolean
  catalog: CatalogSnapshot
}

/** Owns publication only. Fetching/cache remain with the source hooks; sort/filter stay in the view. */
export const useAggregateSnapshot = ({ identity, catalogKey, active, catalog }: Props) => {
  const [state, setState] = useState(() => {
    const sources: Sources = { catalog, chains: {} }
    return { identity, catalogKey, active, generation: 0, sources, view: project(sources) }
  })

  let current = state
  if (state.identity !== identity || state.catalogKey !== catalogKey || state.active !== active) {
    const sameIdentity = state.identity === identity
    const sameCatalog = state.catalogKey === catalogKey
    const sources =
      sameIdentity && sameCatalog ? state.sources : { catalog, chains: sameIdentity ? state.sources.chains : {} }

    current = {
      identity,
      catalogKey,
      active,
      // Search replaces only the catalog; chain subscriptions belong to the wallet/tab session.
      generation: state.generation + (sameIdentity && state.active === active ? 0 : 1),
      sources,
      view: sources === state.sources ? state.view : project(sources),
    }
    setState(current)
  }

  const session = `${identity}:${current.generation}`
  const published = useRef(current)
  const acceptingSession = useRef<string | undefined>(active ? session : undefined)
  const pending = useRef<
    | {
        session: string
        catalog?: CatalogSnapshot
        chains: Map<number, ChainSnapshot>
        timer: ReturnType<typeof setTimeout>
      }
    | undefined
  >(undefined)

  const clearPending = useCallback(() => {
    if (pending.current) clearTimeout(pending.current.timer)
    pending.current = undefined
  }, [])

  const enqueue = useCallback(
    (sourceSession: string, chainId?: number, chain?: ChainSnapshot, catalogUpdate?: CatalogSnapshot) => {
      if (acceptingSession.current !== sourceSession) return

      if (!pending.current) {
        pending.current = {
          session: sourceSession,
          chains: new Map(),
          timer: setTimeout(() => {
            const batch = pending.current
            pending.current = undefined
            if (!batch || acceptingSession.current !== batch.session) return

            setState(previous => {
              if (!previous.active || `${previous.identity}:${previous.generation}` !== batch.session) return previous

              const chains = { ...previous.sources.chains }
              batch.chains.forEach((next, id) => {
                chains[id] = shareChain(chains[id], next)
              })

              const nextCatalog = batch.catalog
                ? {
                    ...batch.catalog,
                    currencies: shareCurrencies(previous.sources.catalog.currencies, batch.catalog.currencies),
                  }
                : previous.sources.catalog

              const sources = replaceEqualDeep(previous.sources, { catalog: nextCatalog, chains })
              if (sources === previous.sources) return previous

              return { ...previous, sources, view: replaceEqualDeep(previous.view, project(sources)) }
            })
          }, AGGREGATE_UPDATE_INTERVAL_MS),
        }
      }

      if (chainId !== undefined && chain) pending.current.chains.set(chainId, chain)
      if (catalogUpdate) pending.current.catalog = catalogUpdate
    },
    [],
  )

  const onSnapshot = useCallback(
    (session: string, chainId: number, snapshot: ChainSnapshot) => {
      enqueue(session, chainId, snapshot)
    },
    [enqueue],
  )

  useLayoutEffect(() => {
    published.current = current
  }, [current])

  useLayoutEffect(() => {
    // Discard the old query's catalog without losing chain responses or extending their deadline.
    if (pending.current) pending.current.catalog = undefined
  }, [catalogKey])

  useLayoutEffect(() => {
    clearPending()
    acceptingSession.current = active ? session : undefined

    return () => {
      acceptingSession.current = undefined
      clearPending()
    }
  }, [session, active, clearPending])

  useEffect(() => {
    if (catalog !== published.current.sources.catalog) enqueue(session, undefined, undefined, catalog)
  }, [catalog, catalogKey, session, enqueue])

  return { session, onSnapshot, ...current.view }
}

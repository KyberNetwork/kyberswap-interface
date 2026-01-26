import { useCallback, useEffect, useState } from 'react'
import { useAddFavoriteMutation, useRemoveFavoriteMutation } from 'services/zapEarn'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { EarnPool, ParsedEarnPool } from 'pages/Earns/types'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

const FAVORITE_DELAY_MS = 500
const FAVORITE_EXPIRE_DAYS = 7
const LOCAL_STORAGE_KEY_PREFIX = 'poolExplorer_'
const SESSION_STORAGE_FAVORITE_KEY_PREFIX = 'poolExplorer_favorite_'
const FAVORITE_MESSAGE_TEMPLATE = `Click sign to add favorite pools at Kyberswap.com without logging in.\nThis request won’t trigger any blockchain transaction or cost any gas fee. Expires in ${FAVORITE_EXPIRE_DAYS} days. \n\nIssued at: {issuedAt}`

const getPoolKey = (pool: EarnPool) => {
  const chainId = pool.chain?.id ?? pool.chainId
  return `${chainId}:${pool.address}`
}

const getSessionStorageKey = (account: string) => `${SESSION_STORAGE_FAVORITE_KEY_PREFIX}${account.toLowerCase()}`

const useFavoritePool = ({ refetch }: { refetch?: () => void }) => {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [addFavorite] = useAddFavoriteMutation()
  const [removeFavorite] = useRemoveFavoriteMutation()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()

  const [favoriteLoading, setFavoriteLoading] = useState<string[]>([])
  const [delayFavorite, setDelayFavorite] = useState(false)
  const [sessionFavorites, setSessionFavorites] = useState<Record<string, boolean>>({})

  const handleAddFavoriteLoading = (poolAddress: string) => {
    if (!favoriteLoading.includes(poolAddress)) setFavoriteLoading([...favoriteLoading, poolAddress])
  }
  const handleRemoveFavoriteLoading = (poolAddress: string) =>
    setFavoriteLoading(favoriteLoading.filter(address => address !== poolAddress))

  const updateSessionFavorite = useCallback(
    (pool: ParsedEarnPool, isFavorite: boolean) => {
      if (!account) return
      const poolKey = getPoolKey(pool)
      setSessionFavorites(prev => {
        const next = { ...prev, [poolKey]: isFavorite }
        try {
          sessionStorage.setItem(getSessionStorageKey(account), JSON.stringify(next))
        } catch {
          // Ignore storage errors and keep in-memory state.
        }
        return next
      })
    },
    [account],
  )

  const getFavoriteStatus = useCallback(
    (pool: EarnPool) => {
      const poolKey = getPoolKey(pool)
      if (Object.prototype.hasOwnProperty.call(sessionFavorites, poolKey)) {
        return sessionFavorites[poolKey]
      }
      return !!pool.favorite?.isFavorite
    },
    [sessionFavorites],
  )

  const handleFavorite = async (e: React.MouseEvent<SVGElement, MouseEvent>, pool: ParsedEarnPool) => {
    e.stopPropagation()
    if (favoriteLoading.includes(pool.address) || delayFavorite) return

    const isPoolFavorite = !!pool.favorite?.isFavorite
    try {
      handleAddFavoriteLoading(pool.address)

      if (!account) {
        toggleWalletModal()
        return
      }

      const { signature, msg } = await getOrCreateSignature(account, library)

      setDelayFavorite(true)

      const result = await (isPoolFavorite ? removeFavorite : addFavorite)({
        chainId: (pool.chain?.id || pool.chainId) as number,
        userAddress: account,
        poolAddress: pool.address,
        message: msg,
        signature,
      })

      if ((result as any).error) {
        throw new Error((result as any).error.data.message || 'Something went wrong')
      }

      refetch?.()
    } catch (error) {
      const action = pool.favorite?.isFavorite ? 'Remove' : 'Add'
      notify(
        {
          title: `${action} failed`,
          summary: error?.message || 'Something went wrong',
          type: NotificationType.WARNING,
        },
        8000,
      )
    } finally {
      updateSessionFavorite(pool, !isPoolFavorite)

      handleRemoveFavoriteLoading(pool.address)
    }
  }

  useEffect(() => {
    if (delayFavorite)
      setTimeout(() => {
        setDelayFavorite(false)
      }, FAVORITE_DELAY_MS)
  }, [delayFavorite])

  useEffect(() => {
    if (!account) {
      setSessionFavorites({})
      return
    }
    try {
      const stored = sessionStorage.getItem(getSessionStorageKey(account))
      if (!stored) {
        setSessionFavorites({})
        return
      }
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === 'object') {
        setSessionFavorites(parsed as Record<string, boolean>)
      } else {
        setSessionFavorites({})
      }
    } catch {
      setSessionFavorites({})
    }
  }, [account])

  return {
    handleFavorite,
    favoriteLoading,
    getFavoriteStatus,
  }
}

export default useFavoritePool

const getOrCreateSignature = async (account: string, library: any) => {
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${account}`

  try {
    const data = JSON.parse(localStorage.getItem(key) || '')
    if (data.issuedAt) {
      const expire = new Date(data.issuedAt)
      expire.setDate(expire.getDate() + FAVORITE_EXPIRE_DAYS)
      const now = new Date()
      if (expire > now) {
        return { signature: data.signature, msg: data.msg }
      }
    }
  } catch {
    // Invalid stored data, continue to create new signature
  }

  const issuedAt = new Date().toISOString()
  const msg = FAVORITE_MESSAGE_TEMPLATE.replace('{issuedAt}', issuedAt)
  const signature = await library?.send('personal_sign', [`0x${Buffer.from(msg, 'utf8').toString('hex')}`, account])

  localStorage.setItem(key, JSON.stringify({ signature, msg, issuedAt }))
  return { signature, msg }
}

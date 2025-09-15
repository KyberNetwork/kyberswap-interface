import { useEffect, useState } from 'react'
import { PoolQueryParams, useAddFavoriteMutation, useRemoveFavoriteMutation } from 'services/zapEarn'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ParsedEarnPool } from 'pages/Earns/types'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

const FAVORITE_DELAY_MS = 500
const FAVORITE_EXPIRE_DAYS = 7
const LOCAL_STORAGE_KEY_PREFIX = 'poolExplorer_'
const FAVORITE_MESSAGE_TEMPLATE = `Click sign to add favorite pools at Kyberswap.com without logging in.\nThis request won’t trigger any blockchain transaction or cost any gas fee. Expires in ${FAVORITE_EXPIRE_DAYS} days. \n\nIssued at: {issuedAt}`

const useFavoritePool = ({ filters, refetch }: { filters: PoolQueryParams; refetch: () => void }) => {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [addFavorite] = useAddFavoriteMutation()
  const [removeFavorite] = useRemoveFavoriteMutation()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()

  const [favoriteLoading, setFavoriteLoading] = useState<string[]>([])
  const [delayFavorite, setDelayFavorite] = useState(false)

  const handleAddFavoriteLoading = (poolAddress: string) => {
    if (!favoriteLoading.includes(poolAddress)) setFavoriteLoading([...favoriteLoading, poolAddress])
  }
  const handleRemoveFavoriteLoading = (poolAddress: string) =>
    setFavoriteLoading(favoriteLoading.filter(address => address !== poolAddress))

  const handleFavorite = async (e: React.MouseEvent<SVGElement, MouseEvent>, pool: ParsedEarnPool) => {
    e.stopPropagation()
    if (favoriteLoading.includes(pool.address) || delayFavorite) return

    try {
      handleAddFavoriteLoading(pool.address)

      if (!account) {
        toggleWalletModal()
        return
      }

      const { signature, msg } = await getOrCreateSignature(account, library)

      const isPoolFavorite = !!pool.favorite?.isFavorite
      setDelayFavorite(true)

      const result = await (isPoolFavorite ? removeFavorite : addFavorite)({
        chainId: filters.chainId,
        userAddress: account,
        poolAddress: pool.address,
        message: msg,
        signature,
      })

      if ((result as any).error) {
        throw new Error((result as any).error.data.message || 'Something went wrong')
      }

      await refetch()
    } catch (error) {
      const action = pool.favorite?.isFavorite ? 'Remove' : 'Add'
      notify(
        {
          title: `${action} failed`,
          summary: error instanceof Error ? error.message : 'Something went wrong',
          type: NotificationType.ERROR,
        },
        8000,
      )
    } finally {
      handleRemoveFavoriteLoading(pool.address)
    }
  }

  useEffect(() => {
    if (delayFavorite)
      setTimeout(() => {
        setDelayFavorite(false)
      }, FAVORITE_DELAY_MS)
  }, [delayFavorite])

  return {
    handleFavorite,
    favoriteLoading,
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

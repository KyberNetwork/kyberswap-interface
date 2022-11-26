import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { AppDispatch } from 'state'
import { getTokenList } from 'utils/getTokenList'

import { setTokenList } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    SUPPORTED_NETWORKS.forEach(chainId => {
      const listUrl = NETWORKS_INFO[chainId].tokenListUrl
      getTokenList(listUrl, chainId)
        .then(tokenList => {
          dispatch(setTokenList({ chainId, tokenList }))
        })
        .catch(error => {
          console.error(`Failed to get list at url ${listUrl}`, error)
        })
    })
  }, [dispatch])

  return null
}

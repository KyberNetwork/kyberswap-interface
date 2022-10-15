import { ChainId } from '@kyberswap/ks-sdk-core'
import { BigNumber, ethers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'

import ERC20_INTERFACE, { ERC20_ABI } from 'constants/abis/erc20'
import { providers, useActiveWeb3React } from 'hooks'
import { useMulticallContract } from 'hooks/useContract'
import useInterval from 'hooks/useInterval'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

// todo cache memo
// todo check performance call
export const useTokenBalanceOfAnotherChain = (chainId: ChainId | undefined, token: WrappedTokenInfo | undefined) => {
  const { account } = useActiveWeb3React()
  const [balance, setBalance] = useState('0')

  useEffect(() => {
    if (account && chainId && token)
      getTokenBalanceOfAnotherChain(account, token, chainId)
        .then(data => {
          setBalance(data)
        })
        .catch(console.error)
    else {
      setBalance('0')
    }
  }, [chainId, token, account, balance])
  return balance
}

function getTokenBalanceOfAnotherChain(account: string, token: WrappedTokenInfo, chainId: ChainId): Promise<string> {
  const isNativeToken = token.multichainInfo?.tokenType === 'NATIVE'
  return new Promise(async (resolve, reject) => {
    try {
      if (!account || !token || !chainId) return reject('wrong input')
      console.log('callllll') // todo check check performance

      let balance: BigNumber | undefined
      try {
        const provider = providers[chainId]
        if (isNativeToken) {
          balance = await provider.getBalance(account)
        } else {
          const contract = new ethers.Contract(token?.address, ERC20_ABI, provider)
          balance = await contract.balanceOf(account)
        }
      } catch (error) {}

      resolve(balance ? ethers.utils.formatEther(balance.toString()) : '0')
    } catch (error) {
      reject(error)
    }
  })
}

// todo list token bridge còn hơi lag
// todo cache - fallback when not support use local storage
type TokenList = { anytoken: string; underlying: string }[]

type PoolBridgeInfoMap = {
  [address: string]: PoolBridgeInfo
}
type PoolBridgeInfo = {
  balance: string
  balanceOf: string
}
type CallParam = {
  callData: string
  target: string
  label: string
  fragment: string
  key: string
}

function getCallParams(list: TokenList, account: string | undefined) {
  const calls: CallParam[] = []
  for (const item of list) {
    calls.push({
      callData: ERC20_INTERFACE.encodeFunctionData('balanceOf', [item.anytoken]),
      target: item.underlying,
      label: 'balanceOf',
      fragment: 'balanceOf',
      key: item.anytoken,
    })
  }
  return calls
}

const formatResult = (response: string[], calls: CallParam[]) => {
  const resultList: PoolBridgeInfoMap = {}
  if (!response) return resultList
  for (let i = 0, len = calls.length; i < len; i++) {
    const item = calls[i]
    if (!response[i]) continue

    let value = ''
    try {
      value = ERC20_INTERFACE?.decodeFunctionResult(item.fragment, response[i])?.toString()
    } catch (error) {
      continue
    }

    if (!resultList[item.key]) {
      resultList[item.key] = { balance: '0', balanceOf: '0' }
    }
    resultList[item.key][item.label as keyof PoolBridgeInfo] = value
  }
  return resultList
}

// get pool of list token of a chain
export function useMultichainPool(chainId: ChainId | undefined, tokenList: TokenList) {
  const [poolData, setPoolData] = useState<PoolBridgeInfoMap>()
  const { account } = useActiveWeb3React()
  const multicallContract = useMulticallContract(chainId)
  // todo check performance
  const getEvmPoolsData = useCallback(async (): Promise<PoolBridgeInfoMap> => {
    if (!chainId || !account) return Promise.reject('Wrong input')
    try {
      const calls = getCallParams(tokenList, account)
      const { returnData } = await multicallContract?.callStatic.tryBlockAndAggregate(
        false,
        calls.map(({ callData, target }: CallParam) => ({ target, callData })),
      )
      const resultList: PoolBridgeInfoMap = formatResult(
        returnData.map((item: [boolean, string]) => item[1]),
        calls,
      )
      return resultList
    } catch (error) {
      return Promise.reject(error)
    }
  }, [account, chainId, tokenList, multicallContract])

  const fetchPoolCallback = useCallback(async () => {
    try {
      const newData: PoolBridgeInfoMap = await getEvmPoolsData()
      // small object, no performance problem here
      if (JSON.stringify(newData || {}) !== JSON.stringify(poolData || {})) {
        setPoolData(newData)
      }
    } catch (e) {
      console.log(e)
    }
  }, [getEvmPoolsData, poolData])

  useEffect(() => {
    fetchPoolCallback()
  }, [chainId, account, tokenList, fetchPoolCallback])

  useInterval(fetchPoolCallback, 1000 * 10)

  return !chainId ? undefined : poolData
}

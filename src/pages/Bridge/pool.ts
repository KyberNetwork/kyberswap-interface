import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'

import ERC20_INTERFACE, { ERC20_ABI } from 'constants/abis/erc20'
import { MULTICALL_ABI, MULTICALL_NETWORKS } from 'constants/multicall'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
// import { useMulticallContract } from 'hooks/useContract'
import useInterval from 'hooks/useInterval'
// import { useSingleContractMultipleData } from 'state/multicall/hooks'
import { isAddress } from 'utils'

// todo list token bridge còn hơi lag
// todo refactor
// todo cache - fallback when not support use local storage
// todo use useSingleContractMultipleData
const Web3 = require('web3')
const TIMEOUT = 'timeout'
function timeoutWeb3() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(TIMEOUT)
    }, 1000 * 60)
  })
}
export function getWeb3({ rpc, provider }: { rpc: string; provider: any }) {
  if (provider) {
    return new Web3(provider)
  } else {
    return new Web3(new Web3.providers.HttpProvider(rpc || ''))
  }
}
function getBatchWeb3Data({ rpc, calls, provider }: any) {
  return new Promise((resolve, reject) => {
    const web3 = getWeb3({ rpc, provider })
    const batch = new web3.BatchRequest()
    for (const obj of calls) {
      if (obj.callData) {
        batch.add(web3.eth.call.request({ data: obj.callData, to: obj.target }, 'latest'))
      } else {
        const property = obj.property || 'eth'
        batch.add(web3[property][obj.methods].request(...obj.input))
      }
    }
    batch.requestManager.sendBatch(batch.requests, (err: any, res: any) => {
      if (err) {
        reject(err)
      } else {
        const arr = res.map(({ result }: any) => result)
        resolve(arr)
      }
    })
  })
}
function getContract({ abi, rpc, provider }: any) {
  const web3 = getWeb3({ rpc, provider })
  return new web3.eth.Contract(abi ? abi : ERC20_ABI)
}

type MulticallDataParams = { chainId: ChainId; rpc: string; calls: any; provider: any }
function getMulticallData({ chainId, rpc, calls, provider }: MulticallDataParams) {
  return new Promise((resolve, reject) => {
    const contract = getContract({ abi: MULTICALL_ABI, rpc, provider })
    const multicallToken = MULTICALL_NETWORKS[chainId]
    contract.options.address = multicallToken

    const arr = []
    for (const obj of calls) {
      if (obj.target) {
        arr.push({
          target: obj.target,
          callData: obj.callData,
        })
      } else if (obj.methods === 'getBalance') {
        arr.push({
          target: multicallToken,
          callData: contract.methods.getEthBalance(...obj.input).encodeABI(),
        })
      }
    }

    contract.methods.aggregate(arr).call((err: any, res: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(res.returnData)
      }
    })
  })
}

async function getBatchData({ chainId, rpc, calls, provider }: MulticallDataParams) {
  let results: any = ''
  try {
    if (!chainId) return results
    const useMethods = MULTICALL_NETWORKS[chainId] ? getMulticallData : getBatchWeb3Data
    results = await new Promise((resolve, reject) => {
      Promise.race([timeoutWeb3(), useMethods({ chainId, rpc, calls, provider })]).then(res => {
        res === TIMEOUT ? reject(res) : resolve(res)
      })
    })
  } catch (error) {
    console.error(error.toString())
  }
  return results
}

function getCallParams(list: TokenList, account: string | undefined) {
  const calls: any = []
  for (const item of list) {
    calls.push({
      callData: ERC20_INTERFACE.encodeFunctionData('balanceOf', [item.anytoken]),
      target: item.underlying,
      label: 'balanceOf',
      fragment: 'balanceOf',
      key: item.anytoken,
    })
    calls.push({
      callData: ERC20_INTERFACE.encodeFunctionData('totalSupply', []),
      target: item.anytoken,
      label: 'totalSupply',
      fragment: 'totalSupply',
      key: item.anytoken,
    })
    if (isAddress(account)) {
      calls.push({
        callData: ERC20_INTERFACE.encodeFunctionData('balanceOf', [account]),
        target: item.anytoken,
        label: 'balance',
        fragment: 'balanceOf',
        key: item.anytoken,
      })
    }
  }
  return calls
}

export function getEvmPoolsDatas(
  chainId: ChainId,
  list: TokenList,
  account?: string,
  provider?: any,
): Promise<PoolBridgeInfoMap> {
  return new Promise(async (resolve, reject) => {
    const calls = getCallParams(list, account)
    if (calls.length > 0 && chainId) {
      try {
        const res: any = await getBatchData({ chainId, calls, provider, rpc: NETWORKS_INFO[chainId].rpcUrl })
        const resultList: PoolBridgeInfoMap = {}
        if (res) {
          for (let i = 0, len = calls.length; i < len; i++) {
            const item = calls[i]
            if (!res[i]) continue
            const value =
              res[i] === '0x' ? '' : ERC20_INTERFACE?.decodeFunctionResult(item.fragment, res[i])?.toString()
            if (!resultList[item.key]) {
              resultList[item.key] = { totalSupply: '0', balance: '0', balanceOf: '0' }
            }
            resultList[item.key][item.label as keyof PoolBridgeInfo] = value
          }
        }
        resolve(resultList)
      } catch (error) {
        reject(error)
      }
    } else {
      reject()
    }
  })
}

type TokenList = { anytoken: any; underlying: any }[]
export function useEvmPools({
  account,
  tokenList,
  chainId,
}: {
  account: string
  chainId: ChainId | undefined
  tokenList: TokenList
}): () => Promise<PoolBridgeInfoMap> {
  const { library, chainId: curChainId } = useActiveWeb3React()
  const getEvmPoolsData = useCallback((): Promise<PoolBridgeInfoMap> => {
    return new Promise((resolve, reject) => {
      if (!chainId) return reject('Not found chain id')
      const provider = curChainId?.toString() === chainId.toString() && library?.provider ? library?.provider : ''
      getEvmPoolsDatas(chainId, tokenList, account, provider).then(resolve).catch(reject)
    })
  }, [account, curChainId, chainId, tokenList, library?.provider])
  return getEvmPoolsData
}
type PoolBridgeInfoMap = {
  [address: string]: PoolBridgeInfo
}
type PoolBridgeInfo = {
  balance: string
  balanceOf: string
  totalSupply: string
}
// call one pool
export function usePoolBridge(chainId: ChainId | undefined, anytoken: any, underlying: any) {
  const [poolData, setPoolData] = useState<PoolBridgeInfo>()
  const { account } = useActiveWeb3React()
  const tokenList = useMemo(() => {
    return anytoken && underlying ? [{ anytoken, underlying }] : []
  }, [anytoken, underlying])

  const getEvmPoolsData = useEvmPools({
    account: account ?? '',
    tokenList,
    chainId,
  })

  const fetchPoolCallback = useCallback(() => {
    if (chainId) {
      getEvmPoolsData()
        .then((res: PoolBridgeInfoMap) => {
          const newData = Object.values(res)[0]
          // small object, no performance problem here
          if (JSON.stringify(newData || {}) !== JSON.stringify(poolData || {})) {
            setPoolData(newData)
          }
        })
        .catch(e => {
          console.log(e)
        })
    }
  }, [chainId, getEvmPoolsData, poolData])

  useEffect(() => {
    fetchPoolCallback()
  }, [chainId, account, anytoken, fetchPoolCallback])
  useInterval(fetchPoolCallback, 1000 * 10)
  return !chainId ? undefined : poolData
}

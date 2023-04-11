import { BigNumber, providers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { NATIVE_TOKEN_ADDRESS } from '../constants'
import { useContract } from './useContract'
import erc20ABI from '../constants/multicall/erc20.json'
import { useActiveWeb3 } from './useWeb3Provider'

export enum APPROVAL_STATE {
  UNKNOWN = 'unknown',
  PENDING = 'pending',
  APPROVED = 'approved',
  NOT_APPROVED = 'not_approved',
}
function useApproval(amountToApproveString: string, token: string, spender: string) {
  const { account, provider } = useActiveWeb3()
  const [loading, setLoading] = useState(false)
  const [approvalState, setApprovalState] = useState(() =>
    token === NATIVE_TOKEN_ADDRESS ? APPROVAL_STATE.APPROVED : APPROVAL_STATE.UNKNOWN,
  )
  const contract = useContract(token, erc20ABI)

  const [pendingTx, setPendingTx] = useState('')

  const approve = useCallback(() => {
    if (contract) {
      const MaxUint256: BigNumber = BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      contract.approve(spender, MaxUint256).then((res: providers.TransactionResponse) => {
        setApprovalState(APPROVAL_STATE.PENDING)
        setPendingTx(res.hash)
      })
    }
  }, [contract, spender])

  useEffect(() => {
    if (pendingTx) {
      const i = setInterval(() => {
        provider?.getTransactionReceipt(pendingTx).then(receipt => {
          if (receipt) {
            setPendingTx('')
            setApprovalState(APPROVAL_STATE.APPROVED)
          }
        })
      }, 8_000)

      return () => {
        clearInterval(i)
      }
    }
  }, [pendingTx, provider])

  useEffect(() => {
    if (token === NATIVE_TOKEN_ADDRESS) {
      setApprovalState(APPROVAL_STATE.APPROVED)
    }
    if (contract && token !== NATIVE_TOKEN_ADDRESS && account && spender) {
      setLoading(true)
      contract.allowance(account, spender).then((res: any) => {
        const amountToApprove = BigNumber.from(amountToApproveString)
        if (amountToApprove.lte(res)) {
          setApprovalState(APPROVAL_STATE.APPROVED)
        } else {
          setApprovalState(APPROVAL_STATE.NOT_APPROVED)
        }
        setLoading(false)
      })
    }
  }, [contract, token, account, spender, amountToApproveString])

  return { loading, approvalState, approve }
}

export default useApproval

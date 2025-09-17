import { BigNumber } from '@ethersproject/bignumber'
import { t } from '@lingui/macro'
import { defaultAbiCoder } from 'ethers/lib/utils'
import { useCallback, useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { friendlyError } from 'utils/errorMessage'

import { useReadingContract } from './useContract'

export enum PermitNftState {
  NOT_APPLICABLE = 'not_applicable',
  READY_TO_SIGN = 'ready_to_sign',
  SIGNING = 'signing',
  SIGNED = 'signed',
  ERROR = 'error',
}

export interface PermitNftParams {
  contractAddress: string
  tokenId: string
  spender: string
  deadline?: number
}

export interface PermitNftResult {
  deadline: number
  nonce: BigNumber
  signature: string
  permitData: string
}

// NFT Position Manager ABI for permit functionality
const NFT_PERMIT_ABI = [
  'function name() view returns (string)',
  'function nonces(address owner, uint256 word) view returns (uint256 bitmap)',
  'function permit(address spender, uint256 tokenId, uint256 deadline, uint256 nonce, bytes signature) payable',
]

// 30 days validity buffer
const PERMIT_NFT_VALIDITY_BUFFER = 30 * 24 * 60 * 60

export const usePermitNft = ({ contractAddress, tokenId, spender, deadline }: PermitNftParams) => {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()
  const [isSigningInProgress, setIsSigningInProgress] = useState(false)
  const [permitData, setPermitData] = useState<PermitNftResult | null>(null)

  const nftContract = useReadingContract(contractAddress, NFT_PERMIT_ABI)

  // Get nonces bitmap for word 0
  const noncesState = useSingleCallResult(nftContract, 'nonces', [account, 0])
  const nameState = useSingleCallResult(nftContract, 'name', [])

  const permitState = useMemo(() => {
    if (!account || !contractAddress || !tokenId || !spender) {
      return PermitNftState.NOT_APPLICABLE
    }
    if (isSigningInProgress) {
      return PermitNftState.SIGNING
    }
    if (permitData) {
      return PermitNftState.SIGNED
    }
    return PermitNftState.READY_TO_SIGN
  }, [account, contractAddress, tokenId, spender, isSigningInProgress, permitData])

  const findFreeNonce = useCallback((bitmap: BigNumber, word = 0): BigNumber => {
    // Find a free bit in the bitmap (unordered nonce)
    for (let i = 0; i < 256; i++) {
      if (bitmap.shr(i).and(1).isZero()) {
        return BigNumber.from(word).shl(8).add(i)
      }
    }
    throw new Error('No free nonce in word 0; pick a different word.')
  }, [])

  const signPermitNft = useCallback(async (): Promise<PermitNftResult | null> => {
    if (!library || !account || !chainId || !noncesState?.result?.[0] || !nameState?.result?.[0]) {
      console.error('Missing required data for NFT permit')
      return null
    }

    if (permitState !== PermitNftState.READY_TO_SIGN) {
      console.error('NFT permit not ready to sign')
      return null
    }

    setIsSigningInProgress(true)

    try {
      const contractName = nameState.result[0]
      const bitmap = noncesState.result[0]
      const nonce = findFreeNonce(bitmap, 0)
      const permitDeadline = deadline || Math.floor(Date.now() / 1000) + PERMIT_NFT_VALIDITY_BUFFER

      // EIP-712 domain and types for NFT permit
      const domain = {
        name: contractName,
        chainId,
        verifyingContract: contractAddress,
      }

      const types = {
        Permit: [
          { name: 'spender', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      }

      const message = {
        spender,
        tokenId,
        nonce: nonce.toString(),
        deadline: permitDeadline,
      }

      const typedData = JSON.stringify({
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          ...types,
        },
        domain,
        primaryType: 'Permit',
        message,
      })

      console.log('Signing NFT permit with data:', typedData)

      const signature = await library.send('eth_signTypedData_v4', [account.toLowerCase(), typedData])

      // Encode permit data for contract call
      const permitData = defaultAbiCoder.encode(['uint256', 'uint256', 'bytes'], [permitDeadline, nonce, signature])

      notify({
        type: NotificationType.SUCCESS,
        title: t`NFT Permit Signed`,
        summary: t`Successfully signed permit for NFT #${tokenId}`,
      })

      const result = {
        deadline: permitDeadline,
        nonce,
        signature,
        permitData,
      }

      setPermitData(result)
      return result
    } catch (error) {
      const message = friendlyError(error)
      console.error('NFT Permit error:', { message, error })

      notify({
        title: t`NFT Permit Error`,
        summary: message,
        type: NotificationType.ERROR,
      })

      return null
    } finally {
      setIsSigningInProgress(false)
    }
  }, [
    account,
    chainId,
    library,
    contractAddress,
    tokenId,
    spender,
    deadline,
    permitState,
    noncesState?.result,
    nameState?.result,
    findFreeNonce,
    notify,
  ])

  return {
    permitState,
    signPermitNft,
    permitData,
    isReady: permitState === PermitNftState.READY_TO_SIGN && !!noncesState?.result && !!nameState?.result,
  }
}

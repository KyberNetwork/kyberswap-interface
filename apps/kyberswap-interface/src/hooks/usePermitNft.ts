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
  deadline: number
  version?: 'v3' | 'v4' | 'auto' // specify version or auto-detect
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
  'function nonces(address owner, uint256 word) view returns (uint256 bitmap)', // V4 unordered nonces
  'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)', // V3 ordered nonces
  'function DOMAIN_SEPARATOR() view returns (bytes32)', // V3 domain separator
  'function PERMIT_TYPEHASH() view returns (bytes32)', // V3 permit typehash
  'function permit(address spender, uint256 tokenId, uint256 deadline, uint256 nonce, bytes signature) payable',
]

export const usePermitNft = ({ contractAddress, tokenId, spender, deadline, version = 'auto' }: PermitNftParams) => {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()
  const [isSigningInProgress, setIsSigningInProgress] = useState(false)
  const [permitData, setPermitData] = useState<PermitNftResult | null>(null)
  const [detectedVersion, setDetectedVersion] = useState<'v3' | 'v4' | null>(null)

  const nftContract = useReadingContract(contractAddress, NFT_PERMIT_ABI)

  // Get nonces bitmap for word 0 (V4 style)
  const noncesState = useSingleCallResult(nftContract, 'nonces', [account, 0])
  // Get position data (V3 style) - only call if we have a tokenId
  const positionsState = useSingleCallResult(nftContract, 'positions', tokenId ? [tokenId] : undefined)
  const nameState = useSingleCallResult(nftContract, 'name', [])
  // Get V3 specific data
  const domainSeparatorState = useSingleCallResult(nftContract, 'DOMAIN_SEPARATOR', [])
  const permitTypehashState = useSingleCallResult(nftContract, 'PERMIT_TYPEHASH', [])

  // Auto-detect version based on available data
  const actualVersion = useMemo(() => {
    if (version !== 'auto') return version

    if (detectedVersion) return detectedVersion

    // Try to detect based on available data
    if (positionsState?.result && !positionsState.error) {
      setDetectedVersion('v3')
      return 'v3'
    }
    if (noncesState?.result && !noncesState.error) {
      setDetectedVersion('v4')
      return 'v4'
    }

    return 'v4' // Default to v4 if uncertain
  }, [version, detectedVersion, positionsState, noncesState])

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

  // Get nonce based on version
  const getNonce = useCallback((): BigNumber | null => {
    if (actualVersion === 'v3') {
      // Use ordered nonce from positions function
      if (positionsState?.result?.[0] !== undefined) {
        return BigNumber.from(positionsState.result[0]).add(1) // Next nonce is current + 1
      }
    } else {
      // Use unordered nonce from bitmap (V4)
      if (noncesState?.result?.[0]) {
        return findFreeNonce(noncesState.result[0], 0)
      }
    }
    return null
  }, [actualVersion, positionsState?.result, noncesState?.result, findFreeNonce])

  const signPermitNft = useCallback(async (): Promise<PermitNftResult | null> => {
    if (!library || !account || !chainId || !nameState?.result?.[0]) {
      console.error('Missing required data for NFT permit')
      return null
    }

    // Check version-specific requirements
    if (
      actualVersion === 'v3' &&
      (!positionsState?.result || !domainSeparatorState?.result || !permitTypehashState?.result)
    ) {
      console.error('Missing V3 contract data for NFT permit')
      return null
    }
    if (actualVersion === 'v4' && !noncesState?.result?.[0]) {
      console.error('Missing nonces data for V4 NFT permit')
      return null
    }

    if (permitState !== PermitNftState.READY_TO_SIGN) {
      console.error('NFT permit not ready to sign')
      return null
    }

    setIsSigningInProgress(true)

    try {
      const nonce = getNonce()

      if (!nonce) {
        throw new Error(`Failed to get nonce for ${actualVersion}`)
      }

      const permitDeadline = deadline

      let signature: string
      let permitData: string

      if (actualVersion === 'v3') {
        // V3 uses EIP-712 but with simpler domain structure
        const contractName = nameState.result[0]

        // V3 domain structure (simpler than V4)
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

        console.log(`Signing ${actualVersion} NFT permit with data:`, typedData)

        const flatSig = await library.send('eth_signTypedData_v4', [account.toLowerCase(), typedData])

        // Split signature into v, r, s for V3 format
        const r = flatSig.slice(0, 66)
        const s = '0x' + flatSig.slice(66, 130)
        const v = parseInt(flatSig.slice(130, 132), 16)

        // V3 permit data: encode(deadline, v, r, s)
        permitData = defaultAbiCoder.encode(['uint256', 'uint8', 'bytes32', 'bytes32'], [permitDeadline, v, r, s])
        signature = flatSig
      } else {
        // V4 uses EIP-712 typed data signing (keep existing working implementation)
        const contractName = nameState.result[0]

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

        console.log(`Signing ${actualVersion} NFT permit with data:`, typedData)

        signature = await library.send('eth_signTypedData_v4', [account.toLowerCase(), typedData])

        // V4 permit data: encode(deadline, nonce, signature) - keep existing working format
        permitData = defaultAbiCoder.encode(['uint256', 'uint256', 'bytes'], [permitDeadline, nonce, signature])
      }

      const v = actualVersion.toUpperCase()
      notify({
        type: NotificationType.SUCCESS,
        title: t`NFT Permit Signed`,
        summary: t`Successfully signed ${v} permit for NFT #${tokenId}`,
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
    actualVersion,
    noncesState?.result,
    positionsState?.result,
    nameState?.result,
    domainSeparatorState?.result,
    permitTypehashState?.result,
    getNonce,
    notify,
  ])

  // Check readiness based on version
  const isReady = useMemo(() => {
    if (permitState !== PermitNftState.READY_TO_SIGN || !nameState?.result) {
      return false
    }

    if (actualVersion === 'v3') {
      return !!positionsState?.result
    } else {
      return !!noncesState?.result
    }
  }, [permitState, nameState?.result, actualVersion, positionsState?.result, noncesState?.result])

  return {
    permitState,
    signPermitNft,
    permitData,
    isReady,
    version: actualVersion,
  }
}

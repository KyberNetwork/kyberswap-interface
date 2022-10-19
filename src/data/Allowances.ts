import { Token, TokenAmount } from '@namgold/ks-sdk-core'
import { useEffect, useMemo, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useTokenContractForReading } from 'hooks/useContract'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useActiveWeb3React } from 'hooks'
import { getAccount } from '@solana/spl-token'
import { SolanaNetworkInfo } from 'constants/networks/type'
import { useAssociatedTokensAccounts } from 'state/wallet/solanaHooks'

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): TokenAmount | undefined {
  const { isEVM, isSolana, networkInfo, account } = useActiveWeb3React()
  const contractForReading = useTokenContractForReading(isEVM ? token?.address : undefined)

  const inputs = useMemo(() => [owner, spender], [owner, spender])
  const allowance = useSingleCallResult(contractForReading, 'allowance', inputs).result

  const [allowanceSolana, setAllowanceSolana] = useState<bigint | null>(null)
  const atas = useAssociatedTokensAccounts()
  const ata = token?.mint && atas ? atas[token.mint.toBase58()] : undefined
  useEffect(() => {
    const calc = async () => {
      if (isSolana && token?.mint && spender && account && ata) {
        try {
          const traderAccount = await getAccount((networkInfo as SolanaNetworkInfo).connection, ata.pubkey)
          if (traderAccount.delegate?.equals(new PublicKey(spender))) {
            setAllowanceSolana(traderAccount.delegatedAmount)
          } else {
            setAllowanceSolana(BigInt(0))
          }
        } catch (e) {
          console.error('fetch allowance', e)
          setAllowanceSolana(null)
        }
      } else {
        setAllowanceSolana(null)
      }
    }
    calc()
  }, [account, ata, isSolana, networkInfo, spender, token])

  return useMemo(() => {
    if (token) {
      if (isEVM && allowance) return TokenAmount.fromRawAmount(token, allowance.toString())
      if (isSolana && allowanceSolana !== null) return TokenAmount.fromRawAmount(token, allowanceSolana.toString())
    }
    return
  }, [token, isEVM, allowance, isSolana, allowanceSolana])
}

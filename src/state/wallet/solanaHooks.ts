import { Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { AccountLayout, RawAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import JSBI from 'jsbi'
import { useEffect, useMemo, useState } from 'react'

import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { serumConnection } from 'state/connection/connection'
import { useAllTransactions } from 'state/transactions/hooks'
import { isAddress } from 'utils'

export const useSOLBalance = (uncheckedAddress?: string): CurrencyAmount<Currency> | undefined => {
  const { chainId, account, isSolana } = useActiveWeb3React()
  const [solBalance, setSolBalance] = useState<CurrencyAmount<Currency> | undefined>(undefined)
  const allTransactions = useAllTransactions()

  useEffect(() => {
    const getBalance = async () => {
      if (!isSolana) return
      if (!account) return
      if (!isAddress(chainId, account)) return
      try {
        const publicKey = new PublicKey(account)
        if (publicKey) {
          const balance = await serumConnection.getBalance(publicKey)
          const balanceJSBI = JSBI.BigInt(balance)
          if (solBalance === undefined || !JSBI.equal(balanceJSBI, solBalance.quotient))
            setSolBalance(CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], balanceJSBI))
        } else {
          if (solBalance !== undefined) setSolBalance(undefined)
        }
      } catch (e) {}
    }
    getBalance()

    // do not add solBalance to deps list, it would trigger infinity loops calling rpc calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allTransactions,
    account,
    chainId,
    isSolana,
    // solBalance,
    uncheckedAddress,
  ])

  return solBalance
}
type Overwrite<T, U> = Omit<T, keyof U> & U

type ParsedData = {
  data: RawAccount
}
type AccountInfoParsed = Overwrite<AccountInfo<any>, ParsedData> & {
  pubkey: PublicKey
}

export const useAssociatedTokensAccounts = (): { [mintAddress: string]: AccountInfoParsed } | null => {
  const { isSolana, account } = useActiveWeb3React()
  const allTransactions = useAllTransactions()
  const [atas, setAtas] = useState<{ [mintAddress: string]: AccountInfoParsed } | null>(null)

  useEffect(() => {
    if (!isSolana) return
    if (!account) return
    async function getTokenAccounts(publicKey: PublicKey) {
      try {
        const response = await serumConnection.getTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        })
        const atas: { [mintAddress: string]: AccountInfoParsed } = {}

        response.value.forEach(ata => {
          const parsedAccountData = AccountLayout.decode(ata.account.data)
          const parsedAta: AccountInfoParsed = {
            ...ata.account,
            pubkey: ata.pubkey,
            data: parsedAccountData,
          }
          atas[parsedAccountData.mint.toBase58()] = parsedAta
        })
        setAtas(atas)
      } catch (error) {
        console.error('get ata failed', { error })
      }
    }

    getTokenAccounts(new PublicKey(account))
  }, [allTransactions, account, isSolana])

  return atas
}

export function useTokensBalanceSolana(tokens?: Token[]): [TokenAmount | undefined, boolean][] {
  // export const useTokensBalanceSolana = (
  //   validatedTokenAddresses: string[],
  // ): { [mintAddress: string]: TokenAmount | false } => {
  const atas = useAssociatedTokensAccounts()
  const [tokensBalance, setTokensBalance] = useState<{ [mintAddress: string]: TokenAmount | undefined }>({})
  const allTransactions = useAllTransactions()
  const tokensMap: { [mintAddress: string]: Token } = useMemo(() => {
    return (
      tokens?.reduce((acc, token) => {
        acc[token.address] = token
        return acc
      }, {} as { [address: string]: Token }) || {}
    )
  }, [tokens])

  useEffect(() => {
    const newTokensBalance: { [mintAddress: string]: TokenAmount | undefined } =
      tokens?.reduce((acc, token) => {
        acc[token.address] = undefined
        return acc
      }, {} as { [mintAddress: string]: TokenAmount | undefined }) || {}
    console.debug('useTokensBalanceSolana - useEffect 1', { newTokensBalance })
    setTokensBalance(newTokensBalance)
  }, [allTransactions, tokens])

  useEffect(() => {
    async function getTokenAccounts() {
      console.debug('useTokensBalanceSolana - useEffect getTokenAccounts - 2', { tokens, atas })
      if (!tokens) return
      if (!atas) return
      console.debug('useTokensBalanceSolana - useEffect getTokenAccounts - 3')
      // Init all tokens balance by 0
      const newTokensBalance: { [mintAddress: string]: TokenAmount | undefined } = tokens.reduce((acc, token) => {
        acc[token.address] = CurrencyAmount.fromRawAmount(token, 0)
        return acc
      }, {} as { [mintAddress: string]: TokenAmount | undefined })
      console.debug('useTokensBalanceSolana - useEffect getTokenAccounts - 4', { newTokensBalance })

      tokens.forEach(token => {
        newTokensBalance[token.address] = CurrencyAmount.fromRawAmount(
          tokensMap[token.address],
          JSBI.BigInt(atas[token.address]?.data.amount.toString() || 0),
        )
      })
      console.debug('useTokensBalanceSolana - useEffect getTokenAccounts - 5', { newTokensBalance })

      setTokensBalance(newTokensBalance)
    }
    console.debug('useTokensBalanceSolana - useEffect getTokenAccounts - 1', { atas })
    if (atas) {
      console.debug('useTokensBalanceSolana - useEffect getTokenAccounts - 1.1')
      getTokenAccounts()
    }
  }, [allTransactions, atas, tokens, tokensMap])

  return useMemo(
    () => tokens?.map(token => [tokensBalance[token.address] || undefined, !tokensBalance[token.address]]) ?? [],
    [tokensBalance, tokens],
  )
}

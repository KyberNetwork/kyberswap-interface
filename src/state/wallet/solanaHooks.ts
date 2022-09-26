import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@namgold/ks-sdk-core'
import { AccountLayout, Mint, RawAccount, TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js'
import JSBI from 'jsbi'
import { useEffect, useMemo, useState } from 'react'

// import { useTokenList } from './useTokenlist'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { isAddress } from 'utils'

export const useSOLBalance = (uncheckedAddress?: string): CurrencyAmount<Currency> | undefined => {
  const { chainId, account } = useActiveWeb3React()
  const [solBalance, setSolBalance] = useState<CurrencyAmount<Currency> | undefined>(undefined)

  useEffect(() => {
    const getBalance = async () => {
      if (chainId !== ChainId.SOLANA) return
      if (!account) return
      if (!isAddress(chainId, account)) return
      try {
        const publicKey = new PublicKey(account)
        if (publicKey) {
          console.count('solana getBalance')
          console.info('solana getBalance', publicKey.toBase58())
          const balance = await NETWORKS_INFO[ChainId.SOLANA].connection.getBalance(publicKey)
          const balanceJSBI = JSBI.BigInt(balance)
          if (solBalance === undefined || !JSBI.equal(balanceJSBI, solBalance.quotient))
            setSolBalance(CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], balanceJSBI))
        } else {
          if (solBalance !== undefined) setSolBalance(undefined)
        }
      } catch (e) {}
    }
    setSolBalance(undefined)
    getBalance()

    // do not add solBalance to deps list, it would trigger infinity loops calling rpc calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uncheckedAddress])

  return solBalance
}
type Overwrite<T, U> = Omit<T, keyof U> & U

type ParsedMint = {
  mint: Mint
}
type RawAccountParsed = Overwrite<RawAccount, ParsedMint>

type ParsedData = {
  data: RawAccountParsed
}
type AccountInfoParsed = Overwrite<AccountInfo<any>, ParsedData> & {
  pubkey: PublicKey
}

export const useAssociatedTokensAccounts = (): { [mintAddress: string]: AccountInfoParsed } | null => {
  const { chainId } = useActiveWeb3React()

  const { publicKey } = useWallet()
  const [atas, setAtas] = useState<{ [mintAddress: string]: AccountInfoParsed } | null>(null)

  useEffect(() => {
    if (chainId !== ChainId.SOLANA) return
    if (!publicKey) return
    async function getTokenAccounts(publicKey: PublicKey, connection: Connection) {
      try {
        console.count('solana getTokenAccountsByOwner')
        console.info('solana getTokenAccountsByOwner', publicKey.toBase58())
        console.log('connection.getBlockHeight', await connection.getBlockHeight())
        const response = await connection.getTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        })
        const atas: { [mintAddress: string]: AccountInfoParsed } = {}
        await Promise.all(
          response.value.map(async ata => {
            // use map only to use with Promise.all. It should be understand as .forEach
            const parsedAccountData = AccountLayout.decode(ata.account.data)
            console.count('solana getMint')
            console.info('solana getMint', parsedAccountData.mint.toBase58())
            const parsedMintAccountData = {
              ...parsedAccountData,
              mint: await getMint(connection, parsedAccountData.mint),
            }
            const parsedAta: AccountInfoParsed = {
              ...ata.account,
              pubkey: ata.pubkey,
              data: parsedMintAccountData,
            }
            atas[parsedMintAccountData.mint.address.toBase58()] = parsedAta
            return
          }),
        )
        setAtas(atas)
      } catch (e) {}
    }

    getTokenAccounts(publicKey, NETWORKS_INFO[ChainId.SOLANA].connection)
  }, [publicKey, chainId])

  return atas
}

export function useTokensBalanceSolana(tokens?: Token[]): [TokenAmount | undefined, boolean][] {
  // export const useTokensBalanceSolana = (
  //   validatedTokenAddresses: string[],
  // ): { [mintAddress: string]: TokenAmount | false } => {
  const atas = useAssociatedTokensAccounts()
  const [solBalances, setSolBalances] = useState<{ [mintAddress: string]: TokenAmount | false }>({})

  useEffect(() => {
    const newSolBalances: { [mintAddress: string]: TokenAmount | false } = {}
    tokens?.forEach(token => {
      newSolBalances[token.address] = false
    })
    setSolBalances(newSolBalances)
  }, [tokens])

  useEffect(() => {
    async function getTokenAccounts() {
      if (!atas) return
      const newSolBalances: { [mintAddress: string]: TokenAmount } = {}
      // Init all tokens balance by 0
      tokens?.forEach(token => (newSolBalances[token.address] = CurrencyAmount.fromRawAmount(token, 0)))

      Object.keys(atas).forEach(ataAddress => {
        const accountInfo = atas[ataAddress].data
        const token = new Token(ChainId.SOLANA, accountInfo.mint.address.toBase58(), accountInfo.mint.decimals)
        newSolBalances[accountInfo.mint.address.toBase58()] = CurrencyAmount.fromRawAmount(
          token,
          JSBI.BigInt(accountInfo.amount.toString()),
        )
      })

      setSolBalances(newSolBalances)
    }

    if (atas) {
      getTokenAccounts()
    }
  }, [atas, tokens])

  return useMemo(
    () => tokens?.map(token => [solBalances[token.address] || undefined, solBalances[token.address] === false]) ?? [],
    [solBalances, tokens],
  )
}

// export const useBalance = (currency: Currency | null): CurrencyAmount | false => {
//   const SOLBalance = useSOLBalance()
//   const tokensBalances = useTokensBalances()
//   const [balance, setBalance] = useState<CurrencyAmount | false>(false)

//   useEffect(() => {
//     setBalance(false)
//   }, [currency])

//   useEffect(() => {
//     if (currency) {
//       if (currency instanceof Token) {
//         setBalance(tokensBalances[currency.mint.toBase58()])
//       } else {
//         setBalance(SOLBalance)
//       }
//     } else {
//       setBalance(false)
//     }
//   }, [currency, SOLBalance, tokensBalances])

//   return balance
// }

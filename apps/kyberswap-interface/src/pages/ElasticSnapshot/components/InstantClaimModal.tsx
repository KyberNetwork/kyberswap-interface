import { ChainId, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'

import { NotificationType } from 'components/Announcement/type'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import Dots from 'components/Dots'
import { Terms } from 'components/Header/web3/WalletModal'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import { wagmiConfig } from 'components/Web3Provider'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useReadingContract } from 'hooks/useContract'
import { useAllTokens } from 'hooks/useTokens'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import InstantAbi from 'pages/ElasticSnapshot/data/abis/instantClaimAbi.json'
import avalanche from 'pages/ElasticSnapshot/data/instant/avalanche.json'
import ethereum from 'pages/ElasticSnapshot/data/instant/ethereum.json'
import optimism from 'pages/ElasticSnapshot/data/instant/optimism.json'
import userPhase2 from 'pages/ElasticSnapshot/data/instant/pendle_dappos_instant_polygon.json'
import userPhase2_5 from 'pages/ElasticSnapshot/data/instant/phase2.5.json'
import polygon from 'pages/ElasticSnapshot/data/instant/polygon.json'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber } from 'utils/numbers'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'
import { Address, encodeFunctionData } from 'utils/viem'
import { getGatedWalletClient } from 'utils/walletClient'

const TABLE_GRID = 'grid grid-cols-[1.3fr_1fr_1fr_0.75fr] gap-2 p-2 text-sm'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 7 })

const contractAddress = '0xD0806364e9672EF21039Dc4DC84651B9b535E535'
const phase2ContractAddress = '0x3771cb0e40f55316a9cf9a79a60b562946a39d8b'
const phase2_5ContractAddress = '0x39c4620d26c87beef4fdd78295001d1e1e5366f1'

const snapshotPrices: { [key: string]: number } = {
  '0xd7bb095a60d7666d4a6f236423b47ddd6ae6cfa7': 3024.788661,
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': 2382.617666,
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 1,
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': 0.812957,
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 1,
  '0x03b54a6e9a984069379fae1a4fc4dbae93b3bccd': 2750.912419,
  '0xaddb6a0412de1ba0f936dcaeb8aaa24578dcf3b2': 2518.714817,
  '0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202': 0.6043092478,
  '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664': 1,
  '0xc7198437980c041c805a1edcba50c1ce5db95118': 1,
  '0xfab550568c688d5d8a52c7d794cb93edc26ec0ec': 1,
  '0x5cc8d49984834314f54211b1d872318cf766d466': 1,
}

export default function InstantClaimModal({ onDismiss, phase }: { onDismiss: () => void; phase: '1' | '2' | '2.5' }) {
  const { account, chainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()

  const polygonContractAddress =
    phase === '2' ? phase2ContractAddress : phase === '2.5' ? phase2_5ContractAddress : contractAddress

  const ethereumContract = useReadingContract(contractAddress, InstantAbi, ChainId.MAINNET)
  const optimismContract = useReadingContract(contractAddress, InstantAbi, ChainId.OPTIMISM)
  const polygonContract = useReadingContract(polygonContractAddress, InstantAbi, ChainId.MATIC)
  const avalancheContract = useReadingContract(contractAddress, InstantAbi, ChainId.AVAXMAINNET)

  const [claimed, setClaimed] = useState([true, true, true, true])

  const ethereumTokens = useAllTokens(true, ChainId.MAINNET)
  const optimismTokens = useAllTokens(true, ChainId.OPTIMISM)
  const polygonTokens = useAllTokens(true, ChainId.MATIC)
  const avalancheTokens = useAllTokens(true, ChainId.AVAXMAINNET)

  const allTokens = [ethereumTokens, optimismTokens, polygonTokens, avalancheTokens]

  const phase2Data = useMemo(() => {
    return userPhase2.find(info => info.claimData.receiver.toLowerCase() === account?.toLowerCase())
  }, [account])

  const phase2_5Data = useMemo(() => {
    return userPhase2_5.find(info => info.claimData.receiver.toLowerCase() === account?.toLowerCase())
  }, [account])

  const userData = useMemo(() => {
    if (!account) return []
    if (phase !== '1') return [undefined, undefined, phase2Data || phase2_5Data, undefined]
    return [ethereum, optimism, polygon, avalanche].map(data =>
      data.find(info => info.claimData.receiver.toLowerCase() === account.toLowerCase()),
    )
  }, [account, phase, phase2Data, phase2_5Data])

  useEffect(() => {
    ;(() => {
      const contractChainIds: [typeof ethereumContract, ChainId][] = [
        [ethereumContract, ChainId.MAINNET],
        [optimismContract, ChainId.OPTIMISM],
        [polygonContract, ChainId.MATIC],
        [avalancheContract, ChainId.AVAXMAINNET],
      ]
      Promise.all(
        contractChainIds.map(([contract, contractChainId], index) => {
          if (userData[index] && contract) {
            return readContract(wagmiConfig, {
              address: contract.address as Address,
              abi: InstantAbi,
              functionName: 'claimed',
              args: [BigInt(userData[index]?.claimData.index ?? 0)],
              chainId: contractChainId as number,
            }) as Promise<boolean>
          }
          return Promise.resolve(true)
        }),
      ).then(res => setClaimed(res))
    })()
  }, [ethereumContract, optimismContract, polygonContract, avalancheContract, userData])

  const totalValue = userData.reduce(
    (acc, cur) => acc + (cur?.claimData?.tokenInfo?.reduce((total, item) => total + item.value, 0) || 0),
    0,
  )

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [selectedNetworkToClaim, setSelectedNetworkToClaim] = useState<ChainId | null>(null)
  const [isAcceptTerm, setIsAcceptTerm] = useState(false)

  const selectedIndex =
    selectedNetworkToClaim === ChainId.MAINNET
      ? 0
      : selectedNetworkToClaim === ChainId.OPTIMISM
      ? 1
      : selectedNetworkToClaim === ChainId.MATIC
      ? 2
      : 3

  const { changeNetwork } = useChangeNetwork()
  const [autoSign, setAutoSign] = useState(false)
  const handleClaim = () => {
    if (selectedNetworkToClaim !== chainId && selectedNetworkToClaim) {
      setAutoSign(true)
      changeNetwork(selectedNetworkToClaim)
    } else {
      signAndClaim()
    }
  }

  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()

  const [signing, setSigning] = useState(false)
  const ipfsLink =
    phase !== '1'
      ? 'https://bafkreibjr6w7fahoj5rbe4utot3xqeffedyxxgiw4xvryw4d6n6pb6sxzq.ipfs.w3s.link'
      : 'https://bafkreiclpbxs5phtgmdicdxp4v6iul5agoadbd4u7vtut23dmoifiirqli.ipfs.w3s.link'
  const signAndClaim = useCallback(async () => {
    setAutoSign(false)
    setSigning(true)

    try {
      if (!account || !selectedNetworkToClaim) throw new Error('Wallet not connected')

      const verifyingContract = (phase !== '1' ? polygonContractAddress : contractAddress) as Address
      const walletClient = await getGatedWalletClient({ chainId: selectedNetworkToClaim })
      if (!walletClient) throw new Error('Wallet client unavailable')

      const signature = await walletClient.signTypedData({
        account: account as Address,
        domain: {
          name: 'Kyberswap Instant Grant',
          version: '1',
          chainId: selectedNetworkToClaim,
          verifyingContract,
        },
        types: {
          Agreement: [
            { name: 'leafIndex', type: 'uint256' },
            { name: 'termsAndConditions', type: 'string' },
          ],
        },
        primaryType: 'Agreement',
        message: {
          leafIndex: BigInt(userData[selectedIndex]?.claimData?.index ?? 0),
          termsAndConditions:
            phase !== '1'
              ? 'By confirming this transaction, I agree to the KyberSwap Elastic Recovered Asset Redemption Terms and Conditions which can be found at this link https://bafkreibjr6w7fahoj5rbe4utot3xqeffedyxxgiw4xvryw4d6n6pb6sxzq.ipfs.w3s.link'
              : `By confirming this transaction, I agree to the KyberSwap Elastic Recovered Asset Redemption Terms which can be found at this link ${ipfsLink}`,
        },
      })

      const encodedData = encodeFunctionData({
        abi: InstantAbi,
        functionName: 'claim',
        args: [
          {
            index: userData[selectedIndex]?.claimData?.index,
            receiver: account,
            tokenInfo: userData[selectedIndex]?.claimData.tokenInfo.map(item => ({
              token: item.token,
              amount: item.amount,
            })),
          },
          userData[selectedIndex]?.proof,
          signature,
        ],
      })

      const tx = await sendEVMTransaction({
        account,
        contractAddress: verifyingContract,
        encodedData,
        value: 0n,
        errorInfo: { name: ErrorName.SwapError, wallet: undefined },
        isSmartConnector,
        chainId: selectedNetworkToClaim,
      })

      setSigning(false)
      if (tx?.hash) {
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.CLAIM,
        })
        onDismiss()
      }
    } catch (e: any) {
      console.error(e)
      setSigning(false)
      notify({
        title: `Error`,
        summary: friendlyError(e),
        type: NotificationType.ERROR,
      })
    }
  }, [
    phase,
    polygonContractAddress,
    ipfsLink,
    account,
    isSmartConnector,
    selectedNetworkToClaim,
    userData,
    selectedIndex,
    notify,
    addTransactionWithType,
    onDismiss,
  ])

  useEffect(() => {
    if (autoSign && chainId === selectedNetworkToClaim) {
      signAndClaim()
    }
  }, [autoSign, chainId, selectedNetworkToClaim, signAndClaim])

  return (
    <Modal width="100%" maxWidth="680px" isOpen={true} onDismiss={onDismiss}>
      <div className={cn('relative flex w-full flex-col bg-background leading-normal', upToSmall ? 'p-4' : 'p-5')}>
        <div className="text-center text-xl font-medium text-text">
          <Trans>Claim Asset</Trans>
        </div>
        <ButtonEmpty onClick={onDismiss} width="36px" height="36px" padding="0" className="absolute right-4 top-4">
          <X className="text-text" />
        </ButtonEmpty>

        {selectedNetworkToClaim ? (
          <>
            <div className="text-sm text-subText">
              <Trans>You are currently claiming</Trans>
            </div>
            <div className="mt-2 rounded-xl bg-buttonBlack p-4">
              {userData[selectedIndex]?.claimData.tokenInfo.map((item, index) => {
                const tk = allTokens[selectedIndex][item.token.toLowerCase()]
                const tkAmount = tk && TokenAmount.fromRawAmount(tk, item.amount)

                return (
                  <div className="mt-2 flex gap-2" key={index}>
                    <CurrencyLogo currency={tk} />
                    {+tkAmount?.toSignificant(6)} {tk?.symbol}
                  </div>
                )
              })}
            </div>

            <div className="mt-2 text-subText">
              on the <span className="text-text">{NETWORKS_INFO[selectedNetworkToClaim].name}</span>
            </div>

            <div className="mt-6 text-sm text-text">
              If you have additional assets, kindly switch networks and proceed with the claiming process.
            </div>

            <div className="mt-6 text-sm text-subText">
              Make sure you have read and understand the{' '}
              <ExternalLink href={ipfsLink}>KyberSwap’s Terms and Conditions</ExternalLink> before proceeding. You will
              need to Sign a message to confirm that you have read and accepted before claiming your assets.
            </div>

            <Terms onClick={() => setIsAcceptTerm(prev => !prev)} className="mt-6 !bg-transparent !p-0">
              <input
                type="checkbox"
                checked={isAcceptTerm}
                data-testid="accept-term"
                className="mr-3 size-3.5 min-w-3.5 cursor-pointer"
              />
              <div>
                Accept <ExternalLink href={ipfsLink}>KyberSwap’s Terms and Conditions</ExternalLink>
              </div>
            </Terms>
            <div className="mt-6 flex gap-4">
              <ButtonOutlined
                onClick={() => {
                  setSelectedNetworkToClaim(null)
                }}
              >
                Cancel
              </ButtonOutlined>
              <ButtonPrimary onClick={handleClaim} disabled={!isAcceptTerm || signing}>
                {signing ? <Dots>Signing</Dots> : 'Sign and Claim'}
              </ButtonPrimary>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-buttonBlack px-5 py-3">
              <div className="text-sm font-medium text-subText">
                <Trans>Total Amount (USD)</Trans>
              </div>
              <div className="text-xl font-medium">{format(totalValue)}</div>
            </div>

            {!upToSmall && (
              <div className={cn(TABLE_GRID, 'mt-4 text-subText')}>
                <div>Assets</div>
                <div className="text-right">Exploitation Value</div>

                <div className="flex justify-end">
                  <div className="text-right">Snapshot Value</div>
                  <InfoHelper text="Recovered Asset Distribution Snapshot Value" />
                </div>
              </div>
            )}

            {userData.map((item, index) => {
              if (!item) return null
              const chain =
                index === 0
                  ? ChainId.MAINNET
                  : index === 1
                  ? ChainId.OPTIMISM
                  : index === 2
                  ? ChainId.MATIC
                  : ChainId.AVAXMAINNET

              const network = NETWORKS_INFO[chain]
              const totalValue = item.claimData.tokenInfo.reduce((acc, cur) => acc + cur.value, 0)

              const currentValue = item.claimData.tokenInfo.reduce((acc, cur) => {
                const tk = allTokens[index][cur.token.toLowerCase()]
                const tkAmount = tk && TokenAmount.fromRawAmount(tk, cur.amount)
                const currentValue = +(tkAmount?.toExact() || '0') * (snapshotPrices[cur.token.toLowerCase()] || 0)
                return acc + currentValue
              }, 0)

              return (
                <Fragment key={index}>
                  {upToSmall ? (
                    <div className="mt-4 rounded-xl bg-tableHeader px-4 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <img alt="" src={network.icon} width={18} /> <div className="text-base">{network.name}</div>
                        </div>
                        <ButtonPrimary
                          disabled={claimed[index]}
                          className="h-9"
                          width="max-content"
                          onClick={() => setSelectedNetworkToClaim(chain)}
                        >
                          {claimed[index] ? 'Claimed' : <Trans>Claim</Trans>}
                        </ButtonPrimary>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs font-medium text-subText">
                        <div>EXPLOITATION VALUE</div>

                        <div className="flex">
                          <div>SNAPSHOT VALUE</div>
                          <InfoHelper text="Recovered Asset Distribution Snapshot Value" />
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-right text-lg font-medium">{format(totalValue)}</div>
                        <div className="text-right text-lg font-medium">{format(currentValue)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(TABLE_GRID, 'mt-0 items-center rounded-xl bg-buttonGray text-text')}>
                      <div className="flex items-center gap-1.5">
                        <img alt="" src={network.icon} width={18} /> <div className="text-base">{network.name}</div>
                      </div>
                      <div className="text-right text-lg font-medium">{format(totalValue)}</div>
                      <div className="text-right text-lg font-medium">{format(currentValue)}</div>
                      <div className="flex justify-end">
                        <ButtonPrimary
                          disabled={claimed[index]}
                          className="h-9"
                          width="max-content"
                          onClick={() => setSelectedNetworkToClaim(chain)}
                        >
                          {claimed[index] ? 'Claimed' : <Trans>Claim</Trans>}
                        </ButtonPrimary>
                      </div>
                    </div>
                  )}

                  {item.claimData.tokenInfo.map((info, idx) => {
                    const tk = allTokens[index][info.token.toLowerCase()]
                    const tkAmount = tk && TokenAmount.fromRawAmount(tk, info.amount)
                    const currentValue = +(tkAmount?.toExact() || '0') * (snapshotPrices[info.token.toLowerCase()] || 0)

                    if (upToSmall)
                      return (
                        <div className="px-4 py-2" key={idx}>
                          <div className="mt-2 flex items-center gap-1.5">
                            <CurrencyLogo currency={tk} size="16px" />
                            <div>
                              {tkAmount?.toSignificant(6)} {tk?.symbol}
                            </div>
                          </div>
                          <div className="my-2 flex justify-between">
                            <div>{format(info.value)}</div>
                            <div>{format(currentValue)}</div>
                          </div>
                          {idx !== item.claimData.tokenInfo.length - 1 && <Divider />}
                        </div>
                      )

                    return (
                      <div className={cn(TABLE_GRID, 'mt-0 items-center rounded-xl text-text')} key={info.token}>
                        <div className="flex items-center gap-1.5">
                          <CurrencyLogo currency={tk} size="16px" />
                          <div>
                            {tkAmount?.toSignificant(6)} {tk?.symbol}
                          </div>
                        </div>
                        <div className="text-right">{format(info.value)}</div>
                        <div className="text-right">{format(currentValue)}</div>
                      </div>
                    )
                  })}
                </Fragment>
              )
            })}
          </>
        )}
      </div>
    </Modal>
  )
}

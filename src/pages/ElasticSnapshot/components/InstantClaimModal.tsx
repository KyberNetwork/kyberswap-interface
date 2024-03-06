import { ChainId, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Interface } from 'ethers/lib/utils'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import Dots from 'components/Dots'
import { TermAndCondition } from 'components/Header/web3/WalletModal'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { useReadingContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber } from 'utils/numbers'

import InstantAbi from '../data/abis/instantClaimAbi.json'
import avalanche from '../data/instant/avalanche.json'
import ethereum from '../data/instant/ethereum.json'
import optimism from '../data/instant/optimism.json'
import userPhase2 from '../data/instant/pendle_dappos_instant_polygon.json'
import userPhase2_5 from '../data/instant/phase2.5.json'
import polygon from '../data/instant/polygon.json'

const Total = styled.div`
  display: flex;
  justify-content: space-between;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 12px;
  padding: 12px 20px;
  align-items: center;
  margin-top: 24px;
`

const TableHeader = styled.div`
  display: grid;
  padding: 8px;
  grid-template-columns: 1.3fr 1fr 1fr 0.75fr;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  margin-top: 1rem;
`

const TableBody = styled(TableHeader)<{ backgroundColor?: string }>`
  color: ${({ theme }) => theme.text};
  margin-top: 0;
  align-items: center;
  border-radius: 12px;
`

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 7 })

const contractAddress = '0xD0806364e9672EF21039Dc4DC84651B9b535E535'
const phase2ContractAddress = '0x3771cb0e40f55316a9cf9a79a60b562946a39d8b'
const phase2_5ContractAddress = '0x39c4620d26c87beef4fdd78295001d1e1e5366f1'

const ContractInterface = new Interface(InstantAbi)

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
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const polygonContractAddress =
    phase === '2' ? phase2ContractAddress : phase === '2.5' ? phase2_5ContractAddress : contractAddress

  const ethereumContract = useReadingContract(contractAddress, ContractInterface, ChainId.MAINNET)
  const optimismContract = useReadingContract(contractAddress, ContractInterface, ChainId.OPTIMISM)
  const polygonContract = useReadingContract(polygonContractAddress, ContractInterface, ChainId.MATIC)
  const avalancheContract = useReadingContract(contractAddress, ContractInterface, ChainId.AVAXMAINNET)

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
      Promise.all(
        [ethereumContract, optimismContract, polygonContract, avalancheContract].map((contract, index) => {
          if (userData[index] && contract) {
            return contract.claimed(userData[index]?.claimData.index)
          } else {
            return Promise.resolve(true)
          }
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
  const signAndClaim = useCallback(() => {
    setAutoSign(false)
    setSigning(true)

    library
      ?.send('eth_signTypedData_v4', [
        account,
        JSON.stringify({
          types: {
            EIP712Domain: [
              {
                name: 'name',
                type: 'string',
              },
              {
                name: 'version',
                type: 'string',
              },
              {
                name: 'chainId',
                type: 'uint256',
              },
              {
                name: 'verifyingContract',
                type: 'address',
              },
            ],
            Agreement: [
              {
                name: 'leafIndex',
                type: 'uint256',
              },
              {
                name: 'termsAndConditions',
                type: 'string',
              },
            ],
          },
          primaryType: 'Agreement',
          domain: {
            name: 'Kyberswap Instant Grant',
            version: '1',
            chainId: selectedNetworkToClaim,
            verifyingContract: phase !== '1' ? polygonContractAddress : contractAddress,
          },
          message: {
            leafIndex: userData[selectedIndex]?.claimData?.index,
            termsAndConditions:
              phase !== '1'
                ? 'By confirming this transaction, I agree to the KyberSwap Elastic Recovered Asset Redemption Terms and Conditions which can be found at this link https://bafkreibjr6w7fahoj5rbe4utot3xqeffedyxxgiw4xvryw4d6n6pb6sxzq.ipfs.w3s.link'
                : `By confirming this transaction, I agree to the KyberSwap Elastic Recovered Asset Redemption Terms which can be found at this link ${ipfsLink}`,
          },
        }),
      ])
      .then(signature => {
        const encodedData = ContractInterface.encodeFunctionData('claim', [
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
        ])
        library
          ?.getSigner()
          .sendTransaction({
            to: phase !== '1' ? polygonContractAddress : contractAddress,
            data: encodedData,
          })
          .then(tx => {
            setSigning(false)
            addTransactionWithType({
              hash: tx.hash,
              type: TRANSACTION_TYPE.CLAIM,
            })
            onDismiss()
          })
          .catch(e => {
            console.log(e)
            setSigning(false)
            notify({
              title: `Error`,
              summary: friendlyError(e),
              type: NotificationType.ERROR,
            })
          })
      })
      .catch(e => {
        console.log(e)
        setSigning(false)
        notify({
          title: `Error`,
          summary: friendlyError(e),
          type: NotificationType.ERROR,
        })
      })
  }, [
    phase,
    polygonContractAddress,
    ipfsLink,
    account,
    library,
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
      <Flex
        flexDirection="column"
        padding={upToSmall ? '1rem' : '20px'}
        bg={theme.background}
        width="100%"
        lineHeight={1.5}
        sx={{
          position: 'relative',
        }}
      >
        <Text color={theme.text} fontSize="20px" fontWeight="500" textAlign="center">
          <Trans>Claim Asset</Trans>
        </Text>
        <ButtonEmpty
          onClick={onDismiss}
          width="36px"
          height="36px"
          padding="0"
          style={{ position: 'absolute', right: '1rem', top: '1rem' }}
        >
          <X color={theme.text} />
        </ButtonEmpty>

        {selectedNetworkToClaim ? (
          <>
            <Text color={theme.subText} fontSize={14}>
              <Trans>You are currently claiming</Trans>
            </Text>
            <Box sx={{ background: theme.buttonBlack, padding: '1rem', borderRadius: '12px', marginTop: '8px' }}>
              {userData[selectedIndex]?.claimData.tokenInfo.map((item, index) => {
                const tk = allTokens[selectedIndex][item.token.toLowerCase()]
                const tkAmount = tk && TokenAmount.fromRawAmount(tk, item.amount)

                return (
                  <Flex marginTop="8px" key={index} sx={{ gap: '8px' }}>
                    <CurrencyLogo currency={tk} />
                    {+tkAmount?.toSignificant(6)} {tk?.symbol}
                  </Flex>
                )
              })}
            </Box>

            <Text color={theme.subText} marginTop="8px">
              on the{' '}
              <Text as="span" color={theme.text}>
                {NETWORKS_INFO[selectedNetworkToClaim].name}
              </Text>
            </Text>

            <Text color={theme.text} fontSize={14} marginTop="24px">
              If you have additional assets, kindly switch networks and proceed with the claiming process.
            </Text>

            <Text color={theme.subText} fontSize={14} marginTop="24px">
              Make sure you have read and understand the{' '}
              <ExternalLink href={ipfsLink}>KyberSwap’s Terms and Conditions</ExternalLink> before proceeding. You will
              need to Sign a message to confirm that you have read and accepted before claiming your assets.
            </Text>

            <TermAndCondition
              onClick={() => setIsAcceptTerm(prev => !prev)}
              style={{ marginTop: '24px', background: 'transparent', padding: 0 }}
            >
              <input
                type="checkbox"
                checked={isAcceptTerm}
                data-testid="accept-term"
                style={{ marginRight: '12px', height: '14px', width: '14px', minWidth: '14px', cursor: 'pointer' }}
              />
              <Text>
                Accept <ExternalLink href={ipfsLink}>KyberSwap’s Terms and Conditions</ExternalLink>
              </Text>
            </TermAndCondition>
            <Flex marginTop="24px" sx={{ gap: '1rem' }}>
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
            </Flex>
          </>
        ) : (
          <>
            <Total>
              <Text color={theme.subText} fontSize="14px" fontWeight="500">
                <Trans>Total Amount (USD)</Trans>
              </Text>
              <Text fontSize={20} fontWeight="500">
                {format(totalValue)}
              </Text>
            </Total>

            {!upToSmall && (
              <TableHeader>
                <Text>Assets</Text>
                <Text textAlign="right">Exploitation Value</Text>

                <Flex justifyContent="flex-end">
                  <Text textAlign="right">Snapshot Value</Text>
                  <InfoHelper text="Recovered Asset Distribution Snapshot Value" />
                </Flex>
              </TableHeader>
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
                    <Box
                      sx={{
                        borderRadius: '12px',
                        padding: '8px 1rem',
                        background: theme.tableHeader,
                        marginTop: '1rem',
                      }}
                    >
                      <Flex alignItems="center" justifyContent="space-between">
                        <Flex sx={{ gap: '6px' }} alignItems="center">
                          <img alt="" src={network.icon} width={18} /> <Text fontSize={16}>{network.name}</Text>
                        </Flex>
                        <ButtonPrimary
                          disabled={claimed[index]}
                          style={{ height: '36px' }}
                          width="max-content"
                          onClick={() => setSelectedNetworkToClaim(chain)}
                        >
                          {claimed[index] ? 'Claimed' : <Trans>Claim</Trans>}
                        </ButtonPrimary>
                      </Flex>

                      <Flex
                        marginTop="12px"
                        alignItems="center"
                        justifyContent="space-between"
                        color={theme.subText}
                        fontWeight="500"
                        fontSize="12px"
                      >
                        <Text>EXPLOITATION VALUE</Text>

                        <Flex>
                          <Text>SNAPSHOT VALUE</Text>
                          <InfoHelper text="Recovered Asset Distribution Snapshot Value" />
                        </Flex>
                      </Flex>

                      <Flex alignItems="center" justifyContent="space-between" marginTop="4px">
                        <Text fontSize={18} textAlign="right" fontWeight="500">
                          {format(totalValue)}
                        </Text>
                        <Text fontSize={18} textAlign="right" fontWeight="500">
                          {format(currentValue)}
                        </Text>
                      </Flex>
                    </Box>
                  ) : (
                    <TableBody style={{ backgroundColor: theme.buttonGray }}>
                      <Flex sx={{ gap: '6px' }} alignItems="center">
                        <img alt="" src={network.icon} width={18} /> <Text fontSize={16}>{network.name}</Text>
                      </Flex>
                      <Text fontSize={18} textAlign="right" fontWeight="500">
                        {format(totalValue)}
                      </Text>
                      <Text fontSize={18} textAlign="right" fontWeight="500">
                        {format(currentValue)}
                      </Text>
                      <Flex justifyContent="flex-end">
                        <ButtonPrimary
                          disabled={claimed[index]}
                          style={{ height: '36px' }}
                          width="max-content"
                          onClick={() => setSelectedNetworkToClaim(chain)}
                        >
                          {claimed[index] ? 'Claimed' : <Trans>Claim</Trans>}
                        </ButtonPrimary>
                      </Flex>
                    </TableBody>
                  )}

                  {item.claimData.tokenInfo.map((info, idx) => {
                    const tk = allTokens[index][info.token.toLowerCase()]
                    const tkAmount = tk && TokenAmount.fromRawAmount(tk, info.amount)
                    const currentValue = +(tkAmount?.toExact() || '0') * (snapshotPrices[info.token.toLowerCase()] || 0)

                    if (upToSmall)
                      return (
                        <Box sx={{ padding: '8px 1rem' }}>
                          <Flex sx={{ gap: '6px' }} alignItems="center" marginTop="0.5rem">
                            <CurrencyLogo currency={tk} size="16px" />
                            <Text>
                              {tkAmount?.toSignificant(6)} {tk?.symbol}
                            </Text>
                          </Flex>
                          <Flex justifyContent="space-between" marginY="8px">
                            <Text>{format(info.value)}</Text>
                            <Text>{format(currentValue)}</Text>
                          </Flex>
                          {idx !== item.claimData.tokenInfo.length - 1 && <Divider />}
                        </Box>
                      )

                    return (
                      <TableBody key={info.token}>
                        <Flex sx={{ gap: '6px' }} alignItems="center">
                          <CurrencyLogo currency={tk} size="16px" />
                          <Text>
                            {tkAmount?.toSignificant(6)} {tk?.symbol}
                          </Text>
                        </Flex>
                        <Text textAlign="right">{format(info.value)}</Text>
                        <Text textAlign="right">{format(currentValue)}</Text>
                      </TableBody>
                    )
                  })}
                </Fragment>
              )
            })}
          </>
        )}
      </Flex>
    </Modal>
  )
}

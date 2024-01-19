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
import Dots from 'components/Dots'
import { TermAndCondition } from 'components/Header/web3/WalletModal'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber } from 'utils/numbers'

import avalanche from '../data/instant/avalanche.json'
import ethereum from '../data/instant/ethereum.json'
import optimism from '../data/instant/optimism.json'
import polygon from '../data/instant/polygon.json'
import InstantAbi from '../data/instantClaimAbi.json'

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
  grid-template-columns: 1.3fr 1fr 1fr; // 0.75fr;
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

const contractAddresses = ['', '', '0x8BCd25bc7a51FaB19eed470Ef28F94b9f72485Cc', '']

const ContractInterface = new Interface(InstantAbi)

export default function InstantClaim() {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  // const ethereumContract = useReadingContract(contractAddresses[0], ContractInterface, ChainId.MAINNET)
  // const optimismContract = useReadingContract(contractAddresses[1], ContractInterface, ChainId.OPTIMISM)
  // const polygonContract = useReadingContract(contractAddresses[2], ContractInterface, ChainId.MATIC)
  // const avalancheContract = useReadingContract(contractAddresses[3], ContractInterface, ChainId.AVAXMAINNET)

  // const [claimed, setClaimed] = useState([true, true, true, true])

  const ethereumTokens = useAllTokens(true, ChainId.MAINNET)
  const optimismTokens = useAllTokens(true, ChainId.OPTIMISM)
  const polygonTokens = useAllTokens(true, ChainId.MATIC)
  const avalancheTokens = useAllTokens(true, ChainId.AVAXMAINNET)

  const allTokens = [ethereumTokens, optimismTokens, polygonTokens, avalancheTokens]

  const userData = useMemo(() => {
    if (!account) return []
    return [ethereum, optimism, polygon, avalanche].map(data =>
      data.find(info => info.claimData.receiver.toLowerCase() === account.toLowerCase()),
    )
  }, [account])

  // useEffect(() => {
  //   ;(() => {
  //     Promise.all(
  //       [ethereumContract, optimismContract, polygonContract, avalancheContract].map((contract, index) => {
  //         if (userData[index] && contract) {
  //           return contract.claimed(userData[index]?.claimData.index)
  //         } else {
  //           return Promise.resolve(true)
  //         }
  //       }),
  //     ).then(res => setClaimed(res))
  //   })()
  // }, [ethereumContract, optimismContract, polygonContract, avalancheContract, userData])

  const totalValue = userData.reduce(
    (acc, cur) => acc + (cur?.claimData?.tokenInfo?.reduce((total, item) => total + item.value, 0) || 0),
    0,
  )

  const tokenAddresses = userData.map(item => [...new Set(item?.claimData?.tokenInfo.map(inf => inf.token))])

  const ethereumTokensPrice = useTokenPrices(tokenAddresses[0], ChainId.MAINNET)
  const optimismTokensPrice = useTokenPrices(tokenAddresses[1], ChainId.OPTIMISM)
  const polygonTokensPrice = useTokenPrices(tokenAddresses[2], ChainId.MATIC)
  const avalancheTokensPrice = useTokenPrices(tokenAddresses[3], ChainId.AVAXMAINNET)
  const prices = [ethereumTokensPrice, optimismTokensPrice, polygonTokensPrice, avalancheTokensPrice]

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
            verifyingContract: contractAddresses[selectedIndex],
          },
          message: {
            leafIndex: userData[selectedIndex]?.claimData?.index,
            termsAndConditions:
              'I accept KyberSwap’s Terms and Conditions published here https://bafkreic3csqhyqrz3wir2wd7sn2owrsuwbn4aakbaje5zmmpoy2dmbdlyi.ipfs.w3s.link',
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
        console.log(signature, encodedData)
        library
          ?.getSigner()
          .sendTransaction({
            to: contractAddresses[selectedIndex],
            data: encodedData,
          })
          .then(tx => {
            setSigning(false)
            addTransactionWithType({
              hash: tx.hash,
              type: TRANSACTION_TYPE.CLAIM,
            })
            setShow(false)
            setSelectedNetworkToClaim(null)
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
  }, [account, library, selectedNetworkToClaim, userData, selectedIndex, notify, addTransactionWithType])

  useEffect(() => {
    if (autoSign && chainId === selectedNetworkToClaim) {
      signAndClaim()
    }
  }, [autoSign, chainId, selectedNetworkToClaim, signAndClaim])

  console.log(userData)
  if (!userData.filter(Boolean).length) return null

  return (
    <Flex flexDirection="column">
      <Modal
        width="100%"
        maxWidth="680px"
        isOpen={show}
        onDismiss={() => {
          setShow(false)
        }}
      >
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
            onClick={() => {
              setSelectedNetworkToClaim(null)
              setShow(false)
            }}
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
                <ExternalLink href="/todo">KyberSwap’s Terms and Conditions</ExternalLink> before proceeding. You will
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
                  Accept <ExternalLink href="/todo">KyberSwap’s Terms and Conditions</ExternalLink>
                </Text>
              </TermAndCondition>
              <Flex marginTop="24px" sx={{ gap: '1rem' }}>
                <ButtonOutlined
                  onClick={() => {
                    setShow(false)
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

              <TableHeader>
                <Text>Assets</Text>
                <Text textAlign="right">Exploitation Value</Text>
                <Text textAlign="right">Current Value</Text>
              </TableHeader>

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
                  const currentValue = +(tkAmount?.toExact() || '0') * (prices[index][cur.token.toLowerCase()] || 0)
                  return acc + currentValue
                }, 0)

                return (
                  <Fragment key={index}>
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
                      {/*
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
                      */}
                    </TableBody>

                    {item.claimData.tokenInfo.map(info => {
                      const tk = allTokens[index][info.token.toLowerCase()]
                      const tkAmount = tk && TokenAmount.fromRawAmount(tk, info.amount)
                      const currentValue =
                        +(tkAmount?.toExact() || '0') * (prices[index][info.token.toLowerCase()] || 0)

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

      <Text fontSize={20} fontWeight="500">
        <Trans>Available assets for claiming</Trans>
      </Text>

      <Flex
        flexDirection="column"
        padding="12px 20px"
        justifyContent="space-between"
        marginTop="1rem"
        width="max-content"
        sx={{ gap: '16px', borderRadius: '12px' }}
        backgroundColor="rgba(0,0,0,0.64)"
      >
        <Text fontSize="14px" fontWeight="500" color={theme.subText} lineHeight="20px">
          <Trans>Total Amount (USD)</Trans>
        </Text>
        <Flex sx={{ gap: '1rem' }} alignItems="flex-end">
          <Text fontWeight="500" fontSize={20}>
            {format(totalValue)}
          </Text>
          <Text
            sx={{ fontSize: '14px', cursor: 'pointer' }}
            fontWeight="500"
            role="button"
            color={theme.primary}
            mb="2px"
            onClick={() => {
              setShow(true)
            }}
          >
            <Trans>Details</Trans>
          </Text>
        </Flex>
      </Flex>

      <Text marginTop="1rem" fontSize={14} color={theme.subText} lineHeight={1.5}>
        <Trans>Total Amount includes assets that KyberSwap has recovered or rescued under Category 3 & 5</Trans>
      </Text>
      <Text marginTop="8px" fontSize={14} color={theme.subText} lineHeight={1.5}>
        <Trans>
          Your assets are spread across various networks. Kindly choose the relevant network and proceed with the
          claiming process.
        </Trans>
      </Text>
    </Flex>
  )
}

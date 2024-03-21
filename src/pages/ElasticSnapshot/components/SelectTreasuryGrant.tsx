import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { type Provider, ZkMeWidget, verifyKYCWithZkMeServices } from '@zkmelabs/widget'
import { rgba } from 'polished'
import { useEffect, useMemo, useState } from 'react'
import { Check, Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import {
  useCreateOptionMutation,
  useGetUserSelectedOptionQuery,
  useLazyGetAccessTokensQuery,
} from 'services/commonService'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import Dots from 'components/Dots'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { VerticalDivider } from 'pages/About/styleds'
import { useNotify } from 'state/application/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import vesting3rdData from '../data/pendle_dappos_vesting.json'
import vestingData from '../data/vesting.json'
import vestingOptionA from '../data/vesting/optionA.json'
import vestingOptionB from '../data/vesting/optionB.json'
import ChooseGrantModal from './ChooseGrantModal'
import TermAndPolicyModal from './TermAndPolicyModal'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })

const Step = styled.div`
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  line-height: 20px;
  width: 56px;
  height: 56px;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme }) => theme.background};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`

const APP_ID = 'M2023122583510932543540072365652'

const MANUAL_KYCS = [
  '0x5119d8c206546C5361Bb6317D7508d9bd4787C16',
  '0x2130FD01026867A6c8DdE24ad5E64F2e2DFce196',
  '0x6Ef7173Ba0552f8940Dda4B5eA5AC48b17f8b8a2',
  '0x5da35491fF9d73E3F5ff0D3C6ED1eA5ab68770C0',
  '0x4526B09df42775975a543e0E984172Ab202b4Ff8',
]

export default function SelectTreasuryGrant({ userHaveVestingData }: { userHaveVestingData: boolean }) {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const [showOptionModal, setShowOptionsModal] = useState(false)

  const addressesOptionA = vestingOptionA.map(item => item.claimData.receiver.toLowerCase())
  const addressesOptionB = vestingOptionB.map(item => item.claimData.receiver.toLowerCase())
  const userData = vestingData.find(
    item =>
      item.receiver.toLowerCase() === account?.toLowerCase() &&
      (addressesOptionA.includes(item.receiver.toLowerCase()) ||
        addressesOptionB.includes(item.receiver.toLowerCase())),
  )

  const userPhase2 = vestingData.find(
    item =>
      item.receiver.toLowerCase() === account?.toLowerCase() &&
      !addressesOptionA.includes(item.receiver.toLowerCase()) &&
      !addressesOptionB.includes(item.receiver.toLowerCase()),
  )
  const user3rdData = vesting3rdData.find(item => item.receiver.toLowerCase() === account?.toLowerCase())
  const totalPhase2Value = (user3rdData?.value || 0) + (userPhase2?.value || 0)
  const totalValue = (userData?.value || 0) + totalPhase2Value
  const isNull = user3rdData?.value === null
  const isTotalNull = totalValue === 0 && isNull

  const [createOption] = useCreateOptionMutation()
  const notify = useNotify()

  const [isKyc, setIsKyc] = useState(false)
  const [loadingZkme, setLoading] = useState(false)

  const { library } = useWeb3React()
  const [getAccessTokenQuery] = useLazyGetAccessTokensQuery()

  const provider: Provider | null = useMemo(
    () =>
      library && account && chainId === ChainId.MATIC
        ? {
            async getAccessToken() {
              // Request a new token from your backend service and return it to the widget
              return getAccessTokenQuery().then(res => {
                return res?.data?.data?.accessToken || ''
              })
            },
            async getUserAccounts() {
              return [account]
            },
            async delegateTransaction(tx) {
              const txResponse = await library.getSigner().sendTransaction(tx as any)
              return txResponse?.hash
            },
          }
        : null,
    [library, account, getAccessTokenQuery, chainId],
  )

  const zkMe = useMemo(() => {
    return provider ? new ZkMeWidget(APP_ID, 'KyberSwap', '0x89', provider) : null
  }, [provider])

  useEffect(() => {
    if (zkMe && account) {
      type KycResults = 'matching' | 'mismatch'
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      zkMe.on('finished', async (verifiedAddress: string, kycResults: KycResults) => {
        // We recommend that you double-check this by calling the functions mentioned in the "Helper functions" section.
        if (kycResults === 'matching' && verifiedAddress.toLowerCase() === account.toLowerCase()) {
          const results = await verifyKYCWithZkMeServices(APP_ID, account)
          if (results) {
            zkMe.destroy()
            setIsKyc(true)
          }
        }
      })
    }
  }, [zkMe, account])

  useEffect(() => {
    const fn = async () => {
      if (account && MANUAL_KYCS.includes(account)) {
        setIsKyc(true)
        return
      }
      if (zkMe && account) {
        setLoading(true)
        const results: boolean = await verifyKYCWithZkMeServices(
          APP_ID, // This parameter means the same thing as "mchNo"
          account,
        )

        if (results) {
          setIsKyc(true)
        } else {
          setIsKyc(false)
        }
        setLoading(false)
      }
    }
    fn()
  }, [zkMe, account])

  const {
    data: userSelectedData,
    error,
    isLoading: loadingUserOption,
    refetch,
  } = useGetUserSelectedOptionQuery(account || '', {
    skip: !account,
  })

  const userSelectedOption = useMemo(
    () => (error ? '' : userSelectedData?.data.option?.toUpperCase()),
    [error, userSelectedData],
  )

  const { changeNetwork } = useChangeNetwork()

  useEffect(() => {
    if (zkMe && chainId !== ChainId.MATIC) {
      zkMe.destroy()
    }
  }, [chainId, zkMe])

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const [showTermModal, setShowTermModal] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <>
      <TermAndPolicyModal
        isOpen={showTermModal}
        onDismiss={() => setShowTermModal(false)}
        onOk={() => {
          setShowTermModal(false)
          zkMe?.launch()
        }}
      />
      <ChooseGrantModal
        isOpen={showOptionModal}
        onDismiss={() => {
          setShowOptionsModal(false)
          if (!userSelectedOption) refetch()
        }}
        userSelectedOption={userSelectedOption}
      />
      <Flex flexDirection="column">
        <Text fontSize={20} fontWeight="500">
          <Trans>Selecting Treasury Grant Option</Trans>
        </Text>

        <Box backgroundColor={rgba('#08A1E7', 0.2)} padding="1rem" sx={{ borderRadius: '12px' }} marginTop="1rem">
          <Text fontSize={14} lineHeight="20px">
            For anyone who missed the{' '}
            <Text color="#58B5EE" as="span">
              March 13
            </Text>{' '}
            Treasury Grant program registration deadline, you will still be able to complete registration steps.
            However, if eligible, your grant will be processed at a later time. We will announce the Grant processing
            timeline for Batch 2 Treasury Grant recipients on{' '}
            <Text color="#58B5EE" as="span">
              February 24th at 14:00 UTC
            </Text>{' '}
            at{' '}
            <ExternalLink href="https://blog.kyberswap.com/kyberswap-elastic-exploit-treasury-grant-program-registration/#:~:text=For%20Affected%20Users%20who%20missed%20the%20Treasury%20Grant%20Program%20registration%20period%3A">
              the following link
            </ExternalLink>
          </Text>
        </Box>

        <Flex marginTop="1rem" padding={upToMedium ? '12px 0' : '12px 20px'} alignItems="center">
          <Flex
            flexDirection="column"
            justifyContent="space-between"
            marginRight={upToMedium ? '12px' : '24px'}
            sx={{ gap: '16px', borderRadius: '12px' }}
          >
            <Text fontSize={upToMedium ? '12px' : '14px'} fontWeight="500" color={theme.subText} lineHeight="20px">
              <Trans>TOTAL AMOUNT (USD)</Trans>
            </Text>
            <Text fontWeight="500" fontSize={upToMedium ? 16 : 20}>
              {isTotalNull ? 'N/A' : format(totalValue)}
            </Text>
          </Flex>
          <VerticalDivider style={{ height: '100%' }} />
          <Flex
            flexDirection="column"
            justifyContent="space-between"
            marginX={upToMedium ? '12px' : '24px'}
            sx={{ gap: '16px' }}
          >
            <Text fontSize="14px" color={theme.subText} lineHeight="20px">
              <Trans>Phase 1</Trans>
            </Text>
            <Text fontWeight="500" fontSize={upToMedium ? 16 : 20}>
              {format(userData?.value || 0)}
            </Text>
          </Flex>
          <VerticalDivider style={{ height: '80%' }} />
          <Flex
            flexDirection="column"
            justifyContent="space-between"
            sx={{ gap: '16px' }}
            marginX={upToMedium ? '12px' : '24px'}
          >
            <Text fontSize="14px" color={theme.subText} lineHeight="20px">
              <Trans>Phase 2</Trans>
            </Text>
            <Text fontWeight="500" fontSize={upToMedium ? 16 : 20}>
              {isNull ? 'N/A' : format(totalPhase2Value || 0)}
            </Text>
          </Flex>
        </Flex>

        <Text fontSize={14} color={theme.subText} lineHeight={1.5}>
          <Info size={12} color="#58B5EE" />
          <Text as="span" marginLeft="6px" color="#58B5EE">
            Phase 1:
          </Text>{' '}
          First Batch of Affected Users including:
          <ul>
            <li>Normal cases of Affected Users who made the January 31 Treasury Grant Program registration deadline</li>
            <li style={{ marginTop: '4px' }}>
              Category 3 Affected Users who made the January 31 Treasury Grant Program registration deadline, intending
              to claim Treasury Grants for unrecovered funds
            </li>
            <li style={{ marginTop: '4px' }}>
              Category 3 and 5 Affected Users claiming Category 3 Affected Assets which have been partially recovered,
              Category 3 Swapped Affected Assets, and Category 5 Affected Assets which have been recovered
            </li>
          </ul>
        </Text>

        <Text fontSize={14} color={theme.subText} lineHeight={1.5}>
          <Info size={12} color="#58B5EE" />
          <Text as="span" marginLeft="6px" color="#58B5EE">
            Phase 2:
          </Text>{' '}
          Second Batch of Affected Users including:
          <ul>
            <li>Third Party Affected Users of DappOS, Pendle, Magpie/Penpie and Equilibria</li>
            <li style={{ marginTop: '4px' }}>Affected Users with Multisig/AA/Safe/Other Contract Affected Addresses</li>
            <li style={{ marginTop: '4px' }}>
              Normal cases of Affected Users who missed the January 31 Treasury Grant Program registration deadline, but
              made the next March 4 deadline
            </li>
            <li>
              Category 3 Affected Users who missed the January 31 Treasury Grant Program registration deadline, but made
              the next March 4 deadline, intending to claim Treasury Grants for unrecovered funds
            </li>
          </ul>
        </Text>

        <Text marginTop="1rem" fontSize={14} color={theme.subText} lineHeight="20px">
          <Trans>
            Total Amount includes all affected funds under Category 1, 2 & 4 and unrecovered funds under Category 3 & 5
            (USD value subject to change based on Grant Terms).
          </Trans>
        </Text>
        <Text marginTop="8px" fontSize={14} color={theme.subText} lineHeight="20px">
          <Trans>
            To apply for KyberSwap Treasury Grant, complete your KYC process and select your preferred option before
            January 31, 2024 - 14 OTC
          </Trans>
        </Text>

        <Flex sx={{ gap: '20px' }} alignItems={upToMedium ? 'flex-start' : 'center'} marginTop="24px">
          <Step>
            <Trans>Step</Trans>{' '}
            <Text fontSize={20} fontWeight="500" color={theme.text}>
              1
            </Text>
          </Step>
          <Flex
            flex={1}
            alignItems={upToMedium ? 'flex-start' : 'center'}
            sx={{ gap: '20px' }}
            flexDirection={upToMedium ? 'column' : 'row'}
          >
            <Text fontSize={14} flex={1} lineHeight="20px" color={isKyc ? theme.subText : theme.text}>
              {isKyc ? (
                <Trans>Your wallet has been verified. Please select the grant option.</Trans>
              ) : (
                <Trans>Only available on Polygon, you may need to spend a small gas fee to complete your KYC</Trans>
              )}
            </Text>

            {isKyc ? (
              <ButtonLight style={{ width: 'fit-content', height: '36px', minWidth: '116px' }}>
                <Check size={18} />
                <Text marginLeft="0.25rem">
                  <Trans>Verified</Trans>
                </Text>
              </ButtonLight>
            ) : (
              <ButtonPrimary
                width="fit-content"
                style={{ minWidth: '116px', height: '36px' }}
                onClick={() => {
                  if (chainId !== ChainId.MATIC) {
                    changeNetwork(ChainId.MATIC)
                  } else {
                    setShowTermModal(true)
                  }
                }}
              >
                {chainId !== ChainId.MATIC ? (
                  <Trans>Switch to Polygon</Trans>
                ) : loadingZkme ? (
                  <Dots>Loading</Dots>
                ) : (
                  'KYC'
                )}
              </ButtonPrimary>
            )}
          </Flex>
        </Flex>

        <Flex sx={{ gap: '20px' }} alignItems={upToMedium ? 'flex-start' : 'center'} marginTop="24px">
          <Step>
            <Trans>Step</Trans>{' '}
            <Text fontSize={20} fontWeight="500" color={theme.text}>
              2
            </Text>
          </Step>
          <Flex
            flex={1}
            alignItems={upToMedium ? 'flex-start' : 'center'}
            sx={{ gap: '20px' }}
            flexDirection={upToMedium ? 'column' : 'row'}
          >
            <Text fontSize={14} flex={1} lineHeight="20px" color={userSelectedOption ? theme.subText : theme.text}>
              {userSelectedOption ? (
                <Text display="flex" sx={{ gap: '4px' }}>
                  You have selected option {userSelectedOption}.{' '}
                  {userHaveVestingData ? (
                    <Text>
                      Please go to{' '}
                      <Text
                        as="span"
                        color={theme.primary}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          searchParams.set('tab', 'vesting')
                          setSearchParams(searchParams)
                        }}
                      >
                        Vesting
                      </Text>{' '}
                      tab to claim tokens{' '}
                    </Text>
                  ) : (
                    `The UI for claiming tokens will be enabled on ${
                      totalPhase2Value ? 'March 20, 2024.' : 'February 6th, 2024.'
                    }`
                  )}
                </Text>
              ) : (
                <Trans>
                  You can{' '}
                  <Text color={theme.warning} as="span">
                    choose Grant Option once
                  </Text>
                  , please read and decide carefully
                </Trans>
              )}
            </Text>

            <ButtonPrimary
              width="fit-content"
              style={{ height: '36px', minWidth: '116px' }}
              disabled={!isKyc || !!userSelectedOption || loadingZkme || loadingUserOption}
              onClick={() => setShowOptionsModal(true)}
            >
              {loadingUserOption || loadingZkme ? (
                <Dots>Loading</Dots>
              ) : userSelectedOption ? (
                <Trans>Option {userSelectedOption}</Trans>
              ) : (
                <Trans>Choose Grant Option</Trans>
              )}
            </ButtonPrimary>
          </Flex>
        </Flex>

        {(!userSelectedOption || userSelectedOption === 'C') && (
          <>
            <Flex marginTop="24px" />
            <Divider />

            <Flex sx={{ gap: '20px' }} alignItems={upToMedium ? 'flex-start' : 'center'} marginTop="24px">
              <Step>
                <Trans>Opt Out</Trans>
              </Step>

              <Flex
                flex={1}
                alignItems={upToMedium ? 'flex-start' : 'center'}
                sx={{ gap: '20px' }}
                flexDirection={upToMedium ? 'column' : 'row'}
              >
                <Text fontSize={14} flex={1} lineHeight="20px">
                  {userSelectedOption === 'C' ? (
                    <Trans>Thank you. You have chosen to Opt Out.</Trans>
                  ) : (
                    <Trans>
                      In case you want to Opt Out (i) from KyberSwap Treasury Grant Program, proceed in actions.
                    </Trans>
                  )}
                </Text>

                <ButtonOutlined
                  width="fit-content"
                  style={{ height: '36px' }}
                  disabled={userSelectedOption === 'C'}
                  onClick={() => {
                    const message = 'I confirm choosing Option C - Opt out.'
                    library
                      ?.getSigner()
                      .signMessage(message)
                      .then(async signature => {
                        if (signature && account) {
                          const res = await createOption({
                            walletAddress: account,
                            signature,
                            message,
                          })
                          if ((res as any)?.data?.code === 0) {
                            notify({
                              title: t`Choose option successfully`,
                              summary: t`You have chosen option C for KyberSwap Elastic Exploit Treasury Grant Program`,
                              type: NotificationType.SUCCESS,
                            })
                            refetch()
                          } else {
                            notify({
                              title: t`Error`,
                              summary: (res as any).error?.data?.message || t`Something went wrong`,
                              type: NotificationType.ERROR,
                            })
                          }
                        } else {
                          notify({
                            title: t`Error`,
                            summary: t`Something went wrong`,
                            type: NotificationType.ERROR,
                          })
                        }
                      })
                  }}
                >
                  <Trans>Opt Out</Trans>
                </ButtonOutlined>
              </Flex>
            </Flex>

            <Text marginTop="1rem" color={theme.subText} fontSize={14} fontStyle="italic">
              Once you make a selection, you are{' '}
              <Text color={theme.warning} as="span">
                unable to change your choice.
              </Text>
            </Text>
          </>
        )}
      </Flex>
    </>
  )
}

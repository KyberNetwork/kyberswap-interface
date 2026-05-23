import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { type Provider, ZkMeWidget, verifyKYCWithZkMeServices } from '@zkmelabs/widget'
import { useEffect, useMemo, useState } from 'react'
import { Check, Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import {
  useCreateOptionMutation,
  useGetUserSelectedOptionQuery,
  useLazyGetAccessTokensQuery,
} from 'services/commonService'

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
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

import vesting3rdData from '../data/pendle_dappos_vesting.json'
import phase3 from '../data/phase3.json'
import vestingData from '../data/vesting.json'
import vestingOptionA from '../data/vesting/optionA.json'
import vestingOptionB from '../data/vesting/optionB.json'
import ChooseGrantModal from './ChooseGrantModal'
import TermAndPolicyModal from './TermAndPolicyModal'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })

const APP_ID = 'M2023122583510932543540072365652'

const MANUAL_KYCS = [
  '0x5119d8c206546C5361Bb6317D7508d9bd4787C16',
  '0x2130FD01026867A6c8DdE24ad5E64F2e2DFce196',
  '0x6Ef7173Ba0552f8940Dda4B5eA5AC48b17f8b8a2',
  '0x5da35491fF9d73E3F5ff0D3C6ED1eA5ab68770C0',
  '0x4526B09df42775975a543e0E984172Ab202b4Ff8',
]

const Step = ({ children }: { children: React.ReactNode }) => (
  <div className="flex size-14 flex-col items-center justify-center rounded-lg bg-background p-2 text-center text-sm leading-5 text-subText">
    {children}
  </div>
)

export default function SelectTreasuryGrant({ userHaveVestingData }: { userHaveVestingData: boolean }) {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const phase3Info = phase3.find(
    item =>
      item.receiver.toLowerCase() === account?.toLowerCase() ||
      item.oldAddress.toLowerCase() === account?.toLowerCase(),
  )
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
      <div className="flex flex-col">
        <span className="text-xl font-medium">
          <Trans>Selecting Treasury Grant Option</Trans>
        </span>

        <div className="mt-4 rounded-xl bg-blue/20 p-4">
          <span className="text-sm leading-5">
            For anyone who missed the <span className="text-blue3">March 13</span> Treasury Grant program registration
            deadline, you will still be able to complete registration steps. However, if eligible, your grant will be
            processed at a later time. We will announce the Grant processing timeline for Batch 2 Treasury Grant
            recipients on <span className="text-blue3">February 24th at 14:00 UTC</span> at{' '}
            <ExternalLink href="https://blog.kyberswap.com/kyberswap-elastic-exploit-treasury-grant-program-registration/#:~:text=For%20Affected%20Users%20who%20missed%20the%20Treasury%20Grant%20Program%20registration%20period%3A">
              the following link
            </ExternalLink>
          </span>
        </div>

        <div className={cn('mt-4 flex items-center py-3', upToMedium ? 'px-0' : 'px-5')}>
          <div className={cn('flex flex-col justify-between gap-4 rounded-xl', upToMedium ? 'mr-3' : 'mr-6')}>
            <span className={cn('font-medium leading-5 text-subText', upToMedium ? 'text-xs' : 'text-sm')}>
              <Trans>TOTAL AMOUNT (USD)</Trans>
            </span>
            <span className={cn('font-medium', upToMedium ? 'text-base' : 'text-xl')}>
              {phase3Info ? format(phase3Info.value) : isTotalNull ? 'N/A' : format(totalValue)}
            </span>
          </div>
          <VerticalDivider style={{ height: '100%' }} />
          <div className={cn('flex flex-col justify-between gap-4', upToMedium ? 'mx-3' : 'mx-6')}>
            <span className="text-sm leading-5 text-subText">
              <Trans>Phase 1</Trans>
            </span>
            <span className={cn('font-medium', upToMedium ? 'text-base' : 'text-xl')}>
              {phase3Info ? format(phase3Info.vestedAmount || 0) : format(userData?.value || 0)}
            </span>
          </div>
          <VerticalDivider style={{ height: '80%' }} />
          <div className={cn('flex flex-col justify-between gap-4', upToMedium ? 'mx-3' : 'mx-6')}>
            <span className="text-sm leading-5 text-subText">
              <Trans>Phase 2</Trans>
            </span>
            <span className={cn('font-medium', upToMedium ? 'text-base' : 'text-xl')}>
              {phase3Info ? 0 : isNull ? 'N/A' : format(totalPhase2Value || 0)}
            </span>
          </div>
          {phase3Info && (
            <>
              <VerticalDivider style={{ height: '80%' }} />
              <div className={cn('flex flex-col justify-between gap-4', upToMedium ? 'mx-3' : 'mx-6')}>
                <span className="text-sm leading-5 text-subText">
                  <Trans>Phase 3</Trans>
                </span>
                <span className={cn('font-medium', upToMedium ? 'text-base' : 'text-xl')}>
                  {format(phase3Info.value - (phase3Info.vestedAmount || 0))}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="text-sm leading-relaxed text-subText">
          <Info size={12} color={theme.blue3} />
          <span className="ml-1.5 text-blue3">Phase 1:</span> First Batch of Affected Users including:
          <ul>
            <li>Normal cases of Affected Users who made the January 31 Treasury Grant Program registration deadline</li>
            <li className="mt-1">
              Category 3 Affected Users who made the January 31 Treasury Grant Program registration deadline, intending
              to claim Treasury Grants for unrecovered funds
            </li>
            <li className="mt-1">
              Category 3 and 5 Affected Users claiming Category 3 Affected Assets which have been partially recovered,
              Category 3 Swapped Affected Assets, and Category 5 Affected Assets which have been recovered
            </li>
          </ul>
        </div>

        <div className="text-sm leading-relaxed text-subText">
          <Info size={12} color={theme.blue3} />
          <span className="ml-1.5 text-blue3">Phase 2:</span> Second Batch of Affected Users including:
          <ul>
            <li>Third Party Affected Users of DappOS, Pendle, Magpie/Penpie and Equilibria</li>
            <li className="mt-1">Affected Users with Multisig/AA/Safe/Other Contract Affected Addresses</li>
            <li className="mt-1">
              Normal cases of Affected Users who missed the January 31 Treasury Grant Program registration deadline, but
              made the next March 4 deadline
            </li>
            <li>
              Category 3 Affected Users who missed the January 31 Treasury Grant Program registration deadline, but made
              the next March 4 deadline, intending to claim Treasury Grants for unrecovered funds
            </li>
          </ul>
        </div>

        <div className="text-sm leading-relaxed text-subText">
          <Info size={12} color={theme.blue3} />
          <span className="ml-1.5 text-blue3">Phase 3:</span> The{' '}
          <b>Third Batch of Special Affected Users (total 11 wallets) including</b> who encountered specific issues
          listed below and reported them through the{' '}
          <b>Kyber Customer Support channel prior to the Phase 2 deadline.</b>
          To be eligible for Phase 3 of the KyberSwap Grant Program, users must have strictly followed specific
          processes and completed their reports before the Phase 2 deadline. This phase is exclusively available to
          those who fulfilled all requirements within the given timeframe, and <b>
            is not open for new applications
          </b>{' '}
          after the Phase 2 cutoff. Eligible cases include:
          <ul>
            <li>
              Users whose KYC verification failed due to technical issues with the ZkMe system and passed the manual KYC
              process
            </li>

            <li className="mt-1">
              Users who were unable to apply within Phase 2 due to ZkMe-related delays or errors.
            </li>
            <li className="mt-1">
              Users who experienced wallet security issues and requested to update to a new wallet for grant application
              purposes.
            </li>
          </ul>
          <div>
            All users eligible for Phase 3 have been notified of their eligibility directly through the KyberSwap
            Customer Support channel.
          </div>
        </div>

        <span className="mt-4 text-sm leading-5 text-subText">
          <Trans>
            Total Amount includes all affected funds under Category 1, 2 & 4 and unrecovered funds under Category 3 & 5
            (USD value subject to change based on Grant Terms).
          </Trans>
        </span>
        <span className="mt-2 text-sm leading-5 text-subText">
          <Trans>
            To apply for KyberSwap Treasury Grant, complete your KYC process and select your preferred option before
            January 31, 2024 - 14 OTC
          </Trans>
        </span>

        <div className={cn('mt-6 flex gap-5', upToMedium ? 'items-start' : 'items-center')}>
          <Step>
            <Trans>Step</Trans> <span className="text-xl font-medium text-text">1</span>
          </Step>
          <div className={cn('flex flex-1 gap-5', upToMedium ? 'flex-col items-start' : 'flex-row items-center')}>
            <span className={cn('flex-1 text-sm leading-5', isKyc ? 'text-subText' : 'text-text')}>
              {isKyc ? (
                <Trans>Your wallet has been verified. Please select the grant option.</Trans>
              ) : (
                <Trans>Only available on Polygon, you may need to spend a small gas fee to complete your KYC</Trans>
              )}
            </span>

            {isKyc ? (
              <ButtonLight style={{ width: 'fit-content', height: '36px', minWidth: '116px' }}>
                <Check size={18} />
                <span className="ml-1">
                  <Trans>Verified</Trans>
                </span>
              </ButtonLight>
            ) : (
              <ButtonPrimary
                width="fit-content"
                style={{ minWidth: '116px', height: '36px' }}
                disabled
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
          </div>
        </div>

        <div className={cn('mt-6 flex gap-5', upToMedium ? 'items-start' : 'items-center')}>
          <Step>
            <Trans>Step</Trans> <span className="text-xl font-medium text-text">2</span>
          </Step>
          <div className={cn('flex flex-1 gap-5', upToMedium ? 'flex-col items-start' : 'flex-row items-center')}>
            <span className={cn('flex-1 text-sm leading-5', userSelectedOption ? 'text-subText' : 'text-text')}>
              {userSelectedOption ? (
                <span className="flex gap-1">
                  You have selected option {userSelectedOption}.{' '}
                  {userHaveVestingData ? (
                    <span>
                      Please go to{' '}
                      <span
                        className="cursor-pointer text-primary"
                        onClick={() => {
                          searchParams.set('tab', 'vesting')
                          setSearchParams(searchParams)
                        }}
                      >
                        Vesting
                      </span>{' '}
                      tab to claim tokens{' '}
                    </span>
                  ) : (
                    `The UI for claiming tokens will be enabled on ${
                      totalPhase2Value ? 'March 20, 2024.' : 'February 6th, 2024.'
                    }`
                  )}
                </span>
              ) : (
                <Trans>
                  You can <span className="text-warning">choose Grant Option once</span>, please read and decide
                  carefully
                </Trans>
              )}
            </span>

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
          </div>
        </div>
        <span className="mt-2 text-sm italic text-subText">
          KyberSwap Treasury Grant Completed on 1st Feb 2025 as announced in this{' '}
          <ExternalLink href="https://x.com/kybernetwork/status/1886258729508831569">tweet</ExternalLink>. If there’s an
          update, we will announce it on our official channels.
        </span>

        {(!userSelectedOption || userSelectedOption === 'C') && (
          <>
            <div className="mt-6" />
            <Divider />

            <div className={cn('mt-6 flex gap-5', upToMedium ? 'items-start' : 'items-center')}>
              <Step>
                <Trans>Opt Out</Trans>
              </Step>

              <div className={cn('flex flex-1 gap-5', upToMedium ? 'flex-col items-start' : 'flex-row items-center')}>
                <span className="flex-1 text-sm leading-5">
                  {userSelectedOption === 'C' ? (
                    <Trans>Thank you. You have chosen to Opt Out.</Trans>
                  ) : (
                    <Trans>
                      In case you want to Opt Out (i) from KyberSwap Treasury Grant Program, proceed in actions.
                    </Trans>
                  )}
                </span>

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
              </div>
            </div>

            <span className="mt-4 text-sm italic text-subText">
              Once you make a selection, you are <span className="text-warning">unable to change your choice.</span>
            </span>
          </>
        )}
      </div>
    </>
  )
}

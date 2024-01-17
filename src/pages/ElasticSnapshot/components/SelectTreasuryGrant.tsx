import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { type Provider, ZkMeWidget, verifyKYCWithZkMeServices } from '@zkmelabs/widget'
import { useEffect, useMemo, useState } from 'react'
import { Check } from 'react-feather'
import { Flex, Text } from 'rebass'
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
import { useNotify } from 'state/application/hooks'
import { formatDisplayNumber } from 'utils/numbers'

import ChooseGrantModal from './ChooseGrantModal'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 7 })

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

export default function SelectTreasuryGrant() {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const [showOptionModal, setShowOptionsModal] = useState(false)

  const [createOption] = useCreateOptionMutation()
  const notify = useNotify()

  const [isKyc, setIsKyc] = useState(false)
  const [loadingZkme, setLoading] = useState(false)

  const { library } = useWeb3React()
  const [getAccessTokenQuery] = useLazyGetAccessTokensQuery()

  const provider: Provider | null = useMemo(
    () =>
      library && account
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
    [library, account, getAccessTokenQuery],
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

  return (
    <>
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

        <Flex
          flexDirection="column"
          padding="12px 20px"
          justifyContent="space-between"
          marginTop="1rem"
          width="180px"
          sx={{ gap: '16px', borderRadius: '12px' }}
          backgroundColor="rgba(0,0,0,0.64)"
        >
          <Text fontSize="14px" fontWeight="500" color={theme.subText} lineHeight="20px">
            <Trans>Total Amount (USD)</Trans>
          </Text>
          <Text fontWeight="500" fontSize={20}>
            {format(10000000)}
          </Text>
        </Flex>

        <Text marginTop="1rem" fontSize={14} color={theme.subText} lineHeight="20px">
          <Trans>
            Total Amount includes all affected funds under Category 1, 2 & 4 and unrecovered funds under Category 3 & 5.
          </Trans>
        </Text>
        <Text marginTop="8px" fontSize={14} color={theme.subText} lineHeight="20px">
          <Trans>
            To apply for KyberSwap Treasury Grant, complete your KYC process and select your preferred option before
            January 31, 2024 - 14 OTC
          </Trans>
        </Text>

        <Flex sx={{ gap: '20px' }} alignItems="center" marginTop="24px">
          <Step>
            <Trans>Step</Trans>{' '}
            <Text fontSize={20} fontWeight="500" color={theme.text}>
              1
            </Text>
          </Step>
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
                  zkMe?.launch()
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

        <Flex sx={{ gap: '20px' }} alignItems="center" marginTop="24px">
          <Step>
            <Trans>Step</Trans>{' '}
            <Text fontSize={20} fontWeight="500" color={theme.text}>
              2
            </Text>
          </Step>
          <Text fontSize={14} flex={1} lineHeight="20px" color={userSelectedOption ? theme.subText : theme.text}>
            {userSelectedOption ? (
              <Trans>
                You have selected option {userSelectedOption}. The UI for claiming tokens will be enabled on February
                26th, 2024.
              </Trans>
            ) : (
              <Trans>You can choose Grant Option once, please read and decide carefully</Trans>
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

        {(!userSelectedOption || userSelectedOption === 'C') && (
          <>
            <Flex marginTop="24px" />
            <Divider />
            <Flex sx={{ gap: '20px' }} alignItems="center" marginTop="24px">
              <Step>
                <Trans>Opt Out</Trans>
              </Step>
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
          </>
        )}
      </Flex>
    </>
  )
}

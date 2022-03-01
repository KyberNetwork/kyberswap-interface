import Divider from 'components/Divider'
import React, { useEffect, useState, useMemo } from 'react'
import { Flex, Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { VerticalDivider } from 'pages/About/styleds'
import { useActiveWeb3React } from 'hooks'
import { ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import FarmingPoolsToggle from 'components/Toggle/FarmingPoolsToggle'
import { ArrowRight, ChevronDown, ChevronsDown, ChevronUp } from 'react-feather'
import TokensSelect from './TokensSelect'
import Slider from 'components/Slider'
import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import { Currency } from '@dynamic-amm/sdk'
import { useNetworkModalToggle } from '../../state/application/hooks'
import NetworkModal from 'components/NetworkModal'
import ShareLinkModal from './ShareLinkModal'
import { currencyId } from 'utils/currencyId'
import { useMedia } from 'react-use'
import { useCurrencyConvertedToNative } from 'utils/dmm'
const PageWrapper = styled.div`
  width: 100%;
  padding: 28px;
  min-width: 343px;
`

const BodyWrapper = styled.div`
  max-width: 1016px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  padding: 20px;
  margin: auto;
`

const AboutDropdown = styled.div`
  padding: 10px 16px;
  border-radius: 4px;
  margin-bottom: 24px;
  background-color: ${({ theme }) => theme.green}20;
  color: ${({ theme }) => theme.text};
`

const AddressBox = styled.div`
  border-radius: 8px;
  background: ${({ theme }) => theme.buttonBlack};
  padding: 12px;
  overflow: hidden;
`

const ReferralCommissionBox = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  padding: 16px;
  border-radius: 8px;
  width: 100%;
  margin-bottom: 20px;
`
const MaxButton = styled.div`
  border-radius: 3px;
  background: ${({ theme }) => theme.green + '20'};
  background-opacity: 0.2;
  padding: 8px 5px;
  display: inline-block;
  height: fit-content;
  cursor: pointer;
`

const NetworkSelect = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
  padding: 10px 14px;
  font-weight: 500;
  font-size: 20px;
  color: ${({ theme }) => theme.text};
  text-align: left;
  flex: 1;
  position: relative;
  cursor: pointer;
  margin-bottom: 16px;
  font-size: 16px;
`

const AddressInput = styled.input`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
`

const Label = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText} !important;
  font-weight: 500;
  margin-bottom: 8px;
  display: none;
  @media only screen and (min-width: 800px) {
    display: block;
  }
`

const CommissionSlider = styled(Slider)`
  width: 100%;
  margin: 0;
  padding: 0 !important;
  &::-webkit-slider-thumb {
    background-color: ${({ theme }) => theme.subText} !important;
    margin: 1px 0;
  }
  &::-moz-range-thumb {
    background-color: ${({ theme }) => theme.subText} !important;
  }
  &::-ms-thumb {
    background-color: ${({ theme }) => theme.subText} !important;
  }
  &::-webkit-slider-runnable-track {
    background: ${({ theme }) => theme.subText};
    height: 2px;
  }

  &::-moz-range-track {
    background: ${({ theme }) => theme.subText};
    height: 2px;
  }
  &::-ms-track {
    background: ${({ theme }) => theme.subText};
  }
`
export default function CreateReferral() {
  const { account, chainId } = useActiveWeb3React()
  const theme = useTheme()
  const [isShowChain, setIsShowChain] = useState(false)
  const [isShowTokens, setIsShowTokens] = useState(false)
  const [commission, setCommission] = useState(50)
  const [currencyA, setCurrencyA] = useState<Currency | undefined>()
  const [currencyB, setCurrencyB] = useState<Currency | undefined>()
  const nativeCurrencyA = useCurrencyConvertedToNative(currencyA)
  const nativeCurrencyB = useCurrencyConvertedToNative(currencyB)
  const toggleNetworkModal = useNetworkModalToggle()
  const [isShowShareLinkModal, setIsShowShareLinkModal] = useState(false)
  const [address, setAddress] = useState('')
  const above900 = useMedia('(min-width: 900px)')

  useEffect(() => {
    account && setAddress(account)
  }, [account])
  useEffect(() => {
    setCurrencyA(undefined)
    setCurrencyB(undefined)
  }, [chainId])
  const shareUrl = useMemo(() => {
    if ((address && isShowTokens && currencyA && currencyB) || (address && !isShowTokens)) {
      return (
        window.location.origin +
        '/#/swap?' +
        `referral=${address}&fee_percent=${commission}${
          isShowTokens
            ? `&inputCurrency=${currencyId(nativeCurrencyA as Currency, chainId)}&outputCurrency=${currencyId(
                nativeCurrencyB as Currency,
                chainId
              )}`
            : ''
        }${isShowChain ? `&networkId=${chainId}` : ''}`
      )
    }
    return ''
  }, [address, commission, nativeCurrencyA, nativeCurrencyB, chainId, isShowTokens, isShowChain])

  return (
    <PageWrapper>
      <BodyWrapper>
        <Text fontSize={20} marginBottom="20px" textAlign="center" fontWeight={500}>
          <Trans>Create a Referral Link</Trans>
        </Text>
        {above900 && <Divider marginBottom="20px" />}
        <Flex justifyContent="space-around" alignItems="stretch" flexDirection={above900 ? 'row' : 'column'}>
          <Flex flexDirection="column" flex={1}>
            <AboutDropdown>
              {/* <Flex
                justifyContent="space-between"
                alignItems="center"
                onClick={() => setIsShowAbout(prev => !prev)}
                style={{ cursor: 'pointer' }}
              >
                <Text>
                  <Trans>About</Trans>
                </Text>
                {isShowAbout ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Flex> */}
              {/* {isShowAbout && (
                <>
                  <Divider margin={'10px 0'} /> */}
              <Text fontSize={12} lineHeight={'20px'}>
                <Trans>
                  You can create referral links here. If your referral link is used by anyone during a trade, you will
                  receive a small commission from their transaction. The commission will be instantly sent to your
                  wallet address. You can create multiple referral links with different configurations.
                  <br />
                  <br />
                  Read more here
                </Trans>
              </Text>
              {/* </>
              )} */}
            </AboutDropdown>

            <Text fontSize={12} color={theme.disableText} textAlign="right" marginBottom="8px" fontStyle="italic">
              <Trans>*Required</Trans>
            </Text>
            <AddressBox style={{ marginBottom: !above900 ? '24px' : '' }}>
              <Text fontSize={12} color={theme.subText} marginBottom="8px">
                <Trans>Your wallet address *</Trans>{' '}
                <InfoHelper
                  size={14}
                  text={t`Any referral commission will automatically be sent to this wallet address`}
                />
              </Text>
              <Text fontSize={20} lineHeight={'24px'} color={theme.text}>
                <AddressInput
                  type="text"
                  value={address}
                  onChange={(e: any) => {
                    setAddress(e.target.value)
                  }}
                />
              </Text>
            </AddressBox>
          </Flex>
          <VerticalDivider style={{ height: 'auto', margin: ' 0 32px' }} />
          <Flex flex={1} flexDirection="column">
            <ReferralCommissionBox>
              <Text fontSize={12} lineHeight="16px" color={theme.subText} marginBottom="10px">
                <Trans>Referral Commission</Trans> (%) *{' '}
                <InfoHelper
                  size={14}
                  text={t`Commission (%) that is applied to each successful trade that uses your referral link`}
                />
              </Text>
              <Flex justifyContent="space-between" alignItems="center">
                <Text fontSize={36} fontWeight="42px" color={theme.text}>
                  {commission / 1000} %
                </Text>
                <MaxButton onClick={() => setCommission(100)}>
                  <Text fontSize={12} color={theme.green}>
                    <Trans>Max</Trans>: 0.1%
                  </Text>
                </MaxButton>
              </Flex>
              <CommissionSlider
                value={commission}
                min={5}
                max={100}
                step={5}
                onChange={value => setCommission(value)}
                size={16}
                style={{}}
              />
            </ReferralCommissionBox>
            <Flex marginBottom="20px" justifyContent="space-between">
              <Text fontSize={16} lineHeight="20px" color={theme.text}>
                <Trans>Include Chain</Trans>
                <InfoHelper size={14} text={t`You can include the chain to swap in your referral link`} />
              </Text>
              <FarmingPoolsToggle isActive={isShowChain} toggle={() => setIsShowChain(prev => !prev)} />
            </Flex>
            {isShowChain && (
              <>
                <NetworkSelect>
                  {chainId && (
                    <>
                      <Flex alignItems="center" onClick={() => toggleNetworkModal()}>
                        <img
                          src={NETWORK_ICON[chainId]}
                          style={{ height: '20px', width: '20px', marginRight: '8px' }}
                        />
                        {NETWORK_LABEL[chainId]}
                      </Flex>
                      <ChevronDown size={20} style={{ top: '10px', right: '10px', position: 'absolute' }} />
                    </>
                  )}
                </NetworkSelect>
                <Flex marginBottom="20px" justifyContent="space-between">
                  <Text fontSize={16} lineHeight="20px" color={theme.text}>
                    <Trans>Include Tokens</Trans>
                    <InfoHelper size={14} text={t`You can include the tokens to swap in your referral link`} />
                  </Text>
                  <FarmingPoolsToggle isActive={isShowTokens} toggle={() => setIsShowTokens(prev => !prev)} />
                </Flex>
                {isShowTokens && (
                  <Flex alignItems="center" marginBottom="28px">
                    <Flex flexDirection="column" flex={1}>
                      <Label>
                        <Trans>Input Token</Trans>*
                      </Label>
                      <TokensSelect
                        currency={nativeCurrencyA}
                        onCurrencySelect={currency => setCurrencyA(currency)}
                        onRemoveSelect={() => setCurrencyA(undefined)}
                      />
                    </Flex>
                    <ArrowRight style={{ margin: '10px 14px', alignSelf: 'flex-end' }} />
                    <Flex flexDirection="column" flex={1}>
                      <Label>
                        <Trans>Output Token</Trans>*
                      </Label>
                      <TokensSelect
                        currency={nativeCurrencyB}
                        onCurrencySelect={currency => setCurrencyB(currency)}
                        onRemoveSelect={() => setCurrencyB(undefined)}
                      />
                    </Flex>
                  </Flex>
                )}
              </>
            )}
            <ButtonPrimary
              disabled={(isShowTokens && (!currencyA || !currencyB)) || !address}
              onClick={() => setIsShowShareLinkModal(true)}
            >
              <Trans>Create Your Referral Link</Trans>
            </ButtonPrimary>
          </Flex>
        </Flex>
      </BodyWrapper>
      <NetworkModal />
      <ShareLinkModal
        isOpen={isShowShareLinkModal}
        onDismiss={() => setIsShowShareLinkModal(false)}
        shareUrl={shareUrl}
      />
    </PageWrapper>
  )
}

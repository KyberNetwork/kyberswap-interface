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
import { shortenAddress } from 'utils'
import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import { ChainId, Currency } from '@dynamic-amm/sdk'
import { useNetworkModalToggle, useToggleModal } from '../../state/application/hooks'
import NetworkModal from 'components/NetworkModal'
import ShareLinkModal from './ShareLinkModal'
import { currencyId } from 'utils/currencyId'
const PageWrapper = styled.div`
  width: 100%;
  padding: 28px;
`

const BodyWrapper = styled.div`
  max-width: 808px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  padding: 20px;
  margin: auto;
`

const AboutDropdown = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 10px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
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
  padding: 8px;
  font-weight: 500;
  font-size: 20px;
  color: ${({ theme }) => theme.text};
  text-align: left;
  flex: 1;
  position: relative;
  cursor: pointer;
`

const AddressInput = styled.input`
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme }) => theme.text};
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
`
export default function CreateReferral() {
  const { account, chainId } = useActiveWeb3React()
  const theme = useTheme()
  const [isShowTokens, setIsShowTokens] = useState(true)
  const [commission, setCommission] = useState(50)
  const [currencyA, setCurrencyA] = useState<Currency | null>(null)
  const [currencyB, setCurrencyB] = useState<Currency | null>(null)
  const toggleNetworkModal = useNetworkModalToggle()
  const [isShowShareLinkModal, setIsShowShareLinkModal] = useState(false)
  const [address, setAddress] = useState('')
  const [isShowAbout, setIsShowAbout] = useState(true)
  useEffect(() => {
    account && setAddress(account)
  }, [account])
  useEffect(() => {
    setCurrencyA(null)
    setCurrencyB(null)
  }, [chainId])
  const shareUrl = useMemo(() => {
    if ((account && isShowTokens && currencyA && currencyB) || (account && !isShowTokens)) {
      // const params = `referral=${account}&fee_percent=${commission}${
      //   isShowTokens
      //     ? `&inputCurrency=${currencyId(currencyA as Currency, chainId)}&outputCurrency=${currencyId(
      //         currencyB as Currency,
      //         chainId
      //       )}`
      //     : ''
      // }&networkId=${chainId}`
      // return window.location.origin + `/#/swap?ref=` + btoa(params)

      return (
        window.location.origin +
        '/#/swap?' +
        `referral=${account}&fee_percent=${commission}${
          isShowTokens
            ? `&inputCurrency=${currencyId(currencyA as Currency, chainId)}&outputCurrency=${currencyId(
                currencyB as Currency,
                chainId
              )}`
            : ''
        }&networkId=${chainId}`
      )
    }
    return ''
  }, [commission, currencyA, currencyB, chainId, isShowTokens])

  return (
    <PageWrapper>
      <BodyWrapper>
        <Text fontSize={20} marginBottom="20px" textAlign="center" fontWeight={500}>
          <Trans>Create a Referral Link</Trans>
        </Text>
        <Divider marginBottom="20px" />
        <Flex justifyContent="space-around" alignItems="stretch">
          <Flex flexDirection="column" flex={1}>
            <AboutDropdown>
              <Flex
                justifyContent="space-between"
                alignItems="center"
                onClick={() => setIsShowAbout(prev => !prev)}
                style={{ cursor: 'pointer' }}
              >
                <Text>
                  <Trans>About</Trans>
                </Text>
                {isShowAbout ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Flex>
              {isShowAbout && (
                <>
                  <Divider margin={'10px 0'} />
                  <Text fontSize={12} lineHeight={'20px'} color={theme.subText}>
                    <Trans>
                      You can create referral links here. If your referral link is used by anyone during a trade, you
                      will receive a small commission from their transaction. The commission will be instantly sent to
                      your wallet address. You can create multiple referral links with different configurations.
                      <br />
                      <br />
                      Read more here
                    </Trans>
                  </Text>
                </>
              )}
            </AboutDropdown>

            <Text fontSize={12} color={theme.disableText} textAlign="right" marginBottom="8px" fontStyle="italic">
              *Required
            </Text>
            <AddressBox>
              <Text fontSize={12} color={theme.subText} marginBottom="8px">
                Your wallet address *{' '}
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
              <Slider
                value={commission}
                min={0}
                max={100}
                step={5}
                onChange={value => setCommission(value)}
                style={{ width: '100%', margin: 0 }}
                size={12}
              />
            </ReferralCommissionBox>
            <Flex marginBottom="28px" justifyContent="space-between">
              <Text fontSize={16} lineHeight="20px" color={theme.text}>
                Include Tokens and Chain
                <InfoHelper size={14} text={t`You can also include tokens and chain in your referral link`} />
              </Text>
              <FarmingPoolsToggle isActive={isShowTokens} toggle={() => setIsShowTokens(prev => !prev)} />
            </Flex>
            {isShowTokens && (
              <>
                <NetworkSelect style={{ marginBottom: '16px' }}>
                  {chainId && (
                    <>
                      <Flex alignItems="center" onClick={() => toggleNetworkModal()}>
                        <img
                          src={NETWORK_ICON[chainId]}
                          style={{ height: '24px', width: '24px', marginRight: '5px' }}
                        />
                        {NETWORK_LABEL[chainId]}
                      </Flex>
                      <ChevronDown style={{ top: '10px', right: '5px', position: 'absolute' }} />
                    </>
                  )}
                </NetworkSelect>
                <Flex alignItems="center" marginBottom="28px">
                  <TokensSelect currency={currencyA} onCurrencySelect={currency => setCurrencyA(currency)} />
                  <ArrowRight style={{ margin: '0 18px' }} />
                  <TokensSelect currency={currencyB} onCurrencySelect={currency => setCurrencyB(currency)} />
                </Flex>
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

import { MaxUint256 } from '@ethersproject/constants'
import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import React, { useEffect, useState } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import Input from 'components/NumericalInput'
import { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen } from 'state/application/hooks'

const Wrapper = styled.div`
  padding: 20px;
  width: 100%;
`

const OptionWrapper = styled.div<{ active?: boolean }>`
  padding: 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  transition: all 0.1s ease;

  ${({ active, theme }) =>
    active
      ? css`
          color: ${theme.text};
          border-color: ${theme.primary};
          background-color: ${theme.primary + '30'};
          box-shadow: 0 2px 4px 0 ${theme.buttonBlack};
          transform: translateY(-2px);
          filter: brightness(1.2);
          svg {
            color: ${theme.primary};
          }
        `
      : css`
          :hover {
            filter: brightness(1.3);
          }
        `};
`

const CloseButton = styled.div`
  svg {
    display: block;
  }
  :hover {
    filter: brightness(0.8);
  }
`

const InputWrapper = styled.div`
  padding: 10px 12px;
  font-size: 12px;
  line-height: 16px;
  height: 36px;
  display: flex;
  align-items: center;
  border-radius: 22px;
  background-color: ${({ theme }) => theme.buttonBlack};
  gap: 4px;
`

enum ApproveOptions {
  Infinite,
  Custom,
  Permit,
}

const ApprovalModal = ({
  typedValue,
  currencyInput,
  onApprove,
  onPermit,
}: {
  typedValue?: string
  currencyInput?: Currency
  onApprove?: (amount: BigNumber) => void
  onPermit?: () => void
}) => {
  const theme = useTheme()
  const [option, setOption] = useState<ApproveOptions>(ApproveOptions.Infinite)
  const [customValue, setCustomValue] = useState(typedValue || '1')

  const isOpen = useModalOpen(ApplicationModal.SWAP_APPROVAL)
  const closeModal = useCloseModal(ApplicationModal.SWAP_APPROVAL)

  useEffect(() => {
    setCustomValue(typedValue || '1')
  }, [typedValue])

  const handleInputChange = (e: string) => {
    setCustomValue(e)
  }
  const isValid = option === ApproveOptions.Infinite || (typedValue && typedValue <= customValue)

  const handleApprove = () => {
    if (isValid) {
      onApprove?.(option === ApproveOptions.Infinite ? MaxUint256 : parseUnits(customValue, currencyInput?.decimals))
      closeModal()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    //Tab key pressed
    if (e.key === 'Tab') {
      e.stopPropagation()
      e.preventDefault()
      setOption(prev => (prev === ApproveOptions.Infinite ? ApproveOptions.Custom : ApproveOptions.Infinite))
    }
  }
  return (
    <Modal isOpen={isOpen} onDismiss={closeModal}>
      <Wrapper onKeyDown={handleKeyDown}>
        <RowBetween marginBottom="16px">
          <Text fontSize="20px" lineHeight="24px">
            Approve
          </Text>
          <CloseButton onClick={closeModal}>
            <X style={{ cursor: 'pointer' }} />
          </CloseButton>
        </RowBetween>

        <Column gap="12px" style={{ marginBottom: '20px' }}>
          <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
            <Trans>
              Choose between Infinite or Custom allowance.{' '}
              <a
                href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/user-guides/instantly-swap-at-the-best-rates#step-4-approve-contract-to-swap-tokens"
                target="_blank"
                rel="noreferrer"
              >
                Read more ↗
              </a>
            </Trans>
          </Text>
          <OptionWrapper active={option === ApproveOptions.Infinite} onClick={() => setOption(ApproveOptions.Infinite)}>
            <RowFit flex="0 0 48px">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M22.9718 21.0283C22.9718 21.0283 20.2859 18.3407 17.6001 15.6567C14.1003 12.155 8.42244 12.155 4.92261 15.6567L4.91711 15.6603C1.41728 19.162 1.41728 24.838 4.91711 28.3397L4.92261 28.3433C8.42244 31.845 14.1003 31.845 17.6001 28.3433C18.1776 27.7658 18.7551 27.1902 19.3051 26.6383C19.8423 26.103 19.8423 25.2303 19.3051 24.695C18.7698 24.1578 17.8971 24.1578 17.3618 24.695C16.8099 25.245 16.2343 25.8225 15.6568 26.4C13.2294 28.8273 9.29328 28.8273 6.86594 26.4L6.86228 26.3945C4.43494 23.9672 4.43494 20.0328 6.86228 17.6055L6.86594 17.6C9.29328 15.1727 13.2294 15.1727 15.6568 17.6C18.3408 20.2858 21.0284 22.9717 21.0284 22.9717C21.5638 23.5088 22.4364 23.5088 22.9718 22.9717C23.5089 22.4363 23.5089 21.5637 22.9718 21.0283Z"
                  fill="currentcolor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M26.6384 19.305C27.1902 18.755 27.7659 18.1775 28.3434 17.6C30.7707 15.1727 34.7069 15.1727 37.1342 17.6C37.1342 17.6018 37.136 17.6037 37.1379 17.6055C39.5652 20.0328 39.5652 23.9672 37.1379 26.3945C37.136 26.3963 37.1342 26.3982 37.1342 26.4C34.7069 28.8273 30.7707 28.8273 28.3434 26.4C25.6594 23.7142 22.9717 21.0283 22.9717 21.0283C22.4364 20.4912 21.5637 20.4912 21.0284 21.0283C20.4912 21.5637 20.4912 22.4363 21.0284 22.9717C21.0284 22.9717 23.7142 25.6593 26.4 28.3433C29.8999 31.845 35.5777 31.845 39.0775 28.3433C39.0794 28.3415 39.0812 28.3415 39.083 28.3397C42.5829 24.838 42.5829 19.162 39.083 15.6603C39.0812 15.6585 39.0794 15.6585 39.0775 15.6567C35.5777 12.155 29.8999 12.155 26.4 15.6567C25.8225 16.2342 25.245 16.8098 24.695 17.3617C24.1579 17.897 24.1579 18.7697 24.695 19.305C25.2304 19.8422 26.103 19.8422 26.6384 19.305Z"
                  fill="currentcolor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M22.9718 21.0283C22.9718 21.0283 20.2859 18.3407 17.6001 15.6567C14.1003 12.155 8.42244 12.155 4.92261 15.6567L4.91711 15.6603C1.41728 19.162 1.41728 24.838 4.91711 28.3397L4.92261 28.3433C8.42244 31.845 14.1003 31.845 17.6001 28.3433C18.1776 27.7658 18.7551 27.1902 19.3051 26.6383C19.8423 26.103 19.8423 25.2303 19.3051 24.695C18.7698 24.1578 17.8971 24.1578 17.3618 24.695C16.8099 25.245 16.2343 25.8225 15.6568 26.4C13.2294 28.8273 9.29328 28.8273 6.86594 26.4L6.86228 26.3945C4.43494 23.9672 4.43494 20.0328 6.86228 17.6055L6.86594 17.6C9.29328 15.1727 13.2294 15.1727 15.6568 17.6C18.3408 20.2858 21.0284 22.9717 21.0284 22.9717C21.5638 23.5088 22.4364 23.5088 22.9718 22.9717C23.5089 22.4363 23.5089 21.5637 22.9718 21.0283Z"
                  fill="currentcolor"
                  filter="blur(2px)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M26.6384 19.305C27.1902 18.755 27.7659 18.1775 28.3434 17.6C30.7707 15.1727 34.7069 15.1727 37.1342 17.6C37.1342 17.6018 37.136 17.6037 37.1379 17.6055C39.5652 20.0328 39.5652 23.9672 37.1379 26.3945C37.136 26.3963 37.1342 26.3982 37.1342 26.4C34.7069 28.8273 30.7707 28.8273 28.3434 26.4C25.6594 23.7142 22.9717 21.0283 22.9717 21.0283C22.4364 20.4912 21.5637 20.4912 21.0284 21.0283C20.4912 21.5637 20.4912 22.4363 21.0284 22.9717C21.0284 22.9717 23.7142 25.6593 26.4 28.3433C29.8999 31.845 35.5777 31.845 39.0775 28.3433C39.0794 28.3415 39.0812 28.3415 39.083 28.3397C42.5829 24.838 42.5829 19.162 39.083 15.6603C39.0812 15.6585 39.0794 15.6585 39.0775 15.6567C35.5777 12.155 29.8999 12.155 26.4 15.6567C25.8225 16.2342 25.245 16.8098 24.695 17.3617C24.1579 17.897 24.1579 18.7697 24.695 19.305C25.2304 19.8422 26.103 19.8422 26.6384 19.305Z"
                  fill="currentcolor"
                  filter="blur(2px)"
                />
              </svg>
            </RowFit>
            <MouseoverTooltip
              text={t`You wish to give KyberSwap permission to use the selected token for transactions without any limit. You do not need to give permission again unless you have revoked it. This approve transaction will cost a gas fee`}
              placement="right"
            >
              <Text
                fontSize="16px"
                lineHeight="20px"
                fontWeight={500}
                style={{ textDecoration: 'underline 1px dotted', textUnderlineOffset: '4px' }}
              >
                <Trans>Infinite Allowance</Trans>
              </Text>
            </MouseoverTooltip>
          </OptionWrapper>

          <OptionWrapper active={option === ApproveOptions.Custom} onClick={() => setOption(ApproveOptions.Custom)}>
            <RowFit flex="0 0 48px">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_398_6043)">
                  <path
                    d="M5.5 31.6249V38.4999H12.375L32.6517 18.2233L25.7767 11.3483L5.5 31.6249ZM37.9683 12.9066C38.6833 12.1916 38.6833 11.0366 37.9683 10.3216L33.6783 6.03161C32.9633 5.31661 31.8083 5.31661 31.0933 6.03161L27.7383 9.38661L34.6133 16.2616L37.9683 12.9066Z"
                    fill="currentcolor"
                  />
                </g>
                <g clipPath="url(#clip1_398_6043)" filter="blur(2px)">
                  <path
                    d="M5.5 31.6249V38.4999H12.375L32.6517 18.2233L25.7767 11.3483L5.5 31.6249ZM37.9683 12.9066C38.6833 12.1916 38.6833 11.0366 37.9683 10.3216L33.6783 6.03161C32.9633 5.31661 31.8083 5.31661 31.0933 6.03161L27.7383 9.38661L34.6133 16.2616L37.9683 12.9066Z"
                    fill="currentcolor"
                  />
                </g>
              </svg>
            </RowFit>

            <Column gap="8px" flex="0 1 200px">
              <MouseoverTooltip
                text={t`You wish to give KyberSwap permission to use up to the selected custom token
                amount for transactions. Subsequent transactions exceeding this amount will require your permission again. This will cost gas fees`}
                placement="right"
              >
                <Text
                  fontSize="16px"
                  lineHeight="20px"
                  fontWeight={500}
                  style={{
                    textDecoration: 'underline 1px dotted',
                    textUnderlineOffset: '4px',
                    alignSelf: 'flex-start',
                  }}
                >
                  <Trans>Custom Allowance</Trans>
                </Text>
              </MouseoverTooltip>
              <InputWrapper>
                <Input value={customValue} onUserInput={handleInputChange} style={{ fontSize: '14px' }} />
                <CurrencyLogo currency={currencyInput} size="16px" />
                <Text color={theme.subText} fontSize="14px">
                  {currencyInput?.symbol}
                </Text>
              </InputWrapper>
            </Column>
          </OptionWrapper>
        </Column>
        <ButtonPrimary onClick={handleApprove} disabled={!isValid}>
          <Trans>Approve</Trans>
        </ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}

export default React.memo(ApprovalModal)

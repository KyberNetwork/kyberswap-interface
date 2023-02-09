import { MaxUint256 } from '@ethersproject/constants'
import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
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
import { RowBetween, RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen } from 'state/application/hooks'

const Wrapper = styled.div`
  padding: 20px;
  width: 100%;
`

const OptionWrapper = styled.div<{ active?: boolean }>`
  padding: 12px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  display: flex;
  gap: 12px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  transition: all 0.1s ease;

  ${({ active, theme }) =>
    active
      ? css`
          color: ${theme.primary};
          border-color: ${theme.primary};
          background-color: ${theme.primary + '30'};
          box-shadow: 0 2px 4px 0 ${theme.buttonBlack};
          transform: translateY(-2px);
          filter: brightness(1.2);
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
  display: flex;
  align-items: center;
  border-radius: 22px;
  background-color: ${({ theme }) => theme.buttonBlack};
  gap: 4px;
`
const Input = styled.input`
  color: ${({ theme }) => theme.subText};
  background: none;
  border: none;
  outline: none;
  flex: 1 1 auto;
`

enum ApproveOptions {
  Infinite,
  Custom,
}

const ApprovalModal = ({
  typedValue,
  currencyInput,
  onApprove,
}: {
  typedValue?: string
  currencyInput?: Currency
  onApprove?: (amount: BigNumber) => void
}) => {
  const theme = useTheme()
  const isOpen = useModalOpen(ApplicationModal.SWAP_APPROVAL)
  const closeModal = useCloseModal(ApplicationModal.SWAP_APPROVAL)
  const [option, setOption] = useState<ApproveOptions>(ApproveOptions.Infinite)
  const [customValue, setCustomValue] = useState(typedValue || '0')

  useEffect(() => {
    setCustomValue(typedValue || '0')
  }, [typedValue])

  return (
    <Modal isOpen={isOpen} onDismiss={closeModal}>
      <Wrapper>
        <RowBetween marginBottom="16px">
          <Text fontSize="20px" lineHeight="24px">
            Approve
          </Text>
          <CloseButton onClick={closeModal}>
            <X style={{ cursor: 'pointer' }} />
          </CloseButton>
        </RowBetween>

        <Column gap="12px" style={{ marginBottom: '20px' }}>
          <Text fontSize="14px" lineHeight="20px" color={theme.subText}>
            <Trans>Choose between Infinite allowance or Exact allowance</Trans>
          </Text>
          <OptionWrapper active={option === ApproveOptions.Infinite} onClick={() => setOption(ApproveOptions.Infinite)}>
            <RowFit flex="0 0 48px">
              <svg width="48" height="44" viewBox="0 0 48 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24.9718 21.0283C24.9718 21.0283 22.2859 18.3407 19.6001 15.6567C16.1003 12.155 10.4224 12.155 6.92261 15.6567L6.91711 15.6603C3.41728 19.162 3.41728 24.838 6.91711 28.3397L6.92261 28.3433C10.4224 31.845 16.1003 31.845 19.6001 28.3433C20.1776 27.7658 20.7551 27.1902 21.3051 26.6383C21.8423 26.103 21.8423 25.2303 21.3051 24.695C20.7698 24.1578 19.8971 24.1578 19.3618 24.695C18.8099 25.245 18.2343 25.8225 17.6568 26.4C15.2294 28.8273 11.2933 28.8273 8.86594 26.4L8.86228 26.3945C6.43494 23.9672 6.43494 20.0328 8.86228 17.6055L8.86594 17.6C11.2933 15.1727 15.2294 15.1727 17.6568 17.6C20.3408 20.2858 23.0284 22.9717 23.0284 22.9717C23.5638 23.5088 24.4364 23.5088 24.9718 22.9717C25.5089 22.4363 25.5089 21.5637 24.9718 21.0283Z"
                  fill="#31CB9E"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M28.6384 19.305C29.1902 18.755 29.7659 18.1775 30.3434 17.6C32.7707 15.1727 36.7069 15.1727 39.1342 17.6C39.1342 17.6018 39.136 17.6037 39.1379 17.6055C41.5652 20.0328 41.5652 23.9672 39.1379 26.3945C39.136 26.3963 39.1342 26.3982 39.1342 26.4C36.7069 28.8273 32.7707 28.8273 30.3434 26.4C27.6594 23.7142 24.9717 21.0283 24.9717 21.0283C24.4364 20.4912 23.5637 20.4912 23.0284 21.0283C22.4912 21.5637 22.4912 22.4363 23.0284 22.9717C23.0284 22.9717 25.7142 25.6593 28.4 28.3433C31.8999 31.845 37.5777 31.845 41.0775 28.3433C41.0794 28.3415 41.0812 28.3415 41.083 28.3397C44.5829 24.838 44.5829 19.162 41.083 15.6603C41.0812 15.6585 41.0794 15.6585 41.0775 15.6567C37.5777 12.155 31.8999 12.155 28.4 15.6567C27.8225 16.2342 27.245 16.8098 26.695 17.3617C26.1579 17.897 26.1579 18.7697 26.695 19.305C27.2304 19.8422 28.103 19.8422 28.6384 19.305Z"
                  fill="#31CB9E"
                />
                <g filter="url(#filter0_f_18_3659)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M24.9718 21.0283C24.9718 21.0283 22.2859 18.3407 19.6001 15.6567C16.1003 12.155 10.4224 12.155 6.92261 15.6567L6.91711 15.6603C3.41728 19.162 3.41728 24.838 6.91711 28.3397L6.92261 28.3433C10.4224 31.845 16.1003 31.845 19.6001 28.3433C20.1776 27.7658 20.7551 27.1902 21.3051 26.6383C21.8423 26.103 21.8423 25.2303 21.3051 24.695C20.7698 24.1578 19.8971 24.1578 19.3618 24.695C18.8099 25.245 18.2343 25.8225 17.6568 26.4C15.2294 28.8273 11.2933 28.8273 8.86594 26.4L8.86228 26.3945C6.43494 23.9672 6.43494 20.0328 8.86228 17.6055L8.86594 17.6C11.2933 15.1727 15.2294 15.1727 17.6568 17.6C20.3408 20.2858 23.0284 22.9717 23.0284 22.9717C23.5638 23.5088 24.4364 23.5088 24.9718 22.9717C25.5089 22.4363 25.5089 21.5637 24.9718 21.0283Z"
                    fill="#31CB9E"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M28.6384 19.305C29.1902 18.755 29.7659 18.1775 30.3434 17.6C32.7707 15.1727 36.7069 15.1727 39.1342 17.6C39.1342 17.6018 39.136 17.6037 39.1379 17.6055C41.5652 20.0328 41.5652 23.9672 39.1379 26.3945C39.136 26.3963 39.1342 26.3982 39.1342 26.4C36.7069 28.8273 32.7707 28.8273 30.3434 26.4C27.6594 23.7142 24.9717 21.0283 24.9717 21.0283C24.4364 20.4912 23.5637 20.4912 23.0284 21.0283C22.4912 21.5637 22.4912 22.4363 23.0284 22.9717C23.0284 22.9717 25.7142 25.6593 28.4 28.3433C31.8999 31.845 37.5777 31.845 41.0775 28.3433C41.0794 28.3415 41.0812 28.3415 41.083 28.3397C44.5829 24.838 44.5829 19.162 41.083 15.6603C41.0812 15.6585 41.0794 15.6585 41.0775 15.6567C37.5777 12.155 31.8999 12.155 28.4 15.6567C27.8225 16.2342 27.245 16.8098 26.695 17.3617C26.1579 17.897 26.1579 18.7697 26.695 19.305C27.2304 19.8422 28.103 19.8422 28.6384 19.305Z"
                    fill="#31CB9E"
                  />
                </g>
                <defs>
                  <filter
                    id="filter0_f_18_3659"
                    x="-2"
                    y="-4"
                    width="52"
                    height="52"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur_18_3659" />
                  </filter>
                </defs>
              </svg>
            </RowFit>

            <Column>
              <Text fontSize="16px" lineHeight="20px" fontWeight={500}>
                <Trans>Infinite Allowance</Trans>
              </Text>
              <Text fontSize="12px" lineHeight="16px">
                <Trans>
                  You wish to give KyberSwap permission to use the selected token for transactions without any limit.
                  You do not need to give permission again unless revoke. This approve transaction will cost gas fee
                </Trans>
              </Text>
            </Column>
          </OptionWrapper>
          <OptionWrapper active={option === ApproveOptions.Custom} onClick={() => setOption(ApproveOptions.Custom)}>
            <RowFit flex="0 0 48px">
              <svg width="48" height="44" viewBox="0 0 50 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_21_3328)" filter="url(#filter0_f_21_3328)">
                  <path
                    d="M30.4999 7.33333C22.3966 7.33333 15.8333 13.8967 15.8333 22C15.8333 30.1033 22.3966 36.6667 30.4999 36.6667C38.6033 36.6667 45.1666 30.1033 45.1666 22C45.1666 13.8967 38.6033 7.33333 30.4999 7.33333ZM30.4999 33C24.4316 33 19.4999 28.0683 19.4999 22C19.4999 15.9317 24.4316 11 30.4999 11C36.5683 11 41.4999 15.9317 41.4999 22C41.4999 28.0683 36.5683 33 30.4999 33ZM8.49992 22C8.49992 17.6183 11.0666 13.8233 14.7883 12.0633C15.4116 11.77 15.8333 11.2017 15.8333 10.5233V10.175C15.8333 8.92833 14.5316 8.14 13.4133 8.67167C8.35325 10.9817 4.83325 16.0783 4.83325 22C4.83325 27.9217 8.35325 33.0183 13.4133 35.3283C14.5316 35.8417 15.8333 35.0717 15.8333 33.825V33.495C15.8333 32.8167 15.4116 32.23 14.7883 31.9367C11.0666 30.1767 8.49992 26.3817 8.49992 22Z"
                    fill="currentColor"
                  />
                </g>
                <defs>
                  <filter
                    id="filter0_f_21_3328"
                    x="-1"
                    y="-4"
                    width="52"
                    height="52"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur_21_3328" />
                  </filter>
                  <clipPath id="clip0_21_3328">
                    <rect width="44" height="44" fill="white" transform="translate(3)" />
                  </clipPath>
                </defs>
              </svg>
            </RowFit>

            <Column gap="8px">
              <Text fontSize="16px" lineHeight="20px" fontWeight={500}>
                <Trans>Custom Allowance</Trans>
              </Text>
              <InputWrapper>
                <Input
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  value={customValue}
                  onChange={(e: any) => setCustomValue(e.target.value)}
                  tabIndex={-1}
                />
                <CurrencyLogo currency={currencyInput} size="16px" />
                <Text color={theme.subText} fontSize="14px">
                  {currencyInput?.symbol}
                </Text>
              </InputWrapper>
              <Text fontSize="12px" lineHeight="16px">
                <Trans>
                  You wish to give KyberSwap permission to use the selected custom allowance token amount for
                  transactions. Subsequent transactions amount exceeding more than will require your permission again.
                  This approve transaction will cost gas fee
                </Trans>
              </Text>
            </Column>
          </OptionWrapper>
        </Column>
        <ButtonPrimary
          onClick={() => {
            onApprove?.(
              option === ApproveOptions.Infinite ? MaxUint256 : parseUnits(customValue, currencyInput?.decimals),
            )
            closeModal()
          }}
        >
          <Trans>Approve</Trans>
        </ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}

export default React.memo(ApprovalModal)

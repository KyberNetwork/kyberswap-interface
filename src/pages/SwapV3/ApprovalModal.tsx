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
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen } from 'state/application/hooks'

import CustomAllowanceIcon from './Components/CustomAllowanceIcon'
import InfiniteAllowanceIcon from './Components/InfiniteAllowanceIcon'

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
  const { mixpanelHandler } = useMixpanel()
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
      mixpanelHandler(
        option === ApproveOptions.Infinite ? MIXPANEL_TYPE.INFINITE_APPROVE_CLICK : MIXPANEL_TYPE.CUSTOM_APPROVE_CLICK,
      )
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
            <Trans>Approve</Trans>
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
              <InfiniteAllowanceIcon />
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
              <CustomAllowanceIcon />
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

import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween, RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { useGetParticipantKyberAIInfo } from 'state/user/hooks'

import { ParticipantStatus } from '../types'

const Wrapper = styled.div`
  width: min(95vw, 480px);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  gap: 20px;
  flex-direction: column;
  b {
    color: ${({ theme }) => theme.text};
  }
`

const WidgetWrapper = styled.div<{ show?: boolean }>`
  position: fixed;
  right: 0;
  top: 310px;
  transition: filter 0.1s ease-out, right 1s ease-out, visibility 1s;
  z-index: 20;
  transform-origin: 100% 100%;
  transform: rotate(-90deg);
  border-radius: 8px 8px 0px 0px;
  background: ${({ theme }) => theme.primary + '32'};
  padding: 4px 8px;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  ${({ show }) =>
    !show &&
    css`
      right: -25px;
      visibility: hidden;
    `};

  :hover {
    filter: brightness(1.2);
  }
`

const XWrapper = styled.span`
  padding: 2px;
  border-radius: 50%;
  transition: all 0.1s;
  svg {
    display: block;
  }
  :hover {
    background-color: ${({ theme }) => theme.primary + '36'};
  }
`

const LOCALSTORAGE_MODAL_SHOWED = 'showedKyberAIFeedbackSurvey'
const LOCALSTORAGE_WIDGET_SHOWED = 'showedKyberAIFeedbackSurveyWidget'

export default function FeedbackSurvey() {
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenWidget, setIsOpenWidget] = useState(false)
  const theme = useTheme()
  const { updatedAt, status } = useGetParticipantKyberAIInfo()

  const isValid = useMemo(() => updatedAt < 1689768000 && status === ParticipantStatus.WHITELISTED, [updatedAt, status])

  useEffect(() => {
    if (!isValid) return
    if (!localStorage.getItem(LOCALSTORAGE_MODAL_SHOWED)) {
      setIsOpen(true)
      localStorage.setItem(LOCALSTORAGE_MODAL_SHOWED, '1')
    }
    if (!localStorage.getItem(LOCALSTORAGE_WIDGET_SHOWED)) {
      setIsOpenWidget(true)
    }
  }, [isValid])

  if (!isValid) return null

  return (
    <>
      <Modal isOpen={isOpen} maxWidth="fit-content">
        <Wrapper>
          <RowBetween>
            <Text fontSize="20px" lineHeight="24px">
              <Trans>KyberAI Feedback Survey</Trans>
            </Text>
            <div onClick={() => setIsOpen(false)} style={{ cursor: 'pointer' }}>
              <X />
            </div>
          </RowBetween>
          <Text fontSize="14px" lineHeight="20px" fontWeight={400} color={theme.subText}>
            <Trans>
              Hey KyberAI Beta Users, <br />
              <br />
              <b>Your feedback is vital to us!</b> Help shape the future of KyberAI by completing our short Beta
              Feedback Survey{' '}
              <a
                target="_blank"
                href="https://docs.google.com/forms/d/e/1FAIpQLSebHPpIP0mqtMb57v3N3rmUCzo87ur86ruTF5QchJiJ2sRmfw/viewform?pli=1"
                rel="noreferrer"
              >
                here
              </a>
              . Your input will help us meet your trading needs better! <br />
              <br />
              As a token of appreciation, we will distribute a total of <b>400 KNC</b> among the top 20 feedback
              respondents
            </Trans>
          </Text>
          <RowBetween gap="20px">
            <ButtonOutlined onClick={() => setIsOpen(false)}>
              <Trans>Mabe later</Trans>
            </ButtonOutlined>
            <ButtonPrimary
              onClick={() =>
                window.open(
                  'https://docs.google.com/forms/d/e/1FAIpQLSebHPpIP0mqtMb57v3N3rmUCzo87ur86ruTF5QchJiJ2sRmfw/viewform?pli=1',
                  '_blank',
                )
              }
            >
              <Trans>Fill survey</Trans>
            </ButtonPrimary>
          </RowBetween>
        </Wrapper>
      </Modal>
      <WidgetWrapper
        show={isOpenWidget}
        onClick={() => {
          window.open(
            'https://docs.google.com/forms/d/e/1FAIpQLSebHPpIP0mqtMb57v3N3rmUCzo87ur86ruTF5QchJiJ2sRmfw/viewform?pli=1',
            '_blank',
          )
          localStorage.setItem(LOCALSTORAGE_WIDGET_SHOWED, '1')
        }}
      >
        <RowFit gap="4px">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <g clipPath="url(#clip0_7500_352677)">
              <path
                d="M4.66675 2.66669L4.66675 9.33335L6.00008 9.33335L6.00008 2.66669L14.0001 2.66669L14.0001 13.3334L6.00008 13.3334L6.00008 12L8.66675 12L8.66675 10.6667L3.33341 10.6667L3.33341 6.66669L0.666748 6.66669L0.666748 12L4.66675 12L4.66675 13.3334C4.66675 14.0667 5.26675 14.6667 6.00008 14.6667L14.0001 14.6667C14.7334 14.6667 15.3334 14.0667 15.3334 13.3334L15.3334 2.66669C15.3334 1.93335 14.7334 1.33335 14.0001 1.33335L6.00008 1.33335C5.26675 1.33335 4.66675 1.93335 4.66675 2.66669Z"
                fill="#31CB9E"
              />
            </g>
            <defs>
              <clipPath id="clip0_7500_352677">
                <rect width="16" height="16" fill="white" transform="translate(0 16) rotate(-90)" />
              </clipPath>
            </defs>
          </svg>
          <Text fontSize="12px" lineHeight="16px">
            <Trans>Feedback</Trans>
          </Text>
          <XWrapper
            onClick={e => {
              e.stopPropagation()
              setIsOpenWidget(false)
            }}
          >
            <X size={14} />
          </XWrapper>
        </RowFit>
      </WidgetWrapper>
    </>
  )
}

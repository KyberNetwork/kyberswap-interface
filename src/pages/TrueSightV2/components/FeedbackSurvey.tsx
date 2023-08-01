import { Trans } from '@lingui/macro'
import { useLocalStorage } from '@solana/wallet-adapter-react'
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

const LOCALSTORAGE_MODAL_SHOWED = 'showedKyberAIFeedbackSurvey_2'
const LOCALSTORAGE_WIDGET_SHOWED = 'showedKyberAIFeedbackSurveyWidget_2'
const MOMENT_THIS_SURVEY_RELEASE = 1689768000
const END_DATE = 1691020800000 // Aug 3

export default function FeedbackSurvey() {
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenWidget, setIsOpenWidget] = useState(false)
  const theme = useTheme()
  const { updatedAt, status } = useGetParticipantKyberAIInfo()
  const [isShowModalLS, setIsShowModalLS] = useLocalStorage<string | undefined>(LOCALSTORAGE_MODAL_SHOWED, undefined)
  const [isShowWidgetLS, setIsShowWidgetLS] = useLocalStorage<string | undefined>(LOCALSTORAGE_WIDGET_SHOWED, undefined)

  const isValid = useMemo(
    () => updatedAt < MOMENT_THIS_SURVEY_RELEASE && status === ParticipantStatus.WHITELISTED && Date.now() < END_DATE,
    [updatedAt, status],
  )

  useEffect(() => {
    if (!isValid) return
    if (!isShowModalLS) {
      setIsOpen(true)
      setIsShowModalLS('1')
    }
    if (!isShowWidgetLS) {
      setIsOpenWidget(true)
    }
  }, [isValid, isShowModalLS, isShowWidgetLS, setIsShowModalLS])

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
              <Trans>Maybe later</Trans>
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
        }}
      >
        <RowFit gap="4px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 7H10V9H20V21H4V9H6V13H8V5H14V1H6V7H4C2.9 7 2 7.9 2 9V21C2 22.1 2.9 23 4 23H20C21.1 23 22 22.1 22 21V9C22 7.9 21.1 7 20 7Z"
              fill="currentcolor"
            />
          </svg>

          <Text fontSize="12px" lineHeight="16px">
            <Trans>Feedback</Trans>
          </Text>
          <XWrapper
            onClick={e => {
              e.stopPropagation()
              setIsOpenWidget(false)
              setIsShowWidgetLS('1')
            }}
          >
            <X size={14} />
          </XWrapper>
        </RowFit>
      </WidgetWrapper>
    </>
  )
}

import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Mail, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import Checkbox from 'components/CheckBox'
import { Telegram } from 'components/Icons'
import MailIcon from 'components/Icons/MailIcon'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import Select from 'components/Select'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification, { Topic } from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import {
  NotificationType,
  useModalOpen,
  useNotificationModalToggle,
  useNotify,
  useWalletModalToggle,
} from 'state/application/hooks'
import { pushUnique } from 'utils'

const Wrapper = styled.div`
  margin: 0;
  padding: 30px 24px;
  width: 100%;
`

const ContentWrapper = styled.div`
  display: flex;
  gap: 15px;
  flex-direction: column;
`

const ActionWrapper = styled.div`
  display: flex;
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 14px;
  `}
`

const CloseIcon = styled(X)`
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
`

const Label = styled.p`
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
`

const InputWrapper = styled.div`
  position: relative;
`
// todo danh
// const CheckIcon = styled(Check)`
//   position: absolute;
//   right: 13px;
//   top: 0;
//   bottom: 0;
//   margin: auto;
// `
const Input = styled.input<{ error: string }>`
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: none;
  outline: none;
  border-radius: 20px;
  width: 100%;
  padding: 12px 14px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  background-color: ${({ theme }) => theme.buttonBlack};
  transition: border 0.5s;
  border: ${({ theme, error }) => `1px solid ${error ? theme.red : theme.border}`};
  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 12px;
  }
`
// dấu tick / x trên input

const ButtonTextt = styled.div`
  font-size: 16px;
  font-weight: 500;
`

const TopicItem = styled(Row)`
  padding: 14px;
  gap: 14px;
  font-weight: 500;
  align-items: flex-start;
`
const TopicItemHeader = styled(TopicItem)`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 8px 8px 0px 0px;
  padding-top: 16px;
  padding-bottom: 16px;
`

const Option = styled(Row)<{ active: boolean }>`
  padding: 10px 16px;
  gap: 10px;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  :hover {
    color: ${({ theme }) => theme.primary};
    background: ${({ theme }) => rgba(theme.subText, 0.1)};
  }
`

enum TAB {
  EMAIL,
  TELEGRAM,
}

export default function NotificationModal() {
  const toggleModal = useNotificationModalToggle()
  const isOpen = useModalOpen(ApplicationModal.NOTIFICATION_SUBSCRIPTION)
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { isLoading, handleSubscribe, topicGroups, userInfo } = useNotification()
  const [inputAccount, setAccount] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TAB>(TAB.EMAIL)
  const [selectedTopic, setSelectedTopic] = useState<number[]>([])
  const isEmailTab = activeTab === TAB.EMAIL
  useEffect(() => {
    setAccount((isEmailTab ? userInfo.email : userInfo.telegram) ?? '')
  }, [userInfo, isEmailTab])

  useEffect(() => {
    setSelectedTopic(isOpen ? topicGroups.filter(e => e.isSubscribed).map(e => e.id) : [])
  }, [isOpen, topicGroups])

  useEffect(() => {
    if (!isOpen) {
      setError('')
    }
  }, [isOpen, activeTab])

  const notify = useNotify()
  const { mixpanelHandler } = useMixpanel()

  const getDiffTopics = useCallback(() => {
    let unsubscribeIds: number[] = []
    let subscribeIds: number[] = []
    let unsubscribeNames: string[] = []
    let subscribeNames: string[] = []
    topicGroups.forEach(group => {
      const isChecked = selectedTopic.includes(group.id)
      // unsubscribe
      if (group.isSubscribed && !isChecked) {
        group.topics.forEach((topic: Topic) => {
          unsubscribeIds = pushUnique(unsubscribeIds, topic.id)
          unsubscribeNames = pushUnique(unsubscribeNames, topic.code)
        })
      }
      // subscribe
      if (!group.isSubscribed && isChecked) {
        group.topics.forEach((topic: Topic) => {
          subscribeIds = pushUnique(subscribeIds, topic.id)
          subscribeNames = pushUnique(subscribeNames, topic.code)
        })
      }
    })
    return {
      subscribeIds,
      unsubscribeIds,
      unsubscribeNames,
      subscribeNames,
      hasChanged: subscribeIds.length + unsubscribeIds.length !== 0,
    }
  }, [topicGroups, selectedTopic])

  const validateInput = (value: string, required = false) => {
    const isValid = isEmailTab ? value.match(/\S+@\S+\.\S+/) : value.startsWith('@') && value.match(/@/g)?.length === 1
    const errMsg = isEmailTab ? t`Please input a valid email address` : t`Please input a valid telegram account`
    setError((value.length && !isValid) || (required && !value.length) ? errMsg : '')
  }
  // todo danh check spec 2, telegram, todo disbale sau khi save
  const onSubscribe = async () => {
    try {
      validateInput(inputAccount, true)
      if (isLoading || error || !inputAccount) return
      if (!isEmailTab) return alert('In developement')
      const { unsubscribeIds, subscribeIds, subscribeNames, unsubscribeNames } = getDiffTopics()
      if (subscribeNames.length) {
        mixpanelHandler(MIXPANEL_TYPE.NOTIFICATION_SELECT_TOPIC, { topics: subscribeNames })
      }
      if (unsubscribeNames.length) {
        mixpanelHandler(MIXPANEL_TYPE.NOTIFICATION_DESELECT_TOPIC, { topics: unsubscribeNames })
      }
      await handleSubscribe(subscribeIds, unsubscribeIds, inputAccount, isEmailTab)
      const hasSubscribe = subscribeIds.length
      notify(
        {
          title: hasSubscribe ? t`Verify Your Email Address` : t`Notification Preferences`,
          summary: hasSubscribe
            ? t`A verification email has been sent to your email address. Please check your inbox to verify your email.`
            : t`Your notification preferences have been saved successfully`,
          type: hasSubscribe ? NotificationType.WARNING : NotificationType.SUCCESS,
          icon: <MailIcon color={hasSubscribe ? theme.warning : theme.primary} />,
        },
        10000,
      )
    } catch (error) {
      notify({
        title: t`Save Error`,
        summary: t`Error occur, please try again`,
        type: NotificationType.ERROR,
      })
      console.log(error)
    }
  }

  const onChangeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setAccount(value)
    validateInput(value)
  }

  const onChangeTopic = (topicId: number) => {
    setSelectedTopic(
      selectedTopic.includes(topicId) ? selectedTopic.filter(el => el !== topicId) : [...selectedTopic, topicId],
    )
  }

  const toggleWalletModal = useWalletModalToggle()

  const onToggleOnTopic = () => {
    setSelectedTopic(selectedTopic.length === topicGroups.length ? [] : topicGroups.map(e => e.id))
  }

  const disableButtonSave = useMemo(
    () => isLoading || !inputAccount || !!error || !getDiffTopics().hasChanged,
    [getDiffTopics, isLoading, inputAccount, error],
  )

  return (
    <Modal isOpen={isOpen} onDismiss={toggleModal} minHeight={false} maxWidth={450}>
      <Wrapper>
        <ContentWrapper>
          <RowBetween>
            <Row fontSize={20} fontWeight={500} gap="10px">
              <MailIcon /> <Trans>Notifications</Trans>
            </Row>
            <CloseIcon onClick={toggleModal} />
          </RowBetween>
          <RowBetween gap="14px">
            <Label>
              <Trans>Select mode of notification</Trans>
            </Label>
            <Select
              style={{
                flex: 1,
                borderRadius: 40,
                color: theme.text,
                fontSize: 14,
                fontWeight: 500,
                height: 38,
                paddingLeft: 20,
              }}
              menuStyle={{ background: theme.background }}
              options={[
                {
                  label: 'Email',
                  value: TAB.EMAIL,
                },
                {
                  label: 'Telegram',
                  value: TAB.TELEGRAM,
                },
              ]}
              value={activeTab}
              optionRender={option => (
                <Option active={activeTab === option?.value} key={option?.value}>
                  {option?.value === TAB.EMAIL ? <Mail size={15} /> : <Telegram size={15} />} {option?.label}
                </Option>
              )}
              onChange={setActiveTab}
            />
          </RowBetween>
          <Flex flexDirection={'column'}>
            <Label>
              {isEmailTab ? (
                <Trans>Enter your email address to receive notifications</Trans>
              ) : (
                <Trans>Your telegram account</Trans>
              )}
            </Label>
            <InputWrapper>
              <Input
                error={error}
                value={inputAccount}
                placeholder={isEmailTab ? 'example@gmail.com' : '@example'}
                onChange={onChangeInput}
              />
              {/* {!error && inputAccount && <CheckIcon color={theme.primary} />} */}
            </InputWrapper>
            <Label style={{ color: theme.red, opacity: error ? 1 : 0, margin: '7px 0px 0px 0px' }}>
              {error || 'No data'}
            </Label>
          </Flex>
          <div>
            <TopicItemHeader>
              <Checkbox
                disabled={!account}
                id="selectAll"
                borderStyle
                onChange={onToggleOnTopic}
                style={{ width: 17, height: 17 }}
                checked={topicGroups.length === selectedTopic.length}
              />
              <Text as="label" htmlFor="selectAll" fontSize={12} color={theme.subText}>
                <Trans>NOTIFICATION PREFERENCES</Trans>
              </Text>
            </TopicItemHeader>
            {topicGroups.map(topic => (
              <TopicItem key={topic.id}>
                <Checkbox
                  disabled={!account}
                  borderStyle
                  checked={selectedTopic.includes(topic.id)}
                  id={`topic${topic.id}`}
                  style={{ width: 17, height: 17, minWidth: 17 }}
                  onChange={() => onChangeTopic(topic.id)}
                />
                <label htmlFor={`topic${topic.id}`}>
                  <Text color={theme.text} fontSize={14}>
                    <Trans>{topic.name}</Trans>
                  </Text>
                  <Text color={theme.subText} fontSize={12} marginTop={'5px'}>
                    <Trans>{topic.description}</Trans>
                  </Text>
                </label>
              </TopicItem>
            ))}
          </div>
          <ActionWrapper>
            {!account ? (
              <ButtonConfirmed confirmed onClick={toggleWalletModal}>
                <ButtonTextt>
                  <Trans>Connect Wallet</Trans>
                </ButtonTextt>
              </ButtonConfirmed>
            ) : (
              <ButtonPrimary disabled={disableButtonSave} borderRadius="46px" height="44px" onClick={onSubscribe}>
                <ButtonTextt>
                  {isLoading ? (
                    <>
                      <Loader />
                      <Trans>Saving ...</Trans>
                    </>
                  ) : (
                    <Trans>Save</Trans>
                  )}
                </ButtonTextt>
              </ButtonPrimary>
            )}
          </ActionWrapper>
        </ContentWrapper>
      </Wrapper>
    </Modal>
  )
}

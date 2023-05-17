import { Trans, t } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useAckTelegramSubscriptionStatusMutation } from 'services/identity'
import styled, { css } from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import Checkbox from 'components/CheckBox'
import Column from 'components/Column'
import { Telegram } from 'components/Icons'
import MailIcon from 'components/Icons/MailIcon'
import Row from 'components/Row'
import ActionButtons from 'components/SubscribeButton/NotificationPreference/ActionButtons'
import Header from 'components/SubscribeButton/NotificationPreference/Header'
import InputEmail from 'components/SubscribeButton/NotificationPreference/InputEmail'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification, { Topic } from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import VerifyCodeModal from 'pages/Verify/VerifyCodeModal'
import { useNotify } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { pushUnique } from 'utils'
import { subscribeTelegramSubscription } from 'utils/firebase'
import { isEmailValid } from 'utils/string'

const Wrapper = styled.div`
  margin: 0;
  padding: 30px 24px;
  width: 100%;
  display: flex;
  gap: 18px;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upToMedium`
     gap: 14px;
     padding: 24px 16px;
  `}
`

const Label = styled.p`
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
`

const TopicItem = styled.label`
  display: flex;
  gap: 14px;
  font-weight: 500;
  align-items: center;
  flex-basis: 45%;

  ${({ theme }) => theme.mediaWidth.upToMedium`
     flex-basis: unset;
  `}
`

const Divider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  width: 100%;
`

const TopicItemHeader = styled.label`
  color: ${({ theme }) => theme.text};
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
`

const ListGroupWrapper = styled.div<{ isInNotificationCenter: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  ${({ isInNotificationCenter }) =>
    isInNotificationCenter &&
    css`
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-between;
    `}
  ${({ theme }) => theme.mediaWidth.upToMedium`
     flex-direction: column;
  `}
`

// const Option = styled(Row)<{ active: boolean }>`
//   padding: 10px 16px;
//   gap: 10px;
//   color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
//   :hover {
//     color: ${({ theme }) => theme.primary};
//     background: ${({ theme }) => rgba(theme.subText, 0.1)};
//   }
// `

enum TAB {
  EMAIL,
  TELEGRAM,
}

// const NOTIFICATION_OPTIONS = [
//   {
//     label: 'Email',
//     value: TAB.EMAIL,
//   },
//   {
//     label: 'Telegram',
//     value: TAB.TELEGRAM,
//   },
// ]

const noop = () => {
  //
}

const sortGroup = (arr: Topic[]) => [...arr].sort((x, y) => y.priority - x.priority)

export const useValidateEmail = (defaultEmail?: string) => {
  // todo refactor this hook
  const [inputEmail, setInputEmail] = useState(defaultEmail || '')
  const [errorInput, setErrorInput] = useState<{ msg: string; type: 'error' | 'warn' } | null>(null)

  const theme = useTheme()

  const validateInput = useCallback((value: string) => {
    const isValid = isEmailValid(value)
    const errMsg = t`Please input a valid email address`
    const msg = value.length && !isValid ? errMsg : ''
    setErrorInput(msg ? { msg, type: 'error' } : null)
  }, [])

  const onChangeEmail = (value: string) => {
    setInputEmail(value)
    validateInput(value)
  }

  const hasErrorInput = errorInput?.type === 'error'
  const errorColor = hasErrorInput ? theme.red : errorInput?.type === 'warn' ? theme.warning : theme.border

  const reset = useCallback(
    (email: string | undefined) => {
      setErrorInput(null)
      setInputEmail(email || defaultEmail || '')
    },
    [defaultEmail],
  )

  return { inputEmail, onChangeEmail, errorInput: errorInput?.msg, errorColor, hasErrorInput, reset }
}

function NotificationPreference({
  header,
  isOpen,
  isInNotificationCenter = false,
  toggleModal = noop,
}: {
  header?: ReactNode
  isOpen: boolean
  isInNotificationCenter?: boolean
  toggleModal?: () => void
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const {
    isLoading,
    saveNotification,
    refreshTopics,
    topicGroups: topicGroupsGlobal,
    unsubscribeAll,
  } = useNotification()

  const { formatUserInfo: userInfo } = useSessionInfo()

  const [isShowVerify, setIsShowVerify] = useState(false)
  const showVerifyModal = () => {
    setIsShowVerify(true)
  }
  const onDismissVerifyModal = () => {
    setIsShowVerify(false)
    onSave()
  }

  const [topicGroups, setTopicGroups] = useState<Topic[]>([])

  const notify = useNotify()
  const { mixpanelHandler } = useMixpanel()

  const [emailPendingVerified, setEmailPendingVerified] = useState('')
  const { inputEmail, errorInput, onChangeEmail, errorColor, reset, hasErrorInput } = useValidateEmail()

  const [activeTab] = useState<TAB>(TAB.EMAIL)
  const [selectedTopic, setSelectedTopic] = useState<number[]>([])

  const isEmailTab = activeTab === TAB.EMAIL
  const isTelegramTab = activeTab === TAB.TELEGRAM

  const isNewUserQualified = !userInfo?.email && !userInfo?.telegramUsername && !!inputEmail && !hasErrorInput
  const notFillEmail = !inputEmail && isEmailTab

  const updateTopicGroupsLocal = useCallback(
    (subIds: number[], unsubIds: number[]) => {
      const newTopicGroups = topicGroupsGlobal.map(group => {
        const newTopics = group.topics.map((topic: Topic) => ({
          ...topic,
          isSubscribed: subIds.includes(topic.id) ? true : unsubIds.includes(topic.id) ? false : topic.isSubscribed,
        }))
        return { ...group, topics: newTopics, isSubscribed: newTopics?.every(e => e.isSubscribed) }
      })
      setTopicGroups(sortGroup(newTopicGroups))
    },
    [topicGroupsGlobal],
  )

  const [ackTelegramSubscriptionStatus] = useAckTelegramSubscriptionStatusMutation()
  useEffect(() => {
    if (!account) return
    const unsubscribe = subscribeTelegramSubscription(account, data => {
      if (data?.isSuccessfully) {
        refreshTopics()
        ackTelegramSubscriptionStatus(account).catch(console.error)
      }
    })
    return () => unsubscribe?.()
  }, [account, refreshTopics, ackTelegramSubscriptionStatus])

  useEffect(() => {
    if (isOpen) {
      setEmailPendingVerified('')
      reset(userInfo?.email)
    }
  }, [userInfo, activeTab, isOpen, reset])

  useEffect(() => {
    setTimeout(
      () => {
        setSelectedTopic(isOpen ? topicGroupsGlobal.filter(e => e.isSubscribed).map(e => e.id) : [])
        if (isOpen) {
          setTopicGroups(sortGroup(topicGroupsGlobal))
        }
      },
      isOpen ? 0 : 400,
    )
  }, [isOpen, topicGroupsGlobal])

  const getDiffChangeTopics = useCallback(
    (topicGroups: Topic[]) => {
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

      const isChangeEmail =
        !hasErrorInput &&
        inputEmail &&
        userInfo?.email !== inputEmail &&
        selectedTopic.length &&
        inputEmail !== emailPendingVerified
      return {
        subscribeIds,
        unsubscribeIds,
        unsubscribeNames,
        subscribeNames,
        hasChanged: subscribeIds.length + unsubscribeIds.length !== 0 || Boolean(isChangeEmail),
      }
    },
    [selectedTopic, inputEmail, userInfo, emailPendingVerified, hasErrorInput],
  )

  const checkProfileAndSave = () => {
    if (isLoading || hasErrorInput || notFillEmail) return
    if (!userInfo?.email) {
      showVerifyModal()
      return
    }
    onSave()
  }

  const onSave = async () => {
    try {
      const { unsubscribeIds, subscribeIds, subscribeNames, unsubscribeNames } = getDiffChangeTopics(topicGroupsGlobal)
      if (subscribeNames.length) {
        mixpanelHandler(MIXPANEL_TYPE.NOTIFICATION_SELECT_TOPIC, { topics: subscribeNames })
      }
      if (unsubscribeNames.length) {
        mixpanelHandler(MIXPANEL_TYPE.NOTIFICATION_DESELECT_TOPIC, { topics: unsubscribeNames })
      }
      if (inputEmail !== userInfo?.email) setEmailPendingVerified(inputEmail)
      const verificationUrl = await saveNotification({
        subscribeIds,
        unsubscribeIds,
        isEmail: isEmailTab,
        isTelegram: isTelegramTab,
      })
      updateTopicGroupsLocal(subscribeIds, unsubscribeIds)
      if (isTelegramTab && verificationUrl) {
        window.open(`https://${verificationUrl}`)
        return
      }

      notify(
        {
          title: t`Notification Preferences`,
          summary: t`Your notification preferences have been saved successfully`,
          type: NotificationType.SUCCESS,
          icon: <MailIcon color={theme.primary} />,
        },
        10000,
      )
      toggleModal()
      if (isInNotificationCenter) {
        refreshTopics()
      }
    } catch (error) {
      notify({
        title: t`Save Error`,
        summary: t`Error occur, please try again`,
        type: NotificationType.ERROR,
      })
      console.log(error)
    }
  }

  const onChangeTopic = (topicId: number) => {
    setSelectedTopic(
      selectedTopic.includes(topicId) ? selectedTopic.filter(el => el !== topicId) : [...selectedTopic, topicId],
    )
  }

  const onToggleAllTopic = () => {
    setSelectedTopic(selectedTopic.length === topicGroups.length ? [] : topicGroups.map(e => e.id))
  }

  const autoSelect = useRef(false)
  useEffect(() => {
    if (isNewUserQualified && !autoSelect.current) {
      // auto select all checkbox when user no register any topic before and fill a valid email
      // this effect will call once
      setSelectedTopic(topicGroups.map(e => e.id))
      autoSelect.current = true
    }
  }, [isNewUserQualified, topicGroups])

  const isVerifiedEmail = userInfo?.email && inputEmail === userInfo?.email
  const isVerifiedTelegram = userInfo?.telegramUsername
  const needVerifyEmail = inputEmail && inputEmail !== userInfo?.email

  const disableButtonSave = useMemo(() => {
    if (isTelegramTab) return isLoading
    if (isLoading || notFillEmail || hasErrorInput || needVerifyEmail) return true
    return !getDiffChangeTopics(topicGroups).hasChanged
  }, [getDiffChangeTopics, isLoading, notFillEmail, isTelegramTab, topicGroups, hasErrorInput, needVerifyEmail])

  const disableCheckbox = !account || notFillEmail || hasErrorInput

  const subscribeAtLeast1Topic = topicGroupsGlobal.some(e => e.isSubscribed)
  const onUnsubscribeAll = () => {
    if (!subscribeAtLeast1Topic) return
    unsubscribeAll()
    toggleModal()
    notify(
      {
        title: t`Unsubscribe Successfully`,
        summary: t`You have successfully unsubscribe from further receiving email notification from us`,
        type: NotificationType.SUCCESS,
        icon: <MailIcon color={theme.primary} />,
      },
      10_000,
    )
  }

  const renderTableHeader = () => {
    return (
      <TopicItemHeader htmlFor="selectAll">
        <Text fontSize={'14px'}>
          <Trans>Notification Preferences</Trans>
        </Text>
        <Flex style={{ gap: '4px', alignItems: 'center' }}>
          <Checkbox
            disabled={disableCheckbox}
            id="selectAll"
            borderStyle
            onChange={onToggleAllTopic}
            style={{ width: 14, height: 14 }}
            checked={topicGroups.length === selectedTopic.length}
          />
          <Text color={theme.subText} fontSize={'12px'}>
            <Trans>Select All</Trans>
          </Text>
        </Flex>
      </TopicItemHeader>
    )
  }

  return (
    <Wrapper>
      {header || <Header toggleModal={toggleModal} />}
      {/* <RowBetween gap="14px">
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
            options={NOTIFICATION_OPTIONS}
            value={activeTab}
            optionRender={option => (
              <Option active={activeTab === option?.value} key={option?.value}>
                {option?.value === TAB.EMAIL ? <Mail size={15} /> : <Telegram size={15} />} {option?.label}
              </Option>
            )}
            onChange={setActiveTab}
          />
        </RowBetween> */}

      {isEmailTab ? (
        <Column>
          <Label>
            <Trans>Enter your email address to receive notifications</Trans>
          </Label>
          <InputEmail
            showVerifyModal={showVerifyModal}
            errorColor={errorColor}
            onChange={onChangeEmail}
            value={inputEmail}
            isInNotificationCenter={isInNotificationCenter}
            isVerifiedEmail={!!isVerifiedEmail}
          />
          {errorInput && <Label style={{ color: errorColor, margin: '7px 0px 0px 0px' }}>{errorInput}</Label>}
        </Column>
      ) : (
        <Flex
          flexDirection="column"
          alignItems={'center'}
          color={theme.subText}
          style={{ gap: 10, margin: '10px 0px' }}
        >
          <Telegram size={24} />

          {isVerifiedTelegram ? (
            <Row align="center" justify="center" gap="3px">
              <Text fontSize={15}>
                <Trans>
                  Your Verified Account:{' '}
                  <Text as="span" color={theme.text}>
                    @{userInfo?.telegramUsername}
                  </Text>
                </Trans>
              </Text>
              <Check color={theme.primary} />
            </Row>
          ) : (
            <Text fontSize={15}>
              <Trans>Click Get Started to subscribe to Telegram</Trans>
            </Text>
          )}
        </Flex>
      )}
      <Divider />
      <Column gap="16px">
        {renderTableHeader()}
        <ListGroupWrapper isInNotificationCenter={!!isInNotificationCenter}>
          {topicGroups.map(topic => (
            <TopicItem
              key={topic.id}
              htmlFor={`topic${topic.id}`}
              style={{ alignItems: isInNotificationCenter ? 'flex-start' : 'center' }}
            >
              <Checkbox
                disabled={disableCheckbox}
                borderStyle
                checked={selectedTopic.includes(topic.id)}
                id={`topic${topic.id}`}
                style={{ width: 14, height: 14, minWidth: 14 }}
                onChange={() => onChangeTopic(topic.id)}
              />
              <Column gap="10px">
                <Text color={theme.text} fontSize={14}>
                  <Trans>{topic.name}</Trans>
                </Text>
                {isInNotificationCenter && (
                  <Text color={theme.subText} fontSize={12}>
                    <Trans>{topic.description}</Trans>
                  </Text>
                )}
              </Column>
            </TopicItem>
          ))}
        </ListGroupWrapper>
      </Column>
      <ActionButtons
        isHorizontal={!!isInNotificationCenter}
        disableButtonSave={disableButtonSave}
        onSave={checkProfileAndSave}
        isTelegramTab={isTelegramTab}
        subscribeAtLeast1Topic={subscribeAtLeast1Topic}
        onUnsubscribeAll={onUnsubscribeAll}
        isLoading={isLoading}
      />
      <VerifyCodeModal
        isOpen={isShowVerify}
        onDismiss={onDismissVerifyModal}
        email={inputEmail}
        onVerifySuccess={onDismissVerifyModal}
      />
    </Wrapper>
  )
}
export default NotificationPreference

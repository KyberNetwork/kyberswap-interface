import { Trans, t } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Lock } from 'react-feather'
import { Text } from 'rebass'
import { useAckTelegramSubscriptionStatusMutation } from 'services/identity'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import Checkbox from 'components/CheckBox'
import Column from 'components/Column'
import MailIcon from 'components/Icons/MailIcon'
import NotificationIcon from 'components/Icons/NotificationIcon'
import Loader from 'components/Loader'
import Row from 'components/Row'
import ActionButtons from 'components/SubscribeButton/NotificationPreference/ActionButtons'
import Header from 'components/SubscribeButton/NotificationPreference/Header'
import InputEmail from 'components/SubscribeButton/NotificationPreference/InputEmail'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification, { Topic, TopicType } from 'hooks/useNotification'
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
  width: 100%;
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
  width: 100%;

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

const ListGroupWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
  flex-direction: row;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToMedium`
     flex-direction: column;
     gap: 24px;
  `}
`

const GroupColum = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const LabelGroup = styled(TextDashed)`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
`

const EmailColum = styled(Column)`
  max-width: 50%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
     max-width: 100%;
  `}
`

const noop = () => {
  //
}

const sortGroup = (arr: Topic[]) => [...arr].sort((x, y) => y.priority - x.priority)

export const useValidateEmail = (defaultEmail?: string) => {
  const [inputEmail, setInputEmail] = useState(defaultEmail || '')
  const [errorInput, setErrorInput] = useState<string | null>(null)

  const theme = useTheme()

  const validateInput = useCallback((value: string) => {
    const isValid = isEmailValid(value)
    const errMsg = t`Please input a valid email address`
    const msg = value.length && !isValid ? errMsg : ''
    setErrorInput(msg ? msg : null)
  }, [])

  const onChangeEmail = useCallback(
    (value: string) => {
      setInputEmail(value)
      validateInput(value)
    },
    [validateInput],
  )

  const hasErrorInput = !!errorInput
  const errorColor = hasErrorInput ? theme.red : theme.border

  const reset = useCallback(
    (email: string | undefined) => {
      setErrorInput(null)
      setInputEmail(email || defaultEmail || '')
    },
    [defaultEmail],
  )

  return { inputEmail, onChangeEmail, errorInput, errorColor, hasErrorInput, reset }
}

function NotificationPreference({
  header,
  isOpen,
  toggleModal = noop,
}: {
  header?: ReactNode
  isOpen: boolean
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

  const { userInfo, isLogin } = useSessionInfo()

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
  const { inputEmail, errorInput, onChangeEmail, errorColor, reset, hasErrorInput } = useValidateEmail(userInfo?.email)

  const [selectedTopic, setSelectedTopic] = useState<number[]>([])

  const notFillEmail = !inputEmail

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
  }, [userInfo, isOpen, reset])

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
      await saveNotification({
        subscribeIds,
        unsubscribeIds,
        isEmail: true,
        isTelegram: false,
      })
      updateTopicGroupsLocal(subscribeIds, unsubscribeIds)
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
      refreshTopics()
    } catch (error) {
      notify({
        title: t`Save Error`,
        summary:
          error.status === 403
            ? t`Some topics that you need to be whitelist to subscribe`
            : t`Error occur, please try again`,
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

  const isVerifiedEmail = userInfo?.email && inputEmail === userInfo?.email
  const needVerifyEmail = inputEmail && inputEmail !== userInfo?.email

  const disableButtonSave = useMemo(() => {
    if (isLoading || notFillEmail || hasErrorInput || needVerifyEmail) return true
    return !getDiffChangeTopics(topicGroups).hasChanged
  }, [getDiffChangeTopics, isLoading, notFillEmail, topicGroups, hasErrorInput, needVerifyEmail])

  const disableCheckbox = needVerifyEmail || !account || notFillEmail || hasErrorInput

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
      </TopicItemHeader>
    )
  }

  const { commons, restrict } = useMemo(() => {
    return {
      commons: topicGroupsGlobal.filter(el => el.type === TopicType.NORMAL),
      restrict: topicGroupsGlobal.filter(el => el.type === TopicType.RESTRICT),
    }
  }, [topicGroupsGlobal])

  const totalTopic = commons.length + restrict.length
  const renderTopic = (topic: Topic, disabled: boolean, disableTooltip?: string) => {
    return (
      <MouseoverTooltip text={disabled ? disableTooltip : ''}>
        <TopicItem key={topic.id} htmlFor={`topic${topic.id}`} style={{ alignItems: 'flex-start' }}>
          <Checkbox
            disabled={disabled}
            borderStyle
            checked={selectedTopic.includes(topic.id)}
            id={`topic${topic.id}`}
            style={{ width: 14, height: 14, minWidth: 14 }}
            onChange={() => onChangeTopic(topic.id)}
          />
          <Column gap="10px">
            <Text color={disabled ? theme.border : theme.text} fontSize={14}>
              <Trans>{topic.name}</Trans>
            </Text>
            <Text color={disabled ? theme.border : theme.subText} fontSize={12}>
              <Trans>{topic.description}</Trans>
            </Text>
          </Column>
        </TopicItem>
      </MouseoverTooltip>
    )
  }

  return (
    <Wrapper>
      {header || <Header toggleModal={toggleModal} />}

      <EmailColum>
        <Label>
          <Trans>Enter your email address to receive notifications</Trans>
        </Label>
        <InputEmail
          hasError={hasErrorInput}
          showVerifyModal={showVerifyModal}
          errorColor={errorColor}
          onChange={onChangeEmail}
          value={inputEmail}
          isVerifiedEmail={!!isVerifiedEmail}
        />
        {errorInput && <Label style={{ color: errorColor, margin: '7px 0px 0px 0px' }}>{errorInput}</Label>}
      </EmailColum>
      <Divider />
      <Column gap="16px">
        {renderTableHeader()}
        <ListGroupWrapper>
          <GroupColum>
            <LabelGroup>
              <NotificationIcon size={16} />
              <MouseoverTooltip text={t`These topics can be subscribed by anyone`} placement="top">
                <Trans>Common Topics</Trans>
              </MouseoverTooltip>
            </LabelGroup>
            {commons.map(topic => renderTopic(topic, disableCheckbox))}
          </GroupColum>
          <GroupColum>
            <LabelGroup>
              <Lock size={15} />
              <MouseoverTooltip
                placement="top"
                text={t`These topics can only be subscribed by a signed-in profile. Go to Profile tab to sign-in with your wallet`}
              >
                <Trans>Restricted Topics</Trans>
              </MouseoverTooltip>
            </LabelGroup>
            {restrict.map(topic => {
              const disableKyberAI = disableCheckbox || !isLogin || !userInfo?.data?.hasAccessToKyberAI
              return renderTopic(
                topic,
                (() => (topic.isKyberAI ? disableKyberAI : disableCheckbox || !isLogin))(),
                topic.isKyberAI && disableKyberAI
                  ? t`You must be whitelisted to subscribe/unsubscribe this topic`
                  : t`These topics can only be subscribed by a signed-in profile. Go to Profile tab to sign-in with your wallet
                `,
              )
            })}
          </GroupColum>
        </ListGroupWrapper>
        {totalTopic === 0 && (
          <Row justify="center" align="center" gap="6px" marginTop={'20px'} width={'100%'}>
            <Loader />
            <Text color={theme.subText} fontSize={14}>
              <Trans>Loading topics ...</Trans>
            </Text>
          </Row>
        )}
      </Column>
      {totalTopic > 0 && (
        <ActionButtons
          disableButtonSave={disableButtonSave}
          onSave={checkProfileAndSave}
          subscribeAtLeast1Topic={subscribeAtLeast1Topic}
          onUnsubscribeAll={onUnsubscribeAll}
          isLoading={isLoading}
          tooltipSave={needVerifyEmail || !userInfo?.email ? t`You will need to verify your email address first` : ''}
        />
      )}
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

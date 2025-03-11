import { Trans, t } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import Checkbox from 'components/CheckBox'
import Column from 'components/Column'
import MailIcon from 'components/Icons/MailIcon'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { PRICE_ALERT_TOPIC_ID } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification, { Topic, TopicType } from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import ActionButtons from 'pages/NotificationCenter/NotificationPreference/ActionButtons'
import InputEmailWithVerification from 'pages/NotificationCenter/NotificationPreference/InputEmail'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { useNotify } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useSignedAccountInfo } from 'state/profile/hooks'
import { pushUnique } from 'utils'
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

const EmailColum = styled(Column)`
  max-width: 50%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
     max-width: 100%;
  `}
`

const noop = () => {}

const sortGroup = (arr: Topic[]) => [...arr].sort((x, y) => y.priority - x.priority)

export const useValidateEmail = (defaultEmail?: string) => {
  const [inputEmail, setInputEmail] = useState(defaultEmail || '')
  const [errorInput, setErrorInput] = useState<string | null>(null)

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

  const reset = useCallback(
    (email: string | undefined) => {
      setErrorInput(null)
      setInputEmail(email || defaultEmail || '')
    },
    [defaultEmail],
  )

  return { inputEmail: inputEmail.trim(), onChangeEmail, errorInput, reset }
}

function NotificationPreference({ toggleModal = noop }: { toggleModal?: () => void }) {
  const theme = useTheme()
  const { isLoading, saveNotification, topicGroups: topicGroupsGlobal, unsubscribeAll } = useNotification()

  const { account } = useActiveWeb3React()
  const { userInfo, isLogin } = useSessionInfo()
  const { isSignInEmail } = useSignedAccountInfo()

  const { inputEmail, errorInput, onChangeEmail, reset } = useValidateEmail(userInfo?.email)
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

  const hasErrorInput = !!errorInput

  const [selectedTopic, setSelectedTopic] = useState<number[]>([])

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

  useEffect(() => {
    setEmailPendingVerified('')
    reset(userInfo?.email)
  }, [userInfo, reset])

  useEffect(() => {
    setSelectedTopic(topicGroupsGlobal.filter(e => e.isSubscribed).map(e => e.id))
    setTopicGroups(sortGroup(topicGroupsGlobal))
  }, [topicGroupsGlobal])

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
      await saveNotification({ subscribeIds, unsubscribeIds })
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

  const disableCheckbox = hasErrorInput
  const isIncludePriceAlert = useCallback(() => {
    const changedData = getDiffChangeTopics(topicGroups)
    return (
      changedData.subscribeIds.includes(+PRICE_ALERT_TOPIC_ID) ||
      changedData.unsubscribeIds.includes(+PRICE_ALERT_TOPIC_ID)
    )
  }, [topicGroups, getDiffChangeTopics])

  const disableButtonSave = useMemo(() => {
    if (isLoading) return true
    const changedData = getDiffChangeTopics(topicGroups)
    if (!isIncludePriceAlert() && disableCheckbox) {
      return true
    }
    return !changedData.hasChanged
  }, [getDiffChangeTopics, isIncludePriceAlert, isLoading, topicGroups, disableCheckbox])

  const checkProfileAndSave = () => {
    if (disableButtonSave) return
    if (needVerifyEmail && !isIncludePriceAlert()) {
      showVerifyModal()
      return
    }
    onSave()
  }

  const subscribeAtLeast1Topic = topicGroupsGlobal.some(e => e.isSubscribed)
  const onUnsubscribeAll = () => {
    if (!subscribeAtLeast1Topic) return
    unsubscribeAll()
    toggleModal()
    notify(
      {
        title: t`Unsubscribe Successfully`,
        summary: t`You have successfully unsubscribed from all email notifications`,
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
  const renderTopic = (topic: Topic, disabled: boolean, disableTooltip?: ReactNode) => {
    return (
      <MouseoverTooltip text={disabled ? disableTooltip : ''} key={topic.id}>
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
              {topic.name}
            </Text>
            <Text color={disabled ? theme.border : theme.subText} fontSize={12}>
              {topic.description}
            </Text>
          </Column>
        </TopicItem>
      </MouseoverTooltip>
    )
  }

  const navigate = useNavigate()
  return (
    <Wrapper>
      <Text fontWeight={'500'} color={theme.text} fontSize="14px">
        <Trans>Email Notification</Trans>
      </Text>

      <EmailColum>
        <Label>
          <Trans>Enter your email address to receive notifications.</Trans>
        </Label>
        <InputEmailWithVerification
          hasError={hasErrorInput}
          showVerifyModal={showVerifyModal}
          onChange={onChangeEmail}
          value={inputEmail}
          isVerifiedEmail={!!isVerifiedEmail}
          isShowVerify={isShowVerify}
          onDismissVerifyModal={onDismissVerifyModal}
          disabled={isSignInEmail}
        />
        {errorInput && (
          <Label style={{ color: errorInput ? theme.red : theme.border, margin: '7px 0px 0px 0px' }}>
            {errorInput}
          </Label>
        )}
      </EmailColum>
      <Divider />
      <Column gap="16px">
        {renderTableHeader()}
        <ListGroupWrapper>
          <GroupColum>
            {commons.map(topic => {
              const isDisabled = topic.isPriceElasticPool ? !account : topic.isPriceAlert ? false : disableCheckbox
              return renderTopic(
                topic,
                isDisabled,
                isDisabled ? t`You must connect wallet and fill an email first` : '',
              )
            })}
          </GroupColum>
          <GroupColum>
            {restrict.map(topic => {
              return renderTopic(
                topic,
                disableCheckbox || !isLogin,
                <Trans>
                  Before you can subscribe to this notification, sign-in to a profile first. Go the{' '}
                  <Text
                    sx={{ cursor: 'pointer' }}
                    as="span"
                    color={theme.primary}
                    onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PROFILE}`)}
                  >
                    Profile
                  </Text>{' '}
                  tab to sign-in with your wallet
                </Trans>,
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
          tooltipSave={
            !getDiffChangeTopics(topicGroups).hasChanged
              ? ''
              : (needVerifyEmail || !userInfo?.email) && !isIncludePriceAlert()
              ? t`You will need to verify your email address first.`
              : ''
          }
        />
      )}
    </Wrapper>
  )
}

const StyledPreference = styled.div`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: unset;
  `}
`

export default function Overview() {
  return (
    <StyledPreference>
      <NotificationPreference />
    </StyledPreference>
  )
}

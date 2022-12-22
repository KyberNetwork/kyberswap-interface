import { t } from '@lingui/macro'
import axios from 'axios'
import { stringify } from 'querystring'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import MailIcon from 'components/Icons/MailIcon'
import { NOTIFICATION_API } from 'constants/env'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { NotificationType, useNotificationModalToggle, useNotify } from 'state/application/hooks'

function VerifyComponent() {
  const qs = useParsedQueryString()
  const notify = useNotify()
  const calledApi = useRef(false)
  const toggleSubscribeModal = useNotificationModalToggle()
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    if (!qs?.confirmation || calledApi.current) return
    calledApi.current = true
    axios
      .get(`${NOTIFICATION_API}/v1/topics/verify`, {
        params: { confirmation: qs.confirmation },
      })
      .then(() => {
        notify(
          {
            type: NotificationType.SUCCESS,
            title: t`Subscription Successful`,
            summary: t`You have successfully subscribed with the email address ${qs.email}`,
            icon: <MailIcon color={theme.primary} />,
          },
          10000,
        )
        toggleSubscribeModal()
        const { confirmation, email, ...rest } = qs
        navigate({ search: stringify(rest) })
      })
      .catch(e => {
        const code = e?.response?.data?.code
        console.error(e)
        notify({
          type: NotificationType.ERROR,
          title: t`Subscription Error`,
          icon: <MailIcon color={theme.red} />,
          summary:
            code === '4001'
              ? t`This verification link has expired. Please return to your inbox to verify with the latest verification link.`
              : t`Error occur, please try again.`,
        })
      })
  }, [qs, notify, navigate, toggleSubscribeModal, theme])

  return null
}
export default VerifyComponent

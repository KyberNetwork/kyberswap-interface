import { t } from '@lingui/macro'

import SubscribeNotificationButton from 'components/SubscribeButton'
import { MouseoverTooltip } from 'components/Tooltip'
import { KYBER_AI_TOPIC_ID } from 'constants/env'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'

export default function SubscribeButtonKyberAI({ source }: { source: string }) {
  const mixpanelHandler = useMixpanelKyberAI()
  return (
    <MouseoverTooltip
      text={t`Subscribe to receive daily email notifications witha curated list of tokens from each category!`}
      placement="right"
      delay={1200}
    >
      <SubscribeNotificationButton
        topicId={KYBER_AI_TOPIC_ID}
        onClick={() =>
          mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SUBSCRIBE_CLICK, {
            source,
          })
        }
      />
    </MouseoverTooltip>
  )
}

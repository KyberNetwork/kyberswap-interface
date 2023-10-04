import { t } from '@lingui/macro'

import SubscribeNotificationButton from 'components/SubscribeButton'
import { MouseoverTooltip } from 'components/Tooltip'
import { KYBER_AI_TOPIC_ID } from 'constants/env'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'

export default function SubscribeButtonKyberAI({ ranking }: { ranking?: boolean }) {
  const mixpanelHandler = useMixpanelKyberAI()
  return (
    <MouseoverTooltip
      text={
        ranking
          ? t`Subscribe to receive daily emails on tokens in your watchlist and tokens recommended by KyberAI!`
          : t`Subscribe to receive daily email notifications witha curated list of tokens from each category!`
      }
      placement="right"
      delay={1200}
    >
      <SubscribeNotificationButton
        topicId={KYBER_AI_TOPIC_ID}
        onClick={() =>
          mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SUBSCRIBE_CLICK, {
            source: ranking ? 'ranking' : 'explore',
          })
        }
      />
    </MouseoverTooltip>
  )
}

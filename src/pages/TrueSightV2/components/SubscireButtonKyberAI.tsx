import SubscribeNotificationButton from 'components/SubscribeButton'
import { MouseoverTooltip } from 'components/Tooltip'
import { KYBER_AI_TOPIC_ID } from 'constants/env'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'

export default function SubscribeButtonKyberAI({ type, tooltip }: { type: 'ranking' | 'explore'; tooltip: string }) {
  const mixpanelHandler = useMixpanelKyberAI()
  return (
    <MouseoverTooltip text={tooltip} placement="right" delay={1200}>
      <SubscribeNotificationButton
        topicId={KYBER_AI_TOPIC_ID[0]}
        onClick={() =>
          mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SUBSCRIBE_CLICK, {
            source: type,
          })
        }
      />
    </MouseoverTooltip>
  )
}

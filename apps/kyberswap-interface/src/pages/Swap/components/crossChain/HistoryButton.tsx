import { t } from '@lingui/macro'
import { Clock } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import { MouseoverTooltip } from 'components/Tooltip'

/** Controlled trigger composed into the form header; SwapPage owns visibility and panel mounting. */
const HistoryButton = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <IconButton
    variant="action"
    active={active}
    aria-label={t`Cross-chain history`}
    aria-expanded={active}
    aria-controls="swap-right-panel"
    onClick={onClick}
  >
    <MouseoverTooltip text={t`History`} placement="top" width="fit-content">
      <Clock size={20} className="text-subText" />
    </MouseoverTooltip>
  </IconButton>
)

export default HistoryButton

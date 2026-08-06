import { t } from '@lingui/macro'

import Dots from 'components/Dots'

/** Stands in for an EG reading that the backend cannot report yet. */
const EgCalculating = ({ className }: { className?: string }) => <Dots className={className}>{t`Calculating`}</Dots>

export default EgCalculating

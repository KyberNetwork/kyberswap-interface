import { Trans } from '@lingui/macro'
import { Plus } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { ButtonPrimary } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { cn } from 'utils/cn'

type Props = {
  className?: string
}
const CreateAlertButton: React.FC<Props> = ({ className }) => {
  const navigate = useNavigate()

  return (
    <ButtonPrimary
      className={cn('h-9 flex-[0_0_fit-content] gap-1 py-0 pl-1.5 pr-2', className)}
      onClick={() => {
        navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.CREATE_ALERT}`)
      }}
    >
      <Plus size={16} />
      <Trans>Create Alert</Trans>
    </ButtonPrimary>
  )
}

export default CreateAlertButton

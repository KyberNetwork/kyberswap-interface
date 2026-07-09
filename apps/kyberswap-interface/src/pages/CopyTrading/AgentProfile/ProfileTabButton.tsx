import { type PropsWithChildren } from 'react'

import { ButtonEmpty, ButtonLight } from 'components/Button'

type ProfileTabButtonProps = PropsWithChildren<{
  active: boolean
  onClick: () => void
}>

const ProfileTabButton = ({ active, children, onClick }: ProfileTabButtonProps) => {
  const TabButton = active ? ButtonLight : ButtonEmpty

  return (
    <TabButton type="button" onClick={onClick} padding="12px 20px">
      {children}
    </TabButton>
  )
}

export default ProfileTabButton

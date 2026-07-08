import { ButtonEmpty, ButtonLight } from 'components/Button'

const ProfileTabButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) => {
  const TabButton = active ? ButtonLight : ButtonEmpty

  return (
    <TabButton type="button" onClick={onClick} padding="12px 20px">
      {children}
    </TabButton>
  )
}

export default ProfileTabButton

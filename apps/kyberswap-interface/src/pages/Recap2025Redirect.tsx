import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

import { useRecapModalToggle } from 'state/application/hooks'

const Recap2025Redirect = () => {
  const toggleRecapModal = useRecapModalToggle()

  useEffect(() => {
    // Set flag to force open recap modal
    localStorage.setItem('forceOpenRecap', 'true')
    // Open the modal
    toggleRecapModal()
  }, [toggleRecapModal])

  return <Navigate to="/" replace />
}

export default Recap2025Redirect

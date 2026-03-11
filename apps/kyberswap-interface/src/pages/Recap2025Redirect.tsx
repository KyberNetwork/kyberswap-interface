import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

import { isRecapAvailable } from 'components/Recap/utils'
import { useRecapModalToggle } from 'state/application/hooks'

const Recap2025Redirect = () => {
  const toggleRecapModal = useRecapModalToggle()

  useEffect(() => {
    if (!isRecapAvailable()) return
    localStorage.setItem('forceOpenRecap', 'true')
    toggleRecapModal()
  }, [toggleRecapModal])

  return <Navigate to="/" replace />
}

export default Recap2025Redirect

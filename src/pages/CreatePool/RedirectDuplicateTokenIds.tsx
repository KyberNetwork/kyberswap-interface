import { Navigate, useParams } from 'react-router-dom'

import CreatePool from './index'

export default function RedirectDuplicateTokenIds() {
  const { currencyIdA, currencyIdB } = useParams()
  if (currencyIdA?.toLowerCase() === currencyIdB?.toLowerCase()) {
    return <Navigate to={`/create/${currencyIdA}`} />
  }
  return <CreatePool />
}

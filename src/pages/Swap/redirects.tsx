import { Navigate, useLocation, useParams } from 'react-router-dom'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapOnly() {
  const location = useLocation()
  return <Navigate to={{ ...location, pathname: '/swap' }} />
}

// Redirects from the /swap/:outputCurrency path to the /swap?outputCurrency=:outputCurrency format
export function RedirectToSwap() {
  const { outputCurrency } = useParams()
  const location = useLocation()

  return (
    <Navigate
      to={{
        ...location,
        pathname: '/swap',
        search:
          location.search && location.search.length > 1
            ? `${location.search}&outputCurrency=${outputCurrency}`
            : `?outputCurrency=${outputCurrency}`,
      }}
    />
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

type UseTabProps<T extends string> = {
  tabs: readonly T[]
  queryKey?: string
  defaultTab?: T | ''
  syncQuery?: boolean
}

const useTab = <T extends string>({
  tabs,
  queryKey = 'tab',
  defaultTab = tabs && tabs.length ? tabs[0] : '',
  syncQuery = true,
}: UseTabProps<T>) => {
  const [searchParams, setSearchParams] = useSearchParams()

  const fallbackTab = useMemo<T | ''>(() => {
    if (!tabs.length) return ''
    return defaultTab && tabs.includes(defaultTab as T) ? (defaultTab as T) : tabs[0]
  }, [defaultTab, tabs])

  const getValidTab = useCallback(
    (value?: string | null): T | '' => {
      if (!tabs.length) return ''
      return value && tabs.includes(value as T) ? (value as T) : fallbackTab
    },
    [fallbackTab, tabs],
  )

  const [localTab, setLocalTab] = useState<T | ''>(fallbackTab)

  useEffect(() => {
    if (!syncQuery) setLocalTab(fallbackTab)
  }, [fallbackTab, syncQuery])

  const activeTab = syncQuery ? getValidTab(searchParams.get(queryKey)) : localTab

  useEffect(() => {
    if (!syncQuery) return

    const queryValue = searchParams.get(queryKey)
    const validTab = getValidTab(queryValue)
    const shouldSkipInitialDefaultSync = !queryValue && Boolean(validTab) && validTab === fallbackTab

    if (queryValue === validTab || shouldSkipInitialDefaultSync || (!queryValue && !validTab)) return

    const nextSearchParams = new URLSearchParams(searchParams)
    if (validTab) nextSearchParams.set(queryKey, validTab)
    else nextSearchParams.delete(queryKey)
    setSearchParams(nextSearchParams, { replace: true })
  }, [fallbackTab, getValidTab, queryKey, searchParams, setSearchParams, syncQuery])

  const setActiveTab = useCallback(
    (tab: T) => {
      const nextTab = getValidTab(tab)

      if (!syncQuery) {
        setLocalTab(nextTab)
        return
      }

      const nextSearchParams = new URLSearchParams(searchParams)
      if (nextTab) nextSearchParams.set(queryKey, nextTab)
      else nextSearchParams.delete(queryKey)
      setSearchParams(nextSearchParams, { replace: true })
    },
    [getValidTab, queryKey, searchParams, setSearchParams, syncQuery],
  )

  return {
    activeTab,
    setActiveTab,
  }
}

export default useTab

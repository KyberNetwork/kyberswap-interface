import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const TIP_LINK_MODAL_QUERY_KEY = 'modal'
const TIP_LINK_MODAL_QUERY_VALUE = 'tip-link-generator'

export const useTipLinkGeneratorModal = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showTipLinkGenerator, setShowTipLinkGenerator] = useState(false)
  const [tipLinkMounted, setTipLinkMounted] = useState(false)

  const openTipLinkGenerator = () => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set(TIP_LINK_MODAL_QUERY_KEY, TIP_LINK_MODAL_QUERY_VALUE)
    setSearchParams(nextSearchParams, { replace: true })
    setShowTipLinkGenerator(true)
  }

  const closeTipLinkGenerator = () => {
    const nextSearchParams = new URLSearchParams(searchParams)
    if (nextSearchParams.get(TIP_LINK_MODAL_QUERY_KEY) === TIP_LINK_MODAL_QUERY_VALUE) {
      nextSearchParams.delete(TIP_LINK_MODAL_QUERY_KEY)
      setSearchParams(nextSearchParams, { replace: true })
    }
    setShowTipLinkGenerator(false)
  }

  useEffect(() => {
    setShowTipLinkGenerator(searchParams.get(TIP_LINK_MODAL_QUERY_KEY) === TIP_LINK_MODAL_QUERY_VALUE)
  }, [searchParams])

  useEffect(() => {
    if (showTipLinkGenerator) setTipLinkMounted(true)
  }, [showTipLinkGenerator])

  return {
    closeTipLinkGenerator,
    openTipLinkGenerator,
    showTipLinkGenerator,
    tipLinkMounted,
  }
}

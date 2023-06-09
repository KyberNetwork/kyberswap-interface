import Helmet from 'react-helmet'

interface SEOProps {
  title: string
  description: string
}

const SEO = ({ title, description }: SEOProps) => {
  return (
    <Helmet title={title}>
      <meta charSet="utf-8" />
      <html lang="en" />
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
    </Helmet>
  )
}

/**
 * /swap/bnb/knc-to-usdt vs /swap/bnb/usdt-to-knc has same content
 * => add canonical link that specify which is main page, => /swap/bnb/knc-to-usdt
 */
export const SEOSwap = ({ canonicalUrl }: { canonicalUrl: string }) => {
  if (!canonicalUrl) return null
  return (
    <Helmet>
      <link href={canonicalUrl} rel="canonical"></link>
    </Helmet>
  )
}

export default SEO

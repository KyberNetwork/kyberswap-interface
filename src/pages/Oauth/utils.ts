import { LoginFlow } from '@kybernetwork/oauth2'

export const getSupportLoginMethods = (loginFlow: LoginFlow | undefined) => {
  return loginFlow?.oauth_client?.metadata?.allowed_login_methods ?? []
}

const whiteListDomains = [/https:\/\/(.+?\.)?kyberswap.com/, /https:\/\/(.+)\.kyberengineering.io/]
const isValidRedirectURL = (url: string | undefined) => {
  try {
    if (!url) return false
    const newUrl = new URL(url) // valid url
    if (
      url.endsWith('.js') ||
      newUrl.pathname.endsWith('.js') ||
      !whiteListDomains.some(regex => newUrl.origin.match(regex))
    ) {
      return false
    }
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:'
  } catch (error) {
    return false
  }
}

export const navigateToUrl = (url: string | undefined) => {
  if (url && isValidRedirectURL(url)) window.location.href = url
}

type MessageParams = {
  domain: string
  uri: string
  address: string
  version: string
  nonce: string
  chainId: number
  issuedAt: string
  statement: string
}

// message follow eip https://eips.ethereum.org/EIPS/eip-4361
export const createSignMessage = ({
  domain,
  uri,
  address,
  version,
  nonce,
  chainId,
  issuedAt,
  statement,
}: MessageParams): string => {
  let prefix = [`${domain} wants you to sign in with your Ethereum account:`, address].join('\n')

  prefix = [prefix, statement].join('\n\n')
  if (statement) {
    prefix += '\n'
  }

  const suffix = [
    `URI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ` + chainId,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')

  return [prefix, suffix].join('\n')
}

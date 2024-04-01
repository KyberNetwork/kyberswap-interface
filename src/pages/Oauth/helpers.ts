import { LoginFlow, LoginMethod } from '@kyberswap/oauth2'

import { isInEnum, queryStringToObject } from 'utils/string'

export const getSupportLoginMethods = (loginFlow: LoginFlow | undefined) => {
  return loginFlow?.oauth_client?.metadata?.allowed_login_methods ?? []
}

export const canAutoSignInEth = (loginMethods: LoginMethod[]) => {
  const isIncludeEth = loginMethods.includes(LoginMethod.ETH)
  const totalMethod = loginMethods.length
  return (
    (isIncludeEth && totalMethod === 1) ||
    (isIncludeEth && totalMethod === 2 && loginMethods.includes(LoginMethod.ANONYMOUS))
  )
}

export const extractAutoLoginMethod = (loginFlow: LoginFlow) => {
  const loginMethods = getSupportLoginMethods(loginFlow)
  let autoLoginMethod: LoginMethod | undefined

  if (loginMethods.length === 1) {
    if (loginMethods.includes(LoginMethod.ANONYMOUS)) {
      throw new Error('Not found login method for this app')
    }
    if (loginMethods.includes(LoginMethod.GOOGLE)) {
      autoLoginMethod = LoginMethod.GOOGLE
    }
  }
  if (canAutoSignInEth(loginMethods)) {
    autoLoginMethod = LoginMethod.ETH
  }

  // auto login method from url
  const { type } = queryStringToObject(window.location.search)
  if (!autoLoginMethod && isInEnum(type + '', LoginMethod) && loginMethods.includes(type)) {
    autoLoginMethod = type as LoginMethod
  }
  return autoLoginMethod
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

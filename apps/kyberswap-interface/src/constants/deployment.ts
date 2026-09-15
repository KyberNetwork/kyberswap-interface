const TESTING_ORIGINS = [
  /^https:\/\/pre-release\.kyberswap\.com$/,
  /^https:\/\/kyberswap-interface-\d+\.pr\.kyberengineering\.io$/,
]

export const isTestingOrigin = (origin: string): boolean => TESTING_ORIGINS.some(pattern => pattern.test(origin))

export const IS_TESTING_DEPLOYMENT = isTestingOrigin(typeof window === 'undefined' ? '' : window.location.origin)

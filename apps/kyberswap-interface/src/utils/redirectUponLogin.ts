const LOGIN_REDIRECT_URL_LOCAL_STORAGE_KEY = 'login_redirect_url'

export const getLoginRedirectUrl = (): string => {
  const url = localStorage.getItem(LOGIN_REDIRECT_URL_LOCAL_STORAGE_KEY) || ''
  return url
}

export const setLoginRedirectUrl = (url = window.location.href) => {
  localStorage.setItem(LOGIN_REDIRECT_URL_LOCAL_STORAGE_KEY, url)
}

export const removeLoginRedirectUrl = () => {
  localStorage.removeItem(LOGIN_REDIRECT_URL_LOCAL_STORAGE_KEY)
}

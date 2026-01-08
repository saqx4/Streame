const REDIRECT_KEY = 'streame:post_login_redirect'

export const redirectToLogin = (currentPath?: string) => {
  try {
    const path = currentPath ?? (window.location.hash || '#/')
    localStorage.setItem(REDIRECT_KEY, path)
  } catch {
    // ignore
  }
  window.location.hash = '#/login'
}

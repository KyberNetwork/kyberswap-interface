/**
 * Shape of the Earn shell, shared by the layout itself and by the route-level fallback that stands
 * in for it while the Earn chunk loads. Kept free of imports so the fallback — which ships in the
 * main bundle — can read it without pulling the layout's dependencies along.
 */

export const SIDEBAR_WIDTH_EXPANDED = 220
export const SIDEBAR_WIDTH_COLLAPSED = 64

export const EARN_SIDEBAR_COLLAPSED_KEY = 'earn-sidebar-collapsed'

/** The sidebar starts in whichever state the user left it, so the fallback has to agree. */
export const readStoredSidebarCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(EARN_SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

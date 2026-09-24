const OPEN_MOBILE_CATALOG_EVENT = "marco:open-mobile-catalog";

/** Ask the mobile shop control to open the catalog browse sheet. */
export function requestMobileCatalogBrowse(): void {
  window.dispatchEvent(new CustomEvent(OPEN_MOBILE_CATALOG_EVENT));
}

/** Subscribe to catalog-browse open requests from the hamburger menu. */
export function subscribeMobileCatalogBrowse(onOpen: () => void): () => void {
  window.addEventListener(OPEN_MOBILE_CATALOG_EVENT, onOpen);
  return () => window.removeEventListener(OPEN_MOBILE_CATALOG_EVENT, onOpen);
}

/**
 * Removes the `?new=1` deep-link flag (used by "Add item"/"Add category"
 * quick actions) once its dialog closes, so a page refresh doesn't reopen it.
 */
export function clearNewParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("new")) return;
  url.searchParams.delete("new");
  window.history.replaceState(window.history.state, "", url);
}

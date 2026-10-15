"use client";

import { useCallback, useMemo, useRef } from "react";

/**
 * Remembers images uploaded while a form is open. On save, anything uploaded
 * but not kept is discarded; on cancel, everything uploaded is discarded.
 * This stops abandoned uploads from piling up in storage.
 */
export function useUploadTracker(discard: (urls: string[]) => void) {
  const uploaded = useRef<string[]>([]);

  const track = useCallback((url: string) => {
    uploaded.current.push(url);
    return url;
  }, []);

  const commit = useCallback(
    (kept: Array<string | null | undefined>) => {
      const unused = uploaded.current.filter((u) => !kept.includes(u));
      uploaded.current = [];
      discard(unused);
    },
    [discard],
  );

  const abandon = useCallback(() => {
    const all = uploaded.current;
    uploaded.current = [];
    discard(all);
  }, [discard]);

  return useMemo(() => ({ track, commit, abandon }), [track, commit, abandon]);
}

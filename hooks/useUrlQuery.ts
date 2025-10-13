
import React from 'react';

export function useUrlQuery(): URLSearchParams {
  const { search } = window.location;
  // useMemo is used to avoid re-creating the URLSearchParams object on every render
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

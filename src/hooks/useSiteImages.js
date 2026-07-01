import { useEffect, useState } from 'react';
import { getSiteImages } from '@backend/queries.js';

// Editable hero + editorial section images, read once from the Wix CMS `SiteImages` collection
// (backend-spec §2). Module-level cache so it's fetched a single time per page load and shared
// by Hero + Editorial. A read failure degrades to an empty list, so components always fall back
// to their bundled assets. Re-fetch happens on a full page reload (matches the catalogue's
// fetch-on-load model) — the client edits a photo in the Wix CMS, it shows on refresh.

let _cache = null; // resolved rows
let _promise = null; // in-flight

function load() {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) {
    _promise = getSiteImages()
      .then((rows) => {
        _cache = Array.isArray(rows) ? rows : [];
        return _cache;
      })
      .catch(() => {
        _cache = [];
        return _cache;
      });
  }
  return _promise;
}

export function useSiteImages() {
  const [rows, setRows] = useState(_cache || []);

  useEffect(() => {
    let alive = true;
    load().then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  // imageUrl for a section + slot, or null (→ caller uses its bundled fallback).
  const get = (section, slot = 1) => {
    const match = rows.find((r) => r.section === section && Number(r.slot) === Number(slot));
    return (match && match.imageUrl) || null;
  };

  return { rows, get };
}

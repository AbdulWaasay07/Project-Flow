import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';


export function useAuthFile(filename) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!filename) return;

    let objectUrl = null;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_BASE}/attachments/files/${filename}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filename]);

  return { blobUrl, loading, error };
}

export async function downloadAuthFile(filename, originalName) {
  try {
    const token = localStorage.getItem('token');
    const res   = await fetch(`${API_BASE}/attachments/files/${filename}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = originalName || filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    console.error('Download error:', err);
    throw err;
  }
}

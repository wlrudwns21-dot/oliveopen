'use client';

export async function api(path, method = 'GET', body) {
  const res = await fetch(`/api/admin/${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || res.statusText);
  return j;
}

export const list = (resource) => api(resource).then((j) => j.rows);
export const create = (resource, body) => api(resource, 'POST', body);
export const update = (resource, pk, body) => api(`${resource}/${pk}`, 'PATCH', body);
export const remove = (resource, pk) => api(`${resource}/${pk}`, 'DELETE');

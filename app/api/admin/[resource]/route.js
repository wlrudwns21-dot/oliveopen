import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { RESOURCES } from '../resources';

function guard(resource) {
  const conf = RESOURCES[resource];
  if (!conf) return { error: NextResponse.json({ error: 'unknown resource' }, { status: 404 }) };
  const session = requireAdmin(conf.perm);
  if (!session) return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  return { conf, session };
}

export async function GET(req, { params }) {
  const { conf, error } = guard(params.resource);
  if (error) return error;
  const { data, error: dbErr } = await db()
    .from(conf.table)
    .select(conf.select || '*')
    .order(conf.order || 'pk', { ascending: conf.order ? true : false });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  let rows = data || [];
  if (conf.hide) rows = rows.map((r) => { const c = { ...r }; conf.hide.forEach((h) => delete c[h]); return c; });
  return NextResponse.json({ rows });
}

export async function POST(req, { params }) {
  const { conf, error } = guard(params.resource);
  if (error) return error;
  const body = await req.json();
  delete body.pk;
  if (params.resource === 'member' && body.password) body.password = await hashPassword(body.password);
  const { data, error: dbErr } = await db().from(conf.table).insert(body).select().single();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ row: data });
}

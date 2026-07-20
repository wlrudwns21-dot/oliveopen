import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './supabase';

const SECRET = process.env.SESSION_SECRET || 'dev-secret';
export const MEMBER_COOKIE = 'oo_member';
export const ADMIN_COOKIE = 'oo_admin';

export function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw, 'utf8').digest('hex');
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

export function signSession(payload) {
  const body = b64url(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verifySession(token) {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export function getMemberSession() {
  return verifySession(cookies().get(MEMBER_COOKIE)?.value);
}

export function getAdminSession() {
  return verifySession(cookies().get(ADMIN_COOKIE)?.value);
}

/** 관리자 권한 확인. kind 를 주면 해당 권한이 거부되지 않았는지도 검사 */
export function requireAdmin(kind) {
  const s = getAdminSession();
  if (!s || !s.isAdmin) return null;
  if (kind && Array.isArray(s.denied) && s.denied.includes(kind)) return null;
  return s;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

/** 로그인한 회원의 그룹/권한 조회 → 관리자 세션 페이로드 계산 */
export async function buildAdminPayload(member) {
  const sb = db();
  const { data: maps } = await sb
    .from('member_group_mapping')
    .select('local_member_group_pk')
    .eq('local_member_pk', member.pk);
  const groupPks = (maps || []).map((m) => m.local_member_group_pk);
  if (!groupPks.length) return null;

  const { data: perms } = await sb
    .from('member_group_permission')
    .select('kind, resource, is_allowed')
    .in('member_group_pk', groupPks);

  const rows = perms || [];
  const isAdmin = rows.some((p) => p.kind === 'ADMIN' && p.resource === 'SYSTEM' && p.is_allowed);
  if (!isAdmin) return null;

  // 명시적으로 거부된 권한 목록 (예: MANAGE_MEMBERS=false)
  const denied = rows.filter((p) => p.is_allowed === false).map((p) => p.kind);
  return { pk: member.pk, id: member.id, nick: member.nick, isAdmin: true, denied };
}

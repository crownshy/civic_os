/**
 * The cookie that lets a Host preview a draft Campaign on the participant site.
 *
 * Admin and civicos are separate apps, so admin's `auth-token` never reaches
 * civicos. Admin copies it into this cookie, scoped to the parent domain both
 * apps share, which it works out from its own host and the participant site's.
 * It has its own name because civicos
 * already uses `auth-token` for the participant, and a Host must not vote or
 * answer demographics as their admin account.
 *
 * civicos reads it in one place: the Campaign lookup, and only after an
 * anonymous read was refused because the Campaign is a draft.
 */
export const HOST_SESSION_COOKIE = 'civicos-host-session';

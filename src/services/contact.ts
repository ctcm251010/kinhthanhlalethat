import { siteConfig } from '@/config/site';

export type ContactSubmissionResult =
  | { ok: true }
  | { ok: false; reason: 'unconfigured' | 'request_failed' };

export async function submitContactForm(form: HTMLFormElement): Promise<ContactSubmissionResult> {
  const endpoint = siteConfig.contactFormEndpoint;
  if (!endpoint) return { ok: false, reason: 'unconfigured' };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(new FormData(form))),
  });

  return response.ok ? { ok: true } : { ok: false, reason: 'request_failed' };
}

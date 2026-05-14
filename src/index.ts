import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { readTurnstileTokenFromUrl, verifyTurnstileToken } from '../../_shared/turnstile';
import { renderTextToolPage, turnstileSiteKeyFromEnv } from '../../_shared/tool-page';

type Env = { Bindings: { TURNSTILE_SITE_KEY?: string; TURNSTILE_SECRET_KEY?: string } };

const app = new Hono<Env>();
app.use('/api/*', cors());
app.get('/', (c) => c.html(renderTextToolPage({ title: 'Tech Stack Detector', description: 'Detect likely frameworks, CMSs, and analytics scripts from a page response.', endpoint: '/api/detect', sample: '{ "detections": ["Tailwind CSS"] }', siteKey: turnstileSiteKeyFromEnv(c.env), buttonLabel: 'Detect', toolSlug: 'tech-stack-detector' })));
app.get('/health', (c) => c.json({ ok: true }));
app.get('/api/detect', async (c) => {
  const captcha = await verifyTurnstileToken(c.env, readTurnstileTokenFromUrl(c.req.url), c.req.header('CF-Connecting-IP'));
  if (!captcha.ok) return c.json({ error: captcha.error }, 403);
  const normalized = normalizeUrl(c.req.query('url') ?? '');
  if (!normalized) return c.json({ error: 'A valid http(s) URL is required.' }, 400);
  const response = await fetch(normalized, { headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'Lindo Free Tools/1.0 (+https://lindo.ai/tools)' } }).catch(() => null);
  if (!response?.ok) return c.json({ error: 'Failed to fetch page.' }, 502);
  const html = (await response.text()).toLowerCase();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const detections = detect(html, headers);
  return c.json({ url: normalized, detections });
});

function detect(html: string, headers: Record<string, string>) {
  const rules = [
    ['Next.js', /__next|_next\//],
    ['React', /react|data-reactroot/],
    ['Vue', /__vue|vue\./],
    ['Nuxt', /__nuxt|nuxt/],
    ['Tailwind CSS', /tailwind|--tw-/],
    ['Bootstrap', /bootstrap/],
    ['WordPress', /wp-content|wordpress/],
    ['Shopify', /cdn\.shopify|shopify/],
    ['Webflow', /webflow/],
    ['Wix', /wixstatic|wix\.com/],
    ['Google Analytics', /gtag\(|google-analytics|googletagmanager/],
    ['HubSpot', /hs-script-loader|hubspot/],
  ] as const;
  const found: string[] = rules.filter(([, regex]) => regex.test(html)).map(([name]) => name);
  if ((headers.server || '').toLowerCase().includes('cloudflare')) found.push('Cloudflare');
  return Array.from(new Set(found));
}

function normalizeUrl(value: string): string | null { try { return new URL(value.startsWith('http') ? value : `https://${value}`).toString(); } catch { return null; } }
export default app;

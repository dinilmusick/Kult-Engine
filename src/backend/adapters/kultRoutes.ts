/**
 * @file kultRoutes.ts
 * @description Route handler for Kult service authoring, execution, and export.
 * Conforms to Skipo Governance (< 200 lines). Law L8 compliant.
 */

import { DepmBackend } from '../DepmBackend.js';
import { createLocalServiceFromKloksAsset, getKloksServiceAsset } from '../../libraries/services/assetDiscovery.js';

export async function handleKultRoutes(
  request: Request,
  url: URL,
  userId: string,
  jsonRes: (data: unknown, status?: number) => Response,
  parseBody: (req: Request) => Promise<any>
): Promise<Response | null> {
  const { pathname } = url;
  const { method } = request;

  if (pathname === '/api/skipo-agent/context' && method === 'GET') {
    return jsonRes(DepmBackend.services.skipoAgent.inspect());
  }
  if (pathname === '/api/skipo-agent/suggest' && method === 'GET') {
    return jsonRes({ suggestions: DepmBackend.services.skipoAgent.suggest(url.searchParams.get('q') || '') });
  }
  if (pathname === '/api/skipo-agent/promotion-plan' && method === 'POST') {
    return jsonRes(DepmBackend.services.skipoAgent.promotionPlan(await parseBody(request)));
  }

  if (pathname === '/api/kult/npm/search' && method === 'GET') {
    const q = url.searchParams.get('q') || '';
    if (!q.trim()) return jsonRes({ success: true, packages: [] });
    try {
      const response = await fetch('https://registry.npmjs.org/-/v1/search?text=' + encodeURIComponent(q) + '&size=20');
      const body = await response.json() as any;
      const packages = (body.objects || []).map((x: any) => x.package?.name).filter(Boolean);
      const preferred = packages.filter((name: string) => name.startsWith('@dinilmusick/') || name.startsWith('@ultrst-armada/'));
      return jsonRes({ success: true, packages: [...preferred, ...packages.filter((n: string) => !preferred.includes(n))] });
    } catch (error: any) {
      return jsonRes({ success: false, packages: [], error: error?.message || 'npm registry unavailable' }, 502);
    }
  }

  if (pathname === '/api/kult/kloks/services' && method === 'GET') {
    if (!userId) return jsonRes({ success: false, error: 'A valid SRKL session is required.' }, 401);
    const { discoverKloksAssets } = await import('../../libraries/services/assetDiscovery.js');
    return jsonRes({
      success: true,
      services: discoverKloksAssets()
        .filter((a: any) => a.category === 'services')
        .map((a: any) => ({ ...a, id: encodeURIComponent(a.export) })),
    });
  }

  const copyMatch = pathname.match(/^\/api\/kult\/kloks\/services\/([^/]+)\/copy$/);
  if (copyMatch && method === 'POST') {
    if (!userId) return jsonRes({ success: false, error: 'A valid SRKL session is required.' }, 401);
    const asset = getKloksServiceAsset(copyMatch[1]);
    if (!asset) return jsonRes({ success: false, status: 404, error: 'KLOKS service not found.' }, 404);
    return jsonRes({ success: true, service: createLocalServiceFromKloksAsset(asset) });
  }

  if (pathname === '/api/kult/validate' && method === 'POST') {
    if (!userId) return jsonRes({ success: false, error: 'A valid SRKL session is required.' }, 401);
    return jsonRes(await DepmBackend.services.service.engineer({ ...(await parseBody(request)), mode: 'validate' }));
  }

  if (pathname === '/api/kult/engine' && method === 'POST') {
    if (!userId) return jsonRes({ success: false, error: 'A valid SRKL session is required.' }, 401);
    const body = await parseBody(request);
    return jsonRes(await DepmBackend.services.service.engineer(body));
  }

  if (pathname === '/api/kult/execute' && method === 'POST') {
    if (!userId) return jsonRes({ success: false, error: 'A valid SRKL session is required.' }, 401);
    const b = await parseBody(request);
    return jsonRes(await DepmBackend.services.kult.execute(b.document, b.inputs));
  }

  if (pathname === '/api/kult/export' && method === 'POST') {
    if (!userId) return jsonRes({ success: false, error: 'A valid SRKL session is required.' }, 401);
    return jsonRes(DepmBackend.services.kult.exportArtifact((await parseBody(request)).document));
  }

  if (pathname === '/api/kult/promote' && method === 'POST') {
    if (!userId) return jsonRes({ success: false, error: 'A valid SRKL session is required.' }, 401);
    return jsonRes(await DepmBackend.services.kult.promote((await parseBody(request)).document));
  }

  return null;
}

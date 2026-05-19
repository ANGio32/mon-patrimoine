export const config = { runtime: 'edge' };

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

const SYSTEM_PROMPT = 'Ingénieur structures expert CSA S6-19. Réponds UNIQUEMENT en JSON valide, sans markdown.';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let geo: Record<string, unknown>;
  let loads: Record<string, unknown>;
  let analysis: Record<string, unknown>;
  try {
    const body = await req.json() as { geo?: unknown; loads?: unknown; analysis?: unknown };
    if (!body.geo || !body.loads || !body.analysis) throw new Error('Missing fields');
    geo = body.geo as Record<string, unknown>;
    loads = body.loads as Record<string, unknown>;
    analysis = body.analysis as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userPrompt = `Analyse les données structurales suivantes d'un pont et donne 3 recommandations concrètes d'ingénierie en français. Chaque recommandation doit être max 2 phrases.

Données du pont :
- Type de structure : ${geo.structure_type}
- Type de tablier : ${geo.deck_type}
- Travées : ${geo.spans}
- Longueur totale : ${geo.total_length_m} m
- Largeur : ${geo.width_m} m
- Dégagement : ${geo.clearance_m} m
- Piles : ${geo.has_piers ? `Oui (${geo.pier_count} piles)` : 'Non'}
- Culées : ${geo.has_abutments ? 'Oui' : 'Non'}

Résultats d'analyse :
- Vmax ULS : ${analysis.Vmax} kN
- Mmax ULS : ${analysis.Mmax} kN·m

Charges :
- Nombre de voies : ${loads.num_lanes}
- Classe de camion : ${loads.truck_class}
- Province : ${loads.province}
- Zone de verglas : ${loads.ice_zone}
- Zone sismique : ${loads.seismic}

Retourne UNIQUEMENT ce JSON :
{ "recommendations": ["...", "...", "..."] }`;

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json() as { content?: Array<{ text: string }> };
    const content = data.content?.[0]?.text ?? '{}';

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]) as Record<string, unknown>;
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

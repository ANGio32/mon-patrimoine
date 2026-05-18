export const config = { runtime: 'edge' };

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

const SYSTEM_PROMPT = 'Structural engineering AI. Respond ONLY with valid JSON, no markdown.';

const USER_PROMPT = `Analyze this structural engineering plan.
Return ONLY this exact JSON:
{
  "structure_type": "bridge|viaduct|culvert|pedestrian|other",
  "description": "2 sentences max describing what you see",
  "detected": {
    "spans": <integer>,
    "total_length_m": <number>,
    "width_m": <number>,
    "clearance_m": <number>,
    "deck_type": "slab|box_girder|i_beam|t_beam|arch|unknown",
    "has_piers": <boolean>,
    "pier_count": <integer>,
    "has_abutments": <boolean>,
    "has_walls": <boolean>
  },
  "confidence": "low|medium|high",
  "notes": "<any important observations>"
}`;

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

  let base64: string;
  let mediaType: string;
  try {
    const body = await req.json() as { base64?: string; mediaType?: string };
    base64 = body.base64 ?? '';
    mediaType = body.mediaType ?? '';
    if (!base64 || !mediaType) throw new Error('Missing fields');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: USER_PROMPT },
            ],
          },
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

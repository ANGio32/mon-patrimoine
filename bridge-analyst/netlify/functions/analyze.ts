import { Handler } from '@netlify/functions';

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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let base64: string;
  let mediaType: string;
  try {
    const body = JSON.parse(event.body ?? '{}');
    base64 = body.base64;
    mediaType = body.mediaType;
    if (!base64 || !mediaType) throw new Error('Missing fields');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
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
      return { statusCode: response.status, body: JSON.stringify({ error: err }) };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? '{}';

    // Parse and validate JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from content
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
};

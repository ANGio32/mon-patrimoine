import type { AIAnalysis } from '../types';

const API_URL = '/api/analyze';

export async function analyzeStructurePlan(base64: string, mediaType: string): Promise<AIAnalysis> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const body = JSON.stringify({ base64, mediaType });

  const attempt = async (): Promise<Response> => {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    return resp;
  };

  let response: Response;
  try {
    response = await attempt();
  } catch {
    // Retry once on network error
    response = await attempt();
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  // Graceful fallback if JSON parse fails or fields missing
  const fallback: AIAnalysis = {
    structure_type: 'bridge',
    description: 'Plan importé. Vérifiez les données détectées.',
    detected: {},
    confidence: 'low',
    notes: '',
  };

  try {
    return {
      structure_type: data.structure_type ?? fallback.structure_type,
      description: data.description ?? fallback.description,
      detected: data.detected ?? {},
      confidence: data.confidence ?? 'low',
      notes: data.notes ?? '',
    };
  } catch {
    return fallback;
  }
}

export function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mediaType = header.split(':')[1].split(';')[0];
      resolve({ base64, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

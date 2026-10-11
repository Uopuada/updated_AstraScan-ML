export async function analyzeSatelliteImagery(base64Image: string, mimeType: string, isTargeted: boolean = false, userNote?: string): Promise<string> {
  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, mimeType, isTargeted, userNote })
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${response.status}`);
  }
  
  const data = await response.json();
  return data.text || "No analysis generated.";
}

export async function summarizeText(text: string): Promise<string> {
  const response = await fetch('/api/gemini/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${response.status}`);
  }
  
  const data = await response.json();
  return data.text || "No summary generated.";
}

export async function autoDetectFeatures(base64Image: string, mimeType: string): Promise<string> {
  const response = await fetch('/api/gemini/autodetect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, mimeType })
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${response.status}`);
  }
  
  const data = await response.json();
  return data.text || "{\"features\": []}";
}

export async function compareSatelliteImagery(
  base64A: string, mimeTypeA: string,
  base64B: string, mimeTypeB: string,
  userNote?: string
): Promise<string> {
  const response = await fetch('/api/gemini/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64A, mimeTypeA, base64B, mimeTypeB, userNote })
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${response.status}`);
  }
  
  const data = await response.json();
  return data.text || "{}";
}

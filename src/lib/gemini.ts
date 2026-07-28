import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateContentWithRetry(request: any, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent(request);
    } catch (error: any) {
      if (error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429 || error?.code === 429 || error?.message?.includes('429')) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        // Exponential backoff with jitter
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}


const SYSTEM_INSTRUCTION = `You are a specialist in Aerial Archaeology and Remote Sensing.
Your task is to analyze the provided satellite imagery and identify potential archaeological and geographical features. 
You must use the following categories and terms as the key for your interpretation. Please structure your response as a Markdown report.

--- KEY START ---
1. Climate Zone: (Arid, Tropical, Temperate, Cold, Polar)
2. Surface: (Agricultural & Landscape Modifications, Settlements, Soil Features)
3. Agricultural & Landscape: (Plough Mark, Ploughland, Ridge & Furrow, Terrace, Embankment)
4. Settlements: (Village, Town, Hamlet, City, Nomadic Settlement, Pastoralist Settlement, Rural Settlement, Unenclosed Settlement, Settlement Mound, Urban Settlement, Modern Settlement, etc.)
5. Soil Features: (Buried Soil, Burned Soil, Discoloration)
6. RS Activity: Aerial Investigation & Mapping, Remote Sensing
7. Shape: (Circular, Curvilinear, Irregular, Semi-Circular, Sub-Circular...)
8. LULC (Land Use Land Cover): Built-up urban, Built-up rural, Industrial, Residential, Bare rock or Soil, Degraded land, Thicket/Brushland, Scrub, Permanent Cropland, Temporary Cropland, Closed Forest, Open forest, Dense natural forest, Degraded grassland, Dense grassy woodland, Sparse grassy woodland, Exclusive mangroves, Species Associated mangroves, Species Mixed shrubland, Deciduous or Coniferous shrubland, Herbaceous wetland, Wooded wetland, Indigenous wooded grassland, Anthropogenic
9. Image Source -> Generic Satellite Imagery Source/name, Google Earth Pro, Bing Imagery
10. Water management: Drain, Canal, Cesspit, Dam, Well, Pond, Irrigation, Qanat
11. Structures & architecture: Desert, Camp, Pyramid, Barn, Building complex, other, Memorial, arch, War memorial, Cairn, Tumulus, Simple cairn, Ring cairn, Axle-shape/propellor, Basket-handle, Boulder Burial, Cairns with (short) lines of Orthostats, Chapel Monument, Choucha/chouchet, Bazina, Drum Monuments, Drum Tombs, Composite Monument, Concentric rings, Corbeille, Crater-topped tumulus, Crescent (regular), Dune-shaped crescent, Crescent Antenna, Crescent with Tails, Disc Tumulus, Enclosed Villages, Flat-topped Tumulus, Goulet (Type 1), Goulet (Type 2), Heel-shaped Cairn, Interrupted Ring, Kerb Burial, Islamic tomb, Keyhole Monument, Kite-Like Structure, (Desert) Kites, Marker Cairn/Balise, Monument with Auxiliary Towers, Mounded Crescent, Pot-bellied crescent, Paved Crescent, Antenna monument, Bulb & Antenna, Rectangle, Ridge Monuments, Platform Tumulus, Small Auxiliary Towers, Standing Stone Site, Stone Alignment, U-structure, Stone Concentrations/Spreads, Stone Emplacements, Stone Half Ring, Horse-shoe/Fatima tent, Stone Outline, Stone Platform, Stone Ring, Tumulus with Arms/Wings, V-Shape, V-Type Monument, Walling, Enclosure (Stone, Vegetation, Complex, Single, Double, Bi-lobial), Structure, Fence, Stone circle, Statue, Shaft, Pit.
12. Specialized features: Kite, Stela, Henge, Furnace, Mine, Quarry, Terracing
13. Defensive structures: City or town bastion, Barbican, Castle, Fort, Fortress, City or town gate, Moat, Turret, Watchtower, Citadel, Hillfort
14. Burial & funerary: Cemetery, Tomb, Rock-cut tomb, Burial mound, Burial, Mausoleum
15. Routes & infrastructure: Ancient route, Path, Road, Stopping place, Trackway, Caravanserai, Waystation, Wharf
--- KEY END ---

For each category, if you observe features matching the terms in the imagery, list them and describe their appearance, location within the image, and any plausible interpretation. If a category is not visible or applicable, you may briefly note that or skip it.
Format your output cleanly in Markdown, using headings for categories.`;

export async function analyzeSatelliteImagery(base64Image: string, mimeType: string, isTargeted: boolean = false, userNote?: string): Promise<string> {
  const imagePart = {
    inlineData: {
      mimeType,
      data: base64Image,
    },
  };

  let prompt = "Analyze this satellite imagery using your expertise and the provided key.";
  if (isTargeted) {
    prompt = "CRITICAL INSTRUCTION: The user has visually drawn annotations (colored lines, shapes, or text) on the image provided in this request. You MUST STRICTLY only interpret the specific features, spots, or areas highlighted by these drawings. Do NOT analyze the background or general image landscape. Your report should focus exclusively on what is highlighted.";
  }
  
  if (userNote) {
    prompt += `\n\nUSER-PROVIDED CONTEXT/NOTE: The user has provided the following information to assist in your analysis: "${userNote}". Please incorporate this context into your interpretation if relevant.`;
  }

  const response = await generateContentWithRetry({
    model: "gemini-3.6-flash",
    contents: [{
      parts: [
        imagePart,
        { text: prompt }
      ]
    }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
    }
  });

  return response.text || "No analysis generated.";
}

export async function summarizeText(text: string): Promise<string> {
  const prompt = "Summarize the following archaeological/geographical analysis report. Provide a concise bulleted summary of the main findings only.";
  
  const response = await generateContentWithRetry({
    model: "gemini-3.6-flash",
    contents: [{
      parts: [
        { text: prompt },
        { text }
      ]
    }],
    config: {
      temperature: 0.3,
    }
  });

  return response.text || "No summary generated.";
}

const autoDetectSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    features: {
      type: Type.ARRAY,
      description: "A list of coordinates (percentages 0-100) mapping to specific spotted structures or features.",
      items: {
        type: Type.OBJECT,
        properties: {
          x: { type: Type.NUMBER, description: "X coordinate as a percentage of the image width (0-100)" },
          y: { type: Type.NUMBER, description: "Y coordinate as a percentage of the image height (0-100)" },
          width: { type: Type.NUMBER, description: "Width of the bounding box as a percentage" },
          height: { type: Type.NUMBER, description: "Height of the bounding box as a percentage" },
          label: { type: Type.STRING, description: "A brief label indicating the feature (e.g., 'Burial Mound', 'Embankment')" }
        },
        required: ["x", "y", "width", "height", "label"]
      }
    }
  },
  required: ["features"]
};

export async function autoDetectFeatures(base64Image: string, mimeType: string): Promise<string> {
  const imagePart = {
    inlineData: {
      mimeType,
      data: base64Image,
    },
  };

  const prompt = `Automatically scan this satellite imagery and detect potential archaeological and geographical features based on your expertise. Return a JSON array mapping coordinates surrounding the features, and provide a short label. Focus on clear structures, ruins, embankments, patterns, or water management systems.`;

  const response = await generateContentWithRetry({
    model: "gemini-3.6-flash",
    contents: [{
      parts: [
        imagePart,
        { text: prompt }
      ]
    }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: autoDetectSchema
    }
  });

  return response.text || "{\"features\": []}";
}

const compareSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    markdownReport: { type: Type.STRING, description: "A detailed markdown report of the differences between Dataset A and Dataset B." },
    differences: {
      type: Type.ARRAY,
      description: "A list of coordinates (percentages 0-100) mapping to specific spotted differences.",
      items: {
        type: Type.OBJECT,
        properties: {
          x: { type: Type.NUMBER, description: "X coordinate as a percentage of the image width (0-100)" },
          y: { type: Type.NUMBER, description: "Y coordinate as a percentage of the image height (0-100)" },
          width: { type: Type.NUMBER, description: "Width of the bounding box as a percentage" },
          height: { type: Type.NUMBER, description: "Height of the bounding box as a percentage" },
          description: { type: Type.STRING, description: "A brief tooltip description of the discrepancy found in this box." }
        },
        required: ["x", "y", "width", "height", "description"]
      }
    }
  },
  required: ["markdownReport", "differences"]
};

export async function compareSatelliteImagery(
  base64A: string, mimeTypeA: string,
  base64B: string, mimeTypeB: string,
  userNote?: string
): Promise<string> {
  const imagePartA = { inlineData: { mimeType: mimeTypeA, data: base64A } };
  const imagePartB = { inlineData: { mimeType: mimeTypeB, data: base64B } };

  let prompt = `Compare these two uploaded satellite images (Image A is first, Image B is second). 
Please visually highlight the areas of significant difference in their analysis results. 
Identify differences in terrain, weather, land use (LULC), potential new structures, excavations, or deforestation.
You must return a JSON object with a 'markdownReport' containing your textual comparison summary, and an array of 'differences' indicating coordinate boundaries where the changes occurred.`;

  if (userNote) {
    prompt += `\n\nUSER-PROVIDED CONTEXT/NOTE: The user has provided the following information to assist in your comparison: "${userNote}". Please incorporate this context into your interpretation if relevant.`;
  }

  const response = await generateContentWithRetry({
    model: "gemini-3.6-flash",
    contents: [{
      parts: [
        imagePartA,
        imagePartB,
        { text: prompt }
      ]
    }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: compareSchema
    }
  });

  return response.text || "{}";
}

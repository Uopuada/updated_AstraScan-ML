import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
      throw new Error("A valid GEMINI_API_KEY is required. Please set your Gemini API key in the Settings menu under Secrets.");
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

async function generateContentWithRetry(request: any, maxRetries = 5) {
  const aiClient = getAI();
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await aiClient.models.generateContent(request);
    } catch (error: any) {
      if (error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429 || error?.code === 429 || error?.message?.includes('429')) {
        attempt++;
        if (attempt >= maxRetries) throw error;
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

const autoDetectSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    features: {
      type: Type.ARRAY,
      description: "A list of coordinates (percentages 0-100) mapping to specific spotted structures or features. Meticulously find geometric shapes and categorize them accurately.",
      items: {
        type: Type.OBJECT,
        properties: {
          x: { type: Type.NUMBER, description: "X coordinate as a percentage of the image width (0-100)" },
          y: { type: Type.NUMBER, description: "Y coordinate as a percentage of the image height (0-100)" },
          width: { type: Type.NUMBER, description: "Width of the bounding box as a percentage" },
          height: { type: Type.NUMBER, description: "Height of the bounding box as a percentage" },
          label: { type: Type.STRING, description: "A highly descriptive label for the feature incorporating its shape (e.g., 'Circular Enclosure', 'Linear Embankment', 'Rectangular Building Complex', 'Square Fort')" }
        },
        required: ["x", "y", "width", "height", "label"]
      }
    }
  },
  required: ["features"]
};

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

// API Routes
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { base64Image, mimeType, isTargeted, userNote } = req.body;
    
    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const imagePart = {
      inlineData: { mimeType, data: base64Image },
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
      contents: [{ parts: [imagePart, { text: prompt }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.2 }
    });

    res.json({ text: response?.text || "No analysis generated." });
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze" });
  }
});

app.post("/api/gemini/summarize", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    const prompt = "Summarize the following archaeological/geographical analysis report. Provide a concise bulleted summary of the main findings only.";
    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: [{ parts: [{ text: prompt }, { text }] }],
      config: { temperature: 0.3 }
    });

    res.json({ text: response?.text || "No summary generated." });
  } catch (error: any) {
    console.error("Summarize error:", error);
    res.status(500).json({ error: error.message || "Failed to summarize" });
  }
});

app.post("/api/gemini/autodetect", async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    if (!base64Image || !mimeType) return res.status(400).json({ error: "Missing image data" });

    const imagePart = {
      inlineData: { mimeType, data: base64Image },
    };

    const prompt = `Automatically scan this satellite imagery and meticulously detect potential archaeological, geographical, and landscape features based on your expert knowledge.
Crucially, look for specific geometric patterns that often indicate human activity:
- Circular features (e.g., ring cairns, enclosures, roundhouses, burial mounds)
- Linear features (e.g., ancient routes, walls, embankments, trackways, canals)
- Rectangular and Square features (e.g., building complexes, forts, farmsteads, courts, terraces)
- Other geometric shapes (U-shape, D-shape, curvilinear, etc.)

Integrate the provided Archaeological vocabulary (Settlements, Soil Features, Water Management, Structures & Architecture, Defensive structures, Burial & funerary, Routes & infrastructure, etc.) to accurately classify these features. 
Return a JSON array mapping bounding box coordinates (x, y, width, height as percentages 0-100) surrounding the detected features, and provide a descriptive label for each. Ensure the label uses professional archaeological terminology.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: [{ parts: [imagePart, { text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: autoDetectSchema
      }
    });

    res.json({ text: response?.text || "{\"features\": []}" });
  } catch (error: any) {
    console.error("Autodetect error:", error);
    res.status(500).json({ error: error.message || "Failed to autodetect" });
  }
});

app.post("/api/gemini/compare", async (req, res) => {
  try {
    const { base64A, mimeTypeA, base64B, mimeTypeB, userNote } = req.body;
    if (!base64A || !base64B) return res.status(400).json({ error: "Missing image data" });

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
      contents: [{ parts: [imagePartA, imagePartB, { text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: compareSchema
      }
    });

    res.json({ text: response?.text || "{}" });
  } catch (error: any) {
    console.error("Compare error:", error);
    res.status(500).json({ error: error.message || "Failed to compare" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

# Satellite Imagery Archaeological Analysis

## 🎯 Aim and Objectives
The primary aim of this web application is to assist archaeologists, researchers, and remote sensing professionals in analyzing satellite imagery to detect and classify potential archaeological and geographical features. 

**Objectives:**
- Automate the preliminary visual inspection of satellite imagery using advanced artificial intelligence.
- Provide a standardized classification system for identifying settlements, agricultural modifications, soil features, water management systems, and defensive structures.
- Enable temporal and comparative analysis to detect structural changes, excavations, or land-use changes over time.
- Offer an interactive, intuitive workspace for experts to annotate, zoom, and inspect high-resolution imagery.
- Streamline the reporting process by exporting automated findings into shareable PDF documents.

## 🛠️ Technology Stack & Programming Language
- **Core Programming Language:** The application is built entirely using **TypeScript** (a statically typed superset of **JavaScript**). Python was *not* used for the development of this web application.
- **Frontend Framework:** React 19, initialized via Vite, utilizing Tailwind CSS for responsive and modern UI styling.
- **Image Manipulation & UI:** `react-zoom-pan-pinch` for the interactive canvas workspace, `lucide-react` for iconography.
- **Reporting:** `jspdf` and `html2canvas` are utilized to capture the workspace and generate downloadable PDF reports.

## 🧠 Machine Learning & AI Integration
Rather than training a custom, specialized machine learning model from scratch using Python (e.g., PyTorch or TensorFlow), this application leverages **Google's Gemini Multimodal Large Language Model (LLM)**. 

Specifically, it uses the `@google/genai` SDK to communicate with the **Gemini Flash** model. 
- **Methodology:** The AI acts as an expert system. It is supplied with a strict "System Instruction" containing an extensive classification key (covering climate zones, LULC, burial funerary types, etc.).
- **Computer Vision:** The multimodal capabilities of Gemini allow it to "see" the uploaded satellite imagery (encoded as Base64) and cross-reference visual anomalies against the provided archaeological key.
- **Structured Output:** The application uses strict JSON Schemas to force the AI to return exact coordinate bounding boxes (`x, y, width, height`) for automatic feature detection, alongside generating descriptive Markdown reports.

## 🚀 What the WebApp Can Do (Features)
1. **Single Image Analysis:** Upload a satellite image and run an AI scan to generate a comprehensive archaeological report. 
2. **Auto-Detect Features:** The AI scans the image and automatically draws bounding boxes over areas of interest (e.g., "Burial Mound", "Embankment").
3. **Compare Analysis (A/B Testing):** Upload two images (e.g., historical vs. current) to visually highlight and document differences, such as new excavations or deforestation.
4. **Targeted / Manual Annotation:** Users can manually draw bounding boxes or annotations on the image to force the AI to focus its analysis *only* on the highlighted regions.
5. **Batch Analysis:** Queue up multiple satellite images for sequential AI processing.
6. **History & PDF Export:** All analyses are saved in a local History log. Users can export their annotated images and AI-generated markdown reports directly to a PDF file for documentation and sharing.

## ⚙️ How It Functions (User Workflow)
1. **Upload:** The user selects the desired module (Single, Compare, or Batch) from the sidebar and uploads satellite imagery (JPEG/PNG/WebP).
2. **Inspect & Annotate:** The image loads into the interactive workspace. The user can zoom, pan, and optionally draw manual annotations using the toolbar.
3. **Analyze:** The user clicks "Run AI Scan". The image is converted to a secure format and sent to the Gemini AI API along with the system instructions and any user-provided context notes.
4. **Review:** The AI returns structured coordinates and a detailed report. The workspace automatically draws the detected features onto the image canvas.
5. **Export:** The user reviews the findings, adjusts as needed, and clicks "Export to PDF" to generate a final, shareable document combining the annotated imagery and the text report.

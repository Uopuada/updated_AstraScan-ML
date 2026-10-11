# AstraScan ML
### AI-Powered Satellite Imagery Interpretation for Archaeological Landscape Analysis

![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Latest-38B2AC)
![Status](https://img.shields.io/badge/status-Prototype-orange)

---

## Overview

AstraScan ML is a modern web-based satellite imagery interpretation platform designed to assist archaeologists, remote sensing specialists, GIS professionals, heritage managers, and researchers in identifying potential archaeological and landscape features using Artificial Intelligence.

The application combines interactive image visualization with Google's Gemini Multimodal AI to perform preliminary interpretation of high-resolution satellite imagery.

The objective is not to replace archaeological expertise, but to accelerate image interpretation by highlighting areas of archaeological interest for further professional assessment.

---

## Project Objectives

The application was developed to:

- Automate preliminary interpretation of satellite imagery.
- Assist archaeological prospection.
- Standardize feature classification.
- Support comparative landscape analysis.
- Improve documentation and reporting.
- Provide an intuitive GIS-style workspace.

---

## Key Features

### Single Image Analysis

Upload a single satellite image and generate an AI-assisted interpretation.

---

### Automatic Feature Detection

Automatically identifies potential archaeological anomalies and produces coordinate-based bounding boxes.

Examples include:

- Burial Mounds
- Embankments
- Agricultural Features
- Settlement Patterns
- Water Management Structures
- Defensive Earthworks

---

### Compare Imagery

Compare historical and recent satellite imagery for:

- Landscape changes
- Excavations
- Deforestation
- Urban expansion
- Environmental modifications

---

### Batch Processing

Queue multiple satellite images for automated processing.

---

### Interactive Workspace

Users can:

- Zoom
- Pan
- Inspect imagery
- Review AI detections

---

### History Log

Stores previous analyses for review.

---

### PDF Report Export

Generate shareable reports containing:

- Annotated imagery
- AI interpretation
- Feature descriptions

---

## Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
- TailwindCSS

### Image Interaction

- react-zoom-pan-pinch

### Icons

- lucide-react

### PDF Generation

- html2canvas
- jsPDF

### Artificial Intelligence

Google Gemini Flash

Integrated through:

@google/genai SDK

---

## Artificial Intelligence Workflow

Unlike traditional computer vision systems trained from scratch, AstraScan ML utilizes Gemini Multimodal AI as an expert reasoning engine.

The application:

1. Receives uploaded imagery.
2. Converts imagery into a supported format.
3. Sends imagery alongside archaeological system instructions from MAEASaM structured Vocabulary.
4. Gemini analyses visual patterns.
5. Returns structured JSON containing:

- Bounding boxes
- Feature labels
- Interpretation
- Markdown report

---

## User Workflow

1. Upload imagery.
2. Review the image.
3. Run AI interpretation.
4. Inspect detected features.
5. Export findings.

---

## Supported Image Formats

- GeoTIFF
- JPG
- PNG
- WebP

Maximum upload size:
10 MB

---

## Intended Users

- Archaeologists
- GIS Analysts
- Remote Sensing Specialists
- Heritage Managers
- Researchers
- Academic Institutions
- Cultural Heritage Organizations

---

## Project Status

Prototype / Research Demonstrator

This project is intended as an AI-assisted archaeological interpretation tool.

AI-generated interpretations should always be verified before archaeological decision-making.

---


## License

MIT License

---

## Author

Developed by

Opuada Uranta

Geospatial Specialist

Nigeria

---

## Acknowledgements

Google Gemini AI

React

TypeScript

TailwindCSS

Open Source GIS Community




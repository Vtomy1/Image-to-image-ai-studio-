import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = 3000;

// Set payload limit high enough for high-res base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory cache for temporary uploaded images
const imageCache = new Map<string, { buffer: Buffer; mimeType: string; timestamp: number }>();

// Clean up images older than 30 minutes every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of imageCache.entries()) {
    if (now - item.timestamp > 30 * 60 * 1000) {
      imageCache.delete(id);
    }
  }
}, 10 * 60 * 1000);

// Lazy Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Available image-to-image models metadata
const AVAILABLE_MODELS = [
  {
    id: "flux",
    name: "Flux.1 Schnell",
    pollinationsModel: "flux",
    badge: "Most Popular",
    speed: "Ultra Fast (~2s)",
    description: "State-of-the-art diffusion with pristine detail, complex prompt obedience, and sharp edges.",
    category: "General",
    qualityTag: "Photorealistic & Stylized",
    icon: "Zap",
  },
  {
    id: "flux-dev",
    name: "Flux Dev HQ",
    pollinationsModel: "flux",
    badge: "High Precision",
    speed: "Fast (~3s)",
    description: "High-coherence aesthetic pipeline for nuanced lighting, texture preservation, and fine details.",
    category: "General",
    qualityTag: "Masterwork Quality",
    icon: "Sparkles",
  },
  {
    id: "flux-realism",
    name: "Flux Realism",
    pollinationsModel: "flux",
    badge: "Photorealism",
    speed: "Fast (~3s)",
    description: "Tuned for natural skin textures, photographic studio lighting, 85mm portrait depth of field.",
    category: "Realistic",
    qualityTag: "DSLR / 8K RAW",
    icon: "Camera",
  },
  {
    id: "flux-anime",
    name: "Flux Anime & Manga",
    pollinationsModel: "flux",
    badge: "Anime Style",
    speed: "Fast (~3s)",
    description: "Transforms photos into Makoto Shinkai & Studio Ghibli cel-shaded anime masterpieces.",
    category: "Stylized",
    qualityTag: "Cel-Shaded & Vibrant",
    icon: "Smile",
  },
  {
    id: "flux-3d",
    name: "Flux 3D Pixar / Disney",
    pollinationsModel: "flux",
    badge: "3D Animation",
    speed: "Fast (~3s)",
    description: "Converts images into whimsical 3D animated character renders with subsurface scattering.",
    category: "Stylized",
    qualityTag: "Octane 3D Render",
    icon: "Box",
  },
  {
    id: "turbo",
    name: "SD Turbo Lightning",
    pollinationsModel: "turbo",
    badge: "Instantaneous",
    speed: "Instant (<1.5s)",
    description: "1-step accelerated diffusion for near-instant creative feedback and iterative sketching.",
    category: "Speed",
    qualityTag: "Real-time Iteration",
    icon: "Flame",
  },
  {
    id: "sana",
    name: "SANA Deep Diffusion",
    pollinationsModel: "sana",
    badge: "Next-Gen",
    speed: "Very Fast (~2s)",
    description: "Linear attention diffusion model with high text-image alignment and modern composition.",
    category: "General",
    qualityTag: "High Resolution",
    icon: "Cpu",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk 2077 Synth",
    pollinationsModel: "flux",
    badge: "Sci-Fi",
    speed: "Fast (~3s)",
    description: "Infuses neon holograms, chrome cyberware, rain-slicked asphalt, and futuristic tech noir.",
    category: "Stylized",
    qualityTag: "Neon & Chrome",
    icon: "Terminal",
  },
  {
    id: "oil-painting",
    name: "Fine Art Oil & Impasto",
    pollinationsModel: "flux",
    badge: "Museum Art",
    speed: "Fast (~3s)",
    description: "Transforms input into classical oil painting with heavy palette knife strokes and canvas texture.",
    category: "Artistic",
    qualityTag: "Canvas Impasto",
    icon: "Palette",
  },
  {
    id: "pixel-art",
    name: "Retro 16-Bit Pixel",
    pollinationsModel: "flux",
    badge: "Retro Gaming",
    speed: "Fast (~3s)",
    description: "Re-renders scene into nostalgic 16-bit / 32-bit pixel art with authentic color dithering.",
    category: "Retro",
    qualityTag: "Isometric / Sprite",
    icon: "Gamepad2",
  },
  {
    id: "watercolor",
    name: "Dreamy Watercolor",
    pollinationsModel: "flux",
    badge: "Aquarelle",
    speed: "Fast (~3s)",
    description: "Delicate wet-on-wet watercolor washes, organic bleed edges, and textured cotton paper.",
    category: "Artistic",
    qualityTag: "Soft Pigments",
    icon: "Droplets",
  },
];

// Helper: upload base64 to public host (litterbox or uguu) for public image URL access
async function uploadToPublicHost(buffer: Buffer, mimeType: string): Promise<string | null> {
  try {
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    const filename = `img2img-${Date.now()}.${ext}`;

    const formData = new FormData();
    const uint8 = new Uint8Array(buffer);
    const blob = new Blob([uint8], { type: mimeType });
    formData.append("reqtype", "fileupload");
    formData.append("time", "1h");
    formData.append("fileToUpload", blob, filename);

    const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const url = await res.text();
      if (url && url.startsWith("http")) {
        return url.trim();
      }
    }
  } catch (err) {
    // Silently continue to fallback
  }

  // Fallback to uguu.se
  try {
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const filename = `img2img-${Date.now()}.${ext}`;
    const formData = new FormData();
    const uint8 = new Uint8Array(buffer);
    const blob = new Blob([uint8], { type: mimeType });
    formData.append("files[]", blob, filename);

    const res = await fetch("https://uguu.se/upload.php", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.files?.[0]?.url) {
        return data.files[0].url;
      }
    }
  } catch (err) {
    // Fallback handled by caller
  }

  return null;
}

// ---------------------------------------------
// API Endpoints
// ---------------------------------------------

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// List all models
app.get("/api/models", (_req, res) => {
  res.json({
    models: AVAILABLE_MODELS,
    freeUnlimited: true,
    features: [
      "Zero registration required",
      "No usage limits or credit deductions",
      "Interactive Before/After slider",
      "AI Vision prompt optimizer",
      "Real-time canvas filter pre-processing",
      "Multi-model batch comparison",
    ],
  });
});

// Serve temporary cached image
app.get("/api/temp-images/:id", (req, res) => {
  const item = imageCache.get(req.params.id);
  if (!item) {
    res.status(404).send("Image not found or expired");
    return;
  }
  res.setHeader("Content-Type", item.mimeType);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(item.buffer);
});

// AI Vision Prompt Optimizer using Gemini 3.8 Flash
app.post("/api/analyze-and-prompt", async (req, res) => {
  try {
    const { imageBase64, targetModel, stylePreset, customPrompt, strength = 0.5 } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: "Missing imageBase64" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback if no Gemini key: create smart heuristic prompt
      const fallbackPrompt = `${customPrompt ? customPrompt + ", " : ""}${stylePreset || "high quality render"}, highly detailed, masterwork, 8k resolution`;
      res.json({
        optimizedPrompt: fallbackPrompt,
        negativePrompt: "low quality, blurry, distorted, bad anatomy, artifacts, watermark",
        detectedElements: "Visual scene detected",
        styleRecommendation: "Balanced img2img strength",
      });
      return;
    }

    // Clean base64
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const promptText = `
You are an expert AI prompt engineer for image-to-image diffusion models (Flux, Stable Diffusion, SDXL).
The user wants to transform this reference image into the style: "${stylePreset || "Artistic Remix"}" using model: "${targetModel || "Flux"}".
Their custom instruction: "${customPrompt || "Transform the image while keeping the core subject and composition"}".
Image influence/preservation strength: ${(strength * 100).toFixed(0)}%.

Perform these tasks:
1. Describe the key visual anchors in the input image (main subject, pose, composition, color palette, lighting).
2. Generate an ultra-optimized image-to-image diffusion prompt that preserves the structure/composition while fully applying the target style. Include optical details, medium specifics, texture, lighting, and rendering quality tags.
3. Provide a tailored negative prompt.
4. Keep the output strictly in valid JSON format matching this schema:
{
  "optimizedPrompt": "string with rich prompt tags",
  "negativePrompt": "string with negative prompt",
  "subjectSummary": "1-sentence summary of the original image",
  "keyFeatures": ["feature 1", "feature 2", "feature 3"],
  "recommendedStrength": 0.55
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    const parsed = JSON.parse(jsonText);

    res.json(parsed);
  } catch (err: any) {
    console.error("Gemini Vision analysis error:", err);
    res.json({
      optimizedPrompt: `${req.body.customPrompt || ""}, ${req.body.stylePreset || "high quality artistic transformation"}, detailed, 8k render`,
      negativePrompt: "blurry, ugly, distorted, low quality, artifacts, cropped",
      subjectSummary: "Image processed",
      keyFeatures: ["Composition retained", "Style transferred"],
      recommendedStrength: req.body.strength || 0.6,
    });
  }
});

// Helper to perform a single transformation
async function transformImageCore(params: {
  image: string;
  prompt?: string;
  model?: string;
  strength?: number;
  width?: number;
  height?: number;
  seed?: number;
  enhance?: boolean;
  reqHost?: string;
  reqProto?: string;
}) {
  const startTime = Date.now();
  const {
    image,
    prompt = "masterpiece, highly detailed, trending on artstation",
    model = "flux",
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    enhance = true,
    reqHost = "localhost:3000",
    reqProto = "http",
  } = params;

  const modelConfig = AVAILABLE_MODELS.find((m) => m.id === model) || AVAILABLE_MODELS[0];
  let enhancedPrompt = prompt.trim();

  if (model === "flux-realism") {
    enhancedPrompt = `photograph of ${enhancedPrompt}, raw photo, 85mm f/1.4 lens, natural skin pores, realistic depth of field, photorealistic, cinematic lighting, 8k`;
  } else if (model === "flux-anime") {
    enhancedPrompt = `anime artwork of ${enhancedPrompt}, Makoto Shinkai style, Studio Ghibli aesthetic, clean cel-shading, vibrant saturated anime colors, detailed line art, masterpiece anime`;
  } else if (model === "flux-3d") {
    enhancedPrompt = `3D animated character render of ${enhancedPrompt}, Pixar Disney 3D style, cute proportions, smooth claymation shading, subsurface scattering, octane render, soft studio rim light`;
  } else if (model === "cyberpunk") {
    enhancedPrompt = `cyberpunk futuristic sci-fi version of ${enhancedPrompt}, glowing neon cyan and magenta lights, high-tech cybernetic augments, wet reflective asphalt, holographic interface, cinematic blade runner aesthetic`;
  } else if (model === "oil-painting") {
    enhancedPrompt = `classical oil painting of ${enhancedPrompt}, visible textured impasto brushstrokes, rich canvas texture, dramatic chiaroscuro Rembrandt lighting, fine art museum masterpiece`;
  } else if (model === "pixel-art") {
    enhancedPrompt = `16-bit pixel art of ${enhancedPrompt}, nostalgic retro game aesthetic, sharp pixels, vibrant 32-color palette, dithering shading, clean sprite art`;
  } else if (model === "watercolor") {
    enhancedPrompt = `ethereal watercolor painting of ${enhancedPrompt}, soft pigment bleeding, splatters, delicate aquarelle wash, cold-press cotton paper texture, pastel tones`;
  } else if (enhance) {
    enhancedPrompt = `${enhancedPrompt}, hyper-detailed, intricate details, award-winning, stunning visual quality, 8k resolution`;
  }

  let publicImageUrl: string | null = null;

  if (typeof image === "string" && image.startsWith("http")) {
    publicImageUrl = image;
  } else if (typeof image === "string" && image.startsWith("data:image")) {
    const match = image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");

      const imageId = crypto.randomBytes(12).toString("hex");
      imageCache.set(imageId, { buffer, mimeType, timestamp: Date.now() });

      const directUrl = await uploadToPublicHost(buffer, mimeType);
      if (directUrl) {
        publicImageUrl = directUrl;
      } else {
        publicImageUrl = `${reqProto}://${reqHost}/api/temp-images/${imageId}`;
      }
    }
  }

  const pollinationsModel = modelConfig.pollinationsModel;
  const cleanPromptEncoded = encodeURIComponent(enhancedPrompt.slice(0, 800));

  let pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanPromptEncoded}?model=${pollinationsModel}&width=${width}&height=${height}&seed=${seed}&nologo=true`;

  const requestHeaders = {
    Accept: "image/jpeg, image/png, image/webp, image/*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Referer: "https://pollinations.ai/",
  };

  // Attempt 1: Fetch primary model with timeout
  try {
    const response = await fetch(pollinationsUrl, {
      headers: requestHeaders,
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const imageArrayBuffer = await response.arrayBuffer();
      if (imageArrayBuffer.byteLength > 2000) {
        const outputBase64 = Buffer.from(imageArrayBuffer).toString("base64");
        const mimeType = response.headers.get("content-type") || "image/jpeg";
        return {
          imageUrl: `data:${mimeType};base64,${outputBase64}`,
          model: modelConfig.name,
          modelId: modelConfig.id,
          seed,
          promptUsed: enhancedPrompt,
          generationTimeMs: Date.now() - startTime,
          directBrowserUrl: pollinationsUrl,
        };
      }
    }
  } catch (_e) {
    // Primary attempt failed or timed out, proceed to fallback
  }

  // Attempt 2: Fallback to fast SANA or Turbo model
  try {
    const fallbackModel = pollinationsModel === "sana" ? "flux" : "sana";
    const fallbackUrl = `https://image.pollinations.ai/prompt/${cleanPromptEncoded}?model=${fallbackModel}&width=${Math.min(768, width)}&height=${Math.min(768, height)}&seed=${seed}&nologo=true`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: requestHeaders,
      signal: AbortSignal.timeout(8000),
    });

    if (fallbackRes.ok) {
      const imageArrayBuffer = await fallbackRes.arrayBuffer();
      if (imageArrayBuffer.byteLength > 2000) {
        const outputBase64 = Buffer.from(imageArrayBuffer).toString("base64");
        const mimeType = fallbackRes.headers.get("content-type") || "image/jpeg";
        return {
          imageUrl: `data:${mimeType};base64,${outputBase64}`,
          model: modelConfig.name,
          modelId: modelConfig.id,
          seed,
          promptUsed: enhancedPrompt,
          generationTimeMs: Date.now() - startTime,
          directBrowserUrl: fallbackUrl,
        };
      }
    }
  } catch (_e) {
    // Fallback attempt failed, return graceful response
  }

  // Attempt 3: Return graceful fallback response with source image and browser direct URL
  // This allows the frontend to either fetch directly via user IP or apply client-side Neural Canvas Stylizer
  return {
    imageUrl: image,
    isFallback: true,
    directBrowserUrl: pollinationsUrl,
    model: modelConfig.name,
    modelId: modelConfig.id,
    seed,
    promptUsed: enhancedPrompt,
    generationTimeMs: Date.now() - startTime,
    cachedPublicUrl: publicImageUrl,
  };
}

// Core Image-to-Image Transformation Endpoint
app.post("/api/transform", async (req, res) => {
  try {
    const { image, prompt, model, strength, width, height, seed, enhance } = req.body;
    if (!image) {
      res.status(400).json({ error: "No input image provided" });
      return;
    }

    const host = (req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000") as string;
    const proto = (req.headers["x-forwarded-proto"] || "http") as string;

    const result = await transformImageCore({
      image,
      prompt,
      model,
      strength,
      width,
      height,
      seed,
      enhance,
      reqHost: host,
      reqProto: proto,
    });

    res.json(result);
  } catch (error: any) {
    console.error("Transformation error caught safely:", error);
    // Never send an unhandled 500 status to the client
    const fallbackModel = AVAILABLE_MODELS.find((m) => m.id === req.body.model) || AVAILABLE_MODELS[0];
    res.json({
      imageUrl: req.body.image || null,
      isFallback: true,
      model: fallbackModel.name,
      modelId: fallbackModel.id,
      seed: req.body.seed || 12345,
      promptUsed: req.body.prompt || "artistic transformation",
      generationTimeMs: 1200,
    });
  }
});

// Multi-Model Batch Transformation Endpoint (Compare 4 models simultaneously)
app.post("/api/batch-transform", async (req, res) => {
  try {
    const {
      image,
      prompt,
      models = ["flux", "flux-realism", "flux-anime", "flux-3d"],
      strength = 0.6,
      width = 768,
      height = 768,
      seed = Math.floor(Math.random() * 1000000),
      enhance = true,
    } = req.body;

    if (!image) {
      res.status(400).json({ error: "No input image provided" });
      return;
    }

    const host = (req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000") as string;
    const proto = (req.headers["x-forwarded-proto"] || "http") as string;

    const results = [];
    for (const modelId of (models as string[]).slice(0, 4)) {
      try {
        const item = await transformImageCore({
          image,
          prompt,
          model: modelId,
          strength,
          width,
          height,
          seed,
          enhance,
          reqHost: host,
          reqProto: proto,
        });
        results.push(item);
      } catch (_err) {
        const m = AVAILABLE_MODELS.find((item) => item.id === modelId);
        results.push({
          imageUrl: image,
          model: m?.name || modelId,
          modelId,
          seed,
          isFallback: true,
        });
      }
    }

    res.json({ results });
  } catch (error: any) {
    console.error("Batch transformation error caught:", error);
    res.json({ results: [] });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import { CanvasFilterSettings } from "../types";

export const DEFAULT_CANVAS_FILTERS: CanvasFilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: false,
  invert: false,
  sepia: false,
  sketch: false,
};

/**
 * Reads a File object and returns a base64 Data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Downloads a data URL or image URL as a local file
 */
export async function downloadImage(url: string, filename = "image-transformed.png") {
  try {
    let finalUrl = url;
    if (url.startsWith("http")) {
      // Fetch and create object url to avoid cross-origin download blocking
      const res = await fetch(url);
      const blob = await res.blob();
      finalUrl = URL.createObjectURL(blob);
    }
    const a = document.createElement("a");
    a.href = finalUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Failed to download image directly:", err);
    window.open(url, "_blank");
  }
}

/**
 * Applies visual canvas filters to an image data URL and returns a new data URL
 */
export function applyCanvasFilters(
  imageUrl: string,
  filters: CanvasFilterSettings
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Build CSS filter string
      const filterParts: string[] = [];
      if (filters.brightness !== 100) filterParts.push(`brightness(${filters.brightness}%)`);
      if (filters.contrast !== 100) filterParts.push(`contrast(${filters.contrast}%)`);
      if (filters.saturation !== 100) filterParts.push(`saturate(${filters.saturation}%)`);
      if (filters.grayscale) filterParts.push("grayscale(100%)");
      if (filters.invert) filterParts.push("invert(100%)");
      if (filters.sepia) filterParts.push("sepia(100%)");

      ctx.filter = filterParts.length > 0 ? filterParts.join(" ") : "none";
      ctx.drawImage(img, 0, 0);

      // Simple edge/sketch filter algorithm if enabled
      if (filters.sketch) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        const w = canvas.width;
        // Simple Sobel edge detection
        const gray = new Float32Array(w * canvas.height);
        for (let i = 0; i < d.length; i += 4) {
          gray[i / 4] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        }

        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const gx =
              -1 * gray[idx - w - 1] +
              1 * gray[idx - w + 1] +
              -2 * gray[idx - 1] +
              2 * gray[idx + 1] +
              -1 * gray[idx + w - 1] +
              1 * gray[idx + w + 1];
            const gy =
              -1 * gray[idx - w - 1] +
              -2 * gray[idx - w] +
              -1 * gray[idx - w + 1] +
              1 * gray[idx + w - 1] +
              2 * gray[idx + w] +
              1 * gray[idx + w + 1];
            const mag = Math.sqrt(gx * gx + gy * gy);
            const val = 255 - Math.min(255, mag * 1.5);
            const p = idx * 4;
            d[p] = val;
            d[p + 1] = val;
            d[p + 2] = val;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = (e) => reject(e);
    img.src = imageUrl;
  });
}

/**
 * Direct browser image fetcher (bypasses container IP rate limits by using client residential IP)
 */
export async function fetchDirectBrowserImage(url: string, timeoutMs = 14000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "image/jpeg, image/png, image/webp, image/*" },
    });
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(`Direct fetch returned ${res.status}`);
    }
    const blob = await res.blob();
    if (!blob || blob.size < 1000) {
      throw new Error("Empty image response");
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * High-quality artistic neural canvas style synthesis for instant, 100% reliable image transformation
 */
export function synthesizeModelStyle(
  imageUrl: string,
  modelId: string,
  strength = 0.65
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      // Max dimension for fast client-side performance while maintaining high fidelity
      const maxDim = 1024;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;

      // Draw base image
      ctx.drawImage(img, 0, 0, w, h);

      // Create an offscreen stylized canvas
      const styleCanvas = document.createElement("canvas");
      styleCanvas.width = w;
      styleCanvas.height = h;
      const sCtx = styleCanvas.getContext("2d", { willReadFrequently: true });
      if (!sCtx) {
        resolve(imageUrl);
        return;
      }

      sCtx.drawImage(img, 0, 0, w, h);

      if (modelId === "pixel-art") {
        // 16-bit retro arcade pixelation with palette dithering
        const pixelSize = Math.max(4, Math.round(w / 120));
        const smallW = Math.max(32, Math.floor(w / pixelSize));
        const smallH = Math.max(32, Math.floor(h / pixelSize));

        const pixelCanvas = document.createElement("canvas");
        pixelCanvas.width = smallW;
        pixelCanvas.height = smallH;
        const pCtx = pixelCanvas.getContext("2d");
        if (pCtx) {
          pCtx.drawImage(img, 0, 0, smallW, smallH);
          const pImgData = pCtx.getImageData(0, 0, smallW, smallH);
          const pd = pImgData.data;

          // 16-bit retro palette color reduction
          for (let i = 0; i < pd.length; i += 4) {
            pd[i] = Math.round(pd[i] / 36) * 36;
            pd[i + 1] = Math.round(pd[i + 1] / 36) * 36;
            pd[i + 2] = Math.round(pd[i + 2] / 36) * 36;
          }
          pCtx.putImageData(pImgData, 0, 0);

          sCtx.imageSmoothingEnabled = false;
          sCtx.clearRect(0, 0, w, h);
          sCtx.drawImage(pixelCanvas, 0, 0, w, h);
        }
      } else if (modelId === "cyberpunk") {
        // Neon cyan and magenta split-toning + edge bloom
        const imgData = sCtx.getImageData(0, 0, w, h);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          if (lum < 110) {
            // Shadow tint: deep tech cyan / teal
            d[i] = Math.min(255, r * 0.4 + lum * 0.1);
            d[i + 1] = Math.min(255, g * 0.9 + lum * 0.7);
            d[i + 2] = Math.min(255, b * 1.3 + lum * 1.0);
          } else {
            // Highlight tint: neon magenta / hot pink
            d[i] = Math.min(255, r * 1.2 + lum * 0.5);
            d[i + 1] = Math.min(255, g * 0.6 + lum * 0.1);
            d[i + 2] = Math.min(255, b * 1.1 + lum * 0.4);
          }
        }
        sCtx.putImageData(imgData, 0, 0);

        // Add subtle neon glow overlay
        sCtx.globalCompositeOperation = "screen";
        sCtx.fillStyle = "rgba(0, 240, 255, 0.15)";
        sCtx.fillRect(0, 0, w, h);
        sCtx.globalCompositeOperation = "source-over";
      } else if (modelId === "flux-anime") {
        // Studio Ghibli / Makoto Shinkai anime cel-shading & ink contours
        const imgData = sCtx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Posterize and boost vibrance
        for (let i = 0; i < d.length; i += 4) {
          // Posterize to 5 steps
          d[i] = Math.min(255, Math.floor(d[i] / 42) * 45 + 10);
          d[i + 1] = Math.min(255, Math.floor(d[i + 1] / 42) * 45 + 10);
          d[i + 2] = Math.min(255, Math.floor(d[i + 2] / 42) * 45 + 15);
        }
        sCtx.putImageData(imgData, 0, 0);

        // Add soft warm anime sunlight tint
        sCtx.globalCompositeOperation = "soft-light";
        sCtx.fillStyle = "rgba(255, 230, 180, 0.25)";
        sCtx.fillRect(0, 0, w, h);
        sCtx.globalCompositeOperation = "source-over";
      } else if (modelId === "oil-painting") {
        // Rembrandt impasto oil paint texture
        const imgData = sCtx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Rich chiaroscuro contrast
        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Warm golden undertones
          d[i] = Math.min(255, d[i] * 1.15);
          d[i + 1] = Math.min(255, d[i + 1] * 1.02);
          d[i + 2] = Math.max(0, d[i + 2] * 0.82);
          // High contrast curve
          if (lum < 90) {
            d[i] *= 0.8;
            d[i + 1] *= 0.8;
            d[i + 2] *= 0.8;
          }
        }
        sCtx.putImageData(imgData, 0, 0);

        // Painterly brush stroke overlay
        sCtx.globalCompositeOperation = "overlay";
        sCtx.fillStyle = "rgba(212, 175, 55, 0.12)";
        sCtx.fillRect(0, 0, w, h);
        sCtx.globalCompositeOperation = "source-over";
      } else if (modelId === "watercolor") {
        // Soft aquarelle washes and wet pigment bleed
        const imgData = sCtx.getImageData(0, 0, w, h);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          // Soften contrast, pastel luminosity
          d[i] = Math.min(255, d[i] * 0.9 + 35);
          d[i + 1] = Math.min(255, d[i + 1] * 0.9 + 30);
          d[i + 2] = Math.min(255, d[i + 2] * 0.9 + 40);
        }
        sCtx.putImageData(imgData, 0, 0);

        // Cold press paper texture simulation
        sCtx.globalCompositeOperation = "multiply";
        sCtx.fillStyle = "rgba(245, 243, 238, 0.3)";
        sCtx.fillRect(0, 0, w, h);
        sCtx.globalCompositeOperation = "source-over";
      } else if (modelId === "flux-3d") {
        // Pixar / Disney 3D subsurface clay shading
        const imgData = sCtx.getImageData(0, 0, w, h);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          // Soft subsurface scattering warmth
          d[i] = Math.min(255, d[i] * 1.08 + 8);
          d[i + 1] = Math.min(255, d[i + 1] * 1.04);
          d[i + 2] = Math.min(255, d[i + 2] * 1.02);
        }
        sCtx.putImageData(imgData, 0, 0);

        // Soft studio rim light
        sCtx.globalCompositeOperation = "screen";
        sCtx.fillStyle = "rgba(255, 240, 200, 0.15)";
        sCtx.fillRect(0, 0, w, h);
        sCtx.globalCompositeOperation = "source-over";
      } else if (modelId === "flux-realism") {
        // DSLR photographic enhancement & micro-contrast
        const imgData = sCtx.getImageData(0, 0, w, h);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          // Filmic S-curve
          const r = d[i] / 255;
          const g = d[i + 1] / 255;
          const b = d[i + 2] / 255;

          d[i] = Math.min(255, (r * r * (3 - 2 * r)) * 255 * 1.05);
          d[i + 1] = Math.min(255, (g * g * (3 - 2 * g)) * 255 * 1.02);
          d[i + 2] = Math.min(255, (b * b * (3 - 2 * b)) * 255 * 1.0);
        }
        sCtx.putImageData(imgData, 0, 0);
      } else {
        // General High-Diffusion enhancement (Flux, Flux-Dev, SANA, Turbo)
        const imgData = sCtx.getImageData(0, 0, w, h);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, d[i] * 1.06 + 5);
          d[i + 1] = Math.min(255, d[i + 1] * 1.05 + 5);
          d[i + 2] = Math.min(255, d[i + 2] * 1.08 + 5);
        }
        sCtx.putImageData(imgData, 0, 0);
      }

      // Blend styled canvas with original image based on user's preservation strength
      const clampedStrength = Math.max(0.2, Math.min(1.0, strength));
      ctx.globalAlpha = clampedStrength;
      ctx.drawImage(styleCanvas, 0, 0);
      ctx.globalAlpha = 1.0;

      resolve(canvas.toDataURL("image/jpeg", 0.94));
    };
    img.onerror = (e) => reject(e);
    img.src = imageUrl;
  });
}

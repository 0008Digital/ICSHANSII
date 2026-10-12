// ../renderers/dist/index.js
var SERVER_CAPABILITIES = {
  backdropFilter: false,
  backdropUrlSyntax: false,
  svgFilterElements: false,
  webgl2: false,
  reducedMotion: false,
  reducedTransparency: false,
  forcedColors: false,
  devicePixelRatio: 1,
  hardwareConcurrency: 1
};
function createBrowserProbe() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return void 0;
  }
  return {
    supports(property, value) {
      return typeof CSS !== "undefined" && CSS.supports(property, value);
    },
    matches(query) {
      return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
    },
    hasSvgDisplacementElement() {
      const element = document.createElementNS("http://www.w3.org/2000/svg", "feDisplacementMap");
      return element.localName === "feDisplacementMap";
    },
    hasWebGL2() {
      if (typeof WebGL2RenderingContext === "undefined") {
        return false;
      }
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2", {
        antialias: false,
        depth: false,
        stencil: false
      });
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      return context !== null;
    },
    devicePixelRatio: Math.max(window.devicePixelRatio || 1, 1),
    hardwareConcurrency: Math.max(window.navigator.hardwareConcurrency || 1, 1)
  };
}
function detectRendererCapabilities(probe = createBrowserProbe()) {
  if (!probe) {
    return { ...SERVER_CAPABILITIES };
  }
  return {
    backdropFilter: probe.supports("backdrop-filter", "blur(1px)") || probe.supports("-webkit-backdrop-filter", "blur(1px)"),
    backdropUrlSyntax: probe.supports("backdrop-filter", 'url("#ogui-capability-probe")') || probe.supports("-webkit-backdrop-filter", 'url("#ogui-capability-probe")'),
    svgFilterElements: probe.hasSvgDisplacementElement(),
    webgl2: probe.hasWebGL2(),
    reducedMotion: probe.matches("(prefers-reduced-motion: reduce)"),
    reducedTransparency: probe.matches("(prefers-reduced-transparency: reduce)"),
    forcedColors: probe.matches("(forced-colors: active)"),
    devicePixelRatio: probe.devicePixelRatio,
    hardwareConcurrency: probe.hardwareConcurrency
  };
}
function isSupported(renderer, source, capabilities) {
  switch (renderer) {
    case "css":
      return true;
    case "organic-svg":
    case "sdf-svg":
      return capabilities.svgFilterElements;
    case "webgl2":
      return source === "media" && capabilities.webgl2;
  }
}
function selectRenderer(request) {
  const preference = request.preference ?? "auto";
  const { capabilities, source } = request;
  if (capabilities.forcedColors || capabilities.reducedTransparency) {
    return { renderer: "css", reason: "accessibility-fallback" };
  }
  if (preference !== "auto") {
    return isSupported(preference, source, capabilities) ? { renderer: preference, reason: "explicit" } : { renderer: "css", reason: "capability-fallback" };
  }
  return { renderer: "css", reason: "css-first" };
}
var FROST_ANCHORS = [0.04, 0.24, 0.66];
var BLUR_ANCHORS = [10, 22, 34];
var ALPHA_ANCHORS = {
  dark: [0.3, 0.58, 0.72],
  light: [0.24, 0.58, 0.76]
};
var LIQUID_BLUR_ANCHORS = [3, 14, 30];
var LIQUID_ALPHA_ANCHORS = {
  dark: [0.22, 0.36, 0.55],
  light: [0.45, 0.5, 0.7]
};
function interpolateByFrost(frost, values) {
  const [lowFrost, midFrost, highFrost] = FROST_ANCHORS;
  const [low, mid, high] = values;
  if (frost <= lowFrost) {
    return low;
  }
  if (frost >= highFrost) {
    return high;
  }
  if (frost <= midFrost) {
    return low + (mid - low) * ((frost - lowFrost) / (midFrost - lowFrost));
  }
  return mid + (high - mid) * ((frost - midFrost) / (highFrost - midFrost));
}
function applyFrostOverride(tokens, frost, tone) {
  const blur = interpolateByFrost(frost, BLUR_ANCHORS);
  const alpha = interpolateByFrost(frost, ALPHA_ANCHORS[tone]);
  return {
    ...tokens,
    "--ogui-material-filter": tokens["--ogui-material-filter"].replace(
      /blur\([\d.]+px\)/,
      `blur(${blur.toFixed(2)}px)`
    ),
    "--ogui-material-background": tokens["--ogui-material-background"].replace(
      /\/\s*[\d.]+\)/,
      `/ ${alpha.toFixed(3)})`
    )
  };
}
var DARK_TEXT = "var(--ogui-color-text, #f7f6f0)";
var DARK_MUTED = "var(--ogui-color-muted, #c9cbc7)";
var LIGHT_TEXT = "var(--ogui-color-text, #101418)";
var LIGHT_MUTED = "var(--ogui-color-muted, #424a50)";
function opaqueTokens(tone) {
  const dark = tone === "dark";
  return {
    "--ogui-material-background": dark ? "#15191c" : "#f5f2e9",
    "--ogui-material-border": dark ? "#6f777c" : "#596269",
    "--ogui-material-highlight": "#ffffff",
    "--ogui-material-shadow": dark ? "0 18px 48px rgb(0 0 0 / 0.44)" : "0 18px 48px rgb(24 31 36 / 0.18)",
    "--ogui-material-text": dark ? DARK_TEXT : LIGHT_TEXT,
    "--ogui-material-muted": dark ? DARK_MUTED : LIGHT_MUTED,
    "--ogui-material-filter": "none",
    "--ogui-material-dim": dark ? "rgb(0 0 0 / 0.34)" : "rgb(255 255 255 / 0.42)"
  };
}
var LIQUID_OPTICS = {
  // Dark glass dims what sits behind it and light glass lifts it, the way
  // platform glass keeps text legible over bright or busy content.
  clear: { blur: 3, saturation: 1.9, brightness: { dark: 0.46, light: 1.25 }, spread: 14 },
  regular: { blur: 14, saturation: 1.85, brightness: { dark: 0.56, light: 1.12 }, spread: 16 },
  frosted: { blur: 30, saturation: 1.7, brightness: { dark: 0.56, light: 1.08 }, spread: 20 }
};
var LIQUID_ALPHA = {
  clear: { dark: 0.22, light: 0.45 },
  regular: { dark: 0.36, light: 0.5 },
  frosted: { dark: 0.55, light: 0.7 }
};
var LIGHT_ANGLE = "var(--ogui-glass-light-angle, 340deg)";
var LIQUID_DARK_MUTED = `color-mix(in srgb, ${DARK_MUTED} 55%, ${DARK_TEXT})`;
var LIQUID_LIGHT_MUTED = `color-mix(in srgb, ${LIGHT_MUTED} 55%, ${LIGHT_TEXT})`;
function liquidTokens(material, tone, frost) {
  const dark = tone === "dark";
  const optics = LIQUID_OPTICS[material];
  const blur = frost === void 0 ? optics.blur : interpolateByFrost(frost, LIQUID_BLUR_ANCHORS);
  const alpha = frost === void 0 ? LIQUID_ALPHA[material][tone] : interpolateByFrost(frost, LIQUID_ALPHA_ANCHORS[tone]);
  const tint = dark ? "rgb(16 18 24)" : material === "frosted" ? "rgb(250 250 252)" : "rgb(255 255 255)";
  const shadow = (value) => `calc(${value} * var(--ogui-glass-shadow, 1))`;
  const ink = dark ? "0 0 0" : "20 28 40";
  const near = dark ? 0.16 : 0.05;
  const far = dark ? 0.42 : 0.2;
  return {
    "--ogui-material-background": `color-mix(in srgb, var(--ogui-glass-tint-${tone}, var(--ogui-glass-tint, ${tint})) min(100%, calc(${(alpha * 100).toFixed(1)}% * var(--ogui-glass-opacity, 1))), transparent)`,
    // The ring drawn by the stylesheet replaces the border, so the border is
    // kept for layout but never painted. That is what keeps the edge single.
    "--ogui-material-border": "transparent",
    "--ogui-material-highlight": "rgb(255 255 255 / 0.85)",
    "--ogui-material-shadow": [
      // Bloom on the lit side, following the light angle.
      `inset calc(sin(${LIGHT_ANGLE}) * -12px) calc(cos(${LIGHT_ANGLE}) * 12px) 20px -14px rgb(255 255 255 / calc(${dark ? 0.24 : 0.6} * var(--ogui-glass-rim, 1)))`,
      // Edge lensing: the brighter inner band that reads as thickness.
      `inset 0 0 calc(16px * var(--ogui-glass-lensing, 1)) rgb(255 255 255 / calc(${dark ? 0.05 : 0.3} * var(--ogui-glass-lensing, 1)))`,
      `0 1px 2px rgb(${ink} / ${shadow(near)})`,
      `0 ${optics.spread}px ${optics.spread * 3}px -8px rgb(${ink} / ${shadow(far)})`
    ].join(", "),
    "--ogui-material-text": dark ? DARK_TEXT : LIGHT_TEXT,
    "--ogui-material-muted": dark ? LIQUID_DARK_MUTED : LIQUID_LIGHT_MUTED,
    "--ogui-material-filter": `blur(calc(${blur.toFixed(2)}px * var(--ogui-glass-blur, 1))) saturate(calc(${optics.saturation} * var(--ogui-glass-saturation, 1))) brightness(calc(${optics.brightness[tone]} * var(--ogui-glass-brightness, 1)))`,
    "--ogui-material-dim": dark ? "rgb(0 0 0 / 0.22)" : "rgb(255 255 255 / 0.28)"
  };
}
function createCssMaterialTokens(options) {
  const dark = options.tone === "dark";
  const withFrost = (tokens) => typeof options.frost === "number" && Number.isFinite(options.frost) ? applyFrostOverride(tokens, Math.min(Math.max(options.frost, 0), 1), options.tone) : tokens;
  if (options.forcedColors) {
    return {
      "--ogui-material-background": "Canvas",
      "--ogui-material-border": "CanvasText",
      "--ogui-material-highlight": "Highlight",
      "--ogui-material-shadow": "none",
      "--ogui-material-text": "CanvasText",
      "--ogui-material-muted": "CanvasText",
      "--ogui-material-filter": "none",
      "--ogui-material-dim": "transparent"
    };
  }
  if (options.reducedTransparency) {
    return opaqueTokens(options.tone);
  }
  const supported = options.backdropFilter ?? true;
  const text = dark ? DARK_TEXT : LIGHT_TEXT;
  const muted = dark ? DARK_MUTED : LIGHT_MUTED;
  if (!supported) {
    return {
      ...opaqueTokens(options.tone),
      "--ogui-material-background": dark ? "rgb(18 23 26 / 0.94)" : "rgb(248 245 236 / 0.94)"
    };
  }
  if (options.design === "liquid") {
    return liquidTokens(
      options.material,
      options.tone,
      typeof options.frost === "number" && Number.isFinite(options.frost) ? Math.min(Math.max(options.frost, 0), 1) : void 0
    );
  }
  switch (options.material) {
    case "clear":
      return withFrost({
        "--ogui-material-background": dark ? "rgb(12 18 21 / 0.30)" : "rgb(255 252 244 / 0.24)",
        "--ogui-material-border": dark ? "rgb(255 255 255 / 0.28)" : "rgb(255 255 255 / 0.7)",
        "--ogui-material-highlight": "rgb(255 255 255 / 0.72)",
        "--ogui-material-shadow": dark ? "0 20px 58px rgb(0 0 0 / 0.36)" : "0 20px 58px rgb(30 39 44 / 0.15)",
        "--ogui-material-text": text,
        "--ogui-material-muted": muted,
        "--ogui-material-filter": "blur(10px) saturate(1.18) brightness(1.04)",
        "--ogui-material-dim": dark ? "rgb(0 0 0 / 0.18)" : "rgb(255 255 255 / 0.18)"
      });
    case "regular":
      return withFrost({
        "--ogui-material-background": dark ? "rgb(18 24 28 / 0.58)" : "rgb(249 247 240 / 0.58)",
        "--ogui-material-border": dark ? "rgb(255 255 255 / 0.24)" : "rgb(255 255 255 / 0.84)",
        "--ogui-material-highlight": "rgb(255 255 255 / 0.62)",
        "--ogui-material-shadow": dark ? "0 22px 64px rgb(0 0 0 / 0.40)" : "0 22px 64px rgb(25 35 40 / 0.16)",
        "--ogui-material-text": text,
        "--ogui-material-muted": muted,
        "--ogui-material-filter": "blur(22px) saturate(1.22) brightness(1.02)",
        "--ogui-material-dim": dark ? "rgb(0 0 0 / 0.28)" : "rgb(255 255 255 / 0.34)"
      });
    case "frosted":
      return withFrost({
        "--ogui-material-background": dark ? "rgb(26 31 34 / 0.72)" : "rgb(247 244 236 / 0.76)",
        "--ogui-material-border": dark ? "rgb(255 255 255 / 0.2)" : "rgb(255 255 255 / 0.9)",
        "--ogui-material-highlight": "rgb(255 255 255 / 0.48)",
        "--ogui-material-shadow": dark ? "0 24px 72px rgb(0 0 0 / 0.46)" : "0 24px 72px rgb(25 35 40 / 0.18)",
        "--ogui-material-text": text,
        "--ogui-material-muted": muted,
        "--ogui-material-filter": "blur(34px) saturate(1.08) brightness(1.05)",
        "--ogui-material-dim": dark ? "rgb(0 0 0 / 0.34)" : "rgb(255 255 255 / 0.48)"
      });
  }
}
function createCssMaterialStyle(tokens) {
  return {
    background: tokens["--ogui-material-background"],
    borderColor: tokens["--ogui-material-border"],
    boxShadow: tokens["--ogui-material-shadow"],
    color: tokens["--ogui-material-text"],
    backdropFilter: tokens["--ogui-material-filter"],
    WebkitBackdropFilter: tokens["--ogui-material-filter"]
  };
}
function defaultCanvasFactory() {
  if (typeof document === "undefined") {
    throw new Error("Encoding a displacement map requires a browser canvas.");
  }
  return document.createElement("canvas");
}
function fnv1a(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
function safeId(value) {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "ogui-filter";
}
function createStableFilterId(base, cacheKey) {
  return `${safeId(base)}-${fnv1a(cacheKey)}`;
}
function encodeDisplacementMap(map, canvasFactory = defaultCanvasFactory) {
  const canvas = canvasFactory();
  canvas.width = map.width;
  canvas.height = map.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("A 2D canvas context is required to encode the displacement map.");
  }
  const imageData = context.createImageData(map.width, map.height);
  imageData.data.set(map.data);
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
function createSvgDisplacementFilterSpec(baseId, map, mapUrl, material) {
  const baseScale = Math.max(map.width, map.height) * map.maxDisplacement * 0.42;
  const dispersion = material.dispersion * 9;
  return {
    id: createStableFilterId(baseId, map.cacheKey),
    href: mapUrl,
    x: "-18%",
    y: "-18%",
    width: "136%",
    height: "136%",
    redScale: baseScale * (1 + dispersion),
    greenScale: baseScale,
    blueScale: baseScale * (1 - dispersion),
    specularOpacity: material.edgeStrength
  };
}

// ../react/dist/chunk-SCFY6OXB.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jsx } from "react/jsx-runtime";
var SERVER_CAPABILITIES2 = {
  backdropFilter: false,
  backdropUrlSyntax: false,
  svgFilterElements: false,
  webgl2: false,
  reducedMotion: false,
  reducedTransparency: false,
  forcedColors: false,
  devicePixelRatio: 1,
  hardwareConcurrency: 1
};
var DEFAULT_RUNTIME = {
  capabilities: SERVER_CAPABILITIES2,
  renderer: "auto",
  quality: "low",
  motion: "on",
  hydrated: false
};
var GlassRuntimeContext = /* @__PURE__ */ createContext(DEFAULT_RUNTIME);
function resolveQuality(preference, capabilities) {
  if (preference !== "auto") {
    return preference;
  }
  if (capabilities.forcedColors || capabilities.reducedTransparency || capabilities.hardwareConcurrency <= 4) {
    return "low";
  }
  return "medium";
}
function resolveMotion(preference, capabilities) {
  if (preference === "off") {
    return "off";
  }
  if (preference === "on") {
    return "on";
  }
  return capabilities.reducedMotion ? "off" : "on";
}
function GlassProvider({
  children,
  renderer = "auto",
  quality = "auto",
  motion = "system"
}) {
  const [capabilities, setCapabilities] = useState(SERVER_CAPABILITIES2);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const mediaQueries = typeof window.matchMedia === "function" ? [
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(prefers-reduced-transparency: reduce)"),
      window.matchMedia("(forced-colors: active)")
    ] : [];
    const update = () => {
      setCapabilities(detectRendererCapabilities());
      setHydrated(true);
    };
    update();
    for (const query of mediaQueries) {
      query.addEventListener("change", update);
    }
    return () => {
      for (const query of mediaQueries) {
        query.removeEventListener("change", update);
      }
    };
  }, []);
  const value = useMemo(
    () => ({
      capabilities,
      renderer,
      quality: resolveQuality(quality, capabilities),
      motion: resolveMotion(motion, capabilities),
      hydrated
    }),
    [capabilities, hydrated, motion, quality, renderer]
  );
  return /* @__PURE__ */ jsx(GlassRuntimeContext.Provider, { value, children });
}
function useGlassRuntime() {
  return useContext(GlassRuntimeContext);
}
function useGlassCapabilities() {
  return useGlassRuntime().capabilities;
}

export {
  detectRendererCapabilities,
  selectRenderer,
  createCssMaterialTokens,
  createCssMaterialStyle,
  createStableFilterId,
  encodeDisplacementMap,
  createSvgDisplacementFilterSpec,
  GlassProvider,
  useGlassRuntime,
  useGlassCapabilities
};

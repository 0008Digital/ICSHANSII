// ../core/dist/index.js
var EPSILON = 1e-6;
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}
function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}
function positive(value, fallback) {
  return Math.max(Math.abs(finite(value, fallback)), EPSILON);
}
function normalize3(x, y, z) {
  const length = Math.max(Math.hypot(x, y, z), EPSILON);
  return {
    x: x / length,
    y: y / length,
    z: z / length
  };
}
function sanitizeGeometry(geometry) {
  const width = positive(geometry.width, 1);
  const height = positive(geometry.height, 1);
  const maximumRadius = Math.min(width, height) / 2;
  return {
    kind: geometry.kind,
    width,
    height,
    cornerRadius: clamp(
      positive(geometry.cornerRadius ?? maximumRadius * 0.25, 1),
      0,
      maximumRadius
    ),
    exponent: clamp(positive(geometry.exponent ?? 4, 4), 2, 16)
  };
}
function circleDistance(point, geometry) {
  return Math.hypot(point.x, point.y) - Math.min(geometry.width, geometry.height) / 2;
}
function capsuleDistance(point, geometry) {
  const radius = Math.min(geometry.width, geometry.height) / 2;
  if (geometry.width >= geometry.height) {
    const halfSegment2 = geometry.width / 2 - radius;
    const closestX = clamp(point.x, -halfSegment2, halfSegment2);
    return Math.hypot(point.x - closestX, point.y) - radius;
  }
  const halfSegment = geometry.height / 2 - radius;
  const closestY = clamp(point.y, -halfSegment, halfSegment);
  return Math.hypot(point.x, point.y - closestY) - radius;
}
function roundedRectDistance(point, geometry) {
  const halfWidth = geometry.width / 2;
  const halfHeight = geometry.height / 2;
  const radius = geometry.cornerRadius;
  const qx = Math.abs(point.x) - (halfWidth - radius);
  const qy = Math.abs(point.y) - (halfHeight - radius);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - radius;
}
function superellipseDistance(point, geometry) {
  const halfWidth = geometry.width / 2;
  const halfHeight = geometry.height / 2;
  const nx = Math.abs(point.x) / halfWidth;
  const ny = Math.abs(point.y) / halfHeight;
  const implicitRadius = (nx ** geometry.exponent + ny ** geometry.exponent) ** (1 / geometry.exponent);
  return (implicitRadius - 1) * Math.min(halfWidth, halfHeight);
}
function signedDistance(point, geometry) {
  const sanitized = sanitizeGeometry(geometry);
  const safePoint = {
    x: finite(point.x, 0),
    y: finite(point.y, 0)
  };
  switch (sanitized.kind) {
    case "circle":
      return circleDistance(safePoint, sanitized);
    case "capsule":
      return capsuleDistance(safePoint, sanitized);
    case "rounded-rect":
      return roundedRectDistance(safePoint, sanitized);
    case "superellipse":
      return superellipseDistance(safePoint, sanitized);
  }
}
function surfaceHeight(point, geometry, thickness) {
  const safeThickness = clamp(finite(thickness, 0.6), 0, 1.5);
  const minimumDimension = Math.min(positive(geometry.width, 1), positive(geometry.height, 1));
  const maximumInteriorDistance = Math.max(-signedDistance({ x: 0, y: 0 }, geometry), 1);
  const interiorDistance = Math.max(-signedDistance(point, geometry), 0);
  const normalizedInterior = clamp(interiorDistance / maximumInteriorDistance, 0, 1);
  const profile = Math.sin(normalizedInterior * Math.PI / 2);
  return profile * minimumDimension * 0.18 * safeThickness;
}
function surfaceNormal(point, geometry, thickness) {
  const minimumDimension = Math.min(positive(geometry.width, 1), positive(geometry.height, 1));
  const step = Math.max(minimumDimension / 256, 0.25);
  const left = surfaceHeight({ x: point.x - step, y: point.y }, geometry, thickness);
  const right = surfaceHeight({ x: point.x + step, y: point.y }, geometry, thickness);
  const top = surfaceHeight({ x: point.x, y: point.y - step }, geometry, thickness);
  const bottom = surfaceHeight({ x: point.x, y: point.y + step }, geometry, thickness);
  const dx = (right - left) / (2 * step);
  const dy = (bottom - top) / (2 * step);
  return normalize3(-dx, -dy, 1);
}
var MATERIAL_PRESETS = {
  regular: {
    thickness: 0.62,
    ior: 1.46,
    dispersion: 0.012,
    edgeStrength: 0.46,
    bevel: 0.68,
    frost: 0.24
  },
  clear: {
    thickness: 0.78,
    ior: 1.5,
    dispersion: 0.018,
    edgeStrength: 0.54,
    bevel: 0.76,
    frost: 0.04
  },
  frosted: {
    thickness: 0.44,
    ior: 1.4,
    dispersion: 6e-3,
    edgeStrength: 0.36,
    bevel: 0.58,
    frost: 0.66
  }
};
function sanitizeMaterial(material) {
  return {
    thickness: clamp(finite(material.thickness, 0.62), 0, 1.5),
    ior: clamp(finite(material.ior, 1.46), 1, 2.5),
    dispersion: clamp(finite(material.dispersion, 0.012), 0, 0.08),
    edgeStrength: clamp(finite(material.edgeStrength, 0.46), 0, 1),
    bevel: clamp(finite(material.bevel, 0.68), 0.05, 1),
    frost: clamp(finite(material.frost, 0.24), 0, 1)
  };
}
function getMaterialPreset(name) {
  return { ...MATERIAL_PRESETS[name] };
}
function mapDimension(value) {
  return Math.round(clamp(positive(value, 1), 1, 4096));
}
function normalizedGeometry(geometry) {
  const width = positive(geometry.width, 1);
  const height = positive(geometry.height, 1);
  const maximumRadius = Math.min(width, height) / 2;
  return {
    kind: geometry.kind,
    width,
    height,
    cornerRadius: clamp(
      positive(geometry.cornerRadius ?? maximumRadius * 0.25, 1),
      0,
      maximumRadius
    ),
    exponent: clamp(positive(geometry.exponent ?? 4, 4), 2, 16)
  };
}
function rounded(value) {
  return Number(finite(value, 0).toFixed(6));
}
function createOpticsCacheKey(input) {
  const geometry = normalizedGeometry(input.geometry);
  const material = sanitizeMaterial(input.material);
  return JSON.stringify([
    "ogui-map-v1",
    mapDimension(input.width),
    mapDimension(input.height),
    geometry.kind,
    rounded(geometry.width),
    rounded(geometry.height),
    rounded(geometry.cornerRadius),
    rounded(geometry.exponent),
    rounded(material.thickness),
    rounded(material.ior),
    rounded(material.dispersion),
    rounded(material.edgeStrength),
    rounded(material.bevel),
    rounded(material.frost)
  ]);
}
function smoothMask(distance, antialiasWidth) {
  const linear = clamp(0.5 - distance / Math.max(antialiasWidth * 2, 1e-4), 0, 1);
  return linear * linear * (3 - 2 * linear);
}
function channel(value) {
  return Math.round(clamp(value, 0, 1) * 255);
}
function vectorChannel(value) {
  return Math.round(128 + clamp(value, -1, 1) * 127);
}
function generateDisplacementMap(input) {
  const width = mapDimension(input.width);
  const height = mapDimension(input.height);
  const geometry = normalizedGeometry(input.geometry);
  const material = sanitizeMaterial(input.material);
  const data = new Uint8ClampedArray(width * height * 4);
  const xScale = geometry.width / width;
  const yScale = geometry.height / height;
  const antialiasWidth = Math.max(xScale, yScale) * 0.8;
  const minimumDimension = Math.min(geometry.width, geometry.height);
  const bevelDepth = Math.max(minimumDimension * material.bevel * 0.48, antialiasWidth);
  const refractionStrength = (material.ior - 1) / material.ior * material.thickness * 2.2;
  let maxDisplacement = 0;
  for (let y = 0; y < height; y += 1) {
    const geometryY = (y + 0.5 - height / 2) * yScale;
    for (let x = 0; x < width; x += 1) {
      const geometryX = (x + 0.5 - width / 2) * xScale;
      const offset = (y * width + x) * 4;
      const point = { x: geometryX, y: geometryY };
      const distance = signedDistance(point, geometry);
      const mask = smoothMask(distance, antialiasWidth);
      if (mask <= 0) {
        data[offset] = 128;
        data[offset + 1] = 128;
        data[offset + 2] = 0;
        data[offset + 3] = 0;
        continue;
      }
      const normal = surfaceNormal(point, geometry, material.thickness);
      const displacementX = normal.x * refractionStrength * mask;
      const displacementY = normal.y * refractionStrength * mask;
      const displacementMagnitude = Math.hypot(displacementX, displacementY);
      const interiorDistance = Math.max(-distance, 0);
      const edgeProximity = 1 - clamp(interiorDistance / bevelDepth, 0, 1);
      const fresnel = (1 - normal.z) ** 2;
      const specular = clamp(
        (edgeProximity * 0.24 + fresnel * 5.5) * material.edgeStrength * mask,
        0,
        1
      );
      maxDisplacement = Math.max(maxDisplacement, displacementMagnitude);
      data[offset] = vectorChannel(displacementX);
      data[offset + 1] = vectorChannel(displacementY);
      data[offset + 2] = channel(specular);
      data[offset + 3] = channel(mask);
    }
  }
  return {
    width,
    height,
    data,
    cacheKey: createOpticsCacheKey({ width, height, geometry, material }),
    maxDisplacement
  };
}
var QUALITY_PROFILES = {
  low: {
    scale: 0.3,
    maximumDimension: 96,
    minimumDimension: 16,
    dispersionSamples: 1
  },
  medium: {
    scale: 0.55,
    maximumDimension: 192,
    minimumDimension: 24,
    dispersionSamples: 2
  },
  high: {
    scale: 1,
    maximumDimension: 384,
    minimumDimension: 32,
    dispersionSamples: 3
  }
};
function resolveMapDimensions(width, height, quality) {
  const profile = QUALITY_PROFILES[quality];
  const safeWidth = positive(width, 1);
  const safeHeight = positive(height, 1);
  const scaledWidth = safeWidth * profile.scale;
  const scaledHeight = safeHeight * profile.scale;
  const largest = Math.max(scaledWidth, scaledHeight);
  const maximumScale = largest > profile.maximumDimension ? profile.maximumDimension / largest : 1;
  const widthAfterMaximum = scaledWidth * maximumScale;
  const heightAfterMaximum = scaledHeight * maximumScale;
  const smallest = Math.min(widthAfterMaximum, heightAfterMaximum);
  const minimumScale = smallest < profile.minimumDimension ? profile.minimumDimension / smallest : 1;
  return {
    width: Math.round(
      clamp(widthAfterMaximum * minimumScale, profile.minimumDimension, profile.maximumDimension)
    ),
    height: Math.round(
      clamp(heightAfterMaximum * minimumScale, profile.minimumDimension, profile.maximumDimension)
    )
  };
}
function applyQualityToMapInput(input, quality) {
  const dimensions = resolveMapDimensions(input.width, input.height, quality);
  return {
    ...input,
    ...dimensions
  };
}
function abortError() {
  const error = new Error("Optics map generation was aborted.");
  error.name = "AbortError";
  return error;
}
async function generateDisplacementMapAsync(input, options = {}) {
  if (options.signal?.aborted) {
    throw abortError();
  }
  await new Promise((resolve) => queueMicrotask(resolve));
  if (options.signal?.aborted) {
    throw abortError();
  }
  return generateDisplacementMap(applyQualityToMapInput(input, options.quality ?? "high"));
}
var OpticsMapCache = class {
  #entries = /* @__PURE__ */ new Map();
  #maximumBytes;
  #bytes = 0;
  #hits = 0;
  #misses = 0;
  constructor(maximumBytes = 8 * 1024 * 1024) {
    this.#maximumBytes = Math.round(
      clamp(finite(maximumBytes, 8 * 1024 * 1024), 1024, 64 * 1024 * 1024)
    );
  }
  getOrCreate(input, quality = "high") {
    const resolvedInput = applyQualityToMapInput(input, quality);
    const cacheKey = createOpticsCacheKey(resolvedInput);
    const cached = this.#entries.get(cacheKey);
    if (cached) {
      this.#hits += 1;
      this.#entries.delete(cacheKey);
      this.#entries.set(cacheKey, cached);
      return cached.map;
    }
    this.#misses += 1;
    const generated = generateDisplacementMap(resolvedInput);
    this.#store(generated);
    return generated;
  }
  clear() {
    this.#entries.clear();
    this.#bytes = 0;
  }
  stats() {
    return {
      entries: this.#entries.size,
      bytes: this.#bytes,
      maximumBytes: this.#maximumBytes,
      hits: this.#hits,
      misses: this.#misses
    };
  }
  #store(map) {
    const bytes = map.data.byteLength;
    if (bytes > this.#maximumBytes) {
      return;
    }
    while (this.#bytes + bytes > this.#maximumBytes && this.#entries.size > 0) {
      const oldestKey = this.#entries.keys().next().value;
      if (typeof oldestKey !== "string") {
        break;
      }
      const oldest = this.#entries.get(oldestKey);
      this.#entries.delete(oldestKey);
      this.#bytes -= oldest?.bytes ?? 0;
    }
    this.#entries.set(map.cacheKey, { map, bytes });
    this.#bytes += bytes;
  }
};
var DEFAULT_GLASS_LIGHT_ANGLE = 340;
var DEFAULT_GLASS_LIGHT_SPREAD = 110;
var GLASS_LOOK_PRESETS = {
  /** The default: clear, saturated, lit from the top. */
  liquid: {},
  /** Dense and soft. Content behind reads as colour, not shape. */
  frosted: { blur: 2.2, opacity: 1.6, saturation: 0.8, rim: 0.7, lensing: 0.5 },
  /** Nearly invisible glass defined by its edges. */
  clear: { blur: 0.25, opacity: 0.85, saturation: 1.1, rim: 1.25, lensing: 1.2 },
  /** See-through but dark and faded, like tinted glass. */
  smoked: {
    blur: 0.8,
    opacity: 1.9,
    tint: { dark: "rgb(8 10 14)", light: "rgb(206 210 218)" },
    saturation: 0.7,
    brightness: 0.8,
    rim: 0.75
  },
  /** Thick, light-bending glass: strong edges, little frost. */
  lensed: { blur: 0.5, opacity: 0.85, saturation: 1.25, rim: 1.45, lensing: 2, lightSpread: 160 }
};
var RANGES = {
  blur: [0, 4],
  opacity: [0, 3],
  saturation: [0, 3],
  brightness: [0.3, 2],
  rim: [0, 2],
  highlight: [0, 2],
  lensing: [0, 3],
  shadow: [0, 3]
};
function number(value, [low, high]) {
  return value === void 0 ? void 0 : clamp(finite(value, 1), low, high);
}
function resolveGlassLook(input = "liquid") {
  return typeof input === "string" ? { ...GLASS_LOOK_PRESETS[input] ?? {} } : { ...input };
}
function createGlassLookTokens(input = "liquid") {
  const look = resolveGlassLook(input);
  const tokens = {};
  const put = (name, value, unit = "") => {
    if (value !== void 0) {
      tokens[name] = `${Number(value.toFixed(4))}${unit}`;
    }
  };
  put("--ogui-glass-blur", number(look.blur, RANGES.blur));
  put("--ogui-glass-opacity", number(look.opacity, RANGES.opacity));
  put("--ogui-glass-saturation", number(look.saturation, RANGES.saturation));
  put("--ogui-glass-brightness", number(look.brightness, RANGES.brightness));
  put("--ogui-glass-rim", number(look.rim, RANGES.rim));
  put("--ogui-glass-highlight", number(look.highlight, RANGES.highlight));
  put("--ogui-glass-lensing", number(look.lensing, RANGES.lensing));
  put("--ogui-glass-shadow", number(look.shadow, RANGES.shadow));
  if (look.lightAngle !== void 0) {
    put("--ogui-glass-light-angle", (finite(look.lightAngle, 0) % 360 + 360) % 360, "deg");
  }
  if (look.lightSpread !== void 0) {
    const spread = clamp(finite(look.lightSpread, 110), 0, 170);
    put("--ogui-glass-light-spread", Math.max(spread, 1), "deg");
    if (spread === 0) {
      tokens["--ogui-glass-highlight"] = "0";
    }
  }
  const color = (value) => {
    if (value === void 0 || value.trim() === "") return void 0;
    if (/[;{}]/.test(value)) {
      throw new Error(`Invalid glass tint "${value}". Use a CSS colour such as #0b0d10.`);
    }
    return value.trim();
  };
  if (typeof look.tint === "string") {
    const tint = color(look.tint);
    if (tint) tokens["--ogui-glass-tint"] = tint;
  } else if (look.tint) {
    const dark = color(look.tint.dark);
    const light = color(look.tint.light);
    if (dark) tokens["--ogui-glass-tint-dark"] = dark;
    if (light) tokens["--ogui-glass-tint-light"] = light;
  }
  return tokens;
}
var HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;
var PRESET_ACCENTS = {
  neutral: {
    dark: { accent: "#f4f3ee", secondary: "#c8cbc6", tertiary: "#8d938f" },
    light: { accent: "#151719", secondary: "#4f5652", tertiary: "#8a8f8b" }
  },
  cobalt: {
    dark: { accent: "#7896ff", secondary: "#a5b7ff", tertiary: "#6fd5e8" },
    light: { accent: "#315ee8", secondary: "#5e72cb", tertiary: "#16788c" }
  },
  teal: {
    dark: { accent: "#43d6b0", secondary: "#83dfc9", tertiary: "#75bde5" },
    light: { accent: "#087f6b", secondary: "#337d72", tertiary: "#276b91" }
  },
  violet: {
    dark: { accent: "#aa92ff", secondary: "#c4b7f6", tertiary: "#e39abf" },
    light: { accent: "#6549d5", secondary: "#765fb4", tertiary: "#a14472" }
  },
  coral: {
    dark: { accent: "#ff8a76", secondary: "#ffb09f", tertiary: "#f2c368" },
    light: { accent: "#c94735", secondary: "#a95748", tertiary: "#8c6400" }
  },
  amber: {
    dark: { accent: "#f1c75b", secondary: "#e7d08e", tertiary: "#db9162" },
    light: { accent: "#966300", secondary: "#836b2e", tertiary: "#9c4f2e" }
  }
};
var RADII = {
  sharp: { control: "0.5rem", surface: "0.75rem", capsule: "0.5rem" },
  balanced: { control: "0.8rem", surface: "1.2rem", capsule: "999px" },
  soft: { control: "1.05rem", surface: "1.65rem", capsule: "999px" }
};
function expandHex(color) {
  const normalized = color.toLowerCase();
  if (!HEX_COLOR.test(normalized)) {
    throw new Error(
      `Invalid theme color "${color}". Use a three- or six-digit hexadecimal color such as #5b7cff.`
    );
  }
  if (normalized.length === 4) {
    return `#${normalized.slice(1).split("").map((channel2) => `${channel2}${channel2}`).join("")}`;
  }
  return normalized;
}
function rgb(color) {
  const value = expandHex(color).slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}
function channelLuminance(channel2) {
  const value = channel2 / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
function relativeLuminance(color) {
  const value = rgb(color);
  return channelLuminance(value.r) * 0.2126 + channelLuminance(value.g) * 0.7152 + channelLuminance(value.b) * 0.0722;
}
function contrastRatio(first, second) {
  const high = Math.max(relativeLuminance(first), relativeLuminance(second));
  const low = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (high + 0.05) / (low + 0.05);
}
function readableForeground(background) {
  const dark = "#101214";
  const light = "#f9f8f3";
  return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light;
}
function alpha(color, opacity) {
  const value = rgb(color);
  return `rgb(${value.r} ${value.g} ${value.b} / ${opacity})`;
}
function createGlassTheme(appearance, input = {}) {
  const dark = appearance === "dark";
  const contrast = input.contrast ?? "high";
  const radius = RADII[input.radius ?? "balanced"];
  const preset = PRESET_ACCENTS[input.preset ?? "neutral"][appearance];
  const accent = expandHex(input.accent ?? preset.accent);
  const accentInk = readableForeground(accent);
  const highContrast = contrast === "high";
  const danger = dark ? "#ff8176" : "#b93630";
  const success = dark ? "#58d79e" : "#15734d";
  const warning = dark ? "#f1c75b" : "#855a00";
  const canvas = dark ? "#0e1113" : "#fbfaf6";
  const focus = contrastRatio(accent, canvas) >= 3 ? accent : readableForeground(canvas);
  return {
    appearance,
    background: dark ? "#080a0b" : "#f4f2ec",
    canvas,
    surface: dark ? "rgb(255 255 255 / 0.075)" : "rgb(255 255 255 / 0.64)",
    surfaceStrong: dark ? "rgb(255 255 255 / 0.12)" : "rgb(255 255 255 / 0.88)",
    text: dark ? "#f7f6f1" : "#111315",
    muted: dark ? highContrast ? "#bec2bd" : "#a5aaa6" : highContrast ? "#4b514d" : "#606662",
    border: dark ? highContrast ? "rgb(255 255 255 / 0.2)" : "rgb(255 255 255 / 0.14)" : highContrast ? "rgb(14 18 16 / 0.22)" : "rgb(14 18 16 / 0.16)",
    borderStrong: dark ? "rgb(255 255 255 / 0.34)" : "rgb(14 18 16 / 0.38)",
    control: dark ? "rgb(255 255 255 / 0.085)" : "rgb(255 255 255 / 0.7)",
    controlHover: dark ? "rgb(255 255 255 / 0.15)" : "rgb(255 255 255 / 0.96)",
    controlActive: dark ? "rgb(255 255 255 / 0.21)" : "rgb(225 223 216 / 0.96)",
    accent,
    accentInk,
    accentSoft: alpha(accent, dark ? 0.16 : 0.12),
    secondary: expandHex(input.secondary ?? preset.secondary),
    tertiary: expandHex(input.tertiary ?? preset.tertiary),
    focus,
    danger,
    dangerInk: readableForeground(danger),
    success,
    successInk: readableForeground(success),
    warning,
    warningInk: readableForeground(warning),
    radiusControl: radius.control,
    radiusSurface: radius.surface,
    radiusCapsule: radius.capsule,
    accentContrast: contrastRatio(accent, accentInk)
  };
}
function createGlassThemeTokens(palette) {
  return {
    "--ogui-color-background": palette.background,
    "--ogui-color-canvas": palette.canvas,
    "--ogui-color-surface": palette.surface,
    "--ogui-color-surface-strong": palette.surfaceStrong,
    "--ogui-color-text": palette.text,
    "--ogui-color-muted": palette.muted,
    "--ogui-color-border": palette.border,
    "--ogui-color-border-strong": palette.borderStrong,
    "--ogui-color-control": palette.control,
    "--ogui-color-control-hover": palette.controlHover,
    "--ogui-color-control-active": palette.controlActive,
    "--ogui-color-accent": palette.accent,
    "--ogui-color-accent-ink": palette.accentInk,
    "--ogui-color-accent-soft": palette.accentSoft,
    "--ogui-color-secondary": palette.secondary,
    "--ogui-color-tertiary": palette.tertiary,
    "--ogui-color-focus": palette.focus,
    "--ogui-color-danger": palette.danger,
    "--ogui-color-danger-ink": palette.dangerInk,
    "--ogui-color-success": palette.success,
    "--ogui-color-success-ink": palette.successInk,
    "--ogui-color-warning": palette.warning,
    "--ogui-color-warning-ink": palette.warningInk,
    "--ogui-radius-control": palette.radiusControl,
    "--ogui-radius-surface": palette.radiusSurface,
    "--ogui-radius-capsule": palette.radiusCapsule ?? "999px"
  };
}

export {
  signedDistance,
  surfaceHeight,
  surfaceNormal,
  sanitizeMaterial,
  getMaterialPreset,
  createOpticsCacheKey,
  generateDisplacementMap,
  QUALITY_PROFILES,
  resolveMapDimensions,
  applyQualityToMapInput,
  generateDisplacementMapAsync,
  OpticsMapCache,
  DEFAULT_GLASS_LIGHT_ANGLE,
  DEFAULT_GLASS_LIGHT_SPREAD,
  GLASS_LOOK_PRESETS,
  resolveGlassLook,
  createGlassLookTokens,
  relativeLuminance,
  contrastRatio,
  readableForeground,
  createGlassTheme,
  createGlassThemeTokens
};

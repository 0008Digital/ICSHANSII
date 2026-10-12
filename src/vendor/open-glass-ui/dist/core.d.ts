interface Point2D {
    x: number;
    y: number;
}
interface SurfaceNormal {
    x: number;
    y: number;
    z: number;
}
type LensShapeKind = "circle" | "capsule" | "rounded-rect" | "superellipse";
interface LensGeometry {
    kind: LensShapeKind;
    width: number;
    height: number;
    cornerRadius?: number;
    exponent?: number;
}
type MaterialPresetName = "regular" | "clear" | "frosted";
interface GlassMaterial {
    thickness: number;
    ior: number;
    dispersion: number;
    edgeStrength: number;
    bevel: number;
    frost: number;
}
interface DisplacementMapInput {
    width: number;
    height: number;
    geometry: LensGeometry;
    material: GlassMaterial;
}
interface DisplacementMap {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    cacheKey: string;
    maxDisplacement: number;
}

type OpticsQuality = "low" | "medium" | "high";
interface QualityProfile {
    scale: number;
    maximumDimension: number;
    minimumDimension: number;
    dispersionSamples: 1 | 2 | 3;
}
interface MapDimensions {
    width: number;
    height: number;
}
declare const QUALITY_PROFILES: Readonly<Record<OpticsQuality, QualityProfile>>;
declare function resolveMapDimensions(width: number, height: number, quality: OpticsQuality): MapDimensions;
declare function applyQualityToMapInput(input: DisplacementMapInput, quality: OpticsQuality): DisplacementMapInput;

interface OpticsCacheStats {
    entries: number;
    bytes: number;
    maximumBytes: number;
    hits: number;
    misses: number;
}
interface AsyncMapOptions {
    quality?: OpticsQuality;
    signal?: AbortSignal;
}
declare function generateDisplacementMapAsync(input: DisplacementMapInput, options?: AsyncMapOptions): Promise<DisplacementMap>;
declare class OpticsMapCache {
    #private;
    constructor(maximumBytes?: number);
    getOrCreate(input: DisplacementMapInput, quality?: OpticsQuality): DisplacementMap;
    clear(): void;
    stats(): OpticsCacheStats;
}

declare function createOpticsCacheKey(input: DisplacementMapInput): string;
declare function generateDisplacementMap(input: DisplacementMapInput): DisplacementMap;

declare function signedDistance(point: Point2D, geometry: LensGeometry): number;
declare function surfaceHeight(point: Point2D, geometry: LensGeometry, thickness: number): number;
declare function surfaceNormal(point: Point2D, geometry: LensGeometry, thickness: number): SurfaceNormal;

/**
 * Art direction for liquid glass. Every numeric field except the two light
 * angles is a multiplier where `1` is the default look, so values compose
 * predictably with the per-surface materials (clear, regular, frosted).
 */
interface GlassLook {
    /** Backdrop blur multiplier. 0 is perfectly clear, 2+ is heavily frosted. */
    blur?: number;
    /** Tint opacity multiplier. Low is see-through, high is dense. */
    opacity?: number;
    /**
     * Tint mixed into every surface (any CSS colour). Pass `{ dark, light }` to
     * tint each appearance differently: a dark tint needs light text, so smoked
     * glass, for example, uses a near-black tint in dark mode and a grey one in
     * light mode.
     */
    tint?: string | {
        dark?: string;
        light?: string;
    };
    /** Backdrop saturation multiplier: how vividly colour bleeds through. */
    saturation?: number;
    /** Backdrop brightness multiplier. Below 1 dims what sits behind the glass. */
    brightness?: number;
    /** Whole-edge multiplier: hairline, highlight, and inner bloom. 0 removes the edge. */
    rim?: number;
    /** Directional highlight intensity only (0 to 2). 0 keeps a plain hairline edge. */
    highlight?: number;
    /** Direction light comes from, in degrees: 0 is top, 90 right, 270 left. */
    lightAngle?: number;
    /**
     * How much of the edge the highlight covers, in degrees of arc (0 to 170).
     * 0 switches the directional highlight off, leaving only the hairline.
     */
    lightSpread?: number;
    /** Edge lensing multiplier: the bright inner edge that reads as thickness. */
    lensing?: number;
    /** Depth (drop shadow) multiplier. */
    shadow?: number;
}
type GlassLookPreset = "liquid" | "frosted" | "clear" | "smoked" | "lensed";
type GlassLookInput = GlassLookPreset | GlassLook;
interface GlassLookTokens {
    "--ogui-glass-blur"?: string;
    "--ogui-glass-opacity"?: string;
    "--ogui-glass-tint"?: string;
    "--ogui-glass-tint-dark"?: string;
    "--ogui-glass-tint-light"?: string;
    "--ogui-glass-saturation"?: string;
    "--ogui-glass-brightness"?: string;
    "--ogui-glass-rim"?: string;
    "--ogui-glass-highlight"?: string;
    "--ogui-glass-light-angle"?: string;
    "--ogui-glass-light-spread"?: string;
    "--ogui-glass-lensing"?: string;
    "--ogui-glass-shadow"?: string;
}
/** Default light: from the top, a little left of centre. */
declare const DEFAULT_GLASS_LIGHT_ANGLE = 340;
declare const DEFAULT_GLASS_LIGHT_SPREAD = 110;
declare const GLASS_LOOK_PRESETS: Readonly<Record<GlassLookPreset, Readonly<GlassLook>>>;
declare function resolveGlassLook(input?: GlassLookInput): GlassLook;
/**
 * Converts a look into the `--ogui-glass-*` custom properties the liquid design
 * reads. Only fields that are set are emitted, so a look applied to one
 * element overrides just those fields and inherits the rest.
 */
declare function createGlassLookTokens(input?: GlassLookInput): GlassLookTokens;

declare function sanitizeMaterial(material: GlassMaterial): GlassMaterial;
declare function getMaterialPreset(name: MaterialPresetName): GlassMaterial;

type GlassAppearance = "dark" | "light";
type GlassAppearancePreference = GlassAppearance | "system";
type GlassContrast = "standard" | "high";
type GlassRadius = "sharp" | "balanced" | "soft";
/**
 * The visual language the recipes render in.
 *
 * - `liquid` (default since 0.4): clear, highly saturated glass with
 *   directional specular rims, capsule controls, and fluid selection.
 * - `classic`: the 0.1 to 0.3 look, kept byte-for-byte so existing products can
 *   upgrade the package without a visual change.
 */
type GlassDesign = "liquid" | "classic";
type GlassThemePreset = "neutral" | "cobalt" | "teal" | "violet" | "coral" | "amber";
interface GlassThemeInput {
    /**
     * Art direction for the liquid design: a preset name or individual
     * multipliers. Written as `--ogui-glass-*` custom properties on the theme
     * boundary; ignored by the classic design.
     */
    glass?: GlassLookInput;
    preset?: GlassThemePreset;
    accent?: string;
    secondary?: string;
    tertiary?: string;
    contrast?: GlassContrast;
    radius?: GlassRadius;
}
interface GlassThemePalette {
    appearance: GlassAppearance;
    background: string;
    canvas: string;
    surface: string;
    surfaceStrong: string;
    text: string;
    muted: string;
    border: string;
    borderStrong: string;
    control: string;
    controlHover: string;
    controlActive: string;
    accent: string;
    accentInk: string;
    accentSoft: string;
    secondary: string;
    tertiary: string;
    focus: string;
    danger: string;
    dangerInk: string;
    success: string;
    successInk: string;
    warning: string;
    warningInk: string;
    radiusControl: string;
    radiusSurface: string;
    /** Radius for pill-shaped controls. Optional so hand-built palettes stay valid. */
    radiusCapsule?: string;
    accentContrast: number;
}
interface GlassThemeTokens {
    "--ogui-color-background": string;
    "--ogui-color-canvas": string;
    "--ogui-color-surface": string;
    "--ogui-color-surface-strong": string;
    "--ogui-color-text": string;
    "--ogui-color-muted": string;
    "--ogui-color-border": string;
    "--ogui-color-border-strong": string;
    "--ogui-color-control": string;
    "--ogui-color-control-hover": string;
    "--ogui-color-control-active": string;
    "--ogui-color-accent": string;
    "--ogui-color-accent-ink": string;
    "--ogui-color-accent-soft": string;
    "--ogui-color-secondary": string;
    "--ogui-color-tertiary": string;
    "--ogui-color-focus": string;
    "--ogui-color-danger": string;
    "--ogui-color-danger-ink": string;
    "--ogui-color-success": string;
    "--ogui-color-success-ink": string;
    "--ogui-color-warning": string;
    "--ogui-color-warning-ink": string;
    "--ogui-radius-control": string;
    "--ogui-radius-surface": string;
    "--ogui-radius-capsule"?: string;
}
declare function relativeLuminance(color: string): number;
declare function contrastRatio(first: string, second: string): number;
declare function readableForeground(background: string): "#101214" | "#f9f8f3";
declare function createGlassTheme(appearance: GlassAppearance, input?: GlassThemeInput): GlassThemePalette;
declare function createGlassThemeTokens(palette: GlassThemePalette): GlassThemeTokens;

export { type AsyncMapOptions, DEFAULT_GLASS_LIGHT_ANGLE, DEFAULT_GLASS_LIGHT_SPREAD, type DisplacementMap, type DisplacementMapInput, GLASS_LOOK_PRESETS, type GlassAppearance, type GlassAppearancePreference, type GlassContrast, type GlassDesign, type GlassLook, type GlassLookInput, type GlassLookPreset, type GlassLookTokens, type GlassMaterial, type GlassRadius, type GlassThemeInput, type GlassThemePalette, type GlassThemePreset, type GlassThemeTokens, type LensGeometry, type LensShapeKind, type MapDimensions, type MaterialPresetName, type OpticsCacheStats, OpticsMapCache, type OpticsQuality, type Point2D, QUALITY_PROFILES, type QualityProfile, type SurfaceNormal, applyQualityToMapInput, contrastRatio, createGlassLookTokens, createGlassTheme, createGlassThemeTokens, createOpticsCacheKey, generateDisplacementMap, generateDisplacementMapAsync, getMaterialPreset, readableForeground, relativeLuminance, resolveGlassLook, resolveMapDimensions, sanitizeMaterial, signedDistance, surfaceHeight, surfaceNormal };

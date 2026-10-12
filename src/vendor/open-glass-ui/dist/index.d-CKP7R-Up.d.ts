type MaterialPresetName = "regular" | "clear" | "frosted";
interface GlassMaterial {
    thickness: number;
    ior: number;
    dispersion: number;
    edgeStrength: number;
    bevel: number;
    frost: number;
}
interface DisplacementMap {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    cacheKey: string;
    maxDisplacement: number;
}
/**
 * The visual language the recipes render in.
 *
 * - `liquid` (default since 0.4): clear, highly saturated glass with
 *   directional specular rims, capsule controls, and fluid selection.
 * - `classic`: the 0.1 to 0.3 look, kept byte-for-byte so existing products can
 *   upgrade the package without a visual change.
 */
type GlassDesign = "liquid" | "classic";

export type { DisplacementMap as D, GlassMaterial as G, MaterialPresetName as M, GlassDesign as a };

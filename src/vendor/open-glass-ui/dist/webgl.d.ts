import * as react from 'react';
import { CanvasHTMLAttributes, RefObject } from 'react';
import { G as GlassMaterial } from './index.d-CKP7R-Up.js';

declare const MAX_WEBGL_LENSES = 6;
interface WebGLLens {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    material: GlassMaterial;
}
type WebGLRendererStatus = "ready" | "lost" | "restored" | "disposed";
interface WebGLGlassRendererOptions {
    onStatusChange?: (status: WebGLRendererStatus) => void;
}
interface PackedLensUniforms {
    count: number;
    rectangles: Float32Array;
    optics: Float32Array;
    surface: Float32Array;
}
declare function packLensUniforms(lenses: readonly WebGLLens[]): PackedLensUniforms;
declare class WebGLGlassRenderer {
    #private;
    constructor(canvas: HTMLCanvasElement, options?: WebGLGlassRendererOptions);
    get status(): WebGLRendererStatus;
    resize(cssWidth: number, cssHeight: number, devicePixelRatio?: number): void;
    render(source: TexImageSource, lenses: readonly WebGLLens[]): void;
    dispose(): void;
}

type WebGLSource = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageBitmap | ImageData | OffscreenCanvas;
type WebGLSurfaceStatus = WebGLRendererStatus | "idle" | "unavailable" | "error";
interface WebGLGlassSurfaceProps extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, "children"> {
    sourceRef: RefObject<WebGLSource | null>;
    lenses: readonly WebGLLens[];
    continuous?: boolean;
    renderKey?: string | number;
    maxDevicePixelRatio?: number;
    onStatusChange?: (status: WebGLSurfaceStatus) => void;
    onRendererError?: (error: Error) => void;
}
declare function scaleWebGLLenses(lenses: readonly WebGLLens[], devicePixelRatio: number): WebGLLens[];
declare const WebGLGlassSurface: react.ForwardRefExoticComponent<WebGLGlassSurfaceProps & react.RefAttributes<HTMLCanvasElement>>;

export { MAX_WEBGL_LENSES, type PackedLensUniforms, WebGLGlassRenderer, type WebGLGlassRendererOptions, WebGLGlassSurface, type WebGLGlassSurfaceProps, type WebGLLens, type WebGLRendererStatus, type WebGLSource, type WebGLSurfaceStatus, packLensUniforms, scaleWebGLLenses };

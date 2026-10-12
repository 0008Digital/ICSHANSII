import * as react from 'react';
import { HTMLAttributes, ReactNode, MutableRefObject, PointerEvent, ButtonHTMLAttributes, InputHTMLAttributes, ReactElement, ChangeEvent, FieldsetHTMLAttributes, SelectHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { GlassDesign as GlassDesign$2 } from './core.js';
export { AsyncMapOptions, DEFAULT_GLASS_LIGHT_ANGLE, DEFAULT_GLASS_LIGHT_SPREAD, DisplacementMap, DisplacementMapInput, GLASS_LOOK_PRESETS, GlassAppearance, GlassAppearancePreference, GlassContrast, GlassLook, GlassLookInput, GlassLookPreset, GlassLookTokens, GlassMaterial, GlassRadius, GlassThemeInput, GlassThemePalette, GlassThemePreset, GlassThemeTokens, LensGeometry, LensShapeKind, MapDimensions, MaterialPresetName, OpticsCacheStats, OpticsMapCache, OpticsQuality, Point2D, QUALITY_PROFILES, QualityProfile, SurfaceNormal, applyQualityToMapInput, contrastRatio, createGlassLookTokens, createGlassTheme, createGlassThemeTokens, createOpticsCacheKey, generateDisplacementMap, generateDisplacementMapAsync, getMaterialPreset, readableForeground, relativeLuminance, resolveGlassLook, resolveMapDimensions, sanitizeMaterial, signedDistance, surfaceHeight, surfaceNormal } from './core.js';
import { M as MaterialPresetName$1, a as GlassDesign$1, D as DisplacementMap, G as GlassMaterial$1 } from './index.d-CKP7R-Up.js';

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

type OpticsQuality = "low" | "medium" | "high";

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

type ConcreteRenderer$1 = "css" | "organic-svg" | "sdf-svg" | "webgl2";
type RendererPreference$1 = "auto" | ConcreteRenderer$1;
type RendererSource$1 = "dom" | "media";
interface RendererCapabilities$1 {
    backdropFilter: boolean;
    backdropUrlSyntax: boolean;
    svgFilterElements: boolean;
    webgl2: boolean;
    reducedMotion: boolean;
    reducedTransparency: boolean;
    forcedColors: boolean;
    devicePixelRatio: number;
    hardwareConcurrency: number;
}

type MaterialTone$1 = "dark" | "light";

interface Canvas2DLike$1 {
    width: number;
    height: number;
    getContext(contextId: "2d"): {
        createImageData(width: number, height: number): ImageData;
        putImageData(imageData: ImageData, x: number, y: number): void;
    } | null;
    toDataURL(type?: string): string;
}
type CanvasFactory$1 = () => Canvas2DLike$1;
interface SvgDisplacementFilterSpec$1 {
    id: string;
    href: string;
    x: string;
    y: string;
    width: string;
    height: string;
    redScale: number;
    greenScale: number;
    blueScale: number;
    specularOpacity: number;
}

interface SdfFilterOptions {
    id: string;
    width: number;
    height: number;
    geometry: LensGeometry;
    material?: GlassMaterial;
    quality?: OpticsQuality;
    canvasFactory?: CanvasFactory$1;
}
interface SdfFilterState {
    filterId: string;
    ready: boolean;
    error: string | null;
    spec: SvgDisplacementFilterSpec$1 | null;
}
interface SdfFilterDefinitionProps {
    filter: SdfFilterState;
}
interface OrganicFilterDefinitionProps {
    id: string;
    frequency?: number;
    turbulence?: number;
    scale?: number;
    seed?: number;
    animate?: boolean;
    children?: ReactNode;
}
declare function useSdfFilter({ id, width, height, geometry, material, quality, canvasFactory, }: SdfFilterOptions): SdfFilterState;
declare function SdfFilterDefinition({ filter }: SdfFilterDefinitionProps): react.JSX.Element | null;
declare function OrganicFilterDefinition({ id, frequency, turbulence, scale, seed, animate, children, }: OrganicFilterDefinitionProps): react.JSX.Element;

type GlassElement$1 = "aside" | "div" | "nav" | "section" | "span";
interface GlassProps$1 extends Omit<HTMLAttributes<HTMLElement>, "color"> {
    as?: GlassElement$1;
    children?: ReactNode;
    material?: MaterialPresetName;
    tone?: MaterialTone$1 | "auto";
    renderer?: RendererPreference$1;
    source?: RendererSource$1;
    interactive?: boolean;
    optics?: Partial<GlassMaterial>;
    geometry?: LensGeometry;
    filterId?: string;
    /**
     * Per-element art direction for the liquid design: a preset name or
     * individual multipliers such as `{ lightAngle: 300, blur: 2 }`. Unset fields
     * inherit from the theme's `glass` look.
     */
    look?: GlassLookInput;
}
declare const Glass: react.ForwardRefExoticComponent<GlassProps$1 & react.RefAttributes<HTMLElement>>;

interface GlassPointerField {
    onPointerMove(event: PointerEvent<HTMLElement>): void;
    onPointerLeave(event: PointerEvent<HTMLElement>): void;
    onPointerDown(event: PointerEvent<HTMLElement>): void;
    onPointerUp(event: PointerEvent<HTMLElement>): void;
    onPointerCancel(event: PointerEvent<HTMLElement>): void;
}
declare function useGlassPointerField(enabled: boolean): GlassPointerField;

type GlassMotionPreference = "system" | "on" | "off";
type GlassQualityPreference = "auto" | OpticsQuality;
interface GlassProviderProps {
    children: ReactNode;
    renderer?: RendererPreference$1;
    quality?: GlassQualityPreference;
    motion?: GlassMotionPreference;
}
interface GlassRuntime {
    capabilities: RendererCapabilities$1;
    renderer: RendererPreference$1;
    quality: OpticsQuality;
    motion: "on" | "off";
    hydrated: boolean;
}
declare function GlassProvider({ children, renderer, quality, motion, }: GlassProviderProps): react.JSX.Element;
declare function useGlassRuntime(): GlassRuntime;
declare function useGlassCapabilities(): RendererCapabilities$1;

interface GlassGroupRuntime {
    id: string;
    sourceRef: MutableRefObject<HTMLElement | null>;
}
interface GlassGroupProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    id?: string;
}
interface GlassSourceProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
declare const GlassGroup: react.ForwardRefExoticComponent<GlassGroupProps & react.RefAttributes<HTMLDivElement>>;
declare const GlassSource: react.ForwardRefExoticComponent<GlassSourceProps & react.RefAttributes<HTMLDivElement>>;
declare function useGlassGroup(): GlassGroupRuntime | null;

interface GlassThemeRuntime {
    appearance: GlassAppearance;
    preference: GlassAppearancePreference;
    palette: GlassThemePalette;
    /** Theme tokens plus any `--ogui-glass-*` look tokens set on this boundary. */
    tokens: GlassThemeTokens & GlassLookTokens;
    hydrated: boolean;
    /** Visual language every descendant recipe and `<Glass>` renders in. */
    design: GlassDesign;
}
interface GlassThemeProviderProps extends Omit<HTMLAttributes<HTMLDivElement>, "color" | "children"> {
    children: ReactNode;
    appearance?: GlassAppearancePreference;
    defaultAppearance?: GlassAppearance;
    theme?: GlassThemeInput;
    /**
     * `liquid` (default) renders the current OpenGlass look. `classic` restores
     * the 0.3 look exactly, including its default `balanced` corner radius.
     */
    design?: GlassDesign;
}
declare function GlassThemeProvider({ children, appearance: preference, defaultAppearance, theme, design, className, style, ...props }: GlassThemeProviderProps): react.JSX.Element;
declare function useGlassTheme(): GlassThemeRuntime;

type GlassElement = "aside" | "div" | "nav" | "section" | "span";
interface GlassProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
    as?: GlassElement;
    children?: ReactNode;
    material?: MaterialPresetName;
    tone?: MaterialTone$1 | "auto";
    renderer?: RendererPreference$1;
    source?: RendererSource$1;
    interactive?: boolean;
    optics?: Partial<GlassMaterial>;
    geometry?: LensGeometry;
    filterId?: string;
    /**
     * Per-element art direction for the liquid design: a preset name or
     * individual multipliers such as `{ lightAngle: 300, blur: 2 }`. Unset fields
     * inherit from the theme's `glass` look.
     */
    look?: GlassLookInput;
}

type SemanticTone = "neutral" | "accent" | "positive" | "warning" | "danger";
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: SemanticTone;
}
declare function Badge({ tone, className, ...props }: BadgeProps): react.JSX.Element;
interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
    name: string;
    src?: string;
    size?: "small" | "medium" | "large";
}
declare function Avatar({ name, src, size, className, ...props }: AvatarProps): react.JSX.Element;
declare function AvatarGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>): react.JSX.Element;
interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    eyebrow?: ReactNode;
    title?: ReactNode;
    footer?: ReactNode;
    interactive?: boolean;
    onPress?: () => void;
}
declare function Card({ eyebrow, title, footer, interactive, onPress, className, children, onClick, onKeyDown, role, tabIndex, ...props }: CardProps): react.JSX.Element;
interface StatProps extends HTMLAttributes<HTMLDivElement> {
    label: ReactNode;
    value: ReactNode;
    change?: ReactNode;
    tone?: SemanticTone;
}
declare function Stat({ label, value, change, tone, className, ...props }: StatProps): react.JSX.Element;
interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
    label: ReactNode;
    value: number;
    max?: number;
}
declare function Progress({ label, value, max, className, ...props }: ProgressProps): react.JSX.Element;
interface MeterProps extends HTMLAttributes<HTMLDivElement> {
    label: ReactNode;
    value: number;
    min?: number;
    max?: number;
    low?: number;
    high?: number;
    optimum?: number;
}
declare function Meter({ label, value, min, max, low, high, optimum, className, ...props }: MeterProps): react.JSX.Element;
declare function Spinner({ label, className, ...props }: HTMLAttributes<HTMLSpanElement> & {
    label?: string;
}): react.JSX.Element;
declare function Skeleton({ width, className, ...props }: HTMLAttributes<HTMLSpanElement> & {
    width?: string;
}): react.JSX.Element;
interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    title: ReactNode;
    tone?: SemanticTone;
    onDismiss?: () => void;
}
declare function Alert({ title, tone, onDismiss, className, children, ...props }: AlertProps): react.JSX.Element;
interface BannerProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    title: ReactNode;
    action?: ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
}
declare function Banner({ title, action, dismissible, onDismiss, className, children, ...props }: BannerProps): react.JSX.Element | null;
interface BreadcrumbItem {
    label: string;
    href?: string;
}
declare function Breadcrumbs({ items, className, ...props }: HTMLAttributes<HTMLElement> & {
    items: readonly BreadcrumbItem[];
}): react.JSX.Element;
interface PaginationProps extends HTMLAttributes<HTMLElement> {
    page: number;
    count: number;
    onPageChange: (page: number) => void;
}
declare function Pagination({ page, count, onPageChange, className, ...props }: PaginationProps): react.JSX.Element;
interface AccordionItem {
    id: string;
    title: ReactNode;
    content: ReactNode;
}
declare function Accordion({ items, multiple, defaultOpenIds, headingLevel, className, ...props }: HTMLAttributes<HTMLDivElement> & {
    items: readonly AccordionItem[];
    multiple?: boolean;
    /** Item ids expanded on first render. Pass `[]` to start fully collapsed. */
    defaultOpenIds?: readonly string[];
    /** Heading level for item titles so the accordion fits the page outline. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
}): react.JSX.Element;
interface OverlayProps {
    title: string;
    /** Renders a built-in trigger button. Omit to control the overlay purely through `open`. */
    triggerLabel?: string;
    children: ReactNode;
    description?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    closeOnBackdrop?: boolean;
}
declare function Dialog(props: OverlayProps): react.JSX.Element;
declare function Drawer(props: OverlayProps): react.JSX.Element;
interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    title: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    duration?: number;
    restoreLabel?: string;
}
declare function Toast({ title, actionLabel, onAction, open: controlledOpen, defaultOpen, onOpenChange, duration, restoreLabel, className, children, onFocusCapture, onBlurCapture, onMouseEnter, onMouseLeave, onKeyDown, ...props }: ToastProps): react.JSX.Element | null;
interface ToastOptions {
    title: ReactNode;
    description?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    duration?: number;
}
interface ToastController {
    toast: (options: ToastOptions) => string;
    dismiss: (id: string) => void;
}
interface ToastProviderProps {
    children: ReactNode;
    defaultDuration?: number;
    maxVisible?: number;
    label?: string;
}
declare function ToastProvider({ children, defaultDuration, maxVisible, label, }: ToastProviderProps): react.JSX.Element;
declare function useToast(): ToastController;
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
    label: ReactNode;
    description?: ReactNode;
}
declare function Checkbox({ label, description, className, id: suppliedId, ...props }: CheckboxProps): react.JSX.Element;
interface RadioItem<T extends string> {
    value: T;
    label: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
}
interface RadioGroupProps<T extends string> {
    label: string;
    items: readonly RadioItem<T>[];
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    className?: string;
    name?: string;
    disabled?: boolean;
}
declare function RadioGroup<T extends string>({ label, items, value, defaultValue, onValueChange, className, name: suppliedName, disabled, }: RadioGroupProps<T>): react.JSX.Element;
interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: ReactNode;
    options: readonly SelectOption[];
}
declare function Select({ label, options, className, id: suppliedId, ...props }: SelectProps): react.JSX.Element;
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
}
declare function TextField({ label, hint, error, className, id: suppliedId, ...props }: TextFieldProps): react.JSX.Element;
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
}
declare function Textarea({ label, hint, error, className, id: suppliedId, ...props }: TextareaProps): react.JSX.Element;
interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
    label: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}
declare function SearchField({ label, value, defaultValue, onValueChange, className, id: suppliedId, ...props }: SearchFieldProps): react.JSX.Element;
interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue"> {
    label: ReactNode;
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    decrementLabel?: string;
    incrementLabel?: string;
}
declare function NumberField({ label, value, defaultValue, onValueChange, decrementLabel, incrementLabel, min, max, step, className, id: suppliedId, onChange, disabled, readOnly, ...props }: NumberFieldProps): react.JSX.Element;
interface StepItem {
    id?: string;
    label: ReactNode;
    description?: ReactNode;
}
declare function Stepper({ items, current, onStepChange, className, }: {
    items: readonly StepItem[];
    current: number;
    onStepChange?: (index: number) => void;
    className?: string;
}): react.JSX.Element;
interface ToggleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onChange"> {
    pressed?: boolean;
    defaultPressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
}
declare function ToggleButton({ pressed, defaultPressed, onPressedChange, className, children, onClick, ...props }: ToggleButtonProps): react.JSX.Element;
interface FileDropzoneProps extends HTMLAttributes<HTMLFieldSetElement> {
    label: string;
    name?: string;
    accept?: string;
    multiple?: boolean;
    maxSizeBytes?: number;
    onFiles?: (files: File[]) => void;
    onRejected?: (files: File[]) => void;
    onInputChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}
declare function FileDropzone({ label, name, accept, multiple, maxSizeBytes, onFiles, onRejected, onInputChange, className, onDragEnter, onDragOver, onDragLeave, onDrop, ...props }: FileDropzoneProps): react.JSX.Element;

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
type ControlSize = "small" | "medium" | "large";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ControlSize;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
}
declare function Button({ variant, size, leadingIcon, trailingIcon, className, children, type, onPointerMove, ...props }: ButtonProps): react.JSX.Element;
interface IconButtonProps extends Omit<ButtonProps, "children" | "aria-label"> {
    "aria-label": string;
    children: ReactNode;
}
declare function IconButton({ size, variant, className, children, ...props }: IconButtonProps): react.JSX.Element;
interface SegmentItem<T extends string> {
    value: T;
    label: string;
    icon?: ReactNode;
    disabled?: boolean;
}
interface SegmentedControlProps<T extends string> extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange" | "defaultValue"> {
    "aria-label": string;
    items: readonly SegmentItem<T>[];
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
}
declare function SegmentedControl<T extends string>({ items, value: controlledValue, defaultValue, onValueChange, className, "aria-label": label, ...props }: SegmentedControlProps<T>): react.JSX.Element;
interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
    label: ReactNode;
    description?: ReactNode;
    labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
    onCheckedChange?: (checked: boolean) => void;
}
declare function Switch({ label, description, className, labelProps, checked: controlledChecked, defaultChecked, onChange, onCheckedChange, id: suppliedId, ...props }: SwitchProps): react.JSX.Element;
interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
    label: ReactNode;
    valueText?: string;
    unit?: string;
}
declare function Slider({ label, valueText, unit, className, id: suppliedId, value, defaultValue, min, max, ...props }: SliderProps): react.JSX.Element;
interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    orientation?: "horizontal" | "vertical";
    material?: GlassProps["material"];
    tone?: GlassProps["tone"];
}
declare function Toolbar({ label, orientation, material, tone, className, children, ...props }: ToolbarProps): react.JSX.Element;
interface DockProps extends HTMLAttributes<HTMLElement> {
    label: string;
    material?: GlassProps["material"];
    tone?: GlassProps["tone"];
}
declare function Dock({ label, material, tone, className, children, ...props }: DockProps): react.JSX.Element;
interface TabItem<T extends string> {
    value: T;
    label: ReactNode;
    content: ReactNode;
    disabled?: boolean;
}
interface TabsProps<T extends string> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
    label: string;
    items: readonly TabItem<T>[];
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
}
declare function Tabs<T extends string>({ label, items, value: controlledValue, defaultValue: suppliedDefaultValue, onValueChange, className, ...props }: TabsProps<T>): react.JSX.Element;
interface DisclosureSurfaceProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
    trigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
    triggerLabel?: string;
    material?: GlassProps["material"];
    tone?: GlassProps["tone"];
    placement?: "start" | "center" | "end";
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    focusOnOpen?: "none" | "first" | "last";
    openOnArrowKeys?: boolean;
}
interface MenuProps extends DisclosureSurfaceProps {
    label: string;
}
declare function Menu({ label, children, ...props }: MenuProps): react.JSX.Element;
interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    destructive?: boolean;
}
declare function MenuItem({ destructive, className, children, type, onClick, ...props }: MenuItemProps): react.JSX.Element;
interface PopoverProps extends DisclosureSurfaceProps {
    label: string;
}
declare function Popover({ label, children, ...props }: PopoverProps): react.JSX.Element;
interface TooltipProps {
    label: ReactNode;
    children: ReactElement<{
        "aria-describedby"?: string;
    }>;
    placement?: "top" | "bottom";
}
declare function Tooltip({ label, children, placement }: TooltipProps): react.JSX.Element;
interface MediaControlsProps extends HTMLAttributes<HTMLDivElement> {
    playing: boolean;
    currentTime: number;
    duration: number;
    muted?: boolean;
    onPlayingChange: (playing: boolean) => void;
    onSeek: (time: number) => void;
    onMutedChange?: (muted: boolean) => void;
}
declare function MediaControls({ playing, currentTime, duration, muted, onPlayingChange, onSeek, onMutedChange, className, ...props }: MediaControlsProps): react.JSX.Element;

type ConcreteRenderer = "css" | "organic-svg" | "sdf-svg" | "webgl2";
type RendererPreference = "auto" | ConcreteRenderer;
type RendererSource = "dom" | "media";
interface RendererCapabilities {
    backdropFilter: boolean;
    backdropUrlSyntax: boolean;
    svgFilterElements: boolean;
    webgl2: boolean;
    reducedMotion: boolean;
    reducedTransparency: boolean;
    forcedColors: boolean;
    devicePixelRatio: number;
    hardwareConcurrency: number;
}
interface CapabilityProbe {
    supports(property: string, value: string): boolean;
    matches(query: string): boolean;
    hasSvgDisplacementElement(): boolean;
    hasWebGL2(): boolean;
    devicePixelRatio: number;
    hardwareConcurrency: number;
}
interface RendererRequest {
    preference?: RendererPreference;
    source: RendererSource;
    capabilities: RendererCapabilities;
}
interface RendererDecision {
    renderer: ConcreteRenderer;
    reason: "explicit" | "accessibility-fallback" | "css-first" | "capability-fallback";
}
declare function detectRendererCapabilities(probe?: CapabilityProbe | undefined): RendererCapabilities;
declare function selectRenderer(request: RendererRequest): RendererDecision;

type MaterialTone = "dark" | "light";
interface CssMaterialOptions {
    material: MaterialPresetName$1;
    tone: MaterialTone;
    backdropFilter?: boolean;
    reducedTransparency?: boolean;
    forcedColors?: boolean;
    /**
     * Overrides the material preset's own frost, in the range 0 to 1.
     *
     * Without this, `<Glass optics={{ frost }}>` changed the reported optics but
     * nothing a user could see, because the CSS material was selected purely by
     * preset name. Supplying it interpolates blur and surface opacity between the
     * three presets, so the three named materials still render exactly as before
     * and any value between or beyond them lands somewhere sensible.
     */
    frost?: number;
    /**
     * Visual language for the material. Defaults to `classic` here so direct
     * callers of this function keep their 0.3 output; `<Glass>` passes the
     * theme's design, which defaults to `liquid`.
     */
    design?: GlassDesign$1;
}
interface CssMaterialTokens {
    "--ogui-material-background": string;
    "--ogui-material-border": string;
    "--ogui-material-highlight": string;
    "--ogui-material-shadow": string;
    "--ogui-material-text": string;
    "--ogui-material-muted": string;
    "--ogui-material-filter": string;
    "--ogui-material-dim": string;
}
interface CssMaterialStyle {
    background: string;
    borderColor: string;
    boxShadow: string;
    color: string;
    backdropFilter: string;
    WebkitBackdropFilter: string;
}
declare function createCssMaterialTokens(options: CssMaterialOptions): CssMaterialTokens;
declare function createCssMaterialStyle(tokens: CssMaterialTokens): CssMaterialStyle;

interface Canvas2DLike {
    width: number;
    height: number;
    getContext(contextId: "2d"): {
        createImageData(width: number, height: number): ImageData;
        putImageData(imageData: ImageData, x: number, y: number): void;
    } | null;
    toDataURL(type?: string): string;
}
type CanvasFactory = () => Canvas2DLike;
interface SvgDisplacementFilterSpec {
    id: string;
    href: string;
    x: string;
    y: string;
    width: string;
    height: string;
    redScale: number;
    greenScale: number;
    blueScale: number;
    specularOpacity: number;
}
declare function createStableFilterId(base: string, cacheKey: string): string;
declare function encodeDisplacementMap(map: DisplacementMap, canvasFactory?: CanvasFactory): string;
declare function createSvgDisplacementFilterSpec(baseId: string, map: DisplacementMap, mapUrl: string, material: GlassMaterial$1): SvgDisplacementFilterSpec;

type GlassSystemThemeProps = Omit<GlassThemeProviderProps, "children">;
interface GlassSystemProviderProps extends Omit<GlassProviderProps, "children"> {
    children: ReactNode;
    /** Appearance, theme-token, class, style, and HTML props for the theme boundary. */
    theme?: GlassSystemThemeProps;
    /** Global toast queue options. Set to false when the application supplies its own provider. */
    toasts?: Omit<ToastProviderProps, "children"> | false;
    /**
     * Visual language. `liquid` is the default; pass `classic` to keep the 0.3
     * look exactly. Shorthand for `theme={{ design }}`; `theme.design` wins.
     */
    design?: GlassDesign$2;
}
/**
 * Establishes the runtime capability policy and theme boundary used by
 * OpenGlass UI primitives and recipes.
 */
declare function GlassSystemProvider({ children, theme, toasts, design, ...runtime }: GlassSystemProviderProps): react.JSX.Element;

export { Accordion, type AccordionItem, Alert, type AlertProps, Avatar, AvatarGroup, type AvatarProps, Badge, type BadgeProps, Banner, type BannerProps, type BreadcrumbItem, Breadcrumbs, Button, type ButtonProps, type ButtonVariant, type Canvas2DLike, type CanvasFactory, type CapabilityProbe, Card, type CardProps, Checkbox, type CheckboxProps, type ConcreteRenderer, type ControlSize, type CssMaterialOptions, type CssMaterialStyle, type CssMaterialTokens, Dialog, type DisclosureSurfaceProps, Dock, type DockProps, Drawer, FileDropzone, type FileDropzoneProps, Glass, GlassDesign$2 as GlassDesign, GlassGroup, type GlassGroupProps, type GlassGroupRuntime, type GlassMotionPreference, type GlassPointerField, type GlassProps$1 as GlassProps, GlassProvider, type GlassProviderProps, type GlassQualityPreference, type GlassRuntime, GlassSource, type GlassSourceProps, GlassSystemProvider, type GlassSystemProviderProps, type GlassSystemThemeProps, GlassThemeProvider, type GlassThemeProviderProps, type GlassThemeRuntime, IconButton, type IconButtonProps, type MaterialTone, MediaControls, type MediaControlsProps, Menu, MenuItem, type MenuItemProps, type MenuProps, Meter, type MeterProps, NumberField, type NumberFieldProps, OrganicFilterDefinition, type OrganicFilterDefinitionProps, type OverlayProps, Pagination, type PaginationProps, Popover, type PopoverProps, Progress, type ProgressProps, RadioGroup, type RadioGroupProps, type RadioItem, type RendererCapabilities, type RendererDecision, type RendererPreference, type RendererRequest, type RendererSource, SdfFilterDefinition, type SdfFilterDefinitionProps, type SdfFilterOptions, type SdfFilterState, SearchField, type SearchFieldProps, type SegmentItem, SegmentedControl, type SegmentedControlProps, Select, type SelectOption, type SelectProps, type SemanticTone, Skeleton, Slider, type SliderProps, Spinner, Stat, type StatProps, type StepItem, Stepper, type SvgDisplacementFilterSpec, Switch, type SwitchProps, type TabItem, Tabs, type TabsProps, TextField, type TextFieldProps, Textarea, type TextareaProps, Toast, type ToastController, type ToastOptions, type ToastProps, ToastProvider, type ToastProviderProps, ToggleButton, type ToggleButtonProps, Toolbar, type ToolbarProps, Tooltip, type TooltipProps, createCssMaterialStyle, createCssMaterialTokens, createStableFilterId, createSvgDisplacementFilterSpec, detectRendererCapabilities, encodeDisplacementMap, selectRenderer, useGlassCapabilities, useGlassGroup, useGlassPointerField, useGlassRuntime, useGlassTheme, useSdfFilter, useToast };

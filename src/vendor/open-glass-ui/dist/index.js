"use client";
import {
  DEFAULT_GLASS_LIGHT_ANGLE,
  DEFAULT_GLASS_LIGHT_SPREAD,
  GLASS_LOOK_PRESETS,
  OpticsMapCache,
  QUALITY_PROFILES,
  applyQualityToMapInput,
  contrastRatio,
  createGlassLookTokens,
  createGlassTheme,
  createGlassThemeTokens,
  createOpticsCacheKey,
  generateDisplacementMap,
  generateDisplacementMapAsync,
  getMaterialPreset,
  readableForeground,
  relativeLuminance,
  resolveGlassLook,
  resolveMapDimensions,
  sanitizeMaterial,
  signedDistance,
  surfaceHeight,
  surfaceNormal
} from "./chunk-VZFDC6ZT.js";
import {
  GlassProvider,
  createCssMaterialStyle,
  createCssMaterialTokens,
  createStableFilterId,
  createSvgDisplacementFilterSpec,
  detectRendererCapabilities,
  encodeDisplacementMap,
  selectRenderer,
  useGlassCapabilities,
  useGlassRuntime
} from "./chunk-D5YOP66S.js";

// ../react/dist/index.js
import { useEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import {
  createElement,
  forwardRef
} from "react";
import { useEffect as useEffect2, useRef } from "react";
import {
  createContext,
  useContext,
  useEffect as useEffect3,
  useMemo as useMemo2,
  useState as useState2
} from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
import {
  createContext as createContext2,
  forwardRef as forwardRef2,
  useContext as useContext2,
  useId,
  useMemo as useMemo3,
  useRef as useRef2
} from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var sharedOpticsMapCache = /* @__PURE__ */ new OpticsMapCache();
function useSdfFilter({
  id,
  width,
  height,
  geometry,
  material = getMaterialPreset("regular"),
  quality = "medium",
  canvasFactory
}) {
  const { kind, width: geometryWidth, height: geometryHeight, cornerRadius, exponent } = geometry;
  const { thickness, ior, dispersion, edgeStrength, bevel, frost } = material;
  const input = useMemo(
    () => ({
      width,
      height,
      geometry: {
        kind,
        width: geometryWidth,
        height: geometryHeight,
        ...cornerRadius === void 0 ? {} : { cornerRadius },
        ...exponent === void 0 ? {} : { exponent }
      },
      material: {
        thickness,
        ior,
        dispersion,
        edgeStrength,
        bevel,
        frost
      }
    }),
    [
      bevel,
      cornerRadius,
      dispersion,
      edgeStrength,
      exponent,
      frost,
      geometryHeight,
      geometryWidth,
      height,
      ior,
      kind,
      thickness,
      width
    ]
  );
  const filterId = createStableFilterId(
    id,
    createOpticsCacheKey(applyQualityToMapInput(input, quality))
  );
  const [encoded, setEncoded] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    try {
      const map = sharedOpticsMapCache.getOrCreate(input, quality);
      setEncoded({ map, url: encodeDisplacementMap(map, canvasFactory) });
      setError(null);
    } catch (encodingError) {
      setEncoded(null);
      setError(
        encodingError instanceof Error ? encodingError.message : "Unknown map encoding error."
      );
    }
  }, [canvasFactory, input, quality]);
  return {
    filterId,
    ready: encoded !== null,
    error,
    spec: encoded ? createSvgDisplacementFilterSpec(id, encoded.map, encoded.url, {
      thickness,
      ior,
      dispersion,
      edgeStrength,
      bevel,
      frost
    }) : null
  };
}
function SdfFilterDefinition({ filter }) {
  const spec = filter.spec;
  if (!spec) {
    return null;
  }
  const redMatrix = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0";
  const greenMatrix = "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0";
  const blueMatrix = "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0";
  const specularMatrix = `0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 ${spec.specularOpacity} 0 0`;
  return /* @__PURE__ */ jsx(
    "svg",
    {
      "aria-hidden": "true",
      "data-ogui-sdf-definition": filter.filterId,
      focusable: "false",
      height: "0",
      style: { position: "absolute" },
      width: "0",
      children: /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs(
        "filter",
        {
          id: filter.filterId,
          colorInterpolationFilters: "sRGB",
          height: spec.height,
          width: spec.width,
          x: spec.x,
          y: spec.y,
          children: [
            /* @__PURE__ */ jsx(
              "feImage",
              {
                height: "100%",
                href: spec.href,
                preserveAspectRatio: "none",
                result: "OGUI_MAP",
                width: "100%"
              }
            ),
            /* @__PURE__ */ jsx(
              "feDisplacementMap",
              {
                in: "SourceGraphic",
                in2: "OGUI_MAP",
                result: "OGUI_RED_SHIFT",
                scale: spec.redScale,
                xChannelSelector: "R",
                yChannelSelector: "G"
              }
            ),
            /* @__PURE__ */ jsx("feColorMatrix", { in: "OGUI_RED_SHIFT", result: "OGUI_RED", type: "matrix", values: redMatrix }),
            /* @__PURE__ */ jsx(
              "feDisplacementMap",
              {
                in: "SourceGraphic",
                in2: "OGUI_MAP",
                result: "OGUI_GREEN_SHIFT",
                scale: spec.greenScale,
                xChannelSelector: "R",
                yChannelSelector: "G"
              }
            ),
            /* @__PURE__ */ jsx(
              "feColorMatrix",
              {
                in: "OGUI_GREEN_SHIFT",
                result: "OGUI_GREEN",
                type: "matrix",
                values: greenMatrix
              }
            ),
            /* @__PURE__ */ jsx(
              "feDisplacementMap",
              {
                in: "SourceGraphic",
                in2: "OGUI_MAP",
                result: "OGUI_BLUE_SHIFT",
                scale: spec.blueScale,
                xChannelSelector: "R",
                yChannelSelector: "G"
              }
            ),
            /* @__PURE__ */ jsx(
              "feColorMatrix",
              {
                in: "OGUI_BLUE_SHIFT",
                result: "OGUI_BLUE",
                type: "matrix",
                values: blueMatrix
              }
            ),
            /* @__PURE__ */ jsx("feBlend", { in: "OGUI_RED", in2: "OGUI_GREEN", mode: "screen", result: "OGUI_RG" }),
            /* @__PURE__ */ jsx("feBlend", { in: "OGUI_RG", in2: "OGUI_BLUE", mode: "screen", result: "OGUI_RGB" }),
            /* @__PURE__ */ jsx(
              "feColorMatrix",
              {
                in: "OGUI_MAP",
                result: "OGUI_SPECULAR",
                type: "matrix",
                values: specularMatrix
              }
            ),
            /* @__PURE__ */ jsx("feComposite", { in: "OGUI_SPECULAR", in2: "SourceGraphic", operator: "in", result: "OGUI_SPEC" }),
            /* @__PURE__ */ jsx("feBlend", { in: "OGUI_RGB", in2: "OGUI_SPEC", mode: "screen" })
          ]
        }
      ) })
    }
  );
}
function OrganicFilterDefinition({
  id,
  frequency = 0.012,
  turbulence = 2,
  scale = 18,
  seed = 7,
  animate = true,
  children
}) {
  const motion = useGlassRuntime().motion;
  const baseFrequency = Math.min(Math.max(frequency, 1e-3), 0.08);
  const octaves = Math.round(Math.min(Math.max(turbulence, 1), 4));
  const displacementScale = Math.min(Math.max(scale, 0), 64);
  return /* @__PURE__ */ jsx(
    "svg",
    {
      "aria-hidden": "true",
      "data-ogui-organic-definition": id,
      focusable: "false",
      height: "0",
      style: { position: "absolute" },
      width: "0",
      children: /* @__PURE__ */ jsxs("defs", { children: [
        /* @__PURE__ */ jsxs(
          "filter",
          {
            id,
            colorInterpolationFilters: "sRGB",
            height: "130%",
            width: "130%",
            x: "-15%",
            y: "-15%",
            children: [
              /* @__PURE__ */ jsx(
                "feTurbulence",
                {
                  baseFrequency: `${baseFrequency} ${baseFrequency * 1.35}`,
                  numOctaves: octaves,
                  result: "OGUI_FLOW",
                  seed: Math.round(seed),
                  type: "fractalNoise",
                  children: animate && motion === "on" ? /* @__PURE__ */ jsx(
                    "animate",
                    {
                      attributeName: "baseFrequency",
                      dur: "8s",
                      repeatCount: "indefinite",
                      values: `${baseFrequency} ${baseFrequency * 1.35}; ${baseFrequency * 1.24} ${baseFrequency * 0.92}; ${baseFrequency} ${baseFrequency * 1.35}`
                    }
                  ) : null
                }
              ),
              /* @__PURE__ */ jsx("feGaussianBlur", { in: "OGUI_FLOW", result: "OGUI_SILK", stdDeviation: "0.55" }),
              /* @__PURE__ */ jsx(
                "feDisplacementMap",
                {
                  in: "SourceGraphic",
                  in2: "OGUI_SILK",
                  result: "OGUI_ORGANIC",
                  scale: displacementScale,
                  xChannelSelector: "R",
                  yChannelSelector: "B"
                }
              ),
              /* @__PURE__ */ jsx(
                "feColorMatrix",
                {
                  in: "OGUI_ORGANIC",
                  type: "matrix",
                  values: "1.04 0 0 0 0  0 1.04 0 0 0  0 0 1.08 0 0  0 0 0 1 0"
                }
              )
            ]
          }
        ),
        children
      ] })
    }
  );
}
function useGlassPointerField(enabled) {
  const frameRef = useRef(null);
  const elementRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  useEffect2(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    []
  );
  const schedule = () => {
    if (!enabled || frameRef.current !== null) {
      return;
    }
    const advance = () => {
      const element = elementRef.current;
      const current = currentRef.current;
      const target = targetRef.current;
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      if (element) {
        element.style.setProperty("--ogui-pointer-x", current.x.toFixed(4));
        element.style.setProperty("--ogui-pointer-y", current.y.toFixed(4));
        element.style.setProperty(
          "--ogui-pointer-distance",
          Math.hypot(current.x, current.y).toFixed(4)
        );
      }
      if (Math.abs(target.x - current.x) > 2e-3 || Math.abs(target.y - current.y) > 2e-3) {
        frameRef.current = requestAnimationFrame(advance);
      } else {
        current.x = target.x;
        current.y = target.y;
        frameRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(advance);
  };
  return {
    onPointerMove(event) {
      if (!enabled) {
        return;
      }
      const element = event.currentTarget;
      const bounds = element.getBoundingClientRect();
      elementRef.current = element;
      targetRef.current.x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 2;
      targetRef.current.y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5) * 2;
      schedule();
    },
    onPointerLeave(event) {
      elementRef.current = event.currentTarget;
      targetRef.current.x = 0;
      targetRef.current.y = 0;
      event.currentTarget.style.setProperty("--ogui-press", "0");
      schedule();
    },
    onPointerDown(event) {
      if (enabled) {
        event.currentTarget.style.setProperty("--ogui-press", "1");
      }
    },
    onPointerUp(event) {
      event.currentTarget.style.setProperty("--ogui-press", "0");
    },
    onPointerCancel(event) {
      event.currentTarget.style.setProperty("--ogui-press", "0");
    }
  };
}
var DEFAULT_PALETTE = createGlassTheme("dark");
var DEFAULT_THEME = {
  appearance: "dark",
  preference: "system",
  palette: DEFAULT_PALETTE,
  tokens: createGlassThemeTokens(DEFAULT_PALETTE),
  hydrated: false,
  design: "liquid"
};
var GlassThemeContext = /* @__PURE__ */ createContext(DEFAULT_THEME);
function readSystemAppearance() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
function GlassThemeProvider({
  children,
  appearance: preference = "system",
  defaultAppearance = "dark",
  theme,
  design = "liquid",
  className,
  style,
  ...props
}) {
  const [systemAppearance, setSystemAppearance] = useState2(defaultAppearance);
  const [hydrated, setHydrated] = useState2(false);
  useEffect3(() => {
    if (preference !== "system") {
      setHydrated(true);
      return;
    }
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => {
      setSystemAppearance(readSystemAppearance());
      setHydrated(true);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [preference]);
  const appearance = preference === "system" ? systemAppearance : preference;
  const palette = useMemo2(
    () => createGlassTheme(
      appearance,
      design === "liquid" && theme?.radius === void 0 ? { ...theme, radius: "soft" } : theme
    ),
    [appearance, theme, design]
  );
  const glass = theme?.glass;
  const lookKey = typeof glass === "string" ? glass : JSON.stringify(glass ?? null);
  const lookTokens = useMemo2(
    () => glass === void 0 ? {} : createGlassLookTokens(glass),
    [lookKey]
  );
  const tokens = useMemo2(
    () => ({ ...createGlassThemeTokens(palette), ...lookTokens }),
    [palette, lookTokens]
  );
  const effectiveTokens = useMemo2(() => {
    const styleValues = style ?? {};
    return Object.fromEntries(
      Object.entries(tokens).map(([name, value]) => [
        name,
        styleValues[name] === void 0 ? value : String(styleValues[name])
      ])
    );
  }, [style, tokens]);
  const runtime = useMemo2(
    () => ({ appearance, preference, palette, tokens: effectiveTokens, hydrated, design }),
    [appearance, preference, palette, effectiveTokens, hydrated, design]
  );
  const mergedStyle = {
    ...effectiveTokens,
    colorScheme: appearance,
    color: "var(--ogui-color-text)",
    ...style
  };
  return /* @__PURE__ */ jsx2(GlassThemeContext.Provider, { value: runtime, children: /* @__PURE__ */ jsx2(
    "div",
    {
      ...props,
      className: ["ogui-theme", className].filter(Boolean).join(" "),
      "data-ogui-theme": "",
      "data-ogui-appearance": appearance,
      "data-ogui-design": design,
      "data-ogui-theme-hydrated": hydrated ? "true" : "false",
      style: mergedStyle,
      children
    }
  ) });
}
function useGlassTheme() {
  return useContext(GlassThemeContext);
}
var Glass = forwardRef(function Glass2({
  as = "div",
  children,
  className,
  material = "regular",
  tone = "auto",
  renderer,
  source = "dom",
  interactive = false,
  optics,
  geometry,
  filterId,
  look,
  onPointerMove,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  style,
  ...rest
}, ref) {
  const runtime = useGlassRuntime();
  const theme = useGlassTheme();
  const resolvedTone = tone === "auto" ? theme.appearance : tone;
  const pointerField = useGlassPointerField(interactive && runtime.motion === "on");
  const opticsOverrides = Object.fromEntries(
    Object.entries(optics ?? {}).filter(([, value]) => value !== void 0)
  );
  const resolvedMaterial = { ...getMaterialPreset(material), ...opticsOverrides };
  const rendererPreference = renderer ?? (filterId ? "sdf-svg" : runtime.renderer);
  const decision = selectRenderer({
    source,
    preference: rendererPreference,
    capabilities: runtime.capabilities
  });
  const tokens = createCssMaterialTokens({
    material,
    tone: resolvedTone,
    backdropFilter: runtime.capabilities.backdropFilter,
    reducedTransparency: runtime.capabilities.reducedTransparency,
    forcedColors: runtime.capabilities.forcedColors,
    design: theme.design,
    // Only forward an explicitly supplied frost. Passing the preset's own value
    // unconditionally would round-trip through the interpolation for every
    // surface, and a caller that never set `optics` should get the preset's
    // tokens verbatim.
    ...optics?.frost === void 0 ? {} : { frost: optics.frost }
  });
  const materialStyle = createCssMaterialStyle(tokens);
  const edge = theme.design === "liquid" && !runtime.capabilities.forcedColors ? { borderWidth: 0 } : {};
  const mergedStyle = {
    ...tokens,
    ...materialStyle,
    ...edge,
    "--ogui-pointer-x": "0",
    "--ogui-pointer-y": "0",
    "--ogui-pointer-distance": "0",
    "--ogui-press": "0",
    ...look === void 0 ? {} : createGlassLookTokens(look),
    ...filterId && decision.renderer !== "css" ? { filter: `url(#${filterId})` } : {},
    ...style
  };
  return createElement(
    as,
    {
      ...rest,
      ref,
      className,
      style: mergedStyle,
      onPointerMove: (event) => {
        pointerField.onPointerMove(event);
        onPointerMove?.(event);
      },
      onPointerLeave: (event) => {
        pointerField.onPointerLeave(event);
        onPointerLeave?.(event);
      },
      onPointerDown: (event) => {
        pointerField.onPointerDown(event);
        onPointerDown?.(event);
      },
      onPointerUp: (event) => {
        pointerField.onPointerUp(event);
        onPointerUp?.(event);
      },
      onPointerCancel: (event) => {
        pointerField.onPointerCancel(event);
        onPointerCancel?.(event);
      },
      "data-ogui-glass": "",
      "data-ogui-design": theme.design,
      "data-ogui-material": material,
      "data-ogui-tone": resolvedTone,
      "data-ogui-renderer": decision.renderer,
      "data-ogui-renderer-reason": decision.reason,
      "data-ogui-interactive": interactive ? "true" : "false",
      "data-ogui-hydrated": runtime.hydrated ? "true" : "false",
      "data-ogui-motion": runtime.motion,
      "data-ogui-quality": runtime.quality,
      "data-ogui-shape": geometry?.kind ?? "rounded-rect",
      "data-ogui-thickness": resolvedMaterial.thickness.toFixed(3),
      "data-ogui-ior": resolvedMaterial.ior.toFixed(3)
    },
    children
  );
});
var GlassGroupContext = /* @__PURE__ */ createContext2(null);
function safeId(id) {
  return id.replace(/[^a-zA-Z0-9_-]+/g, "-");
}
var GlassGroup = forwardRef2(function GlassGroup2({ children, id, ...rest }, ref) {
  const reactId = useId();
  const sourceRef = useRef2(null);
  const groupId = safeId(id ?? `ogui-group-${reactId}`);
  const value = useMemo3(() => ({ id: groupId, sourceRef }), [groupId]);
  return /* @__PURE__ */ jsx3(GlassGroupContext.Provider, { value, children: /* @__PURE__ */ jsx3("div", { ...rest, ref, "data-ogui-group": groupId, children }) });
});
var GlassSource = forwardRef2(function GlassSource2({ children, ...rest }, forwardedRef) {
  const group = useContext2(GlassGroupContext);
  return /* @__PURE__ */ jsx3(
    "div",
    {
      ...rest,
      ref: (element) => {
        if (group) {
          group.sourceRef.current = element;
        }
        if (typeof forwardedRef === "function") {
          forwardedRef(element);
        } else if (forwardedRef) {
          forwardedRef.current = element;
        }
      },
      "data-ogui-source": group?.id ?? "",
      children
    }
  );
});
function useGlassGroup() {
  return useContext2(GlassGroupContext);
}

// ../recipes/dist/index.js
import {
  cloneElement,
  createContext as createContext22,
  useCallback as useCallback2,
  useContext as useContext22,
  useEffect as useEffect22,
  useId as useId2,
  useLayoutEffect,
  useRef as useRef22,
  useState as useState22
} from "react";
import { createPortal as createPortal2 } from "react-dom";
import {
  createContext as createContext3,
  useCallback,
  useContext as useContext3,
  useEffect as useEffect4,
  useId as useId3,
  useMemo as useMemo4,
  useRef as useRef3,
  useState as useState3
} from "react";
import { createPortal } from "react-dom";
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
import { jsx as jsx22, jsxs as jsxs22 } from "react/jsx-runtime";
function cx(...values) {
  return values.filter(Boolean).join(" ");
}
function idPart(value) {
  return encodeURIComponent(value).replaceAll("%", "_");
}
function Badge({ tone = "neutral", className, ...props }) {
  return /* @__PURE__ */ jsx4("span", { ...props, className: cx("ogui-badge", className), "data-tone": tone });
}
function Avatar({ name, src, size = "medium", className, ...props }) {
  const dimensions = size === "small" ? 32 : size === "large" ? 52 : 40;
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return /* @__PURE__ */ jsx4(
    "span",
    {
      ...props,
      className: cx("ogui-avatar", className),
      "data-size": size,
      role: "img",
      "aria-label": name,
      title: name,
      children: src ? /* @__PURE__ */ jsx4("img", { src, alt: "", width: dimensions, height: dimensions, loading: "lazy" }) : /* @__PURE__ */ jsx4("span", { "aria-hidden": "true", children: initials })
    }
  );
}
function AvatarGroup({ className, ...props }) {
  return /* @__PURE__ */ jsx4("div", { ...props, className: cx("ogui-avatar-group", className) });
}
function Card({
  eyebrow,
  title,
  footer,
  interactive = false,
  onPress,
  className,
  children,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...props
}) {
  const actionable = Boolean(onPress || onClick);
  const Element = actionable ? "div" : "article";
  return /* @__PURE__ */ jsxs2(
    Element,
    {
      ...props,
      className: cx("ogui-card", (actionable || interactive) && "is-interactive", className),
      role: role ?? (actionable ? "button" : void 0),
      tabIndex: tabIndex ?? (actionable ? 0 : void 0),
      onClick: (event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onPress?.();
        }
      },
      onKeyDown: (event) => {
        onKeyDown?.(event);
        if (actionable && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          event.currentTarget.click();
        }
      },
      children: [
        eyebrow ? /* @__PURE__ */ jsx4("span", { className: "ogui-card__eyebrow", children: eyebrow }) : null,
        title ? /* @__PURE__ */ jsx4("strong", { className: "ogui-card__title", children: title }) : null,
        /* @__PURE__ */ jsx4("div", { className: "ogui-card__body", children }),
        footer ? /* @__PURE__ */ jsx4("footer", { className: "ogui-card__footer", children: footer }) : null
      ]
    }
  );
}
function Stat({ label, value, change, tone = "neutral", className, ...props }) {
  return /* @__PURE__ */ jsxs2("div", { ...props, className: cx("ogui-stat", className), "data-tone": tone, children: [
    /* @__PURE__ */ jsx4("span", { children: label }),
    /* @__PURE__ */ jsx4("strong", { children: value }),
    change ? /* @__PURE__ */ jsx4("small", { children: change }) : null
  ] });
}
function Progress({ label, value, max = 100, className, ...props }) {
  const labelId = useId3();
  const safeMax = Math.max(max, 1);
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  return /* @__PURE__ */ jsxs2("div", { ...props, className: cx("ogui-progress", className), children: [
    /* @__PURE__ */ jsxs2("span", { children: [
      /* @__PURE__ */ jsx4("span", { id: labelId, children: label }),
      /* @__PURE__ */ jsxs2("output", { children: [
        Math.round(safeValue / safeMax * 100),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx4("progress", { value: safeValue, max: safeMax, "aria-labelledby": labelId })
  ] });
}
function Meter({
  label,
  value,
  min = 0,
  max = 100,
  low = 30,
  high = 75,
  optimum = 90,
  className,
  ...props
}) {
  const labelId = useId3();
  return /* @__PURE__ */ jsxs2("div", { ...props, className: cx("ogui-meter", className), children: [
    /* @__PURE__ */ jsx4("span", { id: labelId, children: label }),
    /* @__PURE__ */ jsx4(
      "meter",
      {
        value,
        min,
        max,
        low,
        high,
        optimum,
        "aria-labelledby": labelId
      }
    ),
    /* @__PURE__ */ jsx4("output", { children: value })
  ] });
}
function Spinner({
  label = "Loading",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxs2("span", { ...props, className: cx("ogui-spinner", className), role: "status", children: [
    /* @__PURE__ */ jsx4("i", { "aria-hidden": "true" }),
    /* @__PURE__ */ jsx4("span", { className: "ogui-sr-only", children: label })
  ] });
}
function Skeleton({
  width = "100%",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx4(
    "span",
    {
      ...props,
      className: cx("ogui-skeleton", className),
      style: { ...props.style, width },
      "aria-hidden": "true"
    }
  );
}
function Alert({
  title,
  tone = "neutral",
  onDismiss,
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      ...props,
      className: cx("ogui-alert", className),
      "data-tone": tone,
      role: tone === "danger" ? "alert" : "status",
      children: [
        /* @__PURE__ */ jsx4("span", { className: "ogui-alert__signal", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx4("strong", { children: title }),
          children ? /* @__PURE__ */ jsx4("p", { children }) : null
        ] }),
        onDismiss ? /* @__PURE__ */ jsx4("button", { type: "button", onClick: onDismiss, "aria-label": "Dismiss alert", children: "\xD7" }) : null
      ]
    }
  );
}
function Banner({
  title,
  action,
  dismissible = false,
  onDismiss,
  className,
  children,
  ...props
}) {
  const [visible, setVisible] = useState3(true);
  const titleId = useId3();
  if (!visible) {
    return null;
  }
  const hasOwnName = props["aria-label"] !== void 0 || props["aria-labelledby"] !== void 0;
  return /* @__PURE__ */ jsxs2(
    "aside",
    {
      ...props,
      className: cx("ogui-banner", className),
      "aria-labelledby": hasOwnName ? props["aria-labelledby"] : titleId,
      children: [
        /* @__PURE__ */ jsx4("span", { className: "ogui-banner__flare", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx4("strong", { id: titleId, children: title }),
          children ? /* @__PURE__ */ jsx4("span", { children }) : null
        ] }),
        action,
        dismissible ? /* @__PURE__ */ jsx4(
          "button",
          {
            type: "button",
            onClick: () => {
              setVisible(false);
              onDismiss?.();
            },
            "aria-label": "Dismiss banner",
            children: "\xD7"
          }
        ) : null
      ]
    }
  );
}
function Breadcrumbs({
  items,
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx4("nav", { ...props, className: cx("ogui-breadcrumbs", className), "aria-label": "Breadcrumb", children: /* @__PURE__ */ jsx4("ol", { children: items.map((item, index) => {
    const current = index === items.length - 1;
    return /* @__PURE__ */ jsx4("li", { children: item.href && !current ? /* @__PURE__ */ jsx4("a", { href: item.href, children: item.label }) : /* @__PURE__ */ jsx4("span", { "aria-current": current ? "page" : void 0, children: item.label }) }, `${item.href ?? "current"}-${item.label}`);
  }) }) });
}
function safePageInteger(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(Math.max(1, Math.floor(value)), Number.MAX_SAFE_INTEGER);
}
function paginationItems(page, count) {
  if (count <= 7) {
    return Array.from({ length: count }, (_, index) => index + 1);
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", count];
  }
  if (page >= count - 3) {
    return [1, "start-ellipsis", count - 4, count - 3, count - 2, count - 1, count];
  }
  return [1, "start-ellipsis", page - 1, page, page + 1, "end-ellipsis", count];
}
function Pagination({ page, count, onPageChange, className, ...props }) {
  const safeCount = safePageInteger(count);
  const safePage = Math.min(safePageInteger(page), safeCount);
  const items = paginationItems(safePage, safeCount);
  return (
    // The default name comes first so a caller's aria-label wins; two
    // paginations on one page otherwise share a landmark name.
    /* @__PURE__ */ jsxs2("nav", { "aria-label": "Pagination", ...props, className: cx("ogui-pagination", className), children: [
      /* @__PURE__ */ jsx4(
        "button",
        {
          type: "button",
          "aria-label": "Previous page",
          disabled: safePage <= 1,
          onClick: () => onPageChange(safePage - 1),
          children: "\u2190"
        }
      ),
      items.map(
        (item) => typeof item === "number" ? /* @__PURE__ */ jsx4(
          "button",
          {
            type: "button",
            "aria-label": `Page ${item}`,
            "aria-current": item === safePage ? "page" : void 0,
            onClick: () => onPageChange(item),
            children: item
          },
          item
        ) : /* @__PURE__ */ jsx4("span", { className: "ogui-pagination__ellipsis", "aria-hidden": "true", children: "\u2026" }, item)
      ),
      /* @__PURE__ */ jsx4(
        "button",
        {
          type: "button",
          "aria-label": "Next page",
          disabled: safePage >= safeCount,
          onClick: () => onPageChange(safePage + 1),
          children: "\u2192"
        }
      )
    ] })
  );
}
function Accordion({
  items,
  multiple = false,
  defaultOpenIds,
  headingLevel = 3,
  className,
  ...props
}) {
  const [openItems, setOpenItems] = useState3(
    () => defaultOpenIds === void 0 ? new Set(items[0] ? [items[0].id] : []) : new Set(multiple ? defaultOpenIds : defaultOpenIds.slice(0, 1))
  );
  const Heading = `h${headingLevel}`;
  const baseId = useId3();
  const toggle = (id) => {
    setOpenItems((current) => {
      const next = multiple ? new Set(current) : /* @__PURE__ */ new Set();
      if (!current.has(id)) {
        next.add(id);
      } else if (multiple) {
        next.delete(id);
      }
      return next;
    });
  };
  return /* @__PURE__ */ jsx4("div", { ...props, className: cx("ogui-accordion", className), children: items.map((item) => {
    const open = openItems.has(item.id);
    const itemId = `${baseId}-${idPart(item.id)}`;
    return /* @__PURE__ */ jsxs2("section", { "data-open": open ? "true" : "false", children: [
      /* @__PURE__ */ jsx4(Heading, { children: /* @__PURE__ */ jsxs2(
        "button",
        {
          id: `${itemId}-trigger`,
          type: "button",
          "aria-expanded": open,
          "aria-controls": `${itemId}-panel`,
          onClick: () => toggle(item.id),
          children: [
            /* @__PURE__ */ jsx4("span", { children: item.title }),
            /* @__PURE__ */ jsx4("i", { "aria-hidden": "true", children: "+" })
          ]
        }
      ) }),
      open ? /* @__PURE__ */ jsx4("section", { id: `${itemId}-panel`, "aria-labelledby": `${itemId}-trigger`, children: item.content }) : null
    ] }, item.id);
  }) });
}
var activeOverlayLocks = 0;
var bodyOverflowBeforeLock = "";
var bodyPaddingBeforeLock = "";
var inertLedger = /* @__PURE__ */ new Map();
var activeOverlayStack = [];
var activeOverlayHosts = [];
function lockDocumentForOverlay(portalHost) {
  const body = document.body;
  if (activeOverlayLocks === 0) {
    bodyOverflowBeforeLock = body.style.overflow;
    bodyPaddingBeforeLock = body.style.paddingRight;
    const scrollbarWidth = Math.max(window.innerWidth - document.documentElement.clientWidth, 0);
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  activeOverlayLocks += 1;
  const inerted = [
    .../* @__PURE__ */ new Set([
      ...[...body.children].filter(
        (element) => element instanceof HTMLElement && element !== portalHost && !element.hasAttribute("data-ogui-portal")
      ),
      ...activeOverlayHosts
    ])
  ];
  activeOverlayHosts.push(portalHost);
  for (const element of inerted) {
    const existing = inertLedger.get(element);
    inertLedger.set(element, {
      count: (existing?.count ?? 0) + 1,
      previous: existing?.previous ?? element.inert
    });
    element.inert = true;
  }
  return () => {
    const hostIndex = activeOverlayHosts.lastIndexOf(portalHost);
    if (hostIndex >= 0) {
      activeOverlayHosts.splice(hostIndex, 1);
    }
    for (const element of inerted) {
      const entry = inertLedger.get(element);
      if (!entry) {
        continue;
      }
      if (entry.count > 1) {
        inertLedger.set(element, { ...entry, count: entry.count - 1 });
      } else {
        element.inert = entry.previous;
        inertLedger.delete(element);
      }
    }
    activeOverlayLocks = Math.max(activeOverlayLocks - 1, 0);
    if (activeOverlayLocks === 0) {
      body.style.overflow = bodyOverflowBeforeLock;
      body.style.paddingRight = bodyPaddingBeforeLock;
    }
  };
}
function Overlay({
  title,
  triggerLabel,
  children,
  description,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  closeOnBackdrop = true,
  kind
}) {
  const [internalOpen, setInternalOpen] = useState3(defaultOpen);
  const [portalHost, setPortalHost] = useState3(null);
  const { appearance, tokens, design } = useGlassTheme();
  const runtime = useGlassRuntime();
  const open = controlledOpen ?? internalOpen;
  const triggerRef = useRef3(null);
  const surfaceRef = useRef3(null);
  const closeRef = useRef3(null);
  const openerRef = useRef3(null);
  const wasOpenRef = useRef3(open);
  const titleId = useId3();
  const descriptionId = description ? `${titleId}-description` : void 0;
  useEffect4(() => {
    const host = document.createElement("div");
    host.setAttribute("data-ogui-portal", "");
    document.body.append(host);
    setPortalHost(host);
    return () => {
      host.remove();
    };
  }, []);
  const setVisibility = useCallback(
    (next) => {
      if (controlledOpen === void 0) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );
  useEffect4(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (!wasOpen && open) {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    }
    if (wasOpen && !open) {
      const focusFrame = requestAnimationFrame(() => {
        const opener = openerRef.current;
        openerRef.current = null;
        (triggerRef.current ?? (opener?.isConnected ? opener : null))?.focus();
      });
      return () => cancelAnimationFrame(focusFrame);
    }
  }, [open]);
  useEffect4(() => {
    if (!open || !portalHost) {
      return;
    }
    activeOverlayStack.push(titleId);
    const unlockDocument = lockDocumentForOverlay(portalHost);
    const handleKeyDown = (event) => {
      if (activeOverlayStack.at(-1) !== titleId) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setVisibility(false);
      }
      if (event.key === "Tab") {
        const focusable = [
          ...surfaceRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) ?? []
        ].filter((element) => !element.hasAttribute("disabled"));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      unlockDocument();
      const stackIndex = activeOverlayStack.lastIndexOf(titleId);
      if (stackIndex >= 0) {
        activeOverlayStack.splice(stackIndex, 1);
      }
    };
  }, [open, portalHost, setVisibility, titleId]);
  const overlay = open && portalHost ? /* @__PURE__ */ jsxs2(
    "div",
    {
      className: "ogui-overlay",
      "data-kind": kind,
      "data-ogui-appearance": appearance,
      "data-ogui-design": design,
      "data-ogui-motion": runtime.motion,
      style: { ...tokens, colorScheme: appearance },
      children: [
        closeOnBackdrop ? /* @__PURE__ */ jsx4(
          "button",
          {
            type: "button",
            className: "ogui-overlay__scrim",
            "aria-label": `Close ${title}`,
            onClick: () => setVisibility(false)
          }
        ) : /* @__PURE__ */ jsx4("div", { className: "ogui-overlay__scrim", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs2(
          "div",
          {
            ref: surfaceRef,
            className: "ogui-overlay__surface",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": titleId,
            "aria-describedby": descriptionId,
            children: [
              /* @__PURE__ */ jsxs2("div", { className: "ogui-overlay__header", children: [
                /* @__PURE__ */ jsx4("strong", { id: titleId, children: title }),
                /* @__PURE__ */ jsx4(
                  "button",
                  {
                    ref: closeRef,
                    type: "button",
                    "aria-label": `Close ${title}`,
                    onClick: () => setVisibility(false),
                    children: "\xD7"
                  }
                )
              ] }),
              description ? /* @__PURE__ */ jsx4("p", { id: descriptionId, className: "ogui-overlay__description", children: description }) : null,
              /* @__PURE__ */ jsx4("div", { className: "ogui-overlay__body", children })
            ]
          }
        )
      ]
    }
  ) : null;
  if (triggerLabel === void 0) {
    return portalHost ? createPortal(overlay, portalHost) : null;
  }
  return /* @__PURE__ */ jsxs2("span", { className: `ogui-overlay-trigger ogui-overlay-trigger--${kind}`, children: [
    /* @__PURE__ */ jsx4("button", { ref: triggerRef, type: "button", onClick: () => setVisibility(true), children: triggerLabel }),
    portalHost ? createPortal(overlay, portalHost) : null
  ] });
}
function Dialog(props) {
  return /* @__PURE__ */ jsx4(Overlay, { ...props, kind: "dialog" });
}
function Drawer(props) {
  return /* @__PURE__ */ jsx4(Overlay, { ...props, kind: "drawer" });
}
function Toast({
  title,
  actionLabel,
  onAction,
  open: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  duration = 0,
  restoreLabel = "Show toast",
  className,
  children,
  onFocusCapture,
  onBlurCapture,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
  ...props
}) {
  const [internalOpen, setInternalOpen] = useState3(defaultOpen);
  const [paused, setPaused] = useState3(false);
  const open = controlledOpen ?? internalOpen;
  const remainingDuration = useRef3(duration);
  const previousDuration = useRef3(duration);
  const previouslyOpen = useRef3(open);
  const setOpen = useCallback(
    (next) => {
      if (controlledOpen === void 0) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );
  useEffect4(() => {
    if (duration !== previousDuration.current || open && !previouslyOpen.current) {
      remainingDuration.current = duration;
    }
    previousDuration.current = duration;
    previouslyOpen.current = open;
  }, [duration, open]);
  useEffect4(() => {
    if (!open || paused || duration <= 0) {
      return;
    }
    const remaining = Math.max(remainingDuration.current, 0);
    if (remaining === 0) {
      setOpen(false);
      return;
    }
    const startedAt = Date.now();
    const timeout = window.setTimeout(() => setOpen(false), remaining);
    return () => {
      window.clearTimeout(timeout);
      remainingDuration.current = Math.max(remaining - (Date.now() - startedAt), 0);
    };
  }, [duration, open, paused, setOpen]);
  if (!open) {
    if (controlledOpen !== void 0 || !restoreLabel) {
      return null;
    }
    return /* @__PURE__ */ jsx4("button", { type: "button", className: "ogui-toast__restore", onClick: () => setOpen(true), children: restoreLabel });
  }
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      ...props,
      className: cx("ogui-toast", className),
      role: "status",
      onMouseEnter: (event) => {
        setPaused(true);
        onMouseEnter?.(event);
      },
      onMouseLeave: (event) => {
        setPaused(false);
        onMouseLeave?.(event);
      },
      onFocusCapture: (event) => {
        setPaused(true);
        onFocusCapture?.(event);
      },
      onBlurCapture: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
        onBlurCapture?.(event);
      },
      onKeyDown: (event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
        }
      },
      children: [
        /* @__PURE__ */ jsx4("span", { className: "ogui-toast__mark", "aria-hidden": "true", children: "\u2713" }),
        /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx4("strong", { children: title }),
          children ? /* @__PURE__ */ jsx4("span", { children }) : null
        ] }),
        actionLabel ? /* @__PURE__ */ jsx4(
          "button",
          {
            type: "button",
            onClick: () => {
              onAction?.();
              setOpen(false);
            },
            children: actionLabel
          }
        ) : null,
        /* @__PURE__ */ jsx4("button", { type: "button", "aria-label": "Dismiss notification", onClick: () => setOpen(false), children: "\xD7" })
      ]
    }
  );
}
var ToastContext = /* @__PURE__ */ createContext3(null);
function ToastProvider({
  children,
  defaultDuration = 5e3,
  maxVisible = 3,
  label = "Notifications"
}) {
  const idPrefix = useId3();
  const nextId = useRef3(0);
  const [portalHost, setPortalHost] = useState3(null);
  const [notices, setNotices] = useState3([]);
  const { appearance, tokens, design } = useGlassTheme();
  const runtime = useGlassRuntime();
  useEffect4(() => {
    setPortalHost(document.body);
  }, []);
  const dismiss = useCallback((id) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);
  const toast = useCallback(
    (options) => {
      nextId.current += 1;
      const id = `${idPrefix}-toast-${nextId.current}`;
      const notice = { ...options, id };
      setNotices((current) => [...current, notice].slice(-Math.max(1, maxVisible)));
      return id;
    },
    [idPrefix, maxVisible]
  );
  const controller = useMemo4(() => ({ toast, dismiss }), [dismiss, toast]);
  const viewport = /* @__PURE__ */ jsx4(
    "section",
    {
      className: "ogui-toast-viewport",
      "aria-label": label,
      "data-ogui-appearance": appearance,
      "data-ogui-design": design,
      "data-ogui-motion": runtime.motion,
      style: { ...tokens, colorScheme: appearance },
      children: notices.map((notice) => /* @__PURE__ */ jsx4(
        Toast,
        {
          title: notice.title,
          duration: notice.duration ?? defaultDuration,
          open: true,
          restoreLabel: "",
          ...notice.actionLabel ? { actionLabel: notice.actionLabel } : {},
          ...notice.onAction ? { onAction: notice.onAction } : {},
          onOpenChange: (open) => {
            if (!open) {
              dismiss(notice.id);
            }
          },
          children: notice.description
        },
        notice.id
      ))
    }
  );
  return /* @__PURE__ */ jsxs2(ToastContext.Provider, { value: controller, children: [
    children,
    portalHost ? createPortal(viewport, portalHost) : null
  ] });
}
function useToast() {
  const context = useContext3(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context;
}
function Checkbox({
  label,
  description,
  className,
  id: suppliedId,
  ...props
}) {
  const generatedId = useId3();
  const id = suppliedId ?? generatedId;
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : void 0;
  return /* @__PURE__ */ jsxs2("label", { className: cx("ogui-check", className), htmlFor: id, children: [
    /* @__PURE__ */ jsx4(
      "input",
      {
        ...props,
        id,
        name: props.name ?? id,
        type: "checkbox",
        "aria-labelledby": labelId,
        "aria-describedby": descriptionId
      }
    ),
    /* @__PURE__ */ jsx4("i", { "aria-hidden": "true", children: "\u2713" }),
    /* @__PURE__ */ jsxs2("span", { children: [
      /* @__PURE__ */ jsx4("strong", { id: labelId, children: label }),
      description ? /* @__PURE__ */ jsx4("small", { id: descriptionId, children: description }) : null
    ] })
  ] });
}
function RadioGroup({
  label,
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  name: suppliedName,
  disabled = false
}) {
  const firstEnabled = items.find((item) => !item.disabled)?.value;
  const initialValue = items.find((item) => item.value === defaultValue && !item.disabled)?.value ?? firstEnabled;
  const [internalValue, setInternalValue] = useState3(initialValue);
  const candidate = value ?? internalValue;
  const selected = items.find((item) => item.value === candidate && !item.disabled)?.value ?? firstEnabled;
  const generatedName = useId3();
  const name = suppliedName ?? generatedName;
  return /* @__PURE__ */ jsxs2("fieldset", { className: cx("ogui-radio-group", className), disabled, children: [
    /* @__PURE__ */ jsx4("legend", { children: label }),
    items.map((item, index) => {
      const itemId = `${name}-${index}`;
      const labelId = `${itemId}-label`;
      const descriptionId = item.description ? `${itemId}-description` : void 0;
      return /* @__PURE__ */ jsxs2("label", { htmlFor: itemId, children: [
        /* @__PURE__ */ jsx4(
          "input",
          {
            id: itemId,
            type: "radio",
            name,
            value: item.value,
            checked: selected === item.value,
            disabled: item.disabled,
            "aria-labelledby": labelId,
            "aria-describedby": descriptionId,
            onChange: () => {
              if (value === void 0) {
                setInternalValue(item.value);
              }
              onValueChange?.(item.value);
            }
          }
        ),
        /* @__PURE__ */ jsx4("i", { "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs2("span", { children: [
          /* @__PURE__ */ jsx4("strong", { id: labelId, children: item.label }),
          item.description ? /* @__PURE__ */ jsx4("small", { id: descriptionId, children: item.description }) : null
        ] })
      ] }, item.value);
    })
  ] });
}
function Select({ label, options, className, id: suppliedId, ...props }) {
  const generatedId = useId3();
  const id = suppliedId ?? generatedId;
  const labelId = `${id}-label`;
  const { appearance } = useGlassTheme();
  return /* @__PURE__ */ jsxs2("label", { className: cx("ogui-field", "ogui-select", className), htmlFor: id, children: [
    /* @__PURE__ */ jsx4("span", { id: labelId, children: label }),
    /* @__PURE__ */ jsxs2("span", { className: "ogui-select__control", children: [
      /* @__PURE__ */ jsx4(
        "select",
        {
          ...props,
          id,
          name: props.name ?? id,
          "aria-labelledby": labelId,
          autoComplete: props.autoComplete ?? "off",
          style: { colorScheme: appearance, ...props.style },
          children: options.map((option) => /* @__PURE__ */ jsx4("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value))
        }
      ),
      /* @__PURE__ */ jsx4("i", { "aria-hidden": "true", children: "\u2304" })
    ] })
  ] });
}
function TextField({
  label,
  hint,
  error,
  className,
  id: suppliedId,
  ...props
}) {
  const generatedId = useId3();
  const id = suppliedId ?? generatedId;
  const labelId = `${id}-label`;
  const messageId = hint || error ? `${id}-message` : void 0;
  return /* @__PURE__ */ jsxs2("label", { className: cx("ogui-field", Boolean(error) && "has-error", className), htmlFor: id, children: [
    /* @__PURE__ */ jsx4("span", { id: labelId, children: label }),
    /* @__PURE__ */ jsx4(
      "input",
      {
        ...props,
        id,
        name: props.name ?? id,
        autoComplete: props.autoComplete ?? "off",
        "aria-invalid": error ? true : void 0,
        "aria-labelledby": labelId,
        "aria-describedby": messageId
      }
    ),
    hint || error ? /* @__PURE__ */ jsx4("small", { id: messageId, role: error ? "alert" : void 0, children: error ?? hint }) : null
  ] });
}
function Textarea({
  label,
  hint,
  error,
  className,
  id: suppliedId,
  ...props
}) {
  const generatedId = useId3();
  const id = suppliedId ?? generatedId;
  const labelId = `${id}-label`;
  const messageId = hint || error ? `${id}-message` : void 0;
  return /* @__PURE__ */ jsxs2("label", { className: cx("ogui-field", Boolean(error) && "has-error", className), htmlFor: id, children: [
    /* @__PURE__ */ jsx4("span", { id: labelId, children: label }),
    /* @__PURE__ */ jsx4(
      "textarea",
      {
        ...props,
        id,
        name: props.name ?? id,
        autoComplete: props.autoComplete ?? "off",
        "aria-invalid": error ? true : void 0,
        "aria-labelledby": labelId,
        "aria-describedby": messageId
      }
    ),
    hint || error ? /* @__PURE__ */ jsx4("small", { id: messageId, role: error ? "alert" : void 0, children: error ?? hint }) : null
  ] });
}
function SearchField({
  label,
  value,
  defaultValue = "",
  onValueChange,
  className,
  id: suppliedId,
  ...props
}) {
  const generatedId = useId3();
  const id = suppliedId ?? generatedId;
  const [internalValue, setInternalValue] = useState3(defaultValue);
  const shownValue = value ?? internalValue;
  const update = (next) => {
    if (value === void 0) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };
  return /* @__PURE__ */ jsxs2("label", { className: cx("ogui-search", className), htmlFor: id, children: [
    /* @__PURE__ */ jsx4("span", { className: "ogui-sr-only", children: label }),
    /* @__PURE__ */ jsx4("i", { "aria-hidden": "true", children: "\u2315" }),
    /* @__PURE__ */ jsx4(
      "input",
      {
        ...props,
        id,
        name: props.name ?? id,
        type: "search",
        value: shownValue,
        "aria-label": label,
        autoComplete: props.autoComplete ?? "off",
        spellCheck: props.spellCheck ?? false,
        onChange: (event) => update(event.currentTarget.value)
      }
    ),
    shownValue ? /* @__PURE__ */ jsx4("button", { type: "button", "aria-label": `Clear ${label}`, onClick: () => update(""), children: "\xD7" }) : null
  ] });
}
function NumberField({
  label,
  value,
  defaultValue = 0,
  onValueChange,
  decrementLabel,
  incrementLabel,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  className,
  id: suppliedId,
  onChange,
  disabled,
  readOnly,
  ...props
}) {
  const generatedId = useId3();
  const id = suppliedId ?? generatedId;
  const [internalValue, setInternalValue] = useState3(defaultValue);
  const shownValue = value ?? internalValue;
  const rawMin = Number(min);
  const rawMax = Number(max);
  const minValue = Number.isFinite(rawMin) ? rawMin : Number.MIN_SAFE_INTEGER;
  const maxValue = Number.isFinite(rawMax) ? rawMax : Number.MAX_SAFE_INTEGER;
  const rawStep = Number(step);
  const stepValue = Number.isFinite(rawStep) && rawStep !== 0 ? Math.abs(rawStep) : 1;
  const labelText = typeof label === "string" || typeof label === "number" ? String(label) : "value";
  const decrementDisabled = disabled || readOnly || !Number.isFinite(shownValue) || shownValue <= minValue;
  const incrementDisabled = disabled || readOnly || !Number.isFinite(shownValue) || shownValue >= maxValue;
  const update = (next) => {
    const bounded = Math.min(Math.max(next, minValue), maxValue);
    if (value === void 0) {
      setInternalValue(bounded);
    }
    onValueChange?.(bounded);
  };
  return /* @__PURE__ */ jsxs2("div", { className: cx("ogui-field", "ogui-number", className), children: [
    /* @__PURE__ */ jsx4("label", { htmlFor: id, children: label }),
    /* @__PURE__ */ jsxs2("span", { className: "ogui-number__control", children: [
      /* @__PURE__ */ jsx4(
        "button",
        {
          type: "button",
          "aria-label": decrementLabel ?? `Decrease ${labelText}`,
          disabled: decrementDisabled,
          onClick: () => update(shownValue - stepValue),
          children: "\u2212"
        }
      ),
      /* @__PURE__ */ jsx4(
        "input",
        {
          ...props,
          id,
          name: props.name ?? id,
          type: "number",
          disabled,
          readOnly,
          inputMode: props.inputMode ?? "decimal",
          min,
          max,
          step,
          value: shownValue,
          onChange: (event) => {
            onChange?.(event);
            if (!event.defaultPrevented && Number.isFinite(event.currentTarget.valueAsNumber)) {
              update(event.currentTarget.valueAsNumber);
            }
          }
        }
      ),
      /* @__PURE__ */ jsx4(
        "button",
        {
          type: "button",
          "aria-label": incrementLabel ?? `Increase ${labelText}`,
          disabled: incrementDisabled,
          onClick: () => update(shownValue + stepValue),
          children: "+"
        }
      )
    ] })
  ] });
}
function Stepper({
  items,
  current,
  onStepChange,
  className
}) {
  const generatedId = useId3();
  return /* @__PURE__ */ jsx4("ol", { className: cx("ogui-stepper", className), children: items.map((item, index) => /* @__PURE__ */ jsx4(
    "li",
    {
      "data-state": index < current ? "complete" : index === current ? "current" : "upcoming",
      children: /* @__PURE__ */ jsxs2(
        "button",
        {
          type: "button",
          disabled: !onStepChange,
          "aria-current": index === current ? "step" : void 0,
          onClick: () => onStepChange?.(index),
          children: [
            /* @__PURE__ */ jsx4("i", { "aria-hidden": "true", children: index < current ? "\u2713" : index + 1 }),
            /* @__PURE__ */ jsxs2("span", { children: [
              /* @__PURE__ */ jsx4("strong", { children: item.label }),
              item.description ? /* @__PURE__ */ jsx4("small", { children: item.description }) : null
            ] })
          ]
        }
      )
    },
    item.id ?? `${generatedId}-step-${index}`
  )) });
}
function ToggleButton({
  pressed,
  defaultPressed = false,
  onPressedChange,
  className,
  children,
  onClick,
  ...props
}) {
  const [internalPressed, setInternalPressed] = useState3(defaultPressed);
  const shownPressed = pressed ?? internalPressed;
  return /* @__PURE__ */ jsx4(
    "button",
    {
      ...props,
      type: "button",
      className: cx("ogui-toggle-button", className),
      "aria-pressed": shownPressed,
      onClick: (event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        if (pressed === void 0) {
          setInternalPressed(!shownPressed);
        }
        onPressedChange?.(!shownPressed);
      },
      children
    }
  );
}
function FileDropzone({
  label,
  name,
  accept,
  multiple = false,
  maxSizeBytes,
  onFiles,
  onRejected,
  onInputChange,
  className,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}) {
  const inputId = useId3();
  const statusId = `${inputId}-status`;
  const inputRef = useRef3(null);
  const [dragging, setDragging] = useState3(false);
  const [fileNames, setFileNames] = useState3([]);
  const [error, setError] = useState3("");
  const acceptsFile = (file) => {
    if (!accept) {
      return true;
    }
    return accept.split(",").some((rawRule) => {
      const rule = rawRule.trim().toLowerCase();
      if (rule.startsWith(".")) {
        return file.name.toLowerCase().endsWith(rule);
      }
      if (rule.endsWith("/*")) {
        return file.type.toLowerCase().startsWith(rule.slice(0, -1));
      }
      return file.type.toLowerCase() === rule;
    });
  };
  const syncNativeFiles = (files) => {
    const input = inputRef.current;
    if (!input) {
      return false;
    }
    if (files.length === 0) {
      input.value = "";
      return true;
    }
    if (typeof DataTransfer === "undefined") {
      input.value = "";
      return false;
    }
    try {
      const transfer = new DataTransfer();
      for (const file of files) {
        transfer.items.add(file);
      }
      input.files = transfer.files;
      return true;
    } catch {
      input.value = "";
      return false;
    }
  };
  const receive = (files) => {
    const selectedFiles = multiple ? files : files.slice(0, 1);
    const overflow = multiple ? [] : files.slice(1);
    const accepted = selectedFiles.filter(
      (file) => acceptsFile(file) && (maxSizeBytes === void 0 || file.size <= maxSizeBytes)
    );
    const rejected = [...selectedFiles.filter((file) => !accepted.includes(file)), ...overflow];
    setFileNames(accepted.map((file) => file.name));
    setError(
      rejected.length ? `${rejected.length} ${rejected.length === 1 ? "file was" : "files were"} rejected.` : ""
    );
    onFiles?.(accepted);
    if (rejected.length) {
      onRejected?.(rejected);
    }
    return { accepted, rejected };
  };
  const handleDrop = (event) => {
    onDrop?.(event);
    event.preventDefault();
    setDragging(false);
    const { accepted } = receive([...event.dataTransfer.files]);
    syncNativeFiles(accepted);
  };
  return /* @__PURE__ */ jsxs2(
    "fieldset",
    {
      ...props,
      className: cx("ogui-dropzone", className),
      "data-dragging": dragging ? "true" : "false",
      onDragEnter: (event) => {
        onDragEnter?.(event);
        event.preventDefault();
        setDragging(true);
      },
      onDragOver: (event) => {
        onDragOver?.(event);
        event.preventDefault();
      },
      onDragLeave: (event) => {
        onDragLeave?.(event);
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setDragging(false);
        }
      },
      onDrop: handleDrop,
      children: [
        /* @__PURE__ */ jsx4("legend", { className: "ogui-sr-only", children: label }),
        /* @__PURE__ */ jsx4(
          "input",
          {
            ref: inputRef,
            id: inputId,
            name: name ?? inputId,
            type: "file",
            "aria-label": label,
            "aria-describedby": statusId,
            accept,
            multiple,
            onChange: (event) => {
              onInputChange?.(event);
              if (event.defaultPrevented) {
                return;
              }
              const files = [...event.currentTarget.files ?? []];
              const { accepted, rejected } = receive(files);
              if (rejected.length) {
                syncNativeFiles(accepted);
              }
            }
          }
        ),
        /* @__PURE__ */ jsxs2("label", { htmlFor: inputId, children: [
          /* @__PURE__ */ jsx4("i", { "aria-hidden": "true", children: "\u21A5" }),
          /* @__PURE__ */ jsx4("strong", { children: label }),
          /* @__PURE__ */ jsx4("span", { id: statusId, role: "status", children: error || (fileNames.length ? fileNames.join(", ") : "Drop files or browse") })
        ] })
      ]
    }
  );
}
function classes(...values) {
  return values.filter(Boolean).join(" ");
}
function idPart2(value) {
  return encodeURIComponent(value).replaceAll("%", "_");
}
var useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect22 : useLayoutEffect;
function useSelectionIndicator(containerRef, selector, key) {
  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const place = () => {
      const selected = container.querySelector(selector);
      if (!selected) {
        container.removeAttribute("data-ogui-indicator");
        return;
      }
      container.style.setProperty("--ogui-indicator-x", `${selected.offsetLeft}px`);
      container.style.setProperty("--ogui-indicator-y", `${selected.offsetTop}px`);
      container.style.setProperty("--ogui-indicator-w", `${selected.offsetWidth}px`);
      container.style.setProperty("--ogui-indicator-h", `${selected.offsetHeight}px`);
      container.setAttribute("data-ogui-indicator", "ready");
    };
    place();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(place);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, selector, key]);
}
function rangeProgress(value, min, max) {
  const low = Number(min);
  const high = Number(max);
  const current = Number(value);
  if (![low, high, current].every(Number.isFinite) || high <= low) {
    return "0";
  }
  return Math.min(Math.max((current - low) / (high - low), 0), 1).toFixed(4);
}
function useControllableValue(controlledValue, defaultValue, onChange) {
  const [internalValue, setInternalValue] = useState22(defaultValue);
  const value = controlledValue ?? internalValue;
  const setValue = useCallback2(
    (nextValue) => {
      if (controlledValue === void 0) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [controlledValue, onChange]
  );
  return [value, setValue];
}
function Button({
  variant = "secondary",
  size = "medium",
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = "button",
  onPointerMove,
  ...props
}) {
  return /* @__PURE__ */ jsxs22(
    "button",
    {
      ...props,
      type,
      onPointerMove: (event) => {
        const target = event.currentTarget;
        const box = target.getBoundingClientRect();
        if (box.width > 0 && box.height > 0) {
          target.style.setProperty(
            "--ogui-light-x",
            `${((event.clientX - box.left) / box.width * 100).toFixed(1)}%`
          );
          target.style.setProperty(
            "--ogui-light-y",
            `${((event.clientY - box.top) / box.height * 100).toFixed(1)}%`
          );
        }
        onPointerMove?.(event);
      },
      className: classes(
        "ogui-button",
        `ogui-button--${variant}`,
        `ogui-control--${size}`,
        className
      ),
      children: [
        leadingIcon ? /* @__PURE__ */ jsx22("span", { className: "ogui-button__icon", children: leadingIcon }) : null,
        /* @__PURE__ */ jsx22("span", { className: "ogui-button__label", children }),
        trailingIcon ? /* @__PURE__ */ jsx22("span", { className: "ogui-button__icon", children: trailingIcon }) : null
      ]
    }
  );
}
function IconButton({
  size = "medium",
  variant = "quiet",
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx22(
    Button,
    {
      ...props,
      size,
      variant,
      className: classes("ogui-icon-button", className),
      children
    }
  );
}
function SegmentedControl({
  items,
  value: controlledValue,
  defaultValue = items[0]?.value,
  onValueChange,
  className,
  "aria-label": label,
  ...props
}) {
  if (defaultValue === void 0) {
    throw new Error("SegmentedControl requires at least one item or a defaultValue.");
  }
  const [value, setValue] = useControllableValue(controlledValue, defaultValue, onValueChange);
  const segmentsRef = useRef22(null);
  useSelectionIndicator(segmentsRef, '.ogui-segments__item[aria-pressed="true"]', value);
  return /* @__PURE__ */ jsxs22("fieldset", { ref: segmentsRef, ...props, className: classes("ogui-segments", className), children: [
    /* @__PURE__ */ jsx22("legend", { className: "ogui-sr-only", children: label }),
    /* @__PURE__ */ jsx22("span", { className: "ogui-segments__indicator", "aria-hidden": "true" }),
    items.map((item) => /* @__PURE__ */ jsxs22(
      "button",
      {
        type: "button",
        className: "ogui-segments__item",
        "aria-pressed": item.value === value,
        disabled: item.disabled,
        onClick: () => setValue(item.value),
        children: [
          item.icon ? /* @__PURE__ */ jsx22("span", { "aria-hidden": "true", children: item.icon }) : null,
          /* @__PURE__ */ jsx22("span", { children: item.label })
        ]
      },
      item.value
    ))
  ] });
}
function Switch({
  label,
  description,
  className,
  labelProps,
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  onCheckedChange,
  id: suppliedId,
  ...props
}) {
  const generatedId = useId2();
  const id = suppliedId ?? generatedId;
  const descriptionId = description ? `${id}-description` : void 0;
  const [checked, setChecked] = useControllableValue(
    controlledChecked,
    defaultChecked,
    onCheckedChange
  );
  return /* @__PURE__ */ jsxs22(
    "label",
    {
      ...labelProps,
      className: classes("ogui-switch", labelProps?.className, className),
      htmlFor: id,
      children: [
        /* @__PURE__ */ jsx22(
          "input",
          {
            ...props,
            id,
            name: props.name ?? id,
            type: "checkbox",
            role: "switch",
            checked,
            "aria-checked": checked,
            "aria-labelledby": `${id}-label`,
            "aria-describedby": descriptionId,
            onChange: (event) => {
              setChecked(event.currentTarget.checked);
              onChange?.(event);
            }
          }
        ),
        /* @__PURE__ */ jsxs22("span", { className: "ogui-switch__copy", children: [
          /* @__PURE__ */ jsx22("span", { id: `${id}-label`, className: "ogui-switch__label", children: label }),
          description ? /* @__PURE__ */ jsx22("span", { id: descriptionId, className: "ogui-switch__description", children: description }) : null
        ] }),
        /* @__PURE__ */ jsx22("span", { className: "ogui-switch__track", "aria-hidden": "true", children: /* @__PURE__ */ jsx22("span", { className: "ogui-switch__thumb" }) })
      ]
    }
  );
}
function Slider({
  label,
  valueText,
  unit = "",
  className,
  id: suppliedId,
  value,
  defaultValue,
  min = 0,
  max = 100,
  ...props
}) {
  const generatedId = useId2();
  const id = suppliedId ?? generatedId;
  const labelId = `${id}-label`;
  const [liveValue, setLiveValue] = useState22(defaultValue ?? min);
  const shownValue = value ?? liveValue;
  const numericValue = Array.isArray(shownValue) ? shownValue[0] : shownValue;
  const progress = rangeProgress(numericValue, min, max);
  return /* @__PURE__ */ jsxs22(
    "label",
    {
      className: classes("ogui-slider", className),
      htmlFor: id,
      style: { "--ogui-range-progress": progress },
      children: [
        /* @__PURE__ */ jsxs22("span", { className: "ogui-slider__header", children: [
          /* @__PURE__ */ jsx22("span", { id: labelId, children: label }),
          /* @__PURE__ */ jsx22("output", { htmlFor: id, children: valueText ?? `${numericValue}${unit}` })
        ] }),
        /* @__PURE__ */ jsx22(
          "input",
          {
            ...props,
            id,
            name: props.name ?? id,
            type: "range",
            "aria-labelledby": labelId,
            min,
            max,
            value,
            defaultValue,
            onInput: (event) => {
              setLiveValue(event.currentTarget.value);
              props.onInput?.(event);
            }
          }
        )
      ]
    }
  );
}
function Toolbar({
  label,
  orientation = "horizontal",
  material = "regular",
  tone = "auto",
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx22(
    Glass,
    {
      ...props,
      className: classes("ogui-toolbar", className),
      role: "toolbar",
      "aria-label": label,
      "aria-orientation": orientation,
      "data-orientation": orientation,
      material,
      tone,
      children
    }
  );
}
function Dock({
  label,
  material = "regular",
  tone = "auto",
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx22(
    Glass,
    {
      ...props,
      as: "nav",
      "aria-label": label,
      className: classes("ogui-dock", className),
      material,
      tone,
      children
    }
  );
}
function Tabs({
  label,
  items,
  value: controlledValue,
  defaultValue: suppliedDefaultValue,
  onValueChange,
  className,
  ...props
}) {
  const firstEnabled = items.find((item) => !item.disabled);
  const defaultValue = items.find((item) => item.value === suppliedDefaultValue && !item.disabled)?.value ?? firstEnabled?.value;
  if (defaultValue === void 0) {
    throw new Error("Tabs requires at least one enabled item.");
  }
  const id = useId2();
  const [value, setValue] = useControllableValue(controlledValue, defaultValue, onValueChange);
  const activeItem = items.find((item) => item.value === value && !item.disabled) ?? firstEnabled;
  const tabsRef = useRef22(null);
  useSelectionIndicator(tabsRef, '[role="tab"][aria-selected="true"]', activeItem?.value);
  const move = (currentValue, direction) => {
    const enabled = items.filter((item) => !item.disabled);
    const currentIndex = enabled.findIndex((item) => item.value === currentValue);
    const next = enabled[(currentIndex + direction + enabled.length) % enabled.length];
    if (next) {
      setValue(next.value);
      const button = [
        ...tabsRef.current?.querySelectorAll("[role=tab]") ?? []
      ].find((candidate) => candidate.dataset.tabValue === next.value);
      button?.focus();
    }
  };
  const moveToEdge = (edge) => {
    const enabled = items.filter((item) => !item.disabled);
    const next = edge === "first" ? enabled[0] : enabled.at(-1);
    if (next) {
      setValue(next.value);
      const button = [
        ...tabsRef.current?.querySelectorAll("[role=tab]") ?? []
      ].find((candidate) => candidate.dataset.tabValue === next.value);
      button?.focus();
    }
  };
  return /* @__PURE__ */ jsxs22("div", { ...props, className: classes("ogui-tabs", className), children: [
    /* @__PURE__ */ jsxs22("div", { ref: tabsRef, className: "ogui-tabs__list", role: "tablist", "aria-label": label, children: [
      /* @__PURE__ */ jsx22("span", { className: "ogui-tabs__indicator", "aria-hidden": "true" }),
      items.map((item) => {
        const selected = item.value === activeItem?.value;
        const itemId = idPart2(item.value);
        return /* @__PURE__ */ jsx22(
          "button",
          {
            id: `${id}-tab-${itemId}`,
            type: "button",
            role: "tab",
            "data-tab-value": item.value,
            "aria-selected": selected,
            "aria-controls": `${id}-panel-${itemId}`,
            tabIndex: selected ? 0 : -1,
            disabled: item.disabled,
            onClick: () => setValue(item.value),
            onKeyDown: (event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                move(item.value, -1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                move(item.value, 1);
              }
              if (event.key === "Home") {
                event.preventDefault();
                moveToEdge("first");
              }
              if (event.key === "End") {
                event.preventDefault();
                moveToEdge("last");
              }
            },
            children: item.label
          },
          item.value
        );
      })
    ] }),
    activeItem ? /* @__PURE__ */ jsx22(
      "div",
      {
        id: `${id}-panel-${idPart2(activeItem.value)}`,
        role: "tabpanel",
        "aria-labelledby": `${id}-tab-${idPart2(activeItem.value)}`,
        className: "ogui-tabs__panel",
        children: activeItem.content
      }
    ) : null
  ] });
}
var DisclosureCloseContext = /* @__PURE__ */ createContext22(null);
function DisclosureSurface({
  trigger,
  triggerLabel,
  material = "frosted",
  tone = "auto",
  placement = "start",
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  focusOnOpen = "none",
  openOnArrowKeys = false,
  className,
  children,
  ...props
}) {
  const id = useId2();
  const wrapperRef = useRef22(null);
  const surfaceRef = useRef22(null);
  const requestedFocusRef = useRef22(focusOnOpen);
  const [portalHost, setPortalHost] = useState22(null);
  const [surfacePosition, setSurfacePosition] = useState22({
    top: -1e4,
    left: -1e4
  });
  const [open, setOpen] = useControllableValue(controlledOpen, defaultOpen, onOpenChange);
  const { appearance, tokens } = useGlassTheme();
  const focusTrigger = useCallback2(() => {
    wrapperRef.current?.querySelector("button[aria-controls]")?.focus();
  }, []);
  useEffect22(() => {
    const host = document.createElement("div");
    host.setAttribute("data-ogui-portal", "disclosure");
    document.body.append(host);
    setPortalHost(host);
    return () => host.remove();
  }, []);
  useEffect22(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target) && !surfaceRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        focusTrigger();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [focusTrigger, open, setOpen]);
  useEffect22(() => {
    if (!open || !portalHost || requestedFocusRef.current === "none") {
      return;
    }
    const focusFrame = requestAnimationFrame(() => {
      const surface = surfaceRef.current;
      if (!surface) {
        return;
      }
      const autofocus = surface.querySelector("[data-ogui-autofocus]:not([disabled])");
      const items = [
        ...surface.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ];
      const target = autofocus ?? (requestedFocusRef.current === "last" ? items.at(-1) : items[0]);
      target?.focus();
    });
    return () => cancelAnimationFrame(focusFrame);
  }, [open, portalHost]);
  useLayoutEffect(() => {
    if (!open || !portalHost) {
      return;
    }
    const updatePosition = () => {
      const trigger2 = wrapperRef.current?.querySelector("button[aria-controls]");
      const surface = surfaceRef.current;
      if (!trigger2 || !surface) {
        return;
      }
      const gap = 8;
      const edge = 8;
      const triggerRect = trigger2.getBoundingClientRect();
      const surfaceRect = surface.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      const roomBelow = viewportHeight - triggerRect.bottom - gap;
      const roomAbove = triggerRect.top - gap;
      const placeAbove = surfaceRect.height > roomBelow && roomAbove > roomBelow;
      const preferredTop = placeAbove ? triggerRect.top - surfaceRect.height - gap : triggerRect.bottom + gap;
      const preferredLeft = placement === "center" ? triggerRect.left + (triggerRect.width - surfaceRect.width) / 2 : placement === "end" ? triggerRect.right - surfaceRect.width : triggerRect.left;
      const maxLeft = Math.max(edge, viewportWidth - surfaceRect.width - edge);
      const maxTop = Math.max(edge, viewportHeight - surfaceRect.height - edge);
      setSurfacePosition({
        top: Math.min(Math.max(preferredTop, edge), maxTop),
        left: Math.min(Math.max(preferredLeft, edge), maxLeft)
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, placement, portalHost]);
  const close = useCallback2(() => {
    setOpen(false);
    focusTrigger();
  }, [focusTrigger, setOpen]);
  return /* @__PURE__ */ jsxs22(
    "div",
    {
      ...props,
      ref: wrapperRef,
      className: classes("ogui-disclosure", className),
      "data-placement": placement,
      "data-open": open ? "true" : "false",
      children: [
        cloneElement(trigger, {
          id: `${id}-trigger`,
          "aria-label": triggerLabel ?? trigger.props["aria-label"],
          "aria-expanded": open,
          "aria-controls": `${id}-surface`,
          "aria-haspopup": openOnArrowKeys ? "menu" : trigger.props["aria-haspopup"],
          onClick: (event) => {
            trigger.props.onClick?.(event);
            if (!event.defaultPrevented) {
              requestedFocusRef.current = focusOnOpen;
              setOpen(!open);
            }
          },
          onKeyDown: (event) => {
            trigger.props.onKeyDown?.(event);
            if (!event.defaultPrevented && openOnArrowKeys && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              event.preventDefault();
              requestedFocusRef.current = event.key === "ArrowUp" ? "last" : "first";
              setOpen(true);
            }
          }
        }),
        open && portalHost ? createPortal2(
          /* @__PURE__ */ jsx22(DisclosureCloseContext.Provider, { value: close, children: /* @__PURE__ */ jsx22(
            Glass,
            {
              ref: surfaceRef,
              id: `${id}-surface`,
              className: "ogui-disclosure__surface ogui-disclosure__surface--portal",
              material,
              tone,
              "data-ogui-appearance": appearance,
              "data-ogui-disclosure-surface": "",
              "data-placement": placement,
              style: {
                ...tokens,
                colorScheme: appearance,
                ...surfacePosition
              },
              children
            }
          ) }),
          portalHost
        ) : null
      ]
    }
  );
}
function MenuItems({ label, children }) {
  const menuRef = useRef22(null);
  const close = useContext22(DisclosureCloseContext);
  const focusItem = (intent, current) => {
    const items = [
      ...menuRef.current?.querySelectorAll(
        '[role="menuitem"]:not([disabled])'
      ) ?? []
    ];
    if (items.length === 0) {
      return;
    }
    if (intent === "first") {
      items[0]?.focus();
      return;
    }
    if (intent === "last") {
      items.at(-1)?.focus();
      return;
    }
    const currentIndex = current ? items.indexOf(current) : -1;
    const delta = intent === "next" ? 1 : -1;
    items[(currentIndex + delta + items.length) % items.length]?.focus();
  };
  return /* @__PURE__ */ jsx22(
    "div",
    {
      ref: menuRef,
      role: "menu",
      "aria-label": label,
      className: "ogui-menu__items",
      onKeyDown: (event) => {
        const current = event.target instanceof HTMLElement ? event.target : void 0;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          focusItem("next", current);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          focusItem("previous", current);
          return;
        }
        if (event.key === "Home") {
          event.preventDefault();
          focusItem("first");
          return;
        }
        if (event.key === "End") {
          event.preventDefault();
          focusItem("last");
          return;
        }
        if (event.key === "Tab") {
          close?.();
          return;
        }
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const items = [
            ...menuRef.current?.querySelectorAll(
              '[role="menuitem"]:not([disabled])'
            ) ?? []
          ];
          const currentIndex = current ? items.indexOf(current) : -1;
          const orderedItems = [
            ...items.slice(currentIndex + 1),
            ...items.slice(0, currentIndex + 1)
          ];
          orderedItems.find(
            (item) => item.textContent?.trim().toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase())
          )?.focus();
        }
      },
      children
    }
  );
}
function Menu({ label, children, ...props }) {
  return /* @__PURE__ */ jsx22(
    DisclosureSurface,
    {
      ...props,
      triggerLabel: label,
      className: classes("ogui-menu", props.className),
      focusOnOpen: "first",
      openOnArrowKeys: true,
      children: /* @__PURE__ */ jsx22(MenuItems, { label, children })
    }
  );
}
function MenuItem({
  destructive = false,
  className,
  children,
  type = "button",
  onClick,
  ...props
}) {
  const close = useContext22(DisclosureCloseContext);
  return /* @__PURE__ */ jsx22(
    "button",
    {
      ...props,
      type,
      role: "menuitem",
      tabIndex: -1,
      className: classes("ogui-menu__item", destructive && "is-destructive", className),
      onClick: (event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          close?.();
        }
      },
      children
    }
  );
}
function Popover({ label, children, ...props }) {
  return /* @__PURE__ */ jsx22(
    DisclosureSurface,
    {
      ...props,
      triggerLabel: label,
      className: classes("ogui-popover", props.className),
      focusOnOpen: "first",
      children: /* @__PURE__ */ jsx22("div", { className: "ogui-popover__content", role: "dialog", "aria-label": label, children })
    }
  );
}
function Tooltip({ label, children, placement = "top" }) {
  const id = useId2();
  const [dismissed, setDismissed] = useState22(false);
  const describedBy = [children.props["aria-describedby"], id].filter(Boolean).join(" ");
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the handlers only observe events bubbling from the interactive child to dismiss the tooltip (WCAG 1.4.13); the wrapper itself is never operable.
    /* @__PURE__ */ jsxs22(
      "span",
      {
        className: "ogui-tooltip",
        "data-placement": placement,
        "data-dismissed": dismissed ? "true" : "false",
        onKeyDown: (event) => {
          if (event.key === "Escape") {
            setDismissed(true);
          }
        },
        onMouseLeave: () => setDismissed(false),
        onBlurCapture: () => setDismissed(false),
        children: [
          cloneElement(children, { "aria-describedby": describedBy }),
          /* @__PURE__ */ jsx22("span", { id, role: "tooltip", className: "ogui-tooltip__bubble", children: label })
        ]
      }
    )
  );
}
function formatTime(seconds) {
  const safeSeconds = Math.max(Number.isFinite(seconds) ? seconds : 0, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
var MEDIA_ICON_PATHS = {
  play: "M5 3.2 12.8 8 5 12.8Z",
  pause: "M4.6 3.2h2.4v9.6H4.6Zm4.4 0h2.4v9.6H9Z",
  volume: "M2.4 5.6h2.3L8.2 3v10L4.7 10.4H2.4Zm7.6-.3a3.9 3.9 0 0 1 0 5.4l-1-1a2.5 2.5 0 0 0 0-3.4Z",
  muted: "M2.4 5.6h2.3L8.2 3v10L4.7 10.4H2.4Zm7.5.7 1-1 1.6 1.6 1.6-1.6 1 1L13.5 8l1.6 1.6-1 1-1.6-1.6-1.6 1.6-1-1L11.5 8Z"
};
function MediaIcon({ name }) {
  return /* @__PURE__ */ jsx22(
    "svg",
    {
      "aria-hidden": "true",
      className: "ogui-media__icon",
      fill: "currentColor",
      focusable: "false",
      height: "14",
      viewBox: "0 0 16 16",
      width: "14",
      children: /* @__PURE__ */ jsx22("path", { d: MEDIA_ICON_PATHS[name] })
    }
  );
}
function MediaControls({
  playing,
  currentTime,
  duration,
  muted = false,
  onPlayingChange,
  onSeek,
  onMutedChange,
  className,
  ...props
}) {
  const seekId = useId2();
  const seekMax = Math.max(duration, 1);
  return /* @__PURE__ */ jsxs22(
    "div",
    {
      ...props,
      className: classes("ogui-media", className),
      style: {
        "--ogui-range-progress": rangeProgress(Math.min(currentTime, seekMax), 0, seekMax),
        ...props.style
      },
      children: [
        /* @__PURE__ */ jsx22(
          IconButton,
          {
            size: "small",
            variant: "quiet",
            "aria-label": playing ? "Pause" : "Play",
            onClick: () => onPlayingChange(!playing),
            children: /* @__PURE__ */ jsx22(MediaIcon, { name: playing ? "pause" : "play" })
          }
        ),
        /* @__PURE__ */ jsxs22("label", { className: "ogui-media__seek", htmlFor: seekId, children: [
          /* @__PURE__ */ jsx22("span", { className: "ogui-sr-only", children: "Seek media" }),
          /* @__PURE__ */ jsx22(
            "input",
            {
              id: seekId,
              type: "range",
              min: 0,
              max: Math.max(duration, 1),
              step: 0.01,
              value: Math.min(currentTime, Math.max(duration, 1)),
              "aria-valuetext": `${formatTime(currentTime)} of ${formatTime(duration)}`,
              onChange: (event) => onSeek(Number(event.currentTarget.value))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs22("output", { className: "ogui-media__time", htmlFor: seekId, children: [
          formatTime(currentTime),
          " / ",
          formatTime(duration)
        ] }),
        onMutedChange ? /* @__PURE__ */ jsx22(
          IconButton,
          {
            size: "small",
            variant: "quiet",
            "aria-label": muted ? "Unmute" : "Mute",
            onClick: () => onMutedChange(!muted),
            children: /* @__PURE__ */ jsx22(MediaIcon, { name: muted ? "muted" : "volume" })
          }
        ) : null
      ]
    }
  );
}

// src/index.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
function GlassSystemThemeBoundary({ children, theme, toasts }) {
  const runtime = useGlassRuntime();
  const content = toasts === false ? children : /* @__PURE__ */ jsx5(ToastProvider, { ...toasts ?? {}, children });
  return /* @__PURE__ */ jsx5(GlassThemeProvider, { ...theme ?? {}, "data-ogui-motion": runtime.motion, children: content });
}
function GlassSystemProvider({
  children,
  theme = {},
  toasts,
  design,
  ...runtime
}) {
  return /* @__PURE__ */ jsx5(GlassProvider, { ...runtime, children: /* @__PURE__ */ jsx5(
    GlassSystemThemeBoundary,
    {
      theme: design === void 0 || theme.design !== void 0 ? theme : { ...theme, design },
      toasts,
      children
    }
  ) });
}
export {
  Accordion,
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Banner,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  DEFAULT_GLASS_LIGHT_ANGLE,
  DEFAULT_GLASS_LIGHT_SPREAD,
  Dialog,
  Dock,
  Drawer,
  FileDropzone,
  GLASS_LOOK_PRESETS,
  Glass,
  GlassGroup,
  GlassProvider,
  GlassSource,
  GlassSystemProvider,
  GlassThemeProvider,
  IconButton,
  MediaControls,
  Menu,
  MenuItem,
  Meter,
  NumberField,
  OpticsMapCache,
  OrganicFilterDefinition,
  Pagination,
  Popover,
  Progress,
  QUALITY_PROFILES,
  RadioGroup,
  SdfFilterDefinition,
  SearchField,
  SegmentedControl,
  Select,
  Skeleton,
  Slider,
  Spinner,
  Stat,
  Stepper,
  Switch,
  Tabs,
  TextField,
  Textarea,
  Toast,
  ToastProvider,
  ToggleButton,
  Toolbar,
  Tooltip,
  applyQualityToMapInput,
  contrastRatio,
  createCssMaterialStyle,
  createCssMaterialTokens,
  createGlassLookTokens,
  createGlassTheme,
  createGlassThemeTokens,
  createOpticsCacheKey,
  createStableFilterId,
  createSvgDisplacementFilterSpec,
  detectRendererCapabilities,
  encodeDisplacementMap,
  generateDisplacementMap,
  generateDisplacementMapAsync,
  getMaterialPreset,
  readableForeground,
  relativeLuminance,
  resolveGlassLook,
  resolveMapDimensions,
  sanitizeMaterial,
  selectRenderer,
  signedDistance,
  surfaceHeight,
  surfaceNormal,
  useGlassCapabilities,
  useGlassGroup,
  useGlassPointerField,
  useGlassRuntime,
  useGlassTheme,
  useSdfFilter,
  useToast
};

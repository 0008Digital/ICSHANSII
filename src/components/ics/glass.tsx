"use client";
import { forwardRef } from "react";
import { Glass, resolveGlassLook, getMaterialPreset, type GlassProps } from "@/vendor/open-glass-ui/dist/index.js";
import { useAppearance } from "@/app/providers";
export const GlassSurface=forwardRef<HTMLElement,GlassProps>(function GlassSurface({material,optics,look,...props},ref){
 const {settings}=useAppearance();
 // An explicit specimen keeps its preset; ordinary chrome follows the saved frost control.
 const frost=optics?.frost ?? (material ? getMaterialPreset(material).frost : settings.frost/100);
 const selectedMaterial=material??settings.material;
 const tintBase={clear:0.45,regular:0.5,frosted:0.7}[selectedMaterial];
 return <Glass ref={ref} material={material??settings.material} optics={{...optics,frost}}
  look={{opacity:(0.66+frost*0.3)/tintBase,blur:0.65,shadow:0.3,...(look ? resolveGlassLook(look) : {})}} {...props}/>;
});


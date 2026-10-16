"use client";
import { AppearanceCustomizer } from "./appearance/customizer";
import { BrandingEditor } from "./branding/branding-editor";
import { useWorkspaceRolePreview } from "./workspace-role-preview";
import { GlassSurface } from "./glass";

export function PersonalSettings() {
 const {role}=useWorkspaceRolePreview();
 return <><AppearanceCustomizer/>{role==="admin"?<><p className="demo-banner"><strong>CENTRE BRANDING</strong> Separate from personal appearance. Preview roles do not grant real centre permissions.</p><BrandingEditor/></>:<GlassSurface className="personal-branding-boundary"><h2>Centre branding</h2><p>Managed by the Centre Admin. Personal appearance does not change centre branding.</p></GlassSurface>}</>;
}

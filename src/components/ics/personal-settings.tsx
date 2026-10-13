"use client";
import { AppearanceCustomizer } from "./appearance/customizer";
import { BrandingEditor } from "./branding/branding-editor";
import { useWorkspaceRolePreview } from "./workspace-role-preview";
import { GlassSurface } from "./glass";

export function PersonalSettings() {
 const {role}=useWorkspaceRolePreview();
 return <><AppearanceCustomizer/>{role==="admin"?<><p className="demo-banner"><strong>CENTRE BRANDING</strong> Shared centre presentation is separate from your personal appearance. This demo role preview does not authorize changes.</p><BrandingEditor/></>:<GlassSurface className="personal-branding-boundary"><h2>Centre branding</h2><p>Shared centre branding is managed separately by the Centre Admin. Your appearance preferences do not change it.</p></GlassSurface>}</>;
}

export const SETTINGS_SECTIONS=["appearance","branding"];
export const PERSONAL_SETTINGS_SECTIONS=["appearance"];
export function settingsSectionsForRole(role){return role==="admin"?SETTINGS_SECTIONS:PERSONAL_SETTINGS_SECTIONS;}
export function settingsSectionFromHash(hash){
 const id=String(hash||"").replace(/^#/ ,"");
 return SETTINGS_SECTIONS.find(section=>id===`${section}-title`)??"appearance";
}
export function activeSettingsSection(sections,threshold,viewportHeight=Infinity,atBottom=false){
 const current=[...sections].reverse().find(section=>section.top<=threshold);
 const last=atBottom?[...sections].reverse().find(section=>section.top<viewportHeight):undefined;
 if(last&&last!==current)return last.id.replace(/-title$/,"");
 if(current)return current.id.replace(/-title$/,"");
 return "appearance";
}

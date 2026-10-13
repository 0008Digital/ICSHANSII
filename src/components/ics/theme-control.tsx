"use client";
import { SegmentedControl } from "@/vendor/open-glass-ui/dist/index.js";
import { useAppearance } from "@/app/providers";
export function ThemeControl() {
 const { appearance, setAppearance } = useAppearance();
 return <SegmentedControl aria-label="Appearance" items={[{value:"light",label:"Light"},{value:"dark",label:"Dark"},{value:"system",label:"System"}]} value={appearance} onValueChange={setAppearance} />;
}

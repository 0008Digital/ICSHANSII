import type {ReactNode} from "react";
import {Icon} from "./icon";

// Retains native details/summary semantics; the icon is decorative.
export function DisclosureSummary({children}:{children:ReactNode}) {
 return <summary className="ics-disclosure-summary"><span>{children}</span><Icon name="chevron-down"/></summary>;
}

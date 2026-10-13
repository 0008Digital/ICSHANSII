import type { ReactNode } from "react";
export function PageHeading({title,description,children}:{title:string;description?:string;children?:ReactNode}) {
 return <header className="page-heading"><div><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{children}</header>;
}
export function EmptyState({title,children}:{title:string;children:ReactNode}) {
 return <section className="empty-state"><span className="empty-mark" aria-hidden="true">—</span><h2>{title}</h2><p>{children}</p><span className="quiet-label">Preview only · No changes can be saved</span></section>;
}

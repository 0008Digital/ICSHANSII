export const SECTION_LOCATION_CHANGE = 'ics-hansi:section-location-change';

/** Own same-document section intents only; cross-route navigation stays with Next. */
export function commitRoleSection(href, win, doc, landingPath) {
 const current = new URL(win.location.href), destination = new URL(href, current);
 if (current.pathname !== landingPath || destination.origin !== current.origin ||
     destination.pathname !== current.pathname || destination.search !== current.search) return false;
 const id = decodeURIComponent(destination.hash.slice(1));
 // Cached/inactive route DOM must never win a duplicate-id lookup.
 const target = id ? [...doc.querySelectorAll('main [id]')].find(node => node.id === id && (node.getClientRects().length || (node.hasAttribute?.('data-role-section') && node.closest('main')?.getClientRects().length))) : null;
 // A missing target is not a deferred request to execute on a later page.
 if (id && !target) return true;
 if (destination.href !== current.href) win.history.pushState(null, '', destination.href);
 win.dispatchEvent(new win.Event(SECTION_LOCATION_CHANGE));
 if (target?.hasAttribute?.('data-role-section')) win.scrollTo({top:0});
 else if (target) target.scrollIntoView({block: 'start'});
 else win.scrollTo({top: 0});
 return true;
}

export function navigateRoleSection(event, anchor, win, doc, landingPath) {
 if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
     anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return false;
 const handled = commitRoleSection(anchor.href, win, doc, landingPath);
 if (handled) event.preventDefault();
 return handled;
}

/** A/B identity switches can keep the pathname while clearing the old hash. */
export function resetRoleSectionForIdentity(win, landingPath) {
 const current = new URL(win.location.href);
 if (current.pathname !== landingPath || !current.hash) return false;
 win.history.replaceState(null, '', landingPath);
 win.dispatchEvent(new win.Event(SECTION_LOCATION_CHANGE));
 win.scrollTo({top: 0});
 return true;
}

export function subscribeSectionLocation(listener) {
 const events = ['hashchange', 'popstate', SECTION_LOCATION_CHANGE];
 for (const event of events) window.addEventListener(event, listener);
 return () => { for (const event of events) window.removeEventListener(event, listener); };
}

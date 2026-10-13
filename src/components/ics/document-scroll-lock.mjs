const locks = new WeakMap();

/** Lock the document while native modal dialogs are open, including nested dialogs. */
export function lockDocumentScroll(doc, win) {
 const root = doc.documentElement;
 let lock = locks.get(doc);
 if (!lock) {
  const style = root.style;
  const computed = win.getComputedStyle(root);
  const gap = Math.max(0, win.innerWidth - root.clientWidth);
  lock = {
   count: 0,
   overflow: style.getPropertyValue("overflow"),
   overflowPriority: style.getPropertyPriority("overflow"),
   padding: style.getPropertyValue("padding-right"),
   paddingPriority: style.getPropertyPriority("padding-right"),
   compensated: gap > 0 && !computed.scrollbarGutter?.includes("stable"),
  };
  if (lock.compensated) style.setProperty("padding-right", `${(parseFloat(computed.paddingRight) || 0) + gap}px`);
  style.setProperty("overflow", "hidden");
  locks.set(doc, lock);
 }
 lock.count++;
 let released = false;
 return () => {
  if (released) return;
  released = true;
  if (--lock.count > 0) return;
  const style = root.style;
  if (lock.overflow) style.setProperty("overflow", lock.overflow, lock.overflowPriority);
  else style.removeProperty("overflow");
  if (lock.compensated) {
   if (lock.padding) style.setProperty("padding-right", lock.padding, lock.paddingPriority);
   else style.removeProperty("padding-right");
  }
  locks.delete(doc);
 };
}

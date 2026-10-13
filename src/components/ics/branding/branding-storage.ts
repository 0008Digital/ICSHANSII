const DATABASE = "ics-hansi-branding-local";
const STORE = "logos";

function openDatabase(browser: Window): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!browser.indexedDB) return reject(new Error("Local browser storage is unavailable."));
    const request = browser.indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local logo storage."));
  });
}

const scopedLogoKey = (tenantId: string, logoId: string) => `${tenantId}/${logoId}`;

export async function writeBrandLogo(browser: Window, tenantId: string, logoId: string, blob: Blob): Promise<void> {
  const db = await openDatabase(browser);
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(blob, scopedLogoKey(tenantId, logoId));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Logo could not be stored locally."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Logo storage was interrupted."));
    });
  } finally { db.close(); }
}

export async function readBrandLogo(browser: Window, tenantId: string, logoId: string): Promise<Blob | null> {
  const db = await openDatabase(browser);
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(scopedLogoKey(tenantId, logoId));
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error ?? new Error("Could not restore the saved logo."));
    });
  } finally { db.close(); }
}

export async function deleteBrandLogo(browser: Window, tenantId: string, logoId: string): Promise<void> {
  const db = await openDatabase(browser);
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).delete(scopedLogoKey(tenantId, logoId));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Old logo could not be removed."));
    });
  } finally { db.close(); }
}

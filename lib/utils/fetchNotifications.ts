let sharedPromise: Promise<any> | null = null;
let sharedTime = 0;

export async function fetchNotificationsClient() {
  const now = Date.now();
  if (sharedPromise && (now - sharedTime < 2000)) {
    return sharedPromise;
  }
  
  sharedPromise = fetch("/api/notifications/me", { credentials: "include" })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch notifications");
      }
      return data;
    })
    .finally(() => {
      setTimeout(() => { sharedPromise = null; }, 2000);
    });
    
  sharedTime = now;
  return sharedPromise;
}

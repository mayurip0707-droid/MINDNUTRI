
import { API_BASE_URL } from "./api";

const PROFILE_KEY = "mindnutri_user_profile";
const TOKEN_KEY = "mindnutri_auth_token";

function getLocalWellnessData() {
  const data = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (
      key &&
      key.startsWith("mindnutri_") &&
      key !== PROFILE_KEY &&
      key !== TOKEN_KEY
    ) {
      const rawValue = localStorage.getItem(key);

      if (rawValue !== null) {
        try {
          data[key] = JSON.parse(rawValue);
        } catch {
          data[key] = rawValue;
        }
      }
    }
  }

  return data;
}

async function sendAccountData(token, data) {
  const response = await fetch(`${API_BASE_URL}/account/data`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data }),
  });

  const result = await response.json();

  if (!response.ok || result.status !== "success") {
    throw new Error(result.message || "Could not save account data.");
  }
}

export async function syncAccountData(token) {
  if (!token) {
    throw new Error("Missing authentication token.");
  }

  const response = await fetch(`${API_BASE_URL}/account/data`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok || result.status !== "success") {
    throw new Error(result.message || "Could not load account data.");
  }

  const localData = getLocalWellnessData();
  const serverData =
    result.data && typeof result.data === "object"
      ? result.data
      : {};

  const uploadData = {};
  const restoreData = {};

  // Upload local records that the server does not have yet.
  for (const [key, value] of Object.entries(localData)) {
    if (!(key in serverData)) {
      uploadData[key] = value;
    }
  }

  // Restore server records that are missing locally.
  for (const [key, value] of Object.entries(serverData)) {
    if (!(key in localData)) {
      restoreData[key] = value;
    }
  }

  // Save first, before restoring anything.
  if (Object.keys(uploadData).length > 0) {
    await sendAccountData(token, uploadData);
  }

  for (const [key, value] of Object.entries(restoreData)) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  return {
    uploaded: Object.keys(uploadData).length,
    restored: Object.keys(restoreData).length,
  };
}

export function startAccountAutoSync() {
  if (window.__mindnutriAccountSyncInstalled) {
    return;
  }

  window.__mindnutriAccountSyncInstalled = true;

  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);

    // Only sync writes to this app's localStorage.
    if (
      this !== window.localStorage ||
      typeof key !== "string" ||
      !key.startsWith("mindnutri_") ||
      key === PROFILE_KEY ||
      key === TOKEN_KEY ||
      window.__mindnutriSyncPaused
    ) {
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) return;

    let parsedValue = value;

    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Preserve non-JSON string values.
    }

    sendAccountData(token, { [key]: parsedValue }).catch((error) => {
      console.error("MINDNUTRI background sync failed:", error);
    });
  };
}

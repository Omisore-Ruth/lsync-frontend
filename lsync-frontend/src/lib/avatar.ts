"use client";

import { useSyncExternalStore } from "react";

/**
 * Profile pictures. The photo is shrunk in the browser (so it is small and fast) and kept on this device,
 * so it shows up everywhere straight away. If the backend also accepts an avatar, the profile page sends it there too.
 */
const KEY = (who: string) => `lsync-avatar:${who}`;
const EVENT = "lsync-avatar-change";

export function readAvatar(who: string | undefined): string | null {
  if (!who) return null;
  try {
    return window.localStorage.getItem(KEY(who));
  } catch {
    return null;
  }
}

export function writeAvatar(who: string, dataUrl: string | null) {
  try {
    if (dataUrl) window.localStorage.setItem(KEY(who), dataUrl);
    else window.localStorage.removeItem(KEY(who));
  } catch {
    throw new Error("Your browser has no room to keep the photo. Try a smaller picture.");
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** The saved photo for this person, or null. `serverUrl` is used when the backend already has one and this device does not. */
export function useAvatar(who: string | undefined, serverUrl?: string | null): string | null {
  const local = useSyncExternalStore(subscribe, () => readAvatar(who), () => null);
  return local ?? serverUrl ?? null;
}

/** Reads an image file, crops it to a centred square and returns a small JPEG data URL (256 x 256). */
export async function fileToAvatar(file: File, size = 256): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.size > 12 * 1024 * 1024) throw new Error("That picture is too large. Please choose one under 12 MB.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("We couldn't read that picture. Try a JPG or PNG.");
  });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process pictures. Try Chrome or Edge.");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.85);
}

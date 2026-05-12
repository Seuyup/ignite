import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Ignite } from "@/lib/models/Ignite";
import type { NavItem } from "@/lib/navigation";

export const IGNITE_TYPE_CONTACT = "contactsettings" as const;
export const IGNITE_TYPE_INSTAGRAM = "instagram" as const;

let legacyContactMigrated = false;

/** 구 `contactsettings` 컬렉션 → `ignite` 한 번 이관 */
async function migrateLegacyContactSettingsOnce(): Promise<void> {
  if (legacyContactMigrated) return;
  legacyContactMigrated = true;
  try {
    const exists = await Ignite.exists({ type: IGNITE_TYPE_CONTACT });
    if (exists) return;
    const raw = mongoose.connection.db?.collection("contactsettings");
    if (!raw) return;
    const doc = await raw.findOne<{ body?: string }>({});
    if (!doc) return;
    const body = typeof doc.body === "string" ? doc.body : "";
    await Ignite.create({ type: IGNITE_TYPE_CONTACT, body });
  } catch {
    /* ignore */
  }
}

export async function getIgniteBody(type: string): Promise<string> {
  try {
    await connectDB();
    if (type === IGNITE_TYPE_CONTACT) await migrateLegacyContactSettingsOnce();
    const doc = await Ignite.findOne({ type: type.toLowerCase() }).lean();
    return doc?.body ?? "";
  } catch {
    return "";
  }
}

export async function upsertIgniteBody(
  type: string,
  body: string,
): Promise<void> {
  await connectDB();
  if (type === IGNITE_TYPE_CONTACT) await migrateLegacyContactSettingsOnce();
  await Ignite.findOneAndUpdate(
    { type: type.toLowerCase() },
    { $set: { body } },
    { upsert: true, new: true },
  );
}

/** 공개 `/contact` 본문 */
export async function getContactBody(): Promise<string> {
  return getIgniteBody(IGNITE_TYPE_CONTACT);
}

/** 관리자 연락처 편집 초기값 */
export async function getContactForAdmin(): Promise<{ body: string }> {
  const body = await getIgniteBody(IGNITE_TYPE_CONTACT);
  return { body };
}

/** 헤더 Instagram 링크용. `body`는 사용자명만 (예: wgnb.kr, @ 없이) */
export async function getInstagramHandle(): Promise<string> {
  return (await getIgniteBody(IGNITE_TYPE_INSTAGRAM)).trim();
}

export function buildInstagramNavItem(handle: string): NavItem | null {
  const id = handle.trim().replace(/^@+/, "").replace(/\/+$/, "");
  if (!id) return null;
  return {
    label: "@instagram",
    href: `https://www.instagram.com/${encodeURIComponent(id)}/`,
    external: true,
  };
}

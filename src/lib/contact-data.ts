import { connectDB } from "@/lib/mongodb";
import { ContactSettings } from "@/lib/models/ContactSettings";

const SINGLETON_KEY = "default";

export async function getContactBody(): Promise<string> {
  try {
    await connectDB();
    const doc = await ContactSettings.findOne({
      singletonKey: SINGLETON_KEY,
    }).lean();
    return doc?.body ?? "";
  } catch {
    return "";
  }
}

export async function getContactForAdmin(): Promise<{ body: string }> {
  try {
    await connectDB();
    const doc = await ContactSettings.findOne({
      singletonKey: SINGLETON_KEY,
    }).lean();
    return { body: doc?.body ?? "" };
  } catch {
    return { body: "" };
  }
}

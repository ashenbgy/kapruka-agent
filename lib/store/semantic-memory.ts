import fs from "fs";
import path from "path";
import { RecipientPreferences } from "@/types/chat";

const PROFILES_PATH = path.join(process.cwd(), "data", "profiles.json");

export type UserProfile = {
  id: string;
  preferences: RecipientPreferences;
  updatedAt: string;
};

// Ensure file exists
function ensureProfilesFile() {
  if (!fs.existsSync(PROFILES_PATH)) {
    const dir = path.dirname(PROFILES_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PROFILES_PATH, JSON.stringify({}), "utf8");
  }
}

export function getProfile(userId: string): UserProfile | null {
  ensureProfilesFile();
  try {
    const data = fs.readFileSync(PROFILES_PATH, "utf8");
    const profiles = JSON.parse(data);
    return profiles[userId] || null;
  } catch (error) {
    console.error("Error reading profiles.json:", error);
    return null;
  }
}

export function updateProfile(userId: string, partialPreferences: Partial<RecipientPreferences>) {
  ensureProfilesFile();
  try {
    const data = fs.readFileSync(PROFILES_PATH, "utf8");
    const profiles = JSON.parse(data);

    const existingProfile = profiles[userId] || {
      id: userId,
      preferences: {
        likes: [],
        dislikes: [],
        allergies: [],
      },
      updatedAt: new Date().toISOString(),
    };

    const newPreferences = {
      ...existingProfile.preferences,
      ...partialPreferences,
    };

    // Arrays like likes, dislikes, allergies might just be passed directly instead of merged.
    // If we want them to accumulate, we could merge them. Let's merge unique items.
    if (partialPreferences.likes) {
      newPreferences.likes = Array.from(new Set([...(existingProfile.preferences.likes || []), ...partialPreferences.likes]));
    }
    if (partialPreferences.dislikes) {
      newPreferences.dislikes = Array.from(new Set([...(existingProfile.preferences.dislikes || []), ...partialPreferences.dislikes]));
    }
    if (partialPreferences.allergies) {
      newPreferences.allergies = Array.from(new Set([...(existingProfile.preferences.allergies || []), ...partialPreferences.allergies]));
    }

    profiles[userId] = {
      id: userId,
      preferences: newPreferences,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), "utf8");
    return profiles[userId];
  } catch (error) {
    console.error("Error writing profiles.json:", error);
    return null;
  }
}

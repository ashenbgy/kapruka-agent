/**
 * Simple client‑side analytics helper.
 *
 * The logEvent function records high‑level user interactions into
 * localStorage and prints a console message. This is a lightweight
 * instrumentation layer to help with A/B testing and user‑journey analysis.
 * In a production environment you would send these events to an
 * analytics platform such as Google Analytics, Mixpanel or a custom
 * endpoint. Here we store them locally for privacy and offline use.
 */
export function logEvent(
  eventType: string,
  details: Record<string, unknown> = {},
): void {
  try {
    const key = "giftmate_analytics";
    const existingRaw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(key)
        : null;
    const existing = existingRaw
      ? JSON.parse(existingRaw)
      : [];
    existing.push({
      eventType,
      details,
      timestamp: Date.now(),
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        key,
        JSON.stringify(existing),
      );
    }
  } catch {
    // Swallow errors silently
  }
  // Always log to the console for visibility during development
  /* eslint-disable no-console */
  console.log(
    "Analytics event:",
    eventType,
    details,
  );
}

/**
 * Returns a persistent experiment group for A/B testing.
 *
 * If a group has already been assigned in localStorage, it will
 * return that value. Otherwise, it randomly assigns the user to
 * either group "A" or "B" and stores it in localStorage.
 */
export function getExperimentGroup(): "A" | "B" {
  if (typeof window === "undefined") {
    return "A";
  }
  const key = "giftmate_experiment";
  let group = window.localStorage.getItem(key);
  if (!group || (group !== "A" && group !== "B")) {
    group = Math.random() < 0.5 ? "A" : "B";
    window.localStorage.setItem(key, group);
  }
  return group as "A" | "B";
}
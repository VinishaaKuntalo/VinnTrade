export function cn(
  ...parts: (string | undefined | null | false | 0 | Record<string, boolean>)[]
): string {
  return parts
    .filter(Boolean)
    .map((p) => {
      if (typeof p === "string") return p;
      if (p && typeof p === "object") {
        return Object.entries(p)
          .filter(([, on]) => on)
          .map(([k]) => k)
          .join(" ");
      }
      return "";
    })
    .join(" ");
}

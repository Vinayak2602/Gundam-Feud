export const MAX_BANNER_TEXT_LENGTH = 280;

export type BannerSeverity = "info" | "warning" | "critical";

export interface AnnouncementBanner {
  text: string;
  startAt: string | null;
  publishNow: boolean;
  severity: BannerSeverity;
  enabled: boolean;
  updatedAt: string;
  author: string;
}

export type PublicAnnouncementBanner = Pick<AnnouncementBanner, "text" | "severity" | "updatedAt">;

const bannerStore = globalThis as typeof globalThis & {
  friendlyFeudAnnouncementBanner?: AnnouncementBanner | null;
};

function isValidSeverity(value: unknown): value is BannerSeverity {
  return value === "info" || value === "warning" || value === "critical";
}

function isAnnouncementBanner(value: unknown): value is AnnouncementBanner {
  if (!value || typeof value !== "object") {
    return false;
  }

  const banner = value as Partial<AnnouncementBanner>;
  return (
    typeof banner.text === "string" &&
    (typeof banner.startAt === "string" || banner.startAt === null) &&
    typeof banner.publishNow === "boolean" &&
    isValidSeverity(banner.severity) &&
    typeof banner.enabled === "boolean" &&
    typeof banner.updatedAt === "string" &&
    typeof banner.author === "string"
  );
}


export function getAnnouncementBanner() {
  const banner = bannerStore.friendlyFeudAnnouncementBanner;
  return isAnnouncementBanner(banner) ? banner : null;
}

export function getActiveAnnouncementBanner(now = new Date()) {
  const bannerState = getAnnouncementBanner();

  if (!bannerState?.enabled) {
    return null;
  }

  if (bannerState.publishNow) {
    return bannerState;
  }

  if (!bannerState.startAt) {
    return null;
  }

  const startAt = new Date(bannerState.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return null;
  }

  return startAt <= now ? bannerState : null;
}

export function toPublicAnnouncementBanner(banner: AnnouncementBanner | null): PublicAnnouncementBanner | null {
  if (!banner) {
    return null;
  }

  return {
    text: banner.text,
    severity: banner.severity,
    updatedAt: banner.updatedAt,
  };
}

export function setAnnouncementBanner(nextState: AnnouncementBanner) {
  bannerStore.friendlyFeudAnnouncementBanner = nextState;
}

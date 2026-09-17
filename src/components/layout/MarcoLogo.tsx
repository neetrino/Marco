import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import type { Locale } from "@/lib/i18n/config";

const MARCO_LOGO_SRC = "/logo.webp";
const MARCO_LOGO_INTRINSIC_WIDTH = 1080;
const MARCO_LOGO_INTRINSIC_HEIGHT = 1350;
/** Displayed frame is 83×73 CSS px (`h-20` + aspect box); keep sizes aligned so preload matches the used srcset. */
const MARCO_LOGO_SIZES = "83px";

type MarcoLogoProps = {
  locale: Locale;
  ariaLabel: string;
};

/**
 * MARCO GROUP mark — cropped/zoomed inside an 83×73 frame (same treatment as marco.am).
 */
export function MarcoLogo({ locale, ariaLabel }: MarcoLogoProps) {
  return (
    <AppLink
      href={`/${locale}`}
      prefetchPolicy="intent"
      className="flex h-20 shrink-0 items-center"
      aria-label={ariaLabel}
    >
      <span className="relative aspect-[83/73] h-full w-auto shrink-0 overflow-hidden">
        <Image
          src={MARCO_LOGO_SRC}
          alt=""
          width={MARCO_LOGO_INTRINSIC_WIDTH}
          height={MARCO_LOGO_INTRINSIC_HEIGHT}
          className="absolute -left-[48.54%] -top-[75.88%] h-[278.35%] w-[197.08%] max-w-none"
          priority
          quality={75}
          sizes={MARCO_LOGO_SIZES}
        />
      </span>
    </AppLink>
  );
}

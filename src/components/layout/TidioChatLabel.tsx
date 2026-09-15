"use client";

import { useEffect } from "react";

import { applyTidioWidgetConfig } from "@/components/layout/tidio-chat";
import type { TidioVisitorIdentity } from "@/components/layout/tidio-visitor";

type TidioChatLabelProps = {
  label: string;
  visitor: TidioVisitorIdentity | null;
};

/** Sets the Tidio bubble label and signed-in visitor after ready. */
export function TidioChatLabel({ label, visitor }: TidioChatLabelProps) {
  useEffect(
    () => applyTidioWidgetConfig({ label, visitor }),
    [label, visitor],
  );

  return null;
}

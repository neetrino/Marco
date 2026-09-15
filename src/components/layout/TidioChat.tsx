import Script from "next/script";

import { TidioChatLabel } from "@/components/layout/TidioChatLabel";
import { tidioScriptSrc } from "@/components/layout/tidio-chat";
import {
  assignTidioIdentifySnippet,
  type TidioVisitorIdentity,
} from "@/components/layout/tidio-visitor";

type TidioChatProps = {
  widgetLabel: string;
  visitor: TidioVisitorIdentity | null;
};

/** Storefront live-chat widget. Admin routes do not mount this layout. */
export function TidioChat({ widgetLabel, visitor }: TidioChatProps) {
  return (
    <>
      {visitor ? (
        <Script id="tidio-identify" strategy="afterInteractive">
          {assignTidioIdentifySnippet(visitor)}
        </Script>
      ) : null}
      <Script src={tidioScriptSrc()} strategy="afterInteractive" />
      <TidioChatLabel label={widgetLabel} visitor={visitor} />
    </>
  );
}

import type { TidioVisitorIdentity } from "@/components/layout/tidio-visitor";

/** Public Tidio widget id from the storefront install snippet. */
export const TIDIO_PUBLIC_KEY = "9hqdkmduvfohirterdvel96jtodhtmiw";

const TIDIO_PUBLIC_KEY_PATTERN = /^[a-z0-9]{16,64}$/i;

type TidioChatApi = {
  on: (event: "ready" | "beforeOpen", handler: () => void) => void;
  setFeatures: (features: {
    widgetLabelStatus?: boolean;
    widgetLabelText?: string;
    hideChatWithUsOnHome?: boolean;
  }) => void;
  setVisitorData?: (data: {
    email?: string;
    name?: string;
    phone?: string;
  }) => void;
};

/** Builds the official Tidio widget script URL. */
export function tidioScriptSrc(publicKey: string = TIDIO_PUBLIC_KEY): string {
  if (!TIDIO_PUBLIC_KEY_PATTERN.test(publicKey)) {
    throw new Error("Invalid Tidio public key");
  }

  return `https://code.tidio.co/${publicKey}.js`;
}

/** Closed-widget label and Home-card flags for `tidioChatApi.setFeatures`. */
export function tidioWidgetLabelFeatures(label: string): {
  widgetLabelStatus: true;
  widgetLabelText: string;
  hideChatWithUsOnHome: true;
} {
  return {
    widgetLabelStatus: true,
    widgetLabelText: label,
    hideChatWithUsOnHome: true,
  };
}

function isTidioChatApi(value: unknown): value is TidioChatApi {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    typeof Reflect.get(value, "setFeatures") === "function" &&
    typeof Reflect.get(value, "on") === "function"
  );
}

function readTidioChatApi(): TidioChatApi | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const candidate = Reflect.get(window, "tidioChatApi");
  return isTidioChatApi(candidate) ? candidate : undefined;
}

function writeTidioIdentify(visitor: TidioVisitorIdentity): void {
  Reflect.set(document, "tidioIdentify", visitor);
}

function applyVisitor(visitor: TidioVisitorIdentity): void {
  writeTidioIdentify(visitor);
  readTidioChatApi()?.setVisitorData?.({
    email: visitor.email,
    name: visitor.name,
    phone: visitor.phone,
  });
}

type TidioWidgetConfig = {
  label: string;
  visitor: TidioVisitorIdentity | null;
};

/** Applies label and signed-in visitor data when Tidio is ready. */
export function applyTidioWidgetConfig({
  label,
  visitor,
}: TidioWidgetConfig): () => void {
  const apply = () => {
    readTidioChatApi()?.setFeatures(tidioWidgetLabelFeatures(label));
    if (visitor) {
      applyVisitor(visitor);
    }
  };

  apply();
  document.addEventListener("tidioChat-ready", apply);
  const api = readTidioChatApi();
  api?.on("ready", apply);
  api?.on("beforeOpen", apply);

  return () => {
    document.removeEventListener("tidioChat-ready", apply);
  };
}

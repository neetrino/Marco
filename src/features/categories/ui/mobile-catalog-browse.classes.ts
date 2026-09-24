/**
 * Mobile catalog browse overlay — Figma iPhone 16 & 17 Pro node 86:4391.
 * Design frame width 402; radii/spacing match exported layout.
 */

export const MOBILE_BROWSE_OVERLAY_CLASS =
  "fixed inset-0 z-[700] flex flex-col bg-white md:hidden";

export const MOBILE_BROWSE_SCROLL_CLASS =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-[17px] pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]";

export const MOBILE_BROWSE_CLOSE_WRAP_CLASS =
  "flex justify-end pt-[max(0.75rem,env(safe-area-inset-top))] px-[17px]";

export const MOBILE_BROWSE_CLOSE_BTN_CLASS =
  "flex size-[57px] shrink-0 items-center justify-center rounded-full bg-marco-gray text-marco-black transition-[filter,opacity] hover:brightness-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-slate/25";

export const MOBILE_BROWSE_SEARCH_FORM_CLASS =
  "relative mx-auto flex h-14 w-full max-w-[366px] items-center rounded-[200px] bg-marco-gray pl-6 pr-0";

export const MOBILE_BROWSE_SEARCH_INPUT_CLASS =
  "min-w-0 flex-1 bg-transparent text-sm text-marco-slate outline-none placeholder:text-[rgba(33,43,54,0.46)]";

export const MOBILE_BROWSE_SEARCH_SUBMIT_CLASS =
  "flex h-[54px] w-[155px] shrink-0 items-center justify-center rounded-bl-[30px] rounded-br-[89px] rounded-tl-[30px] rounded-tr-[89px] bg-marco-yellow text-sm font-semibold text-marco-black transition-[filter] hover:brightness-95 active:brightness-90";

export const MOBILE_BROWSE_CARD_GRID_CLASS =
  "mt-6 grid grid-cols-2 gap-2";

export const MOBILE_BROWSE_CARD_CLASS =
  "relative flex h-[248px] flex-col overflow-hidden rounded-[20px] text-left transition-[filter,transform] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-slate/25";

export const MOBILE_BROWSE_CARD_TITLE_CLASS =
  "relative z-10 px-3 pt-5 text-base font-semibold leading-normal text-[#101010]";

export const MOBILE_BROWSE_CARD_IMAGE_WRAP_CLASS =
  "pointer-events-none absolute inset-x-[-8%] bottom-[-6%] h-[78%]";

export const MOBILE_BROWSE_SECTIONS_CLASS =
  "mt-6 flex flex-col gap-4 pb-8";

export const MOBILE_BROWSE_SECTION_CLASS =
  "relative flex flex-col overflow-hidden rounded-[20px] bg-[#ececec] px-5 pb-4 pt-5";

export const MOBILE_BROWSE_SECTION_TITLE_CLASS =
  "shrink-0 text-lg font-semibold tracking-[0.18px] text-black";

export const MOBILE_BROWSE_SECTION_LIST_CLASS =
  "mt-3 flex flex-col gap-1 pr-1";

export const MOBILE_BROWSE_ROW_CLASS =
  "flex h-[54px] shrink-0 items-center gap-1 rounded-2xl pr-[7px] transition-colors hover:bg-black/[0.03] active:bg-black/[0.05]";

export const MOBILE_BROWSE_ROW_LABEL_CLASS =
  "min-w-0 flex-1 truncate text-base tracking-[0.16px] text-black/45";

export const MOBILE_BROWSE_ROW_EXPAND_CLASS =
  "flex size-9 shrink-0 items-center justify-center rounded-full text-black/45 transition-colors hover:bg-black/[0.05] hover:text-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-slate/25";

export const MOBILE_BROWSE_NESTED_LIST_CLASS = "flex flex-col gap-1";

export function mobileBrowseCardSurfaceClass(selected: boolean): string {
  return selected ? "bg-marco-yellow" : "bg-[#ececec]";
}

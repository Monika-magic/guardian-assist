export function sanitizePhoneNumber(phone: string) {
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  return cleaned.replace(/(?!^)\+/g, "");
}

export function buildTelHref(phone: string) {
  const recipient = sanitizePhoneNumber(phone);
  return recipient ? `tel:${recipient}` : "";
}

export function buildSmsHref(phone: string, message: string) {
  const recipient = sanitizePhoneNumber(phone);
  if (!recipient) return "";

  const isiOS =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isiOS ? "&" : "?";

  return `sms:${recipient}${separator}body=${encodeURIComponent(message)}`;
}

export function openNativeHref(href: string) {
  if (!href || typeof window === "undefined") return false;

  try {
    if (window.top && window.top !== window) {
      window.top.location.href = href;
      return true;
    }
  } catch {
    // Cross-origin iframe access can fail; fall back to current window.
  }

  window.location.href = href;
  return true;
}
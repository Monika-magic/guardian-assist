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

  const attempt = (run: () => void) => {
    try {
      run();
      return true;
    } catch {
      return false;
    }
  };

  if (attempt(() => {
    if (window.top && window.top !== window) {
      window.top.location.href = href;
      return;
    }
    throw new Error("top window unavailable");
  })) {
    return true;
  }

  if (attempt(() => window.open(href, "_self"))) {
    return true;
  }

  if (attempt(() => window.location.assign(href))) {
    return true;
  }

  return attempt(() => {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  });
}
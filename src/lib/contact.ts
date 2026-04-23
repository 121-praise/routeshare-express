// Single source of truth for support / help center contact.
export const SUPPORT_PHONE = "2347038863947";
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE}`;

export const waLinkFor = (phone: string, message?: string) => {
  const digits = phone.replace(/\D/g, "");
  // Assume Nigerian numbers; convert leading 0 to 234.
  const intl = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${intl}${q}`;
};

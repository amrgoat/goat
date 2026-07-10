/** All timestamps shown in the app must reflect IST (Asia/Kolkata), regardless of visitor timezone. */
const IST_TIMEZONE = "Asia/Kolkata";

export function formatISTDate(input: string | number | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return new Date(input).toLocaleDateString("en-IN", { timeZone: IST_TIMEZONE, ...opts });
}

export function formatISTTime(input: string | number | Date, opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }): string {
  return new Date(input).toLocaleTimeString("en-IN", { timeZone: IST_TIMEZONE, ...opts });
}

export function formatISTDateTime(input: string | number | Date): string {
  return `${formatISTDate(input)} ${formatISTTime(input)}`;
}

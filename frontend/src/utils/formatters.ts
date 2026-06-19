export function formatCurrency(value?: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(value ?? 0);
}

export function formatDate(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskDocument(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskCep(value: string): string {
  return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskMoneyInput(value: string): string {
  const digits = onlyDigits(value);
  const amount = Number(digits || "0") / 100;
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function parseMoney(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized || 0);
}

export function compactICCID(value?: string): string {
  if (!value) return "-";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)} ${value.slice(6, -4)} ${value.slice(-4)}`;
}

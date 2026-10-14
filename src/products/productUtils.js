
export function getAllBarcodes(product) {
  return [...new Set([
    product?.barcode,
    ...(Array.isArray(product?.barcodeAliases)
      ? product.barcodeAliases
      : []),
  ].map((value) => String(value || "").trim()).filter(Boolean))];
}

export function generateSku(products) {
  const used = new Set(
    products.map((product) => String(product.sku || "").toUpperCase())
  );

  let n = 1;

  while (used.has(`PRD-${String(n).padStart(3, "0")}`)) {
    n++;
  }

  return `PRD-${String(n).padStart(3, "0")}`;
}

export function ean13CheckDigit(firstTwelve) {
  const digits = String(firstTwelve).padStart(12, "0").slice(-12);

  const sum = digits.split("").reduce(
    (total, digit, index) =>
      total + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0
  );

  return String((10 - (sum % 10)) % 10);
}

export function generateBarcode(products) {
  const used = new Set(products.flatMap(getAllBarcodes));

  let n = 1;
  let candidate = "";

  do {
    const base = String(200000000000 + n).slice(-12);
    candidate = base + ean13CheckDigit(base);
    n++;
  } while (used.has(candidate));

  return candidate;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

export function makeBarcodePattern(value) {
  const text = String(value || "");
  let seed = 0;

  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }

  const bars = [];
  let x = 4;

  for (let i = 0; i < Math.max(40, text.length * 7); i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;

    const width = (seed & 3) === 0 ? 2 : 1;

    if (seed & 0x80000000) {
      bars.push({ x, width });
    }

    x += width + ((seed >>> 4) & 1) + 1;
  }

  return { bars, width: x + 4 };
}

export function getProfitPercent(price, cost) {
  const p = Number(price || 0);
  const c = Number(cost || 0);

  if (c <= 0) return "";

  return String(Number((((p - c) / c) * 100).toFixed(2)));
}

export function priceFromProfit(cost, profit) {
  const c = Number(cost || 0);
  const pct = Number(profit || 0);

  if (profit === "" || !Number.isFinite(pct)) return "";

  return String(Number((c * (1 + pct / 100)).toFixed(2)));
}

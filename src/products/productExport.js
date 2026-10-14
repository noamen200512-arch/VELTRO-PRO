
const COLUMNS = [
  ["name", "Product Name"],
  ["sku", "Reference"],
  ["barcode", "Barcode"],
  ["category", "Category"],
  ["purchasePrice", "Purchase Price"],
  ["price", "Retail Price"],
  ["wholesalePrice", "Wholesale Price"],
  ["cartonPrice", "Carton Price"],
  ["retailProfit", "Retail Profit (%)"],
  ["wholesaleProfit", "Wholesale Profit (%)"],
  ["cartonProfit", "Carton Profit (%)"],
  ["piecesPerCarton", "Pieces Per Carton"],
  ["stock", "Stock"],
  ["minStock", "Minimum Stock"],
  ["unit", "Unit"],
  ["barcodeAliases", "Additional Barcodes"],
];

function escapeCsv(value) {
  let text = "";

  if (Array.isArray(value)) {
    text = value.join(" | ");
  } else if (value !== null && value !== undefined) {
    text = String(value);
  }

  // Protect against spreadsheet formula injection.
  if (/^[\t\r ]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function productsToCsv(products = []) {
  const header = COLUMNS
    .map(([, label]) => escapeCsv(label))
    .join(",");

  const rows = products.map((product) =>
    COLUMNS
      .map(([key]) => escapeCsv(product?.[key]))
      .join(",")
  );

  // Help Excel display Arabic and French text correctly.
  return "\uFEFF" + [header, ...rows].join("\r\n");
}

export function downloadProductsCsv(
  products = [],
  filename = "veltro-products.csv"
) {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("CSV export is only available in a browser.");
  }

  const csv = productsToCsv(products);
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

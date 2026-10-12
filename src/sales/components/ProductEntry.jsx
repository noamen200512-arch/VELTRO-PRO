
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Barcode,
  Camera,
  Search,
  Plus,
  Package,
  ScanLine,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { getProducts } from "../../productStore.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getProductBarcodes(product) {
  return [
    product.barcode,
    ...(Array.isArray(product.barcodeAliases)
      ? product.barcodeAliases
      : []),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function findByBarcode(products, barcode) {
  const code = String(barcode ?? "").trim();

  if (!code) return null;

  return (
    products.find((product) =>
      getProductBarcodes(product).includes(code)
    ) ?? null
  );
}

export function ProductEntry({
  onAddProduct,
  showProducts = true,
  onShowProducts,
}) {
  const [products, setProducts] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [search, setSearch] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraSupported, setCameraSupported] = useState(true);
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanningRef = useRef(false);
  const busyRef = useRef(false);

  const loadProducts = useCallback((showMessage = false) => {
    setRefreshing(true);

    try {
      const stored = getProducts();
      const inventory = Array.isArray(stored) ? stored : [];

      setProducts(inventory);

      if (showMessage) {
        setNotice(`Inventory refreshed. ${inventory.length} product(s) loaded.`);
      }

      return inventory;
    } catch {
      if (showMessage) {
        setNotice("Could not refresh inventory. Please try again.");
      }

      return [];
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshProducts = useCallback(() => {
    loadProducts(true);
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();

    const handleFocus = () => loadProducts();

    const handleStorage = (event) => {
      if (
        !event.key ||
        event.key === "veltro_products"
      ) {
        loadProducts();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadProducts]);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setShowCamera(false);
  }, []);

  useEffect(() => {
    return () => {
      scanningRef.current = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const addFromInventory = useCallback(
    (product, quantity = 1) => {
      if (!product) return;

      const stock = Math.max(0, Number(product.stock) || 0);

      if (stock <= 0) {
        setNotice(`${product.name}: Out of stock.`);
        return;
      }

      onAddProduct?.({
        ...product,
        quantity,
        price: Math.max(0, Number(product.price) || 0),
        barcode: String(product.barcode || "").trim(),
      });

      setNotice(`${product.name} selected.`);
      setBarcode("");
      setSearch("");
    },
    [onAddProduct]
  );

  const submitBarcode = useCallback(
    (rawValue) => {
      const code = String(rawValue ?? "").trim();

      if (!code || busyRef.current) return;

      busyRef.current = true;

      try {
        // Read the latest inventory before looking up the barcode.
        const latestProducts = loadProducts();
        const product = findByBarcode(latestProducts, code);

        if (product) {
          addFromInventory(product, 1);
        } else {
          setNotice(`No product found for barcode: ${code}`);
          setBarcode(code);
        }
      } finally {
        busyRef.current = false;
      }
    },
    [loadProducts, addFromInventory]
  );

  const filteredProducts = search.trim()
    ? products
        .filter((product) => {
          const term = normalize(search);

          return (
            normalize(product.name).includes(term) ||
            normalize(product.sku).includes(term) ||
            normalize(product.id).includes(term) ||
            normalize(product.barcode).includes(term) ||
            getProductBarcodes(product).some((code) =>
              normalize(code).includes(term)
            )
          );
        })
        .slice(0, 30)
    : [];

  const startCamera = async () => {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable. Use HTTPS or enter the barcode manually."
      );
      setShowCamera(true);
      return;
    }

    if (!("BarcodeDetector" in window)) {
      setCameraSupported(false);
      setCameraError(
        "This browser does not support automatic barcode detection. Enter the barcode manually."
      );
      setShowCamera(true);
      return;
    }

    setCameraSupported(true);

    try {
      const detector = new window.BarcodeDetector({
        formats: [
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "code_128",
          "code_39",
          "itf",
          "qr_code",
        ],
      });

      detectorRef.current = detector;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;
      setShowCamera(true);

      requestAnimationFrame(async () => {
        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        try {
          await videoRef.current.play();
        } catch {
          setCameraError("Unable to start the camera preview.");
          return;
        }

        scanningRef.current = true;

        const scanFrame = async () => {
          if (
            !scanningRef.current ||
            !videoRef.current ||
            !detectorRef.current
          ) {
            return;
          }

          try {
            const codes = await detectorRef.current.detect(
              videoRef.current
            );

            if (codes.length > 0 && codes[0].rawValue) {
              scanningRef.current = false;
              const value = codes[0].rawValue;
              stopCamera();
              submitBarcode(value);
              return;
            }
          } catch {
            // Continue scanning if a frame cannot be decoded.
          }

          if (scanningRef.current) {
            requestAnimationFrame(scanFrame);
          }
        };

        requestAnimationFrame(scanFrame);
      });
    } catch {
      setCameraError(
        "Could not access the camera. Check browser permissions and try again."
      );
      setShowCamera(true);
    }
  };

  const toggleProducts = () => {
    const nextValue = !showProducts;

    onShowProducts?.(nextValue);

    if (nextValue) {
      loadProducts();
    }
  };

  return (
    <section className="product-entry">
      <div className="product-entry-header">
        <div>
          <h2>Product Entry</h2>
          <p>Find products in your current inventory</p>
        </div>

        <button
          type="button"
          className="product-camera-button"
          onClick={startCamera}
        >
          <Camera size={18} />
          <span>Scan with Camera</span>
        </button>
      </div>

      {/* Barcode entry stays available even when product search is hidden. */}
      <div className="product-entry-barcode">
        <label className="product-entry-label" htmlFor="product-barcode">
          <Barcode size={17} />
          Barcode
        </label>

        <form
          className="product-barcode-field"
          onSubmit={(event) => {
            event.preventDefault();
            submitBarcode(barcode);
          }}
        >
          <ScanLine size={22} />

          <input
            id="product-barcode"
            type="text"
            autoComplete="off"
            placeholder="Scan or enter barcode, then press Enter..."
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
          />

          {barcode && (
            <button
              type="button"
              className="product-clear-button"
              aria-label="Clear barcode"
              onClick={() => setBarcode("")}
            >
              <X size={17} />
            </button>
          )}

          <button type="submit" className="product-add-button">
            <Plus size={18} />
            Add
          </button>
        </form>
      </div>

      {showProducts && (
        <>
          <div className="product-entry-fields">
            <div className="product-entry-field product-search-field">
              <label htmlFor="product-search">
                <Search size={16} />
                Search Product
              </label>

              <div className="product-input-wrapper">
                <Search size={17} />

                <input
                  id="product-search"
                  type="search"
                  autoComplete="off"
                  placeholder="Search by name, reference or barcode..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
          </div>

          {search.trim() && (
            <div className="product-search-results">
              <div className="product-search-results-header">
                <strong>Search Results</strong>
                <span>{filteredProducts.length} found</span>
              </div>

              {filteredProducts.length === 0 ? (
                <p className="product-search-empty">
                  No matching products found in your inventory.
                </p>
              ) : (
                <div className="product-search-list">
                  {filteredProducts.map((product) => {
                    const stock = Math.max(
                      0,
                      Number(product.stock) || 0
                    );

                    return (
                      <button
                        type="button"
                        className="product-search-result"
                        key={product.id}
                        disabled={stock <= 0}
                        onClick={() => addFromInventory(product, 1)}
                      >
                        <span className="product-search-result-icon">
                          <Package size={19} />
                        </span>

                        <span className="product-search-result-info">
                          <strong>{product.name}</strong>
                          <small>
                            Ref: {product.sku || product.id}
                            {product.barcode
                              ? ` · Barcode: ${product.barcode}`
                              : ""}
                          </small>
                        </span>

                        <span className="product-search-result-stock">
                          <strong>
                            {(Number(product.price) || 0).toLocaleString()} DA
                          </strong>
                          <small>
                            {stock > 0 ? `${stock} in stock` : "Out of stock"}
                          </small>
                        </span>

                        <Plus size={18} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {notice && (
        <div className="product-entry-notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="product-entry-footer">
        <div className="product-entry-hint">
          <Package size={16} />
          <span>
            Products and prices are loaded from your inventory.
          </span>
        </div>

        <div className="product-entry-footer-actions">
          <button
            type="button"
            className="product-show-button"
            onClick={toggleProducts}
            aria-expanded={showProducts}
          >
            {showProducts ? (
              <>
                <ChevronUp size={15} />
                Hide Products
              </>
            ) : (
              <>
                <ChevronDown size={15} />
                Show Products
              </>
            )}
          </button>

          <button
            type="button"
            className="product-show-button"
            onClick={refreshProducts}
            disabled={refreshing}
            title="Reload inventory"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "product-refresh-spinning" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {showCamera && (
        <div
          className="product-camera-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Barcode scanner"
        >
          <div className="product-camera-dialog">
            <div className="product-camera-dialog-header">
              <div>
                <h3>Scan Barcode</h3>
                <p>Point your camera at the product barcode.</p>
              </div>

              <button
                type="button"
                className="product-clear-button"
                aria-label="Close camera"
                onClick={stopCamera}
              >
                <X size={20} />
              </button>
            </div>

            {cameraSupported && (
              <video
                ref={videoRef}
                className="product-camera-video"
                playsInline
                muted
              />
            )}

            {cameraError && (
              <p className="product-camera-error">{cameraError}</p>
            )}

            <button
              type="button"
              className="product-camera-button"
              onClick={stopCamera}
            >
              Close Scanner
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProductEntry;

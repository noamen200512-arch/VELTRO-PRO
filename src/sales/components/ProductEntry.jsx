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
  ChevronLeft,
  ChevronRight,
  Check,
  SlidersHorizontal,
  Boxes,
  AlertTriangle,
} from "lucide-react";

import { getProducts, saveProducts } from "../../productStore.js";
import { loadProductsFromCloud } from "../../lib/productCloud.js";

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

function formatMoney(value) {
  return `${(Number(value) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DA`;
}

export function ProductEntry({
  onAddProduct,
  onAddCarton,
  showProducts = true,
  onShowProducts,
}) {
  const [products, setProducts] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 15;
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
  const refreshTimerRef = useRef(null);

  const loadProducts = useCallback((showMessage = false) => {
    try {
      const stored = getProducts();
      const inventory = Array.isArray(stored) ? stored : [];

      setProducts(inventory);

      if (showMessage) {
        setNotice(
          `Inventory refreshed. ${inventory.length} product(s) loaded.`
        );
      }

      return inventory;
    } catch {
      if (showMessage) {
        setNotice("Could not refresh inventory. Please try again.");
      }

      return [];
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    setRefreshing(true);

    try {
      const cloudProducts = await loadProductsFromCloud(getProducts());
      if (!saveProducts(cloudProducts)) {
        throw new Error("Could not update the local product cache.");
      }

      setProducts(cloudProducts);
      setNotice(`Inventory refreshed from cloud. ${cloudProducts.length} product(s) loaded.`);
    } catch (error) {
      console.warn("Cloud inventory refresh unavailable:", error);
      loadProducts();
      setNotice("Cloud refresh failed. Showing products saved on this device.");
    } finally {
      setRefreshing(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    let active = true;

    // Show the local cache immediately, then replace it with the latest
    // organization inventory from Supabase when the cloud is reachable.
    loadProducts();

    const syncCloudProducts = async () => {
      try {
        const cloudProducts = await loadProductsFromCloud(getProducts());
        if (!active) return;

        if (!saveProducts(cloudProducts)) {
          throw new Error("Could not update the local product cache.");
        }

        setProducts(cloudProducts);
      } catch (error) {
        if (!active) return;
        console.warn("Cloud inventory load unavailable; keeping local products:", error);
        loadProducts();
        setNotice("Cloud sync unavailable. Showing products saved on this device.");
      }
    };

    syncCloudProducts();

    const handleFocus = () => {
      loadProducts();
      syncCloudProducts();
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === "veltro_products") {
        loadProducts();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);

      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
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

      if (typeof onAddProduct !== "function") {
        setNotice("Unable to add product. Please check the sales page.");
        return;
      }

      onAddProduct({
        ...product,
        quantity,
        price: Math.max(0, Number(product.price) || 0),
        barcode: String(product.barcode || "").trim(),
      });

      setNotice(`${product.name} selected.`);
      setBarcode("");
      setSearch("");
      setCurrentPage(1);
    },
    [onAddProduct]
  );

  const submitBarcode = useCallback(
    (rawValue) => {
      const code = String(rawValue ?? "").trim();

      if (!code || busyRef.current) return;

      busyRef.current = true;

      try {
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

  const categories = [...new Set(
    products.map((product) => String(product.category ?? "").trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "fr"));

  const filteredProducts = products.filter((product) => {
    const term = normalize(search);
    const matchesCategory = selectedCategory === "all" ||
      normalize(product.category) === normalize(selectedCategory);
    if (!matchesCategory) return false;
    if (!term) return true;
    return (
      normalize(product.name).includes(term) ||
      normalize(product.sku).includes(term) ||
      normalize(product.id).includes(term) ||
      normalize(product.category).includes(term) ||
      normalize(product.barcode).includes(term) ||
      getProductBarcodes(product).some((code) => normalize(code).includes(term))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

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
            // Continue scanning when a frame cannot be decoded.
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

      {/* Search remains visible even when the inventory list is hidden. */}
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
              placeholder="Search by name, reference, category or barcode..."
              value={search}
              onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            />

            {search && (
              <button
                type="button"
                className="product-clear-button"
                aria-label="Clear product search"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* The toggle controls the full inventory list only. */}
      {showProducts && (
        <div className="product-search-results product-inventory-list">
          <div className="product-search-results-header">
            <div className="product-inventory-heading">
              <Boxes size={17} />
              <strong>
                {search.trim() ? "Search Results" : selectedCategory === "all" ? "All Products" : selectedCategory}
              </strong>
            </div>

            <span>
              {`${filteredProducts.length} of ${products.length} products`}
            </span>
          </div>

          <div className="product-inventory-filters">
            <div className="product-category-filter-label">
              <SlidersHorizontal size={15} />
              <span>Category</span>
            </div>
            <button
              type="button"
              className="product-category-picker-trigger"
              aria-haspopup="dialog"
              aria-expanded={categoryPickerOpen}
              onClick={() => {
                setCategorySearch("");
                setCategoryPickerOpen(true);
              }}
            >
              <span className="product-category-picker-current">
                <small>Selected category</small>
                <strong>{selectedCategory === "all" ? "All categories" : selectedCategory}</strong>
              </span>
              <ChevronDown size={17} />
            </button>
          </div>

          {categoryPickerOpen && (
            <div className="product-category-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setCategoryPickerOpen(false);
              }}>
              <section className="product-category-modal" role="dialog" aria-modal="true" aria-labelledby="product-category-modal-title">
                <header className="product-category-modal-header">
                  <div className="product-category-modal-icon"><SlidersHorizontal size={20} /></div>
                  <div>
                    <h3 id="product-category-modal-title">Choose a category</h3>
                    <p>Filter the product list by category</p>
                  </div>
                  <button type="button" className="product-category-modal-close" aria-label="Close categories" onClick={() => setCategoryPickerOpen(false)}>
                    <X size={19} />
                  </button>
                </header>

                <div className="product-category-modal-search">
                  <Search size={17} />
                  <input
                    type="search"
                    autoFocus
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                  />
                  {categorySearch && (
                    <button type="button" aria-label="Clear category search" onClick={() => setCategorySearch("")}><X size={15} /></button>
                  )}
                </div>

                <div className="product-category-modal-list">
                  {[
                    { value: "all", label: "All categories", count: products.length },
                    ...categories.map((category) => ({
                      value: category,
                      label: category,
                      count: products.filter((product) => normalize(product.category) === normalize(category)).length
                    }))
                  ].filter((category) => normalize(category.label).includes(normalize(categorySearch)))
                    .map((category) => {
                      const selected = selectedCategory === category.value;
                      return (
                        <button type="button" key={category.value}
                          className={selected ? "product-category-option selected" : "product-category-option"}
                          onClick={() => {
                            setSelectedCategory(category.value);
                            setCurrentPage(1);
                            setCategoryPickerOpen(false);
                          }}>
                          <span className="product-category-option-main">
                            <span className="product-category-option-symbol"><Boxes size={16} /></span>
                            <span><strong>{category.label}</strong><small>{category.count} products</small></span>
                          </span>
                          {selected ? <Check size={18} /> : <span className="product-category-option-radio" />}
                        </button>
                      );
                    })}
                  {![{ value: "all", label: "All categories" }, ...categories.map((category) => ({ value: category, label: category }))]
                    .some((category) => normalize(category.label).includes(normalize(categorySearch))) && (
                      <div className="product-category-no-results">
                        <Search size={22} />
                        <strong>No categories found</strong>
                        <span>Try a different search.</span>
                      </div>
                    )}
                </div>

                <footer className="product-category-modal-footer">
                  <span>{categories.length} categories available</span>
                  <button type="button" onClick={() => {
                    setSelectedCategory("all");
                    setCurrentPage(1);
                    setCategoryPickerOpen(false);
                  }}>Show all products</button>
                </footer>
              </section>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="product-search-empty">
              {products.length === 0 ? (
                <>
                  <Package size={24} />
                  <p>No products found in your inventory.</p>
                  <span>Try refreshing the inventory.</span>
                </>
              ) : (
                <>
                  <Search size={24} />
                  <p>No matching products found.</p>
                  <span>Try another name, reference or barcode.</span>
                </>
              )}
            </div>
          ) : (
            <div className="product-search-list">
              {visibleProducts.map((product) => {
                const stock = Math.max(
                  0,
                  Number(product.stock) || 0
                );

                const lowStock =
                  stock > 0 &&
                  stock <= Math.max(0, Number(product.minStock) || 0);

                const cartonSize = Math.max(1, Math.floor(Number(product.piecesPerCarton) || 1));
                return (
                  <div className="product-search-result" key={product.id}>
                    <span className="product-search-result-icon">
                      {product.image ? (
                        <img src={product.image} alt="" className="product-search-product-image" />
                      ) : (
                        <Package size={19} />
                      )}
                    </span>

                    <button
                      type="button"
                      className="product-search-result-main"
                      disabled={stock <= 0}
                      onClick={() => addFromInventory(product, 1)}
                      title={stock <= 0 ? "This product is out of stock" : `Add ${product.name} to invoice`}
                    >
                      <span className="product-search-result-info">
                        <strong>{product.name || "Unnamed product"}</strong>
                        <small>Ref: {product.sku || product.id || "—"}{product.category ? ` · ${product.category}` : ""}</small>
                        {product.barcode && <small>Barcode: {product.barcode}</small>}
                      </span>

                      <span className="product-search-result-stock">
                        <strong>{formatMoney(product.price)}</strong>
                        <small className={stock <= 0 ? "product-stock-out" : lowStock ? "product-stock-low" : ""}>
                          {stock <= 0 ? "Out of stock" : `${stock} in stock`}
                        </small>
                      </span>
                    </button>

                    <div className="product-search-result-actions">
                      <button
                        type="button"
                        className="product-carton-button"
                        disabled={cartonSize <= 1 || stock < cartonSize || typeof onAddCarton !== "function"}
                        onClick={() => onAddCarton(product)}
                        title={cartonSize <= 1 ? "Configure pieces per carton for this product" : `Add one carton (${cartonSize} units)`}
                      >
                        <Boxes size={15} />
                        <span>Carton</span>
                        <small>{cartonSize > 1 ? `${cartonSize} pcs` : "Not set"}</small>
                      </button>
                      <button
                        type="button"
                        className="product-unit-add-button"
                        disabled={stock <= 0}
                        onClick={() => addFromInventory(product, 1)}
                        title={stock <= 0 ? "Out of stock" : "Add one unit"}
                        aria-label={`Add one unit of ${product.name}`}
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div className="product-inventory-pagination" aria-label="Product pages">
              <span className="product-pagination-summary">
                {`Showing ${pageStart + 1}–${Math.min(pageStart + PRODUCTS_PER_PAGE, filteredProducts.length)} of ${filteredProducts.length}`}
              </span>
              <div className="product-pagination-controls">
                <button type="button" aria-label="Previous page" disabled={safePage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((page) => page === 1 || page === totalPages || Math.abs(page - safePage) <= 1)
                  .map((page, index, pages) => (
                    <React.Fragment key={page}>
                      {index > 0 && page - pages[index - 1] > 1 && <span className="product-pagination-ellipsis">…</span>}
                      <button type="button" className={page === safePage ? "active" : ""}
                        aria-current={page === safePage ? "page" : undefined}
                        onClick={() => setCurrentPage(page)}>{page}</button>
                    </React.Fragment>
                  ))}
                <button type="button" aria-label="Next page" disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
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
            {`${products.length} products loaded from your inventory.`}
          </span>
        </div>

        <div className="product-entry-footer-actions">
          <button
            type="button"
            className="product-show-button product-toggle-button"
            onClick={toggleProducts}
            aria-expanded={showProducts}
            title={showProducts ? "Hide product list" : "Show product list"}
          >
            {showProducts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{showProducts ? "Hide Products" : "Show Products"}</span>
          </button>

          <button
            type="button"
            className="product-refresh-button"
            onClick={refreshProducts}
            disabled={refreshing}
            title="Reload inventory"
            aria-label={refreshing ? "Refreshing inventory" : "Refresh inventory"}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "product-refresh-spinning" : ""}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
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


import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Plus,
  Barcode,
  Camera,
  Package,
  ScanLine,
  RefreshCw,
} from "lucide-react";
import { getProducts } from "../../productStore.js";
import "./EditInvoiceProductPicker.css";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getProductBarcodes(product) {
  const values = [
    product?.barcode,
    product?.barCode,
    product?.codebar,
    product?.codeBar,
    product?.reference,
    product?.ref,
    ...(Array.isArray(product?.barcodes) ? product.barcodes : []),
    ...(Array.isArray(product?.barcodeAliases) ? product.barcodeAliases : []),
    ...(Array.isArray(product?.extraBarcodes)
      ? product.extraBarcodes
      : []),
  ];

  return values
    .filter((value) => value !== null && value !== undefined)
    .map(String);
}

function getProductName(product) {
  return (
    product?.name ||
    product?.productName ||
    product?.designation ||
    product?.label ||
    "Produit sans nom"
  );
}

function getProductPrice(product) {
  const price =
    product?.salePrice ??
    product?.sellingPrice ??
    product?.sellPrice ??
    product?.price ??
    product?.priceSale ??
    0;

  return Number(price) || 0;
}

function getProductStock(product) {
  const stock =
    product?.quantity ??
    product?.stock ??
    product?.qty ??
    product?.currentStock;

  return stock === undefined || stock === null ? null : Number(stock);
}

export default function EditInvoiceProductPicker({
  onSelect,
  onClose,
}) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const detectorRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    try {
      const result = getProducts();
      setProducts(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Unable to load products:", error);
      setProducts([]);
    }

    searchRef.current?.focus();

    return () => {
      stopCamera();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = normalize(search);

    if (!query) return products;

    return products.filter((product) => {
      const searchableValues = [
        getProductName(product),
        product?.reference,
        product?.ref,
        product?.barcode,
        product?.barCode,
        product?.codebar,
        product?.codeBar,
        ...(Array.isArray(product?.barcodes) ? product.barcodes : []),
        ...(Array.isArray(product?.barcodeAliases) ? product.barcodeAliases : []),
        ...(Array.isArray(product?.extraBarcodes)
          ? product.extraBarcodes
          : []),
      ];

      return searchableValues.some((value) =>
        normalize(value).includes(query)
      );
    });
  }, [products, search]);

  function stopCamera() {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    detectorRef.current = null;
    setScanning(false);
    setCameraOpen(false);
  }

  function selectProduct(product) {
    if (!product) return;

    if (typeof onSelect === "function") {
      onSelect(product.id ?? product.productId ?? product._id ?? product);
    }

    stopCamera();
    onClose?.();
  }

  async function startCamera() {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable. Check that the site uses HTTPS or enter the barcode manually."
      );
      return;
    }

    detectorRef.current = null;
    if ("BarcodeDetector" in window) {
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"],
        });
      } catch (error) {
        console.warn("Barcode detection is not supported for the selected formats:", error);
      }
    } else {
      setCameraError("Camera preview is available, but automatic barcode reading is not supported by this browser. Enter the barcode in the search field.");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);

      // Wait until React has mounted the video element before attaching the stream.
      window.requestAnimationFrame(async () => {
        const video = videoRef.current;
        if (!video || streamRef.current !== stream) return;
        video.srcObject = stream;
        try {
          await video.play();
        } catch (error) {
          console.error("Camera preview playback failed:", error);
          setCameraError("Camera opened but preview could not start. Check browser permissions and retry.");
          setScanning(false);
          return;
        }

        if (detectorRef.current) {
          setScanning(true);
          scanFrame();
        } else {
          setScanning(false);
        }
      });
    } catch (error) {
      console.error("Camera error:", error);
      stopCamera();
      setCameraError("Unable to open the camera. Allow camera access in your browser settings, then retry.");
    }
  }

  async function scanFrame() {
    if (!detectorRef.current || !videoRef.current || !streamRef.current) return;

    try {
      const video = videoRef.current;

      if (video.readyState >= 2) {
        const codes = await detectorRef.current.detect(video);

        if (codes.length > 0 && codes[0].rawValue) {
          const value = codes[0].rawValue;
          setSearch(value);

          const normalizedCode = normalize(value);

          const match = products.find((product) =>
            getProductBarcodes(product).some(
              (barcode) => normalize(barcode) === normalizedCode
            )
          );

          if (match) {
            selectProduct(match);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Barcode scan error:", error);
    }

    scanTimerRef.current = setTimeout(scanFrame, 300);
  }

  function formatPrice(price) {
    return `${price.toLocaleString("fr-FR")} DA`;
  }

  return (
    <div
      className="edit-product-picker-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="edit-product-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-picker-title"
      >
        <header className="edit-product-picker-header">
          <div className="edit-product-picker-heading">
            <span className="edit-product-picker-icon">
              <Package size={21} />
            </span>

            <div>
              <h2 id="edit-product-picker-title">
                Add a product
              </h2>
              <p>Search and select a product</p>
            </div>
          </div>

          <button
            type="button"
            className="edit-product-picker-close"
            onClick={() => {
              stopCamera();
              onClose?.();
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="edit-product-picker-search-row">
          <div className="edit-product-picker-search">
            <Search size={19} />

            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, barcode or reference..."
              autoComplete="off"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="edit-product-picker-camera-button"
            onClick={cameraOpen ? stopCamera : startCamera}
          >
            {cameraOpen ? <X size={18} /> : <Camera size={18} />}
            <span>{cameraOpen ? "Close camera" : "Scan barcode"}</span>
          </button>
        </div>

        {cameraError && (
          <div className="edit-product-picker-camera-error">
            {cameraError}
          </div>
        )}

        {cameraOpen && (
          <div className="edit-product-picker-camera-panel">
            <div className="edit-product-picker-video-wrap">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
              />

              {scanning && (
                <div className="edit-product-picker-scan-line">
                  <ScanLine size={28} />
                  <span>Place the barcode in front of the camera</span>
                </div>
              )}
            </div>

            {!scanning && (
              <p>
                If automatic scanning is unavailable, search for the barcode in the field above.
              </p>
            )}

            <button
              type="button"
              className="edit-product-picker-secondary-button"
              onClick={() => {
                stopCamera();
                startCamera();
              }}
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        )}

        <div className="edit-product-picker-list-heading">
          <span>Product list</span>
          <span>{filteredProducts.length} products</span>
        </div>

        <div className="edit-product-picker-list">
          {filteredProducts.length === 0 ? (
            <div className="edit-product-picker-empty">
              <Package size={34} />
              <strong>No products found</strong>
              <p>Try another name, barcode or reference.</p>
            </div>
          ) : (
            filteredProducts.map((product, index) => {
              const id =
                product.id ??
                product.productId ??
                product._id ??
                index;

              const name = getProductName(product);
              const price = getProductPrice(product);
              const stock = getProductStock(product);
              const reference =
                product.reference ||
                product.ref ||
                getProductBarcodes(product)[0] ||
                "—";

              return (
                <button
                  type="button"
                  className="edit-product-picker-item"
                  key={id}
                  onClick={() => selectProduct(product)}
                >
                  <span className="edit-product-picker-item-icon">
                    <Package size={20} />
                  </span>

                  <span className="edit-product-picker-item-info">
                    <strong>{name}</strong>
                    <small>Ref: {reference}</small>
                    {stock !== null && (
                      <small>
                        Stock: {Number.isFinite(stock) ? stock : 0}
                      </small>
                    )}
                  </span>

                  <span className="edit-product-picker-item-right">
                    <strong>{formatPrice(price)}</strong>
                    <span className="edit-product-picker-add">
                      <Plus size={17} />
                      Add
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        <footer className="edit-product-picker-footer">
          <span>
            <Barcode size={16} />
            Search by name, reference or barcode
          </span>

          <button
            type="button"
            className="edit-product-picker-cancel"
            onClick={() => {
              stopCamera();
              onClose?.();
            }}
          >
            Cancel
          </button>
        </footer>
      </section>
    </div>
  );
}

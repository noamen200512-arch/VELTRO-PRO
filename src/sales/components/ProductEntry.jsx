import React, { useState } from "react";
import {
  Barcode,
  Camera,
  Search,
  Plus,
  Package,
  ScanLine,
  X,
} from "lucide-react";

export function ProductEntry({
  onAddProduct,
  showProducts,
  onShowProducts,
}) {
  const [barcode, setBarcode] = useState("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleAdd = (event) => {
    event.preventDefault();

    const name = productName.trim();
    const numericPrice = Number(price);
    const numericQuantity = Number(quantity);

    if (!name) {
      alert("Please enter a product name.");
      return;
    }

    if (
      price === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      alert("Please enter a valid unit price.");
      return;
    }

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      alert("Please enter a valid quantity.");
      return;
    }

    onAddProduct?.({
      name,
      barcode: barcode.trim(),
      price: numericPrice,
      quantity: numericQuantity,
    });

    setBarcode("");
    setProductName("");
    setPrice("");
    setQuantity("1");
  };

  return (
    <section className="product-entry">
      <div className="product-entry-header">
        <div>
          <h2>Product Entry</h2>
          <p>Scan a barcode or enter product details</p>
        </div>

        <button
          type="button"
          className="product-camera-button"
          onClick={() =>
            alert(
              "Camera barcode scanning will be implemented in a later step."
            )
          }
        >
          <Camera size={18} />
          <span>Scan with Camera</span>
        </button>
      </div>

      <form onSubmit={handleAdd}>
        <label
          className="product-entry-label"
          htmlFor="product-barcode"
        >
          <Barcode size={17} />
          Barcode
        </label>

        <div className="product-barcode-field">
          <ScanLine size={22} />

          <input
            id="product-barcode"
            type="text"
            placeholder="Scan or enter barcode..."
            value={barcode}
            onChange={(event) =>
              setBarcode(event.target.value)
            }
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
        </div>

        <div className="product-entry-fields">
          <div className="product-entry-field">
            <label htmlFor="product-name">
              Product Name
            </label>

            <div className="product-input-wrapper">
              <Search size={17} />

              <input
                id="product-name"
                type="text"
                placeholder="Enter product name"
                value={productName}
                onChange={(event) =>
                  setProductName(event.target.value)
                }
              />
            </div>
          </div>

          <div className="product-entry-field">
            <label htmlFor="product-price">
              Unit Price (DA)
            </label>

            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(event) =>
                setPrice(event.target.value)
              }
              required
            />
          </div>

          <div className="product-entry-field">
            <label htmlFor="product-quantity">
              Quantity
            </label>

            <input
              id="product-quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              required
            />
          </div>

          <button
            type="submit"
            className="product-add-button"
          >
            <Plus size={19} />
            Add Product
          </button>
        </div>
      </form>

      <div className="product-entry-footer">
        <div className="product-entry-hint">
          <Package size={16} />

          <span>
            Scan a barcode or enter product information manually.
          </span>
        </div>

        <button
          type="button"
          className="product-show-button"
          onClick={() =>
            onShowProducts?.(!showProducts)
          }
        >
          {showProducts ? "Hide Products" : "Show Products"}
        </button>
      </div>
    </section>
  );
}

export default ProductEntry;

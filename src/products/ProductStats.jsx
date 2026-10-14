
import React from "react";
import {
  Package,
  Boxes,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const COLORS = {
  panel: "#0D1525",
  border: "rgba(148,163,184,0.14)",
  text: "#F1F5F9",
  muted: "#8795AC",
  cyan: "#35D6D0",
  violet: "#9B8AFB",
  orange: "#FBBF24",
  green: "#34D399",
};

function StatCard({ icon: Icon, label, value, color, note }) {
  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 16,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ color: COLORS.muted, fontSize: 12 }}>
          {label}
        </span>

        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${color}18`,
            display: "grid",
            placeItems: "center",
            color,
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </span>
      </div>

      <div
        style={{
          color: COLORS.text,
          fontSize: "clamp(16px, 1.55vw, 22px)",
          lineHeight: 1.25,
          letterSpacing: "-0.45px",
          fontWeight: 750,
          marginTop: 12,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: COLORS.muted,
          fontSize: 11,
          marginTop: 6,
        }}
      >
        {note}
      </div>
    </div>
  );
}

export default function ProductStats({ stats, money }) {
  const cards = [
    {
      icon: Package,
      label: "Total Products",
      value: stats.count,
      color: COLORS.cyan,
      note: "Products in your catalog",
    },
    {
      icon: Boxes,
      label: "Units in Stock",
      value: Number(stats.totalUnits || 0).toLocaleString("fr-FR"),
      color: COLORS.violet,
      note: "Combined available quantity",
    },
    {
      icon: AlertTriangle,
      label: "Low Stock",
      value: stats.lowStock,
      color: COLORS.orange,
      note: "At or below minimum stock",
    },
    {
      icon: TrendingUp,
      label: "Stock Cost Value",
      value: money(stats.purchaseValue),
      color: COLORS.green,
      note: "Estimated purchase value",
    },
  ];

  return (
    <div
      className="veltro-products-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 14,
        marginBottom: 22,
      }}
    >
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

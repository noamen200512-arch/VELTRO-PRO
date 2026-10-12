
import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Boxes,
  CreditCard,
  CircleHelp,
  ChevronDown,
  Zap,
  CalendarDays,
  Plus,
  Download,
  Filter,
  Clock,
  CheckCircle2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  History,
  ReceiptText,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

import POS from "./POS";
import Products from "./Products.jsx";

const salesData = [
  { day: "Mon", sales: 24000, orders: 120 },
  { day: "Tue", sales: 32000, orders: 145 },
  { day: "Wed", sales: 28000, orders: 132 },
  { day: "Thu", sales: 45000, orders: 190 },
  { day: "Fri", sales: 38000, orders: 165 },
  { day: "Sat", sales: 52000, orders: 220 },
  { day: "Sun", sales: 61000, orders: 245 },
];

const products = [
  {
    id: 1,
    name: "Premium Coffee",
    category: "Beverages",
    sku: "PRD-001",
    stock: 245,
    price: 450,
    status: "In Stock",
  },
  {
    id: 2,
    name: "Mineral Water",
    category: "Drinks",
    sku: "PRD-002",
    stock: 18,
    price: 80,
    status: "Low Stock",
  },
  {
    id: 3,
    name: "Chocolate Biscuits",
    category: "Snacks",
    sku: "PRD-003",
    stock: 156,
    price: 120,
    status: "In Stock",
  },
  {
    id: 4,
    name: "Orange Juice",
    category: "Beverages",
    sku: "PRD-004",
    stock: 0,
    price: 180,
    status: "Out of Stock",
  },
  {
    id: 5,
    name: "Potato Chips",
    category: "Snacks",
    sku: "PRD-005",
    stock: 82,
    price: 100,
    status: "In Stock",
  },
];

const navGroups = [
  {
    title: "GENERAL",
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Settings", icon: Settings },
    ],
  },
  {
    title: "COMMERCE",
    items: [
      { label: "Point of Sale", icon: ShoppingCart },
      { label: "Sales History", icon: History },
      { label: "Products", icon: Package },
      { label: "Categories", icon: Boxes },
      { label: "Purchases", icon: CreditCard },
      { label: "Orders", icon: ShoppingCart },
      { label: "Suppliers", icon: Truck },
      { label: "Customers", icon: Users },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { label: "Cash Register", icon: Wallet },
      { label: "Reports", icon: BarChart3 },
    ],
  },
];

const activities = [
  {
    title: "New order received",
    detail: "Order #ORD-1048",
    time: "5 minutes ago",
    icon: ShoppingCart,
    color: "purple",
  },
  {
    title: "Stock updated",
    detail: "Premium Coffee",
    time: "18 minutes ago",
    icon: Package,
    color: "cyan",
  },
  {
    title: "Payment completed",
    detail: "Order #ORD-1047",
    time: "32 minutes ago",
    icon: CreditCard,
    color: "green",
  },
  {
    title: "New customer added",
    detail: "Customer registration",
    time: "1 hour ago",
    icon: Users,
    color: "orange",
  },
];

function formatMoney(value) {
  return `${Number(value).toLocaleString("fr-DZ")} DA`;
}

function StatCard({
  title,
  value,
  change,
  positive = true,
  icon: Icon,
  accent = "cyan",
  subtitle,
}) {
  return (
    <article className={`stat-card accent-${accent}`}>
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={21} strokeWidth={1.8} />
        </div>

        <button
          className="icon-button"
          type="button"
          aria-label="More options"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      <p className="stat-title">{title}</p>

      <div className="stat-value-row">
        <h2>{value}</h2>

        <span
          className={`change-badge ${
            positive ? "positive" : "negative"
          }`}
        >
          {positive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {change}
        </span>
      </div>

      <p className="stat-subtitle">
        {subtitle || "Compared to last month"}
      </p>
    </article>
  );
}

function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onClose,
}) {
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-symbol">
            <Zap size={23} fill="currentColor" />
          </div>

          <div className="brand-text">
            <h2>VELTRO</h2>
            <span>BUSINESS SUITE</span>
          </div>

          <button
            className="mobile-close icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-workspace">
          <div className="workspace-avatar">V</div>

          <div className="workspace-info">
            <strong>My Business</strong>
            <span>Business workspace</span>
          </div>

          <ChevronDown size={16} />
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-group-title">{group.title}</p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.label;

                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`nav-item ${
                      active ? "active" : ""
                    }`}
                    onClick={() => {
                      onNavigate(item.label);
                      onClose();
                    }}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    <span>{item.label}</span>

                    {item.label === "Point of Sale" && (
                      <span className="nav-badge">POS</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={20} />
            </div>

            <strong>Need help?</strong>
            <p>
              Find answers and learn how to use VELTRO.
            </p>

            <button
              type="button"
              onClick={() =>
                alert("Help center coming soon.")
              }
            >
              Help Center
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="sidebar-footer">
            <span className="online-dot" />
            <span>System operational</span>
            <span className="version">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function DashboardHeader({
  activePage,
  search,
  onSearchChange,
  onMenuClick,
  sidebarVisible,
  onSidebarToggle,
}) {
  return (
    <header className="dashboard-header">
      <div className="header-heading">
        <button
          className="sidebar-toggle icon-button"
          type="button"
          onClick={onSidebarToggle}
          aria-label={
            sidebarVisible ? "Hide sidebar" : "Show sidebar"
          }
          title={
            sidebarVisible ? "Hide sidebar" : "Show sidebar"
          }
        >
          {sidebarVisible ? (
            <PanelLeftClose size={21} />
          ) : (
            <PanelLeftOpen size={21} />
          )}
        </button>

        <button
          className="mobile-menu icon-button"
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          title="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">
              {activePage}
            </span>
          </div>

          <h1>{activePage}</h1>

          <p className="header-description">
            {activePage === "Sales History"
              ? "Review your previous sales and invoices."
              : "Here's what's happening with your business today."}
          </p>
        </div>
      </div>

      <div className="header-actions">
        <label className="search-box">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search anything..."
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
          />

          <kbd>/</kbd>
        </label>

        <button
          className="header-icon-button"
          type="button"
          aria-label="Notifications"
          onClick={() =>
            alert("Notifications coming soon.")
          }
        >
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="header-profile">
          <div className="profile-avatar">AD</div>

          <div className="profile-info">
            <strong>Administrator</strong>
            <span>Business Owner</span>
          </div>

          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <p>{label}</p>

      {payload.map((entry) => (
        <div className="tooltip-row" key={entry.dataKey}>
          <span
            className="tooltip-dot"
            style={{ background: entry.color }}
          />

          <span>
            {entry.dataKey === "sales" ? "Sales" : "Orders"}
          </span>

          <strong>
            {entry.dataKey === "sales"
              ? formatMoney(entry.value)
              : entry.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

function SalesChart() {
  const [period, setPeriod] = useState("7 days");

  return (
    <section className="panel sales-panel">
      <div className="panel-header">
        <div>
          <div className="panel-title-row">
            <h3>Sales Overview</h3>

            <span className="live-indicator">
              <span />
              Live overview
            </span>
          </div>

          <p className="panel-description">
            Monitor your sales performance over time.
          </p>
        </div>

        <div className="panel-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              alert("Export feature coming soon.")
            }
          >
            <Download size={16} />
            Export
          </button>

          <select
            className="select-control"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value)
            }
            aria-label="Sales chart period"
          >
            <option>7 days</option>
            <option>30 days</option>
            <option>90 days</option>
          </select>
        </div>
      </div>

      <div className="chart-summary">
        <div>
          <span className="chart-summary-label">
            Total revenue
          </span>
          <div className="chart-summary-value">
            {formatMoney(280000)}
          </div>
        </div>

        <div className="chart-summary-change">
          <ArrowUpRight size={17} />
          <span>12.8%</span>
          <small>vs previous period</small>
        </div>
      </div>

      <div className="sales-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={salesData}
            margin={{
              top: 12,
              right: 8,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="salesGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#36d9c3"
                  stopOpacity={0.28}
                />
                <stop
                  offset="100%"
                  stopColor="#36d9c3"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#252c3d"
              strokeDasharray="4 5"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8993a8", fontSize: 12 }}
              dy={12}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8993a8", fontSize: 11 }}
              tickFormatter={(value) => `${value / 1000}k`}
              width={42}
            />

            <Tooltip content={<ChartTooltip />} />

            <Area
              type="monotone"
              dataKey="sales"
              stroke="#36d9c3"
              strokeWidth={2.5}
              fill="url(#salesGradient)"
              activeDot={{
                r: 5,
                stroke: "#080b14",
                strokeWidth: 2,
                fill: "#36d9c3",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <span>
          <span className="legend-dot" />
          Sales revenue
        </span>
        <span>Sample dashboard data</span>
      </div>
    </section>
  );
}

function OrdersChart() {
  return (
    <section className="panel orders-panel">
      <div className="panel-header">
        <div>
          <h3>Orders Analytics</h3>
          <p className="panel-description">
            Orders processed this week.
          </p>
        </div>

        <button
          className="icon-button"
          type="button"
          aria-label="More order chart options"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="orders-total">
        <strong>1,217</strong>
        <span className="change-badge positive">
          <ArrowUpRight size={14} />
          8.4%
        </span>
      </div>

      <div className="orders-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={salesData}
            margin={{
              top: 8,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="#252c3d"
              strokeDasharray="4 5"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8993a8", fontSize: 11 }}
            />

            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.035)" }}
              formatter={(value) => [value, "Orders"]}
            />

            <Bar
              dataKey="orders"
              fill="#8a79ff"
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="orders-footer">
        <span>
          <span className="legend-dot violet" />
          Completed orders
        </span>
        <span>Last 7 days</span>
      </div>
    </section>
  );
}

function ProductsTable({ search, onNavigate }) {
  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    );
  });

  return (
    <section className="panel products-panel">
      <div className="panel-header">
        <div>
          <h3>Top Products</h3>
          <p className="panel-description">
            Overview of your current product inventory.
          </p>
        </div>

        <div className="panel-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              alert("Product filters coming soon.")
            }
          >
            <Filter size={16} />
            Filter
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate("Products")}
          >
            <Plus size={17} />
            Add Product
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>SKU</th>
              <th>CATEGORY</th>
              <th>STOCK</th>
              <th>PRICE</th>
              <th>STATUS</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-name-cell">
                    <div className="product-thumbnail">
                      <Package size={19} />
                    </div>
                    <strong>{product.name}</strong>
                  </div>
                </td>

                <td className="muted-cell">{product.sku}</td>
                <td>{product.category}</td>

                <td>
                  <span
                    className={
                      product.stock <= 20
                        ? "stock-warning"
                        : "stock-normal"
                    }
                  >
                    {product.stock}
                  </span>
                </td>

                <td className="price-cell">
                  {formatMoney(product.price)}
                </td>

                <td>
                  <span
                    className={`status-badge ${
                      product.status === "In Stock"
                        ? "status-success"
                        : product.status === "Low Stock"
                        ? "status-warning"
                        : "status-danger"
                    }`}
                  >
                    <span />
                    {product.status}
                  </span>
                </td>

                <td>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Options for ${product.name}`}
                    onClick={() => onNavigate("Products")}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  No products match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>
          Showing {filteredProducts.length} of {products.length} products
        </span>

        <button
          className="view-all-button"
          type="button"
          onClick={() => onNavigate("Products")}
        >
          View all products
          <ArrowUpRight size={15} />
        </button>
      </div>
    </section>
  );
}

function ActivityPanel() {
  return (
    <section className="panel activity-panel">
      <div className="panel-header">
        <div>
          <h3>Recent Activity</h3>
          <p className="panel-description">
            Latest updates from your business.
          </p>
        </div>

        <button
          className="icon-button"
          type="button"
          aria-label="More activity options"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="activity-list">
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <div
              className="activity-item"
              key={activity.title}
            >
              <div className={`activity-icon ${activity.color}`}>
                <Icon size={18} />
              </div>

              <div className="activity-content">
                <strong>{activity.title}</strong>
                <span>{activity.detail}</span>
              </div>

              <div className="activity-time">
                <Clock size={12} />
                <span>{activity.time}</span>
              </div>

              {index !== activities.length - 1 && (
                <span className="activity-connector" />
              )}
            </div>
          );
        })}
      </div>

      <button
        className="activity-view-all"
        type="button"
        onClick={() =>
          alert("Activity history coming soon.")
        }
      >
        View activity history
        <ArrowUpRight size={15} />
      </button>
    </section>
  );
}

function Dashboard({ onNavigate }) {
  const [search, setSearch] = useState("");

  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-content">
          <div className="welcome-eyebrow">
            <Zap size={15} />
            YOUR BUSINESS AT A GLANCE
          </div>

          <h2>Welcome back, Administrator 👋</h2>

          <p>
            Here's your business performance overview for today.
          </p>

          <div className="welcome-date">
            <CalendarDays size={15} />
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="welcome-decoration">
          <div className="decoration-ring ring-one" />
          <div className="decoration-ring ring-two" />
          <div className="decoration-center">
            <BarChart3 size={42} />
          </div>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Business Overview</h2>
          <p>Your key business metrics at a glance.</p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={() =>
            alert("Date range selection coming soon.")
          }
        >
          <CalendarDays size={16} />
          Today
          <ChevronDown size={15} />
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={formatMoney(284500)}
          change="12.8%"
          positive
          icon={Wallet}
          accent="cyan"
        />

        <StatCard
          title="Total Orders"
          value="1,284"
          change="8.4%"
          positive
          icon={ShoppingCart}
          accent="violet"
        />

        <StatCard
          title="Total Products"
          value="856"
          change="4.2%"
          positive
          icon={Package}
          accent="blue"
        />

        <StatCard
          title="Net Profit"
          value={formatMoney(82400)}
          change="2.1%"
          positive={false}
          icon={BarChart3}
          accent="orange"
        />
      </div>

      <div className="charts-grid">
        <SalesChart />
        <OrdersChart />
      </div>

      <div className="bottom-grid">
        <ProductsTable
          search={search}
          onNavigate={onNavigate}
        />
        <ActivityPanel />
      </div>

      <div className="dashboard-search-footer">
        <Search size={16} />

        <input
          type="search"
          placeholder="Search products by name, category or SKU..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
    </>
  );
}

function PlaceholderPage({ title }) {
  const icons = {
    Categories: Boxes,
    Purchases: CreditCard,
    Orders: ShoppingCart,
    Suppliers: Truck,
    Customers: Users,
    "Cash Register": Wallet,
    Reports: BarChart3,
    Settings,
  };

  const Icon = icons[title] || LayoutDashboard;

  return (
    <section className="panel placeholder-panel">
      <div className="placeholder-icon">
        <Icon size={34} />
      </div>

      <h2>{title}</h2>

      <p>
        This module is part of the VELTRO-PRO roadmap.
        Its functionality will be developed in the next stages.
      </p>

      <div className="placeholder-status">
        <CheckCircle2 size={17} />
        Module planned
      </div>
    </section>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const handleSidebarToggle = () => {
    // On phones, open or close the navigation drawer.
    if (window.innerWidth <= 620) {
      setMobileOpen((previous) => !previous);
      return;
    }

    // On larger screens, hide or show the sidebar.
    setSidebarVisible((previous) => !previous);
  };

  const handleMobileMenu = () => {
    setMobileOpen(true);
  };

  return (
    <div
      className={`app-shell ${
        sidebarVisible ? "" : "sidebar-hidden"
      }`}
    >
      {sidebarVisible && (
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <main
        className="main-content"
        style={
          !sidebarVisible
            ? { marginLeft: 0, width: "100%" }
            : undefined
        }
      >
        <DashboardHeader
          activePage={activePage}
          search={search}
          onSearchChange={setSearch}
          onMenuClick={handleMobileMenu}
          sidebarVisible={sidebarVisible}
          onSidebarToggle={handleSidebarToggle}
        />

        <div className="page-content">
          {activePage === "Dashboard" ? (
            <Dashboard onNavigate={setActivePage} />
          ) : activePage === "Point of Sale" ? (
            <POS />
          ) : activePage === "Products" ? (
            <Products />
          ) : (
            <PlaceholderPage title={activePage} />
          )}
        </div>

        <footer className="app-footer">
          <span>
            © {new Date().getFullYear()} VELTRO. All rights reserved.
          </span>

          <span className="footer-status">
            <span />
            All systems operational
          </span>
        </footer>
      </main>
    </div>
  );
}

import React from "react";
import {
LayoutDashboard,
ShoppingCart,
Package,
Truck,
Users,
Wallet,
ChartNoAxesCombined,
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

const salesData = [
{ day: "Mon", sales: 12000, purchases: 7000 },
{ day: "Tue", sales: 18000, purchases: 11000 },
{ day: "Wed", sales: 14000, purchases: 8500 },
{ day: "Thu", sales: 25000, purchases: 15000 },
{ day: "Fri", sales: 21000, purchases: 12000 },
{ day: "Sat", sales: 32000, purchases: 19000 },
{ day: "Sun", sales: 28000, purchases: 16000 },
];

const products = [
{ name: "Premium Coffee", category: "Beverages", sold: 245, revenue: "122,500 DA", color: "#35d6c2" },
{ name: "Mineral Water", category: "Drinks", sold: 198, revenue: "39,600 DA", color: "#a78bfa" },
{ name: "Chocolate Biscuits", category: "Snacks", sold: 164, revenue: "32,800 DA", color: "#f6b860" },
{ name: "Olive Oil 1L", category: "Grocery", sold: 120, revenue: "96,000 DA", color: "#60a5fa" },
];

const navGroups = [
{
title: "GENERAL",
items: [
{ label: "Dashboard", icon: LayoutDashboard, active: true },
{ label: "Settings", icon: Settings },
],
},
{
title: "COMMERCE",
items: [
{ label: "Point of Sale", icon: ShoppingCart, badge: "POS" },
{ label: "Products", icon: Package },
{ label: "Purchases", icon: Truck },
{ label: "Orders", icon: Boxes },
],
},
{
title: "MANAGEMENT",
items: [
{ label: "Customers", icon: Users },
{ label: "Suppliers", icon: Truck },
{ label: "Inventory", icon: Package },
],
},
{
title: "FINANCE & ANALYTICS",
items: [
{ label: "Cash Register", icon: Wallet },
{ label: "Expenses", icon: CreditCard },
{ label: "Reports", icon: ChartNoAxesCombined },
],
},
];

function StatCard({ title, value, change, icon: Icon, tone, positive = true }) {
return (
<article className="stat-card">
<div className="stat-card-top">
<div className={"stat-icon ${tone}"}>
<Icon size={21} strokeWidth={1.8} />
</div>
<button className="icon-button subtle" aria-label="More options">
<MoreHorizontal size={20} />
</button>
</div>
<p className="stat-title">{title}</p>
<div className="stat-value-row">
<h2>{value}</h2>
<span className={"change-badge ${positive ? "positive" : "negative"}"}>
{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
{change}
</span>
</div>
<p className="stat-footnote">Compared to last month</p>
</article>
);
}

function Sidebar() {
return (
<aside className="sidebar">
<a className="brand" href="#dashboard">
<div className="brand-mark"><Zap size={24} fill="currentColor" /></div>
<div className="brand-copy">
<span className="brand-name">VELTRO<span>.</span></span>
<span className="brand-subtitle">BUSINESS CONTROL</span>
</div>
</a>

  <div className="workspace">
    <div className="workspace-avatar">V</div>
    <div className="workspace-copy">
      <strong>My Business</strong>
      <span>Professional plan</span>
    </div>
    <ChevronDown size={16} className="workspace-chevron" />
  </div>

  <nav className="sidebar-navigation">
    {navGroups.map((group) => (
      <div className="nav-group" key={group.title}>
        <p className="nav-group-title">{group.title}</p>
        {group.items.map(({ label, icon: Icon, active, badge }) => (
          <a
            href={`#${label.toLowerCase().replaceAll(" ", "-")}`}
            className={`nav-item ${active ? "active" : ""}`}
            key={label}
            onClick={(event) => {
              if (label !== "Dashboard") event.preventDefault();
            }}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {badge && <span className="nav-badge">{badge}</span>}
            {active && <span className="active-indicator" />}
          </a>
        ))}
      </div>
    ))}
  </nav>

  <div className="sidebar-bottom">
    <div className="upgrade-card">
      <div className="upgrade-icon"><Zap size={17} /></div>
      <strong>Unlock your potential</strong>
      <p>Discover powerful tools for your business.</p>
      <button type="button">Explore features <ArrowUpRight size={14} /></button>
    </div>
    <a href="#help" className="help-link">
      <CircleHelp size={18} />
      <span>Help & Support</span>
    </a>
    <div className="sidebar-version">VELTRO PRO <span>v1.0.0</span></div>
  </div>
</aside>

);
}

function DashboardHeader() {
return (
<header className="topbar">
<div className="breadcrumb">
<span>Workspace</span>
<span className="breadcrumb-divider">/</span>
<strong>Dashboard</strong>
</div>
<div className="topbar-actions">
<label className="search-box">
<Search size={17} />
<input type="search" placeholder="Search anything..." aria-label="Search" />
<kbd>⌘ K</kbd>
</label>
<button className="icon-button notification-button" aria-label="Notifications">
<Bell size={19} />
<span />
</button>
<div className="topbar-divider" />
<button className="profile-button" type="button">
<div className="profile-avatar">N</div>
<div className="profile-copy">
<strong>Administrator</strong>
<span>Super Admin</span>
</div>
<ChevronDown size={15} />
</button>
</div>
</header>
);
}

function SalesChart() {
return (
<section className="panel sales-panel">
<div className="panel-header">
<div>
<h3>Revenue Overview</h3>
<p>Track your business performance over time.</p>
</div>
<select className="period-select" defaultValue="7days" aria-label="Chart period">
<option value="7days">Last 7 days</option>
<option value="30days">Last 30 days</option>
</select>
</div>

  <div className="chart-legend">
    <span><i className="legend-dot turquoise" /> Revenue</span>
    <span><i className="legend-dot violet" /> Purchases</span>
  </div>

  <div className="sales-chart">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={salesData} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#35d6c2" stopOpacity={0.23} />
            <stop offset="100%" stopColor="#35d6c2" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#222b3b" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: "#7e8ba3", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
        <YAxis tick={{ fill: "#7e8ba3", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip
          contentStyle={{ background: "#111827", border: "1px solid #293448", borderRadius: 12, color: "#f4f7fb" }}
          formatter={(value) => [`${Number(value).toLocaleString()} DA`]}
        />
        <Area type="monotone" dataKey="purchases" stroke="#a78bfa" strokeWidth={2} fill="url(#purchaseGradient)" />
        <Area type="monotone" dataKey="sales" stroke="#35d6c2" strokeWidth={2.5} fill="url(#revenueGradient)" activeDot={{ r: 5, fill: "#35d6c2", stroke: "#0b1220", strokeWidth: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</section>

);
}

function OrdersChart() {
const data = [
{ name: "Mon", orders: 32 },
{ name: "Tue", orders: 48 },
{ name: "Wed", orders: 38 },
{ name: "Thu", orders: 64 },
{ name: "Fri", orders: 52 },
{ name: "Sat", orders: 82 },
{ name: "Sun", orders: 69 },
];

return (
<section className="panel orders-panel">
<div className="panel-header">
<div>
<h3>Orders Analytics</h3>
<p>Order volume this week.</p>
</div>
<button className="icon-button subtle" aria-label="More order options">
<MoreHorizontal size={20} />
</button>
</div>
<div className="orders-total">
<strong>385</strong>
<span className="change-badge positive"><ArrowUpRight size={13} /> 12.8%</span>
</div>
<div className="orders-chart">
<ResponsiveContainer width="100%" height="100%">
<BarChart data={data} margin={{ top: 8, right: 0, left: -25, bottom: 0 }}>
<CartesianGrid stroke="#222b3b" strokeDasharray="3 5" vertical={false} />
<XAxis dataKey="name" tick={{ fill: "#7e8ba3", fontSize: 10 }} axisLine={false} tickLine={false} />
<YAxis hide />
<Tooltip
cursor={{ fill: "#ffffff", opacity: 0.035 }}
contentStyle={{ background: "#111827", border: "1px solid #293448", borderRadius: 10 }}
/>
<Bar dataKey="orders" fill="#35d6c2" radius={[5, 5, 0, 0]} maxBarSize={25} />
</BarChart>
</ResponsiveContainer>
</div>
</section>
);
}

function ProductsTable() {
return (
<section className="panel products-panel">
<div className="panel-header">
<div>
<h3>Top Selling Products</h3>
<p>Your best performing products this month.</p>
</div>
<button className="text-button" type="button">View all <ArrowUpRight size={15} /></button>
</div>

  <div className="table-scroll">
    <table className="products-table">
      <thead>
        <tr>
          <th>PRODUCT</th>
          <th>CATEGORY</th>
          <th>SOLD</th>
          <th>REVENUE</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product, index) => (
          <tr key={product.name}>
            <td>
              <div className="product-cell">
                <div className="product-symbol" style={{ "--product-color": product.color }}>
                  <Package size={18} />
                </div>
                <div>
                  <strong>{product.name}</strong>
                  <span>SKU-00{index + 1}</span>
                </div>
              </div>
            </td>
            <td><span className="category-pill">{product.category}</span></td>
            <td className="sold-cell">{product.sold}</td>
            <td className="revenue-cell">{product.revenue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  <div className="table-footer">
    <span>Showing <strong>4</strong> of <strong>24</strong> products</span>
    <div className="pagination">
      <button type="button" disabled aria-label="Previous page">‹</button>
      <button type="button" className="current-page" aria-label="Page 1">1</button>
      <button type="button" aria-label="Page 2">2</button>
      <button type="button" aria-label="Next page">›</button>
    </div>
  </div>
</section>

);
}

function ActivityPanel() {
const activities = [
{ icon: ShoppingCart, title: "New sale completed", detail: "Order #SL-1048", time: "2 min ago", tone: "turquoise" },
{ icon: Package, title: "Stock running low", detail: "Mineral Water · 8 left", time: "18 min ago", tone: "orange" },
{ icon: Users, title: "New customer added", detail: "Customer #CU-025", time: "45 min ago", tone: "violet" },
{ icon: Truck, title: "Purchase received", detail: "Order #PU-021", time: "1 hour ago", tone: "blue" },
];

return (
<section className="panel activity-panel">
<div className="panel-header">
<div>
<h3>Recent Activity</h3>
<p>Latest updates from your business.</p>
</div>
<button className="icon-button subtle" aria-label="Activity options"><MoreHorizontal size={20} /></button>
</div>
<div className="activity-list">
{activities.map(({ icon: Icon, title, detail, time, tone }) => (
<div className="activity-item" key={title}>
<div className={"activity-icon ${tone}"}><Icon size={17} /></div>
<div className="activity-copy">
<strong>{title}</strong>
<span>{detail}</span>
</div>
<time>{time}</time>
</div>
))}
</div>
<button className="activity-view-all" type="button">View all activity <ArrowUpRight size={15} /></button>
</section>
);
}

export default function App() {
return (
<div className="app-shell">
<Sidebar />
<main className="main-area" id="dashboard">
<DashboardHeader />
<div className="dashboard-content">
<div className="welcome-row">
<div>
<div className="eyebrow"><span className="eyebrow-dot" /> YOUR BUSINESS AT A GLANCE</div>
<h1>Good morning, <span>Administrator</span> <span className="wave">✦</span></h1>
<p>Here's what's happening with your business today.</p>
</div>
<button className="date-button" type="button">
<span className="date-icon">▦</span>
October 10, 2026
<ChevronDown size={15} />
</button>
</div>

      <div className="stats-grid">
        <StatCard title="Total Revenue" value="284,650 DA" change="+12.8%" icon={Wallet} tone="tone-turquoise" />
        <StatCard title="Total Orders" value="1,248" change="+8.2%" icon={ShoppingCart} tone="tone-violet" />
        <StatCard title="Total Products" value="2,456" change="+4.6%" icon={Package} tone="tone-blue" />
        <StatCard title="Net Profit" value="86,420 DA" change="+16.3%" icon={ChartNoAxesCombined} tone="tone-orange" />
      </div>

      <div className="charts-grid">
        <SalesChart />
        <OrdersChart />
      </div>

      <div className="bottom-grid">
        <ProductsTable />
        <ActivityPanel />
      </div>

      <footer className="dashboard-footer">
        <span>© 2026 VELTRO. All rights reserved.</span>
        <span><i /> All systems operational</span>
      </footer>
    </div>
  </main>
</div>

);
  }

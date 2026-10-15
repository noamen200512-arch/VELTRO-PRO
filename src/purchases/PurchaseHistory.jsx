import React, { useEffect, useMemo, useState } from "react";
import {
  Search, CalendarDays, Clock3, Truck, Users, Wallet, FileText,
  RefreshCw, Download, Eye, Printer, Pencil, Trash2, Info, History, X
} from "lucide-react";

const money = value => `${Number(value || 0).toLocaleString(
  document.documentElement.lang === "ar" ? "ar-DZ" :
  document.documentElement.lang === "fr" ? "fr-DZ" : "en-US",
  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
)} DA`;

const dateOf = invoice => invoice.date || invoice.closedAt || invoice.openedAt || invoice.updatedAt || "";
const supplierOf = invoice => invoice.supplier || "Unknown Supplier";
const employeeOf = invoice => invoice.closedBy || invoice.createdBy || "Not recorded";
const totalOf = invoice => Math.max(0, Number(invoice.total) || 0);
const paidOf = invoice => Math.max(0, Number(invoice.paid) || 0);
const remainingOf = invoice => Math.max(0, Number(invoice.currentDebt ?? invoice.remaining ?? (totalOf(invoice) - paidOf(invoice))) || 0);

function Stat({ title, value, subtitle, icon: Icon }) {
  return <article className="purchase-metric-card purchase-history-stat">
    <div className="purchase-metric-top"><span>{title}</span><span className="purchase-metric-icon"><Icon size={19} /></span></div>
    <strong>{value}</strong>
    <small>{subtitle}</small>
  </article>;
}

export default function PurchaseHistory({
  invoices = [],
  onNew,
  onView,
  onInfo,
  onEdit,
  onPrint,
  onDelete
}) {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const PAGE_SIZE = 15;

  const suppliers = useMemo(() => [...new Set(invoices.map(supplierOf).filter(Boolean))].sort(), [invoices]);
  const employees = useMemo(() => [...new Set(invoices.map(employeeOf).filter(Boolean))].sort(), [invoices]);

  const filteredInvoices = useMemo(() => {
    if (!appliedFilters) return [];
    const filters = appliedFilters;
    const query = filters.search.trim().toLowerCase();

    return invoices.filter(invoice => {
      const dateValue = dateOf(invoice);
      const date = dateValue ? new Date(dateValue) : null;
      const valid = date && !Number.isNaN(date.getTime());
      const dateOnly = valid ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}` : "";
      const timeOnly = valid ? `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}` : "";
      const matchesSearch = !query || [
        invoice.number, invoice.id, invoice.supplier, invoice.phone,
        invoice.createdBy, invoice.closedBy
      ].some(value => String(value || "").toLowerCase().includes(query));

      return matchesSearch &&
        (!filters.startDate || (dateOnly && dateOnly >= filters.startDate)) &&
        (!filters.endDate || (dateOnly && dateOnly <= filters.endDate)) &&
        (!filters.startTime || (timeOnly && timeOnly >= filters.startTime)) &&
        (!filters.endTime || (timeOnly && timeOnly <= filters.endTime)) &&
        (!filters.supplierFilter || supplierOf(invoice) === filters.supplierFilter) &&
        (!filters.employeeFilter || employeeOf(invoice) === filters.employeeFilter);
    }).sort((a,b) => new Date(dateOf(b) || 0) - new Date(dateOf(a) || 0));
  }, [invoices, appliedFilters, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleInvoices = filteredInvoices.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [appliedFilters, refreshKey]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const totalPurchases = filteredInvoices.reduce((sum, invoice) => sum + totalOf(invoice), 0);
  const totalPaid = filteredInvoices.reduce((sum, invoice) => sum + paidOf(invoice), 0);
  const totalDebt = filteredInvoices.reduce((sum, invoice) => sum + remainingOf(invoice), 0);

  const applySearch = () => {
    const filters = { search, startDate, endDate, startTime, endTime, supplierFilter, employeeFilter };
    if (!Object.values(filters).some(value => String(value ?? "").trim())) {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
      filters.startDate = today;
      filters.endDate = today;
      setStartDate(today);
      setEndDate(today);
    }
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch(""); setStartDate(""); setEndDate(""); setStartTime(""); setEndTime("");
    setSupplierFilter(""); setEmployeeFilter(""); setAppliedFilters(null); setCurrentPage(1);
  };

  const exportCsv = () => {
    const rows = [
      ["Invoice", "Supplier", "Employee", "Date", "Time", "Total DA", "Paid DA", "Remaining DA", "Status"],
      ...filteredInvoices.map(invoice => {
        const date = new Date(dateOf(invoice));
        return [
          invoice.number || invoice.id, supplierOf(invoice), employeeOf(invoice),
          Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(),
          Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(),
          totalOf(invoice), paidOf(invoice), remainingOf(invoice), invoice.status || ""
        ];
      })
    ];
    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "veltro-purchase-history.csv";
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const dateLocale = document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US";

  return <main className="purchase-history-page purchase-history-sales-style">
    <div className="purchase-panel-heading purchase-history-heading">
      <div><h2>Purchase History</h2><p>Search, inspect, print or edit purchase vouchers, using the same workflow as Sales History.</p></div>
      <div className="purchase-history-top-actions">
        <button className="purchase-button secondary" type="button" onClick={exportCsv}><Download size={16}/> Export CSV</button>
        <button className="purchase-button secondary" type="button" onClick={() => setRefreshKey(value => value + 1)}><RefreshCw size={16}/> Refresh</button>
        <button className="purchase-button primary" type="button" onClick={onNew}><FileText size={16}/> New Purchase Voucher</button>
      </div>
    </div>

    <div className="purchase-history-stats">
      <Stat title="Total Purchases" value={money(totalPurchases)} icon={Wallet} subtitle="Based on filtered vouchers"/>
      <Stat title="Purchase Vouchers" value={String(filteredInvoices.length)} icon={FileText} subtitle="Vouchers in current results"/>
      <Stat title="Suppliers" value={String(new Set(filteredInvoices.map(supplierOf)).size)} icon={Truck} subtitle="In the current results"/>
      <Stat title="Outstanding Debt" value={money(totalDebt)} icon={Clock3} subtitle={`Paid: ${money(totalPaid)}`}/>
    </div>

    <section className="purchase-panel purchase-history-filter-panel">
      <div className="purchase-panel-heading">
        <div><h2>Filter purchase vouchers</h2><p>Select a date range, time range, supplier or employee.</p></div>
        <button className="purchase-button secondary" type="button" onClick={resetFilters}><RefreshCw size={16}/> Reset filters</button>
      </div>
      <div className="purchase-history-filter-grid">
        <label className="purchase-history-search"><span><Search size={15}/> Invoice / supplier / employee</span><input type="search" placeholder="Invoice number, supplier or employee..." value={search} onChange={event => setSearch(event.target.value)}/></label>
        <label><span><CalendarDays size={15}/> Start date</span><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)}/></label>
        <label><span><CalendarDays size={15}/> End date</span><input type="date" value={endDate} onChange={event => setEndDate(event.target.value)}/></label>
        <label><span><Clock3 size={15}/> Start time</span><input type="time" value={startTime} onChange={event => setStartTime(event.target.value)}/></label>
        <label><span><Clock3 size={15}/> End time</span><input type="time" value={endTime} onChange={event => setEndTime(event.target.value)}/></label>
        <label><span><Truck size={15}/> Supplier</span><select value={supplierFilter} onChange={event => setSupplierFilter(event.target.value)}><option value="">All suppliers</option>{suppliers.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span><Users size={15}/> Employee</span><select value={employeeFilter} onChange={event => setEmployeeFilter(event.target.value)}><option value="">All employees</option>{employees.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      <div className="purchase-history-search-actions"><button className="purchase-button primary" type="button" onClick={applySearch}><Search size={16}/> Search</button></div>

      <div className="purchase-table-wrap purchase-history-main-table"><table className="purchase-table">
        <thead><tr><th>INVOICE</th><th>SUPPLIER</th><th>EMPLOYEE</th><th>DATE &amp; TIME</th><th>TOTAL</th><th>PAID</th><th>REMAINING</th><th>ACTIONS</th></tr></thead>
        <tbody>
          {visibleInvoices.map((invoice, index) => {
            const date = new Date(dateOf(invoice));
            return <tr key={invoice.id || invoice.number || index}>
              <td><strong>{invoice.number || invoice.id || "Purchase"}</strong></td>
              <td>{supplierOf(invoice)}</td><td>{employeeOf(invoice)}</td>
              <td>{Number.isNaN(date.getTime()) ? "—" : <><div>{date.toLocaleDateString(dateLocale)}</div><small>{date.toLocaleTimeString(dateLocale)}</small></>}</td>
              <td>{money(totalOf(invoice))}</td><td>{money(paidOf(invoice))}</td><td>{money(remainingOf(invoice))}</td>
              <td><div className="purchase-row-actions">
                <button type="button" title="View invoice" aria-label="View invoice" onClick={() => onView(invoice)}><Eye size={15}/></button>
                <button type="button" title="Print invoice" aria-label="Print invoice" onClick={() => onPrint(invoice)}><Printer size={15}/></button>
                <button type="button" title="Edit invoice" aria-label="Edit invoice" onClick={() => onEdit(invoice)}><Pencil size={15}/></button>
                <button type="button" title="Account details" aria-label="Account details" onClick={() => onInfo(invoice)}><Info size={15}/></button>
                <button type="button" className="danger" title="Delete invoice" aria-label="Delete invoice" onClick={() => onDelete(invoice)}><Trash2 size={15}/></button>
              </div></td>
            </tr>;
          })}
          {!visibleInvoices.length && <tr><td colSpan="8" className="purchase-empty-row"><div className="purchase-history-empty"><History size={28}/><strong>{!appliedFilters ? "Press Search to display purchase records." : invoices.length ? "No matching purchase vouchers" : "No purchase vouchers yet"}</strong><p>{!appliedFilters ? "Enter filters if needed, then press Search. With no filters, only today's vouchers are shown." : invoices.length ? "Try changing your filters." : "Confirmed purchase invoices will appear here."}</p></div></td></tr>}
        </tbody>
      </table></div>
      <footer className="purchase-history-pagination">
        <span className="purchase-history-page-summary">{filteredInvoices.length ? `Showing ${startIndex+1}–${Math.min(startIndex+PAGE_SIZE, filteredInvoices.length)} of ${filteredInvoices.length} filtered vouchers (${invoices.length} total)` : `Showing 0 of 0 filtered vouchers (${invoices.length} total)`}</span>
        <div className="purchase-history-page-controls" aria-label="Purchase history pages">
          <button type="button" onClick={() => setCurrentPage(page => Math.max(1,page-1))} disabled={safePage<=1}>Previous</button>
          {Array.from({length:totalPages},(_,index)=>index+1).filter(page=>page===1||page===totalPages||Math.abs(page-safePage)<=1).reduce((items,page,index,pages)=>{if(index>0&&page-pages[index-1]>1)items.push("ellipsis-"+page);items.push(page);return items;},[]).map(page=>typeof page==="number"?<button type="button" key={page} className={page===safePage?"active":""} aria-current={page===safePage?"page":undefined} onClick={()=>setCurrentPage(page)}>{page}</button>:<span className="purchase-history-page-ellipsis" key={page}>…</span>)}
          <button type="button" onClick={() => setCurrentPage(page => Math.min(totalPages,page+1))} disabled={safePage>=totalPages}>Next</button>
        </div>
      </footer>
    </section>
  </main>;
}

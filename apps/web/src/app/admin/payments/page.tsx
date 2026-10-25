"use client";

import { useEffect, useState } from "react";
import { CreditCard, DollarSign, RefreshCw, RotateCcw, ShieldCheck } from "lucide-react";
import { formatCurrency } from "../../../lib/format";
import { api } from "../../../services/api";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const loadPayments = async () => {
    try {
      const data = await api.adminGetPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const handleRefund = async (paymentId: string, amountCents: number) => {
    if (
      !window.confirm(
        `Are you sure you want to refund ${formatCurrency(amountCents)} for this transaction?`,
      )
    ) {
      return;
    }

    setRefundingId(paymentId);
    try {
      await api.adminRefundPayment(paymentId);
      void loadPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setRefundingId(null);
    }
  };

  const totalCaptured = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amountCents, 0);

  const totalRefunded = payments
    .filter((p) => p.status === "REFUNDED")
    .reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Financial Ledger
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            Payment Transactions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track authorized captures, payment methods, transaction IDs, and process refunds
          </p>
        </div>

        <button
          onClick={() => void loadPayments()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Captured Net Revenue</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{formatCurrency(totalCaptured)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Total Refunded</span>
            <p className="text-xl font-black text-rose-400 mt-0.5">{formatCurrency(totalRefunded)}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <RotateCcw className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Provider / Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading payments ledger...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-400 font-bold">
                      {p.transactionId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{p.customerName}</span>
                      <span className="text-[10px] text-slate-500">{p.customerEmail}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      #{p.orderId.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">{p.provider}</td>
                    <td className="py-3 px-4 font-black text-white">
                      {formatCurrency(p.amountCents)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          p.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()}{" "}
                      {new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === "COMPLETED" && (
                        <button
                          onClick={() => void handleRefund(p.id, p.amountCents)}
                          disabled={refundingId === p.id}
                          className="rounded-lg border border-rose-900/50 bg-rose-950/20 px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-950/50 transition disabled:opacity-50"
                        >
                          {refundingId === p.id ? "Refunding..." : "Refund"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

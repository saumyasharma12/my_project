"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const data = await api.adminGetUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleRoleToggle = async (targetUser: any) => {
    if (targetUser.id === currentAdmin?.id) {
      alert("You cannot modify your own administrative role.");
      return;
    }

    const nextRole = targetUser.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    if (
      !window.confirm(
        `Are you sure you want to change ${targetUser.name}'s role from ${targetUser.role} to ${nextRole}?`,
      )
    ) {
      return;
    }

    setUpdatingId(targetUser.id);
    try {
      await api.adminUpdateUserRole(targetUser.id, nextRole);
      void loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Access Control & RBAC
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            User Roles & Permissions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage administrative privileges and user session states
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300">
          Total Users: {users.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Orders Placed</th>
                <th className="py-3 px-4">Active Sessions</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Role Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const isSelf = u.id === currentAdmin?.id;
                  const isAdmin = u.role === "ADMIN";

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-indigo-400 border border-slate-700">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="rounded bg-indigo-500/10 px-1.5 text-[9px] font-bold text-indigo-400">
                              (You)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            isAdmin
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-bold">{u.orderCount}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{u.activeSessions}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isSelf && (
                          <button
                            onClick={() => void handleRoleToggle(u)}
                            disabled={updatingId === u.id}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition disabled:opacity-50 ${
                              isAdmin
                                ? "border border-amber-900/50 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40"
                                : "border border-indigo-900/50 bg-indigo-950/20 text-indigo-400 hover:bg-indigo-950/40"
                            }`}
                          >
                            {updatingId === u.id
                              ? "Updating..."
                              : isAdmin
                                ? "Demote to Customer"
                                : "Promote to Admin"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No users found.
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

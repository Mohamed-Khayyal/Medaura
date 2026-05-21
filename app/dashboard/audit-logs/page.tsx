"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { AuditLog, AuditStats } from "@/lib/types/api";

const PAGE_SIZE = 12;

function formatTimestamp(value?: string) {
  if (!value) return "-";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(parsed));
}

function getLevelTone(level?: string) {
  const normalized = level?.toLowerCase();
  if (normalized === "error") return "bg-rose-50 text-rose-700";
  if (normalized === "warn" || normalized === "warning") {
    return "bg-amber-50 text-amber-700";
  }
  if (normalized === "success") return "bg-emerald-50 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

function getActionLabel(log: AuditLog) {
  const parts = [log.method, log.path].filter(Boolean);
  return log.action || parts.join(" ") || "Unknown action";
}

function getActorLabel(log: AuditLog) {
  const role = log.actor_role || (log.user_id ? "user" : "guest");
  const actorId = log.actor_user_id ?? log.user_id;
  return actorId ? `${role} #${actorId}` : role || "-";
}

function getEmailLabel(log: AuditLog) {
  const body = log.body && typeof log.body === "object" ? log.body : null;
  const email = body && "email" in body ? body.email : undefined;
  return typeof email === "string" && email.trim() ? email : "-";
}

function parseAuditStats(result: any): AuditStats | null {
  if (!result) return null;
  if (result.success && result.data) return result.data as AuditStats;
  if (result.status === "success" && result.stats) return result.stats as AuditStats;
  if (result.stats) return result.stats as AuditStats;
  if (result.data?.stats) return result.data.stats as AuditStats;
  if (result.data) return result.data as AuditStats;
  return result as AuditStats;
}

function parseAuditLogs(result: any): AuditLog[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.logs)) return result.logs;
  if (Array.isArray(result.data?.logs)) return result.data.logs;
  return [];
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsResponse, logsResponse] = await Promise.all([
        fetch("/api/admin/audit-stats", { credentials: "include" }),
        fetch("/api/admin/audit-logs", { credentials: "include" }),
      ]);

      const [statsJson, logsJson] = await Promise.all([
        statsResponse.json().catch(() => null),
        logsResponse.json().catch(() => null),
      ]);

      const errors: string[] = [];
      if (!statsResponse.ok) {
        errors.push(statsJson?.error || "Failed to load audit stats");
      }
      if (!logsResponse.ok) {
        errors.push(logsJson?.error || "Failed to load audit logs");
      }

      const parsedStats = parseAuditStats(statsJson);
      const parsedLogs = parseAuditLogs(logsJson)
        .slice()
        .sort((a, b) => {
          const aTime = a.timestamp ? Date.parse(a.timestamp) : 0;
          const bTime = b.timestamp ? Date.parse(b.timestamp) : 0;
          return bTime - aTime;
        });

      setStats(parsedStats);
      setLogs(parsedLogs);
      setError(errors.length ? errors.join(" | ") : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load audit data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  const derivedStats = useMemo(() => {
    const totals = {
      info: 0,
      error: 0,
      success: 0,
      failed: 0,
    };

    logs.forEach((log) => {
      const level = log.level?.toLowerCase();
      if (level === "info") totals.info += 1;
      if (level === "error") totals.error += 1;

      if (typeof log.status_code === "number") {
        if (log.status_code >= 200 && log.status_code < 400) totals.success += 1;
        if (log.status_code >= 400) totals.failed += 1;
      }
    });

    return {
      total_logs: stats?.total_logs ?? logs.length,
      total_info_logs: stats?.total_info_logs ?? totals.info,
      total_error_logs: stats?.total_error_logs ?? totals.error,
      total_success_logs: stats?.total_success_logs ?? totals.success,
      total_failed_logs: stats?.total_failed_logs ?? totals.failed,
    };
  }, [stats, logs]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageLogs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, page]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const start = Math.max(1, Math.min(page - 2, totalPages - maxButtons + 1));
    const end = Math.min(totalPages, start + maxButtons - 1);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">Audit Logs</h1>
          <p className="text-sm text-(--text-secondary)">
            Review admin and system activity across the platform.
          </p>
        </div>
        <button
          onClick={loadAuditData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-(--card-border) bg-(--card-bg) hover:bg-(--semi-card-bg) text-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4">
          <p className="text-sm text-(--text-secondary)">Total logs</p>
          <div className="mt-2 text-2xl font-semibold text-(--text-primary)">
            {derivedStats.total_logs ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4">
          <p className="text-sm text-(--text-secondary)">Info</p>
          <div className="mt-2 text-2xl font-semibold text-(--text-primary)">
            {derivedStats.total_info_logs ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4">
          <p className="text-sm text-(--text-secondary)">Errors</p>
          <div className="mt-2 text-2xl font-semibold text-(--text-primary)">
            {derivedStats.total_error_logs ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4">
          <p className="text-sm text-(--text-secondary)">Successful</p>
          <div className="mt-2 text-2xl font-semibold text-(--text-primary)">
            {derivedStats.total_success_logs ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4">
          <p className="text-sm text-(--text-secondary)">Failed</p>
          <div className="mt-2 text-2xl font-semibold text-(--text-primary)">
            {derivedStats.total_failed_logs ?? 0}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-(--card-border) bg-(--card-bg)">
        <div className="border-b border-(--card-border) px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-(--text-primary)">Log entries</h2>
          <span className="text-sm text-(--text-secondary)">
            Page {page} of {totalPages}
          </span>
        </div>

        {loading && (
          <div className="px-6 py-8 text-sm text-(--text-secondary)">Loading audit logs...</div>
        )}

        {!loading && error && (
          <div className="px-6 py-8 text-sm text-rose-600">{error}</div>
        )}

        {!loading && !error && pageLogs.length === 0 && (
          <div className="px-6 py-8 text-sm text-(--text-secondary)">No logs yet.</div>
        )}

        {!loading && !error && pageLogs.length > 0 && (
          <>
            <div className="sm:hidden space-y-4 p-4">
              {pageLogs.map((log, index) => (
                <div
                  key={`${log.id ?? "log"}-${index}`}
                  className="rounded-2xl border border-(--card-border) p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-(--text-primary) truncate">
                        {getActionLabel(log)}
                      </p>
                      <p className="text-xs text-(--text-secondary) truncate">
                        {[log.method, log.path].filter(Boolean).join(" ") || "-"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelTone(
                        log.level,
                      )}`}
                    >
                      {log.level || "info"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span className="text-(--text-secondary)">Actor</span>
                    <span className="text-(--text-primary)">{getActorLabel(log)}</span>

                    <span className="text-(--text-secondary)">Email</span>
                    <span className="text-(--text-primary) truncate">
                      {getEmailLabel(log)}
                    </span>

                    <span className="text-(--text-secondary)">Time</span>
                    <span className="text-(--text-primary)">{formatTimestamp(log.timestamp)}</span>

                    <span className="text-(--text-secondary)">IP</span>
                    <span className="text-(--text-primary)">{log.ip || "-"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-(--hover-bg) text-(--text-secondary)">
                  <tr>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Level</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Actor</th>
                    <th className="px-4 py-3 text-left hidden xl:table-cell">IP</th>
                    <th className="px-4 py-3 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLogs.map((log, index) => (
                    <tr
                      key={`${log.id ?? "log"}-${index}`}
                      className="border-t border-(--card-border) hover:bg-(--hover-bg) transition"
                    >
                      <td className="px-4 py-3">
                        <div className="text-(--text-primary) font-medium">
                          {getActionLabel(log)}
                        </div>
                        <div className="text-xs text-(--text-secondary)">
                          {[log.method, log.path].filter(Boolean).join(" ") || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelTone(
                            log.level,
                          )}`}
                        >
                          {log.level || "info"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-(--text-secondary)">
                        {getEmailLabel(log)}
                      </td>
                      <td className="px-4 py-3 text-(--text-secondary) hidden lg:table-cell">
                        {getActorLabel(log)}
                      </td>
                      <td className="px-4 py-3 text-(--text-secondary) hidden xl:table-cell">
                        {log.ip || "-"}
                      </td>
                      <td className="px-4 py-3 text-(--text-secondary) whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-(--card-border) text-sm disabled:opacity-50"
          >
            Previous
          </button>
          {pageNumbers.map((pg) => (
            <button
              key={pg}
              onClick={() => setPage(pg)}
              className={`px-3 py-1.5 rounded-lg border border-(--card-border) text-sm ${
                pg === page
                  ? "bg-(--card-bg) text-(--text-primary)"
                  : "text-(--text-secondary)"
              }`}
            >
              {pg}
            </button>
          ))}
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-(--card-border) text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

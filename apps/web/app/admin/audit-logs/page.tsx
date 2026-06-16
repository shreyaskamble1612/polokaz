"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, Search, Loader2, Calendar, ShieldCheck, User, Info } from "lucide-react";
import useSWR from "swr";
import { clientFetch } from "@/lib/api/client-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AuditLogEntry = {
  id: string;
  adminId: string;
  adminRole: string;
  targetUserId: string;
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason: string;
  notes?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  adminName: string | null;
  targetName: string | null;
};

function actionBadge(action: string) {
  switch (action) {
    case "suspend":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Suspend</Badge>;
    case "reinstate":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Reinstate</Badge>;
    case "cancel":
      return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Cancel</Badge>;
    case "terminate":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Terminate</Badge>;
    case "review":
      return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Review</Badge>;
    case "waive_fee":
      return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Waive Fee</Badge>;
    case "grant_reward":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Grant Reward</Badge>;
    case "tier_change":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Tier Change</Badge>;
    default:
      return <Badge variant="secondary">{action}</Badge>;
  }
}

function roleBadge(role: string) {
  if (role === "super_admin") {
    return <Badge className="bg-slate-950 text-white hover:bg-slate-950 text-[10px]">Super Admin</Badge>;
  }
  return <Badge variant="outline" className="text-slate-600 text-[10px]">Admin</Badge>;
}

function statusBadge(status?: string | null) {
  if (!status) return <span className="text-slate-400">—</span>;
  switch (status.toLowerCase()) {
    case "active":
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">Active</Badge>;
    case "suspended":
      return <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[10px]">Suspended</Badge>;
    case "cancelled":
      return <Badge className="bg-slate-50 text-slate-700 border-slate-100 text-[10px]">Cancelled</Badge>;
    case "terminated":
      return <Badge className="bg-rose-50 text-rose-700 border-rose-100 text-[10px]">Terminated</Badge>;
    case "under_review":
      return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px]">Review</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { data, error, isLoading } = useSWR<any>(
    `/api/admin/audit-log?page=${page}&limit=20`,
    clientFetch
  );

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;
  const totalLogs = data?.total || 0;

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <h2 className="text-2xl font-bold">Failed to load Audit Logs</h2>
        <p className="mt-2 text-sm">{error.message || "Please make sure you have Super Administrator privileges."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-cyan-600" />
            <div>
              <CardTitle className="text-2xl tracking-tight">Security Audit Logs</CardTitle>
              <CardDescription>
                Immutable chronological log of all administrative actions and member modifications.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading audit logs...
            </div>
          ) : logs.length ? (
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Target Member</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>State Transition</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: AuditLogEntry) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {log.adminName || <span className="text-slate-400 font-mono text-xs">{log.adminId.substring(0, 8)}</span>}
                      </TableCell>
                      <TableCell>{roleBadge(log.adminRole)}</TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {log.targetName || <span className="text-slate-400 font-mono text-xs">{log.targetUserId.substring(0, 8)}</span>}
                      </TableCell>
                      <TableCell>{actionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {statusBadge(log.previousStatus)}
                          <span className="text-slate-400">&rarr;</span>
                          {statusBadge(log.newStatus)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-600" title={log.reason}>
                        {log.reason}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full h-8 w-8 p-0"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Info className="h-4 w-4 text-slate-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between gap-3 pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Showing {logs.length} entries of {totalLogs} total logs.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-full"
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-semibold text-slate-950 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-full"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              No audit logs have been recorded yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-cyan-600" />
              Audit Log Detail
            </DialogTitle>
            <DialogDescription>Full audit trail data for log ID: {selectedLog?.id}</DialogDescription>
          </DialogHeader>
          {selectedLog ? (
            <div className="space-y-4 text-sm text-slate-900 py-2 border-y my-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-500">Admin:</span>
                <span className="col-span-2 font-medium">{selectedLog.adminName || "System"} ({selectedLog.adminId})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-500">Admin Role:</span>
                <span className="col-span-2">{roleBadge(selectedLog.adminRole)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-500">Target User:</span>
                <span className="col-span-2 font-medium">{selectedLog.targetName} ({selectedLog.targetUserId})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-500">Action:</span>
                <span className="col-span-2">{actionBadge(selectedLog.action)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-500">State Change:</span>
                <span className="col-span-2 flex items-center gap-1">
                  {statusBadge(selectedLog.previousStatus)}
                  <span>&rarr;</span>
                  {statusBadge(selectedLog.newStatus)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-500">Reason:</span>
                <span className="col-span-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{selectedLog.reason}</span>
              </div>
              {selectedLog.notes && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold text-slate-500">Notes:</span>
                  <span className="col-span-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 whitespace-pre-wrap">{selectedLog.notes}</span>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold text-slate-500">IP Address:</span>
                  <span className="col-span-2 font-mono text-xs">{selectedLog.ipAddress}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-500">Timestamp:</span>
                <span className="col-span-2 font-medium">{new Date(selectedLog.createdAt).toString()}</span>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLog(null)} className="rounded-full">
              Close Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

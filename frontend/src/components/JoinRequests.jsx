import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth.js";

function JoinRequests({ workspaceId }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const { authFetch } = useAuth();

  const fetchRequests = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await authFetch(`/api/workspaces/${workspaceId}/join-requests`);
      // Backend returns { requests: [...], totalCount, myRole }
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách yêu cầu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchRequests();
    }
  }, [workspaceId]);

  const handleAccept = async (requestId) => {
    setActionLoading(requestId);
    try {
      await authFetch(
        `/api/workspaces/${workspaceId}/join-requests/${requestId}/accept`,
        { method: "PUT" }
      );
      // Remove from list after accepting
      setRequests(requests.filter((req) => req.id !== requestId));
    } catch (err) {
      setError(err.message || "Không thể chấp nhận yêu cầu");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading(requestId);
    try {
      await authFetch(
        `/api/workspaces/${workspaceId}/join-requests/${requestId}/reject`,
        { method: "PUT" }
      );
      // Remove from list after rejecting
      setRequests(requests.filter((req) => req.id !== requestId));
    } catch (err) {
      setError(err.message || "Không thể từ chối yêu cầu");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Yêu cầu tham gia ({requests.length})
        </h3>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500">
          Không có yêu cầu nào đang chờ duyệt
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {requests.map((request) => (
            <li key={request.id} className="flex items-center gap-4 px-4 py-3">
              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                {(request.fullName || request.username || "U").charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {request.fullName}
                </p>
                <p className="truncate text-xs text-gray-500">
                  @{request.username}
                </p>
                {request.createdAt && (
                  <p className="text-xs text-gray-400">
                    Gửi lúc: {new Date(request.createdAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(request.id)}
                  disabled={actionLoading === request.id}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === request.id ? "..." : "Chấp nhận"}
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={actionLoading === request.id}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === request.id ? "..." : "Từ chối"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default JoinRequests;

import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth.js";

function WorkspaceMembers({ workspaceId }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { authFetch } = useAuth();

  const fetchMembers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await authFetch(`/api/workspaces/${workspaceId}/members`);
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách thành viên");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Thành viên ({members.length})
        </h3>
      </div>

      {members.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500">
          Chưa có thành viên nào
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-4 px-4 py-3">
              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.fullName || member.username}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  (member.fullName || member.username || "U").charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {member.fullName}
                </p>
                <p className="truncate text-xs text-gray-500">
                  @{member.username}
                </p>
              </div>

              {/* Role Badge */}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  member.role === "WORKSPACE_ADMIN"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {member.role === "WORKSPACE_ADMIN" ? "Admin" : "Member"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default WorkspaceMembers;

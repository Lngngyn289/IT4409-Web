import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import CreateWorkspaceModal from "../components/CreateWorkspaceModal.jsx";
import UserMenu from "../components/UserMenu.jsx";

function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { authFetch, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await authFetch("/api/workspaces");
      setWorkspaces(data);
    } catch (err) {
      let errorMsg = err.message || "Không thể tải danh sách workspace";

      // Provide helpful error messages
      if (err.status === 401) {
        errorMsg = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (err.status === 500) {
        errorMsg = "Lỗi server khi tải workspaces. Vui lòng thử lại sau.";
      }

      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleWorkspaceClick = (workspaceId) => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleCreateSuccess = (newWorkspace) => {
    setWorkspaces([newWorkspace, ...workspaces]);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">
              HUST Collab Platform
            </h1>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content - Centered like Slack */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            Welcome back!
          </h1>
          <p className="text-lg text-gray-600">
            Choose a workspace to get back to working with your team.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Đang tải workspaces...</p>
            </div>
          </div>
        )}

        {/* Workspaces List - Slack style */}
        {!isLoading && workspaces.length > 0 && (
          <div className="space-y-3">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceClick(workspace.id)}
                className="group flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-5 text-left transition hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white">
                    {workspace.avatarUrl ? (
                      <img
                        src={workspace.avatarUrl}
                        alt={workspace.name}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      workspace.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {workspace.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {workspace.memberCount} {workspace.memberCount === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>
                <svg
                  className="h-6 w-6 text-gray-400 transition group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {!isLoading && workspaces.length > 0 && (
          <div className="relative my-12">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">OR</span>
            </div>
          </div>
        )}

        {/* Create New Workspace Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Create a new workspace
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-5 text-left transition hover:border-gray-300 hover:bg-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="text-base font-medium text-gray-900">
                Create a workspace
              </span>
            </div>
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </main>

      {/* Create Workspace Modal */}
      {isModalOpen && (
        <CreateWorkspaceModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}

export default WorkspaceList;

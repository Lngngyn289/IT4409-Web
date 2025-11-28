import { useState, useEffect, useCallback } from "react";
import { addChannelMember, getWorkspaceMembers, getChannelMembers } from "../api";
import useAuth from "../hooks/useAuth";

function AddChannelMemberModal({ workspaceId, channelId, onClose, onSuccess }) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState([]);
  const [channelMembers, setChannelMembers] = useState(new Set());
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const { authFetch } = useAuth(); // Get authFetch

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use authFetch via helper functions
      const [workspaceData, channelData] = await Promise.all([
        getWorkspaceMembers(workspaceId, authFetch),
        getChannelMembers(channelId, authFetch),
      ]);

      // data is WorkspaceMemberListResponseDto { members: [...], totalCount, myRole }
      const items = workspaceData.members || workspaceData.items || [];
      setMembers(Array.isArray(items) ? items : []);

      // Store existing channel member IDs in a Set for fast lookup
      // channelData might be array of members directly
      const existingMemberIds = new Set(
        (Array.isArray(channelData) ? channelData : []).map((m) => m.userId)
      );
      setChannelMembers(existingMemberIds);
    } catch (err) {
      console.error("Failed to fetch members", err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, channelId, authFetch]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Filter members based on search query and exclude existing channel members
  useEffect(() => {
    if (!query.trim()) {
      setFilteredMembers([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = members
      .filter((member) => !channelMembers.has(member.userId)) // Filter out existing members
      .filter(
        (member) =>
          member.fullName?.toLowerCase().includes(lowerQuery) ||
          member.username?.toLowerCase().includes(lowerQuery) ||
          member.email?.toLowerCase().includes(lowerQuery)
      );

    setFilteredMembers(filtered);
  }, [query, members, channelMembers]);

  const handleAddMember = async (userId, email) => {
    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = userId ? { userId } : { email };
      // Pass authFetch
      await addChannelMember(channelId, payload, authFetch);
      setSuccessMsg(`Đã thêm thành viên thành công!`);
      setTimeout(() => {
        setSuccessMsg("");
        // Reset query to allow adding more
        setQuery("");
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      let errorMsg = err.message || "Không thể thêm thành viên";
      if (err.status === 400) {
        errorMsg = "Thành viên đã có trong channel hoặc không tồn tại.";
      }
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Thêm thành viên
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Tìm kiếm thành viên (theo tên hoặc email)
            </label>
            <div className="relative">
                <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập tên hoặc email..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pl-10 text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
                </svg>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {successMsg}
            </div>
          )}

          {/* Search Results */}
          <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-800/50">
            {isLoading ? (
                <div className="p-4 text-center text-slate-400">Đang tải danh sách thành viên...</div>
            ) : query && filteredMembers.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                    <p>Không tìm thấy thành viên nào khớp với "{query}".</p>
                    {query.includes('@') && (
                        <button
                            onClick={() => handleAddMember(null, query)}
                            disabled={isSubmitting}
                            className="mt-2 text-indigo-400 hover:underline disabled:opacity-50"
                        >
                            Thêm bằng email: {query}
                        </button>
                    )}
                </div>
            ) : (
                filteredMembers.map((member) => (
                <div
                    key={member.id}
                    className="flex items-center justify-between border-b border-slate-700/50 p-3 last:border-0 hover:bg-slate-700/50"
                >
                    <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-medium text-white">
                        {(member.fullName?.[0] || member.username?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">{member.fullName || member.username}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                    </div>
                    <button
                    onClick={() => handleAddMember(member.userId, null)}
                    disabled={isSubmitting}
                    className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500 hover:text-white disabled:opacity-50"
                    >
                    Thêm
                    </button>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddChannelMemberModal;

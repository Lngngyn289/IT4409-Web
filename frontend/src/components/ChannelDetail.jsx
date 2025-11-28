import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { leaveChannel } from "../api";
import useAuth from "../hooks/useAuth";
import UpdateChannelModal from "./UpdateChannelModal";
import AddChannelMemberModal from "./AddChannelMemberModal";
import ChannelMembersModal from "./ChannelMembersModal";
import ChannelJoinRequestsModal from "./ChannelJoinRequestsModal";

function ChannelDetail() {
  const { channelId } = useParams();
  const { workspace, refreshChannels } = useOutletContext(); // Passed from WorkspaceLayout
  const { currentUser, authFetch } = useAuth();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  const fetchChannelData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // Use authFetch via helper functions
      const [channelData, membersData] = await Promise.all([
        authFetch(`/api/channels/${channelId}`),
        authFetch(`/api/channels/${channelId}/members`),
      ]);
      setChannel(channelData);
      setMembers(membersData);
    } catch (err) {
      console.error("Failed to fetch channel data", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [channelId, authFetch]);

  useEffect(() => {
    fetchChannelData();
  }, [fetchChannelData]);

  const handleUpdateSuccess = (updatedChannel) => {
    setChannel(updatedChannel);
    setIsUpdateModalOpen(false);
    if (refreshChannels) refreshChannels();
  };
  
  const handleDeleteSuccess = (deletedChannelId) => {
    setIsUpdateModalOpen(false);
    if (refreshChannels) refreshChannels();
    navigate(`/workspaces/${workspace.id}`);
  };

  const handleAddMemberSuccess = () => {
    fetchChannelData(true);
  };

  const handleLeaveChannel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn rời khỏi channel này?")) {
      return;
    }
    try {
      await leaveChannel(channelId, authFetch);
      if (refreshChannels) refreshChannels();
      navigate(`/workspace/${workspace.id}`);
    } catch (err) {
      alert(err.message || "Không thể rời channel");
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
    );
  }

  if (!channel) return <div className="p-6">Channel not found</div>;

  const isWorkspaceAdmin = workspace?.myRole === 'WORKSPACE_ADMIN';
  const isChannelAdmin = channel?.myRole === 'CHANNEL_ADMIN';
  const canManage = isWorkspaceAdmin || isChannelAdmin;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <div>
          <div className="flex items-center gap-2">
             <h2 className="text-xl font-bold text-gray-900">
               {channel.isPrivate ? "🔒" : "#"} {channel.name}
             </h2>
          </div>
          {channel.description && (
            <p className="text-sm text-gray-500">{channel.description}</p>
          )}
          {channel.joinCode && (
             <p className="text-xs text-gray-400 mt-1 cursor-pointer hover:text-gray-600" onClick={() => {
                navigator.clipboard.writeText(channel.joinCode);
                alert("Đã sao chép mã tham gia channel");
             }}>
                Mã tham gia: {channel.joinCode} (Sao chép)
             </p>
          )}
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={() => setIsMembersModalOpen(true)}
                className="text-sm font-medium text-gray-600 hover:underline"
            >
                {members.length} Members
            </button>
            
            {canManage && (
                <>
                {channel.isPrivate && (
                     <button
                        onClick={() => setIsRequestsModalOpen(true)}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                        Join Requests
                    </button>
                )}
                
                <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                >
                    + Add Member
                </button>
                <button
                    onClick={() => setIsUpdateModalOpen(true)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Channel Settings"
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    </svg>
                </button>
                </>
            )}
            
            <button
                onClick={handleLeaveChannel}
                className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                title="Leave Channel"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
      </div>

      {/* Main Content (Messages placeholder) */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex h-full items-center justify-center text-gray-400">
            <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Welcome to #{channel.name}!</h3>
                <p>This is the start of the {channel.name} channel.</p>
                <p className="mt-2 text-sm text-gray-500">{members.length} members</p>
            </div>
        </div>
      </div>
      
      {isUpdateModalOpen && (
        <UpdateChannelModal
            channel={channel}
            onClose={() => setIsUpdateModalOpen(false)}
            onSuccess={handleUpdateSuccess}
            onDelete={handleDeleteSuccess}
        />
      )}

      {isAddMemberModalOpen && (
        <AddChannelMemberModal
            workspaceId={workspace.id}
            channelId={channelId}
            onClose={() => setIsAddMemberModalOpen(false)}
            onSuccess={handleAddMemberSuccess}
        />
      )}

      {isMembersModalOpen && (
        <ChannelMembersModal
            channelId={channelId}
            onClose={() => setIsMembersModalOpen(false)}
            onUpdate={() => fetchChannelData(true)}
        />
      )}

      {isRequestsModalOpen && (
        <ChannelJoinRequestsModal
            channelId={channelId}
            onClose={() => setIsRequestsModalOpen(false)}
            onUpdate={() => fetchChannelData(true)}
        />
      )}
    </div>
  );
}

export default ChannelDetail;

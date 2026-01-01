import VideoTile from "./VideoTile";

function VideoGrid({ participants, localParticipant, screenShare }) {
  // If someone is screen sharing, show screen share prominently
  if (screenShare) {
    // Check if the screen share is from the local participant
    const isLocalScreenShare = screenShare.local ||
                                screenShare.session_id === localParticipant?.session_id;

    // Get displayed participants (max 4)
    const allRemote = Object.values(participants);
    const displayedRemote = allRemote.slice(0, 3); // Max 3 remote participants in sidebar
    const extraCount = allRemote.length - displayedRemote.length;

    return (
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Main area - screen share */}
        <div className="flex-1 flex items-center justify-center">
          <VideoTile participant={screenShare} isScreenShare={true} isLocal={isLocalScreenShare} />
        </div>

        {/* Sidebar with participants - max 4 tiles */}
        <div className="w-64 flex flex-col gap-3 overflow-y-auto">
          {/* Local participant - only show if NOT screen sharing */}
          {localParticipant && !isLocalScreenShare && (
            <VideoTile participant={localParticipant} isLocal={true} />
          )}

          {/* Remote participants - show max 3 */}
          {displayedRemote.map((participant) => (
            <VideoTile key={participant.session_id} participant={participant} />
          ))}

          {/* Show +N badge if there are more participants */}
          {extraCount > 0 && (
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center border-2 border-indigo-500">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">+{extraCount}</div>
                <p className="text-sm text-gray-400 mt-2">more participants</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular grid layout - max 4 participants displayed
  const allParticipants = [
    localParticipant && { ...localParticipant, isLocal: true },
    ...Object.values(participants),
  ].filter(Boolean);

  // Show only first 4 participants
  const displayedParticipants = allParticipants.slice(0, 4);
  const extraParticipants = allParticipants.length - displayedParticipants.length;

  const participantCount = displayedParticipants.length;

  // Determine grid layout based on participant count (max 4 = 2x2)
  let gridClass = "grid gap-4 p-4 h-full";
  if (participantCount === 1) {
    gridClass += " grid-cols-1";
  } else if (participantCount === 2) {
    gridClass += " grid-cols-2";
  } else if (participantCount === 3) {
    gridClass += " grid-cols-2";
  } else if (participantCount === 4) {
    gridClass += " grid-cols-2 grid-rows-2";
  }

  return (
    <div className={gridClass}>
      {displayedParticipants.map((participant, index) => (
        <div key={participant.session_id || `local-${index}`} className="min-h-0 flex items-center justify-center">
          <VideoTile
            participant={participant}
            isLocal={participant.isLocal}
          />
        </div>
      ))}

      {/* Show +N badge if there are more participants */}
      {extraParticipants > 0 && participantCount < 4 && (
        <div className="bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center border-2 border-indigo-500">
          <div className="text-center">
            <div className="text-5xl font-bold text-white">+{extraParticipants}</div>
            <p className="text-sm text-gray-400 mt-2">more</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoGrid;

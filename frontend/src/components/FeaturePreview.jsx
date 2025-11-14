import { useEffect, useState } from "react";

const heroPhrases = ["Where work happens", "Nơi workspace kết nối", "Channel cùng sáng tạo"];

const workspaces = [
  { name: "Marketing Squad", members: 18, color: "from-rose-500 to-orange-400" },
  { name: "HUST Lab R&D", members: 32, color: "from-indigo-500 to-purple-500" },
];

const channels = [
  { name: "#general", unread: 4 },
  { name: "#hust", unread: 2 },
  { name: "#events", unread: 0 },
];

const highlights = [
  { label: "Workspace", value: "12+", desc: "Quản lý nhóm" },
  { label: "Channel", value: "58", desc: "Trao đổi realtime" },
  { label: "Tin nhắn/ngày", value: "3.5K", desc: "Message từ Prisma schema" },
];

const sampleMessages = [
  {
    author: "Kuron",
    avatar: "KR",
    channel: "#general",
    text: "Plan mới đã được chấp nhận, triển khai giúp mình nhé!",
    time: "2m trước",
  },
  {
    author: "Việt Hùng",
    avatar: "VH",
    channel: "#hust",
    text: "Đã lên plan demo Workspace vào 15:00.",
    time: "10m trước",
  },
];

function FeaturePreview({ variant = "scroll" }) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % heroPhrases.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const wrapperClass =
    variant === "static"
      ? "order-2 flex flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-700/60 via-purple-700/50 to-slate-950/70 p-4 text-white shadow-xl shadow-indigo-900/60 lg:order-1 lg:p-6"
      : "order-2 flex max-h-[80vh] flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-700/60 via-purple-700/50 to-slate-950/70 p-4 text-white shadow-xl shadow-indigo-900/60 lg:order-1 lg:p-6";

  const bodyClass =
    variant === "static"
      ? "mt-4 space-y-4"
      : `mt-4 flex-1 space-y-4 overflow-y-auto ${
          variant === "hidden-scroll" ? "no-scrollbar" : "custom-scroll pr-1"
        }`;

  const bodyStyle =
    variant === "hidden-scroll"
      ? { scrollbarWidth: "none", msOverflowStyle: "none" }
      : undefined;

  return (
    <aside className={wrapperClass}>
      <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl bg-white/10 p-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-200/90">Where work happens</p>
        <h3 className="mt-4 text-4xl font-semibold leading-tight">
          <span className="gradient-animated-text bg-clip-text text-transparent">
            {heroPhrases[phraseIndex]}
          </span>
        </h3>
      </div>

      <div className={bodyClass} style={bodyStyle}>
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
          {workspaces.map((ws) => (
            <div
              key={ws.name}
              className={`rounded-2xl bg-gradient-to-r ${ws.color} p-4 text-sm font-semibold shadow-inner shadow-black/30`}
            >
              <p className="text-base font-semibold text-white/90">{ws.name}</p>
              <p className="text-xs text-white/70">{ws.members} thành viên hoạt động</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-slate-950/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-200">Channel đang theo dõi</p>
            <span className="text-xs text-indigo-200/80">Realtime sync</span>
          </div>
          <div className="space-y-2">
            {channels.map((channel) => (
              <div
                key={channel.name}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm"
              >
                <span>{channel.name}</span>
                {channel.unread > 0 && (
                  <span className="rounded-full bg-amber-400/80 px-2 py-0.5 text-xs font-semibold text-slate-900">
                    {channel.unread}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-slate-950/40 p-4">
          {sampleMessages.map((msg) => (
            <div key={msg.author} className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-200/80">
                <span>{msg.channel}</span>
                <span>{msg.time}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/70 font-semibold">
                  {msg.avatar}
                </div>
                <div>
                  <p className="font-semibold">{msg.author}</p>
                  <p className="text-slate-100/80">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 rounded-2xl bg-slate-950/60 p-4">
          {highlights.map((highlight) => (
            <div key={highlight.label} className="flex-1">
              <p className="text-2xl font-semibold">{highlight.value}</p>
              <p className="text-sm text-slate-300">{highlight.label}</p>
              <p className="text-xs text-slate-400">{highlight.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default FeaturePreview;

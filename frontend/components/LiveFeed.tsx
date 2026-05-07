import React from "react";
import { Commentary } from "../types";

interface LiveFeedProps {
  messages: Commentary[];
  isActive: boolean;
  isLoading?: boolean;
}

const formatMinute = (minute?: number) => {
  if (minute === undefined || minute === null) {
    return null;
  }
  return `${minute}'`;
};

const formatMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }
  try {
    return JSON.stringify(metadata);
  } catch {
    return null;
  }
};

export const LiveFeed: React.FC<LiveFeedProps> = ({
  messages,
  isActive,
  isLoading,
}) => {
  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-brand-bg border border-slate-700 rounded-xl border-dashed">
        <div className="w-16 h-16 bg-brand-accent rounded-full border border-slate-700 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2">No Match Selected</h3>
        <p className="text-brand-text-muted max-w-xs">
          Select a match from the list to view live commentary and real-time
          updates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-brand-card border border-slate-700 rounded-xl overflow-hidden shadow-lg shadow-black/50">
      <div className="p-4 bg-brand-accent border-b-2 border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-lg">Live Commentary</h3>
        <span className="text-xs bg-brand-card px-2 py-0.5 border border-slate-700 rounded-md font-medium">
          Real-time
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoading ? (
          <div className="text-center py-10 text-brand-text-muted italic">
            Loading commentary...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-brand-text-muted italic">
            Waiting for updates...
          </div>
        ) : (
          messages.map((msg) => {
            const timestamp = msg.createdAt
              ? new Date(msg.createdAt)
              : new Date();
            const minuteLabel = formatMinute(msg.minute);
            const metadataLabel = formatMetadata(msg.metadata);
            return (
              <div
                key={msg.id}
                className="animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-brand-accent border border-slate-700"></div>
                    <div className="w-0.5 h-full bg-gray-200"></div>
                  </div>
                  <div className="pb-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-brand-text-muted mb-1">
                      <span className="font-mono text-brand-text-muted  bg-brand-bg border border-slate-700 px-2 py-0.5 rounded">
                        {timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      {minuteLabel && (
                        <span className="px-2 py-0.5 bg-brand-bg border border-slate-700 rounded-full font-semibold">
                          {minuteLabel}
                        </span>
                      )}
                      {msg.sequence !== undefined && msg.sequence !== null && (
                        <span className="px-2 py-0.5 bg-brand-bg border border-slate-700 rounded-full font-semibold">
                          Seq {msg.sequence}
                        </span>
                      )}
                      {msg.period && (
                        <span className="px-2 py-0.5 bg-brand-bg border border-slate-700 rounded-full">
                          {msg.period}
                        </span>
                      )}
                      {msg.eventType && (
                        <span className="px-2 py-0.5 bg-brand-accent border border-slate-700 rounded-full font-semibold uppercase tracking-wide text-[10px] text-brand-text-main">
                          {msg.eventType}
                        </span>
                      )}
                    </div>
                    {(msg.actor || msg.team) && (
                      <div className="text-xs font-semibold text-brand-text-muted mb-2">
                        {msg.actor ? msg.actor : "Unknown"}
                        {msg.team ? ` · ${msg.team}` : ""}
                      </div>
                    )}
                    <p className="text-sm font-medium text-brand-text-main leading-relaxed bg-brand-bg p-3 rounded-xl rounded-tl-none border border-slate-700">
                      {msg.message}
                    </p>
                    {metadataLabel && (
                      <div className="mt-2 text-[11px] font-mono text-brand-text-muted bg-brand-card border border-slate-700 px-2 py-1 rounded text-brand-text-main">
                        {metadataLabel}
                      </div>
                    )}
                    {msg.tags && msg.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.tags.map((tag) => (
                          <span
                            key={`${msg.id}-${tag}`}
                            className="text-[10px] uppercase tracking-wide text-brand-text-muted bg-brand-card border border-slate-700 px-2 py-0.5 rounded-full text-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

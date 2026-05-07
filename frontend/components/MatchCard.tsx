import React, { useEffect, useRef, useState } from 'react';
import { Match } from '../types';

interface MatchCardProps {
  match: Match;
  isActive: boolean;
  onWatch: (id: string | number) => void;
  onUnwatch: (id: string | number) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, isActive, onWatch, onUnwatch }) => {
  // Handle case-insensitive status check from API
  const statusLower = match.status.toLowerCase();
  const isLive = statusLower === 'live';
  const [homePulse, setHomePulse] = useState(false);
  const [awayPulse, setAwayPulse] = useState(false);
  const prevScoreRef = useRef({ home: match.homeScore, away: match.awayScore });
  const pulseTimeoutRef = useRef<{ home?: ReturnType<typeof setTimeout>; away?: ReturnType<typeof setTimeout> }>({});
  
  const actionLabel = (() => {
    if (isLive) {
      return isActive ? 'Watching Live' : 'Watch Live';
    }
    if (statusLower === 'finished') {
      return isActive ? 'Viewing Recap' : 'View Recap';
    }
    return isActive ? 'Viewing Match' : 'View Match';
  })();

  useEffect(() => {
    const prevScore = prevScoreRef.current;
    const homeChanged = prevScore.home !== match.homeScore;
    const awayChanged = prevScore.away !== match.awayScore;

    if (homeChanged) {
      setHomePulse(true);
      if (pulseTimeoutRef.current.home) {
        clearTimeout(pulseTimeoutRef.current.home);
      }
      pulseTimeoutRef.current.home = setTimeout(() => {
        setHomePulse(false);
      }, 900);
    }

    if (awayChanged) {
      setAwayPulse(true);
      if (pulseTimeoutRef.current.away) {
        clearTimeout(pulseTimeoutRef.current.away);
      }
      pulseTimeoutRef.current.away = setTimeout(() => {
        setAwayPulse(false);
      }, 900);
    }

    prevScoreRef.current = { home: match.homeScore, away: match.awayScore };

    return () => {
      if (pulseTimeoutRef.current.home) {
        clearTimeout(pulseTimeoutRef.current.home);
      }
      if (pulseTimeoutRef.current.away) {
        clearTimeout(pulseTimeoutRef.current.away);
      }
    };
  }, [match.homeScore, match.awayScore]);
  
  // Format status for display (Capitalize first letter)
  const displayStatus = match.status.charAt(0).toUpperCase() + match.status.slice(1).toLowerCase();

  return (
    <div className={`
      relative p-5 rounded-xl border border-slate-700 bg-brand-card transition-all duration-200
      ${isActive ? 'shadow-lg shadow-black/50 translate-x-[-2px] translate-y-[-2px] ring-2 ring-brand-accent ring-offset-2' : 'hover:shadow-lg shadow-black/50-sm'}
    `}>
      {/* Header: Sport & Status */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted border border-slate-700 rounded-full px-2 py-0.5">
          {match.sport}
        </span>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-live border border-slate-700"></span>
            </span>
          )}
          <span className={`text-sm font-medium ${isLive ? 'text-brand-live' : 'text-brand-text-muted'}`}>
            {displayStatus}
          </span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg text-brand-text-main line-clamp-1">{match.homeTeam}</span>
          <span
            className={`
              font-bold text-2xl border border-slate-700 rounded-lg px-3 py-1 min-w-[3rem] text-center transition-colors
              ${homePulse ? 'bg-brand-accent animate-pulse' : 'bg-brand-bg'}
            `}
          >
            {match.homeScore}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg text-brand-text-main line-clamp-1">{match.awayTeam}</span>
          <span
            className={`
              font-bold text-2xl border border-slate-700 rounded-lg px-3 py-1 min-w-[3rem] text-center transition-colors
              ${awayPulse ? 'bg-brand-accent animate-pulse' : 'bg-brand-bg'}
            `}
          >
            {match.awayScore}
          </span>
        </div>
      </div>

      {/* Footer: Action */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-gray-100 border-dashed">
        <span className="text-xs text-brand-text-muted font-medium">
          {new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWatch(match.id)}
            disabled={isActive}
            className={`
              px-4 py-2 rounded-full font-bold text-sm border border-slate-700 transition-all
              ${isActive 
                ? 'bg-brand-accent text-brand-text-main cursor-default opacity-100' 
                : 'bg-brand-accent text-brand-text-main hover:bg-yellow-300 active:translate-y-0.5'
              }
            `}
          >
            {actionLabel}
          </button>
          {isActive && (
            <button
              onClick={() => onUnwatch(match.id)}
              className="px-3 py-2 rounded-full font-bold text-xs border border-slate-700 bg-brand-card hover:bg-brand-bg transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

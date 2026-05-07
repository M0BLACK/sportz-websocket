export function extractRuns(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  if (Number.isFinite(entry.runs)) {
    return entry.runs;
  }

  if (entry.metadata && Number.isFinite(entry.metadata.runs)) {
    return entry.metadata.runs;
  }

  if (entry.eventType === "four") {
    return 4;
  }

  if (entry.eventType === "six") {
    return 6;
  }

  if (entry.eventType === "run") {
    return 1;
  }

  return null;
}

export function scoreDeltaFromEntry(entry, match) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  if (entry.scoreDelta && typeof entry.scoreDelta === "object") {
    return {
      home: Number(entry.scoreDelta.home || 0),
      away: Number(entry.scoreDelta.away || 0),
    };
  }

  if (entry.eventType === "goal") {
    if (entry.team === match.homeTeam) {
      return { home: 1, away: 0 };
    }
    if (entry.team === match.awayTeam) {
      return { home: 0, away: 1 };
    }
  }

  const runs = extractRuns(entry);
  if (runs !== null) {
    if (entry.team === match.homeTeam) {
      return { home: runs, away: 0 };
    }
    if (entry.team === match.awayTeam) {
      return { home: 0, away: runs };
    }
  }

  return null;
}

export function isNonZeroScoreDelta(delta) {
  if (!delta || typeof delta !== "object") {
    return false;
  }
  return Number(delta.home || 0) !== 0 || Number(delta.away || 0) !== 0;
}

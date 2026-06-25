import type { ImpactState, RadarState } from "../types/impact";
import { radarSentence } from "../utils/radarState";

interface TopBarProps {
  payload: ImpactState | null;
  radar: RadarState | null;
  connectionStatus: string;
}

export function TopBar({ payload, radar, connectionStatus }: TopBarProps) {
  const pass = payload?.summary.status === "passing";
  const sentence = radarSentence(payload, radar);

  return (
    <header className="topbar">
      <div className="brand">
        <h1>{payload ? `${payload.skill.id} 文件关系图谱` : "Skill 文件关系图谱"}</h1>
        <div className="subtitle">
          {payload ? `${payload.skill.relativeDir} · ${payload.generatedAt}` : connectionStatus}
        </div>
      </div>
      <div className="summary">
        {payload ? (
          <>
            <span className={`metric radar ${pass ? "pass" : "fail"}`}>{sentence}</span>
            <span className={`metric ${pass ? "pass" : "fail"}`}>{pass ? "strict passing" : "strict failing"}</span>
            <span className="metric">changed {payload.summary.changedFiles}</span>
            <span className={`metric ${payload.summary.failureCount ? "fail" : "pass"}`}>failures {payload.summary.failureCount}</span>
          </>
        ) : (
          <span className="metric">connecting</span>
        )}
      </div>
    </header>
  );
}

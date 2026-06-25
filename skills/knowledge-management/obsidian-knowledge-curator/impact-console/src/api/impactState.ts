import type { ImpactState } from "../types/impact";

export async function loadImpactState() {
  const response = await fetch("/api/state", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`加载 impact state 失败：${response.status}`);
  }
  return response.json() as Promise<ImpactState>;
}

export function connectImpactEvents(onState: (state: ImpactState) => void, onError: () => void) {
  const source = new EventSource("/events");

  source.addEventListener("graph", (event) => {
    onState(JSON.parse(event.data) as ImpactState);
  });

  source.onerror = onError;

  return () => source.close();
}

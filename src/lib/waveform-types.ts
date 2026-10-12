export type WaveValue = 0 | 1 | "x";
export interface WaveSegment {
  d: number;
  v: WaveValue;
  label?: string;
}
export interface WaveChannel {
  name: string;
  color: string;
  segments: WaveSegment[];
}
export function totalUnits(channels: WaveChannel[]) {
  return Math.max(
    0,
    ...channels.map((c) => c.segments.reduce((sum, s) => sum + s.d, 0)),
  );
}

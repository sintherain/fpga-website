export type BurstKind = "INCR" | "FIXED" | "WRAP";

/** 对齐起始地址的教学模型；非对齐地址的首拍规则须另行处理。 */
export function burstAddresses(
  start: number,
  beats: number,
  bytes: number,
  kind: BurstKind,
) {
  const span = beats * bytes;
  const boundary = Math.floor(start / span) * span;
  return Array.from({ length: beats }, (_, i) => {
    if (kind === "FIXED") return start;
    if (kind === "WRAP")
      return boundary + ((start - boundary + i * bytes) % span);
    return start + i * bytes;
  });
}

export function crosses4KiB(
  start: number,
  beats: number,
  bytes: number,
  kind: BurstKind,
) {
  return burstAddresses(start, beats, bytes, kind).some(
    (address) =>
      Math.floor((address + bytes - 1) / 4096) !== Math.floor(start / 4096),
  );
}

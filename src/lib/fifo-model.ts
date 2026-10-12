export function fifoOperation(
  queue: number[],
  value: number,
  write: boolean,
  read: boolean,
  capacity: number,
) {
  const doWrite = write && queue.length < capacity,
    doRead = read && queue.length > 0;
  const next = doRead ? queue.slice(1) : [...queue];
  if (doWrite) next.push(value);
  return { queue: next, wrote: doWrite, read: doRead ? queue[0] : null };
}

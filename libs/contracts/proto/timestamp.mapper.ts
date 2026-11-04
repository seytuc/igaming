import type { Timestamp } from './generate/google/protobuf/timestamp';

export function toProtoTimestamp(milliseconds = Date.now()): Timestamp {
  const seconds = Math.floor(milliseconds / 1000);

  return {
    seconds,
    nanos: (milliseconds - seconds * 1000) * 1000000,
  };
}

export function fromProtoTimestamp(timestamp: Timestamp): Date {
  const milliseconds = Number(
    timestamp.seconds * 1000 + Math.floor(timestamp.nanos / 1000000),
  );

  return new Date(milliseconds);
}

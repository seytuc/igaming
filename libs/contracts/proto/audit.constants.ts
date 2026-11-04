export const AUDIT_PROTO_PATH = 'libs/contracts/proto/audit.proto';
export const AUDIT_GRPC_PORT = 50051;
export const CORRELATION_ID_METADATA_KEY = 'x-correlation-id';
export const AUDIT_RPC = {
  recordEvent: 'EventRecord',
  ping: 'Ping',
} as const;

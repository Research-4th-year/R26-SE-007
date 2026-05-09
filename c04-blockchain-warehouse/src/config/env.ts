import dotenv from 'dotenv';
import path from 'path';
 
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
 
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}
 
export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development',
  },
  db: { url: requireEnv('DATABASE_URL') },
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  bcrypt: { rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10) },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  },
  gnn: { serviceUrl: process.env.GNN_SERVICE_URL || 'http://localhost:8000' },

  fabric: {
  peerEndpoint:  requireEnv('FABRIC_PEER_ENDPOINT'),
  peerHostAlias: requireEnv('FABRIC_PEER_HOST_ALIAS'),
  channelName:   requireEnv('FABRIC_CHANNEL_NAME'),
  chaincodeName: requireEnv('FABRIC_CHAINCODE_NAME'),
  mspId:         requireEnv('FABRIC_MSP_ID'),
  certPath:      requireEnv('FABRIC_CERT_PATH'),
  keyPath:       requireEnv('FABRIC_KEY_PATH'),
  tlsCertPath:   requireEnv('FABRIC_TLS_CERT_PATH'),
},

} as const;

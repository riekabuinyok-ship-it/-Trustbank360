// TrustBank360 IndexedDB Schema
// Database: trustbank360_v1
// Version: 3 (added providers, commissionSettings stores)

export const DB_NAME = "trustbank360_v1"
export const DB_VERSION = 5

export interface StoreSchema {
  name: string
  keyPath: string
  indexes?: { name: string; keyPath: string | string[]; options?: IDBIndexParameters }[]
}

export const STORES: StoreSchema[] = [
  {
    name: "customers",
    keyPath: "id",
    indexes: [
      { name: "by_phone", keyPath: "phone" },
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_createdAt", keyPath: "createdAt" },
    ],
  },
  {
    name: "transfers",
    keyPath: "id",
    indexes: [
      { name: "by_transactionNumber", keyPath: "transactionNumber", options: { unique: true } },
      { name: "by_secretCode", keyPath: "secretCode" },
      { name: "by_status", keyPath: "status" },
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_createdAt", keyPath: "createdAt" },
      { name: "by_senderId", keyPath: "senderId" },
      { name: "by_receiverId", keyPath: "receiverId" },
    ],
  },
  {
    name: "staff",
    keyPath: "id",
    indexes: [
      { name: "by_email", keyPath: "email", options: { unique: true } },
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_branchId", keyPath: "branchId" },
      { name: "by_role", keyPath: "role" },
    ],
  },
  {
    name: "branches",
    keyPath: "id",
    indexes: [
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_code", keyPath: "code", options: { unique: true } },
    ],
  },
  {
    name: "exchangeRates",
    keyPath: "id",
    indexes: [
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_fromCurrency", keyPath: "fromCurrency" },
    ],
  },
  {
    name: "wallets",
    keyPath: "id",
    indexes: [
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_branchId", keyPath: "branchId" },
      { name: "by_currency", keyPath: "currency" },
    ],
  },
  {
    name: "announcements",
    keyPath: "id",
    indexes: [
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_createdAt", keyPath: "createdAt" },
    ],
  },
  {
    name: "dashboard",
    keyPath: "key",
  },
  {
    name: "reports",
    keyPath: "id",
    indexes: [
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_name", keyPath: "name" },
    ],
  },
  {
    name: "syncQueue",
    keyPath: "id",
    indexes: [
      { name: "by_status", keyPath: "status" },
      { name: "by_tableName", keyPath: "tableName" },
      { name: "by_createdAt", keyPath: "createdAt" },
      { name: "by_companyId", keyPath: "companyId" },
    ],
  },
  {
    name: "syncConflicts",
    keyPath: "id",
    indexes: [
      { name: "by_status", keyPath: "status" },
      { name: "by_tableName", keyPath: "tableName" },
      { name: "by_conflictType", keyPath: "conflictType" },
      { name: "by_createdAt", keyPath: "createdAt" },
      { name: "by_companyId", keyPath: "companyId" },
    ],
  },
  {
    name: "offlineAuditLogs",
    keyPath: "id",
    indexes: [
      { name: "by_synced", keyPath: "syncedAt" },
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_createdAt", keyPath: "createdAt" },
    ],
  },
  {
    name: "pendingPayouts",
    keyPath: "id",
    indexes: [
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_status", keyPath: "status" },
    ],
  },
  {
    name: "auth",
    keyPath: "id",
    indexes: [
      { name: "by_email", keyPath: "email" },
    ],
  },
  {
    name: "devices",
    keyPath: "id",
    indexes: [
      { name: "by_userId", keyPath: "userId" },
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_fingerprint", keyPath: "fingerprint" },
    ],
  },
  {
    name: "settings",
    keyPath: "key",
  },
  {
    name: "seedMeta",
    keyPath: "companyId",
  },
  {
    name: "apiCache",
    keyPath: "key",
    indexes: [
      { name: "by_cachedAt", keyPath: "cachedAt" },
    ],
  },
  {
    name: "notifications",
    keyPath: "id",
    indexes: [
      { name: "by_userId", keyPath: "userId" },
      { name: "by_companyId", keyPath: "companyId" },
      { name: "by_readAt", keyPath: "readAt" },
    ],
  },
  {
    name: "providers",
    keyPath: "id",
    indexes: [
      { name: "by_companyId", keyPath: "companyId" },
    ],
  },
  {
    name: "commissionSettings",
    keyPath: "id",
    indexes: [
      { name: "by_companyId", keyPath: "companyId" },
    ],
  },
]

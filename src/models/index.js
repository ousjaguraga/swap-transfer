// Plain enum constants — replaces the Gen 1 Amplify DataStore-generated models.
// In Amplify Gen 2 (generateClient), enum fields are plain strings, so these
// objects just provide named constants. Values MUST match the enums declared
// in amplify/data/resource.ts.

export const TransferStatus = {
  SENT: 'SENT',
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
};

export const CollectionMethod = {
  CASH: 'CASH',
  WAVE: 'WAVE',
  AFRIMONEY: 'AFRIMONEY',
  CREDIT: 'CREDIT',
};

export const AgentType = {
  AGENT: 'AGENT',
  GAGENT: 'GAGENT',
};

export const CashFlowType = {
  TOP_UP: 'TOP_UP',
  DELIVERY: 'DELIVERY',
  ADJUSTMENT: 'ADJUSTMENT',
};

/**
 * Regression tests for cashflow risk fixes.
 * Focus areas:
 * - Pagination (no silent truncation)
 * - Fail-fast settlement before period reset
 * - No transaction creation when settlement fails
 */

jest.mock('aws-amplify', () => ({
  API: {
    graphql: jest.fn(),
  },
  Auth: {
    currentAuthenticatedUser: jest.fn(),
  },
}));

jest.mock('../src/models', () => ({
  TransferStatus: {
    SENT: 'SENT',
    PAID: 'PAID',
    PENDING: 'PENDING',
    CANCELLED: 'CANCELLED',
  },
}));

const { API } = require('aws-amplify');
const farm = require('../farm');

const listTransfersResp = (items, nextToken = null) => ({
  data: {
    listTransfers: {
      items,
      nextToken,
    },
  },
});

const cashflowTxResp = (items, nextToken = null) => ({
  data: {
    cashFlowTransactionsByAgentBalanceId: {
      items,
      nextToken,
    },
  },
});

describe('Cashflow regressions', () => {
  beforeEach(() => {
    API.graphql.mockReset();
  });

  it('paginates getCashFlowTransactions across all pages', async () => {
    API.graphql
      .mockResolvedValueOnce(cashflowTxResp([{ id: 'tx1' }], 'N1'))
      .mockResolvedValueOnce(cashflowTxResp([{ id: 'tx2' }], null));

    const result = await farm.getCashFlowTransactions('balance-1');

    expect(result).toEqual([{ id: 'tx1' }, { id: 'tx2' }]);
    expect(API.graphql).toHaveBeenCalledTimes(2);
  });

  it('calculateGAgentBalance includes all pages and deduplicates legacy overlap', async () => {
    const agentBalance = {
      id: 'ab-1',
      agentType: 'GAGENT',
      agentEmail: 'g@example.com',
      agentName: 'G Agent',
      openingBalance: 1000,
      periodStartDate: null,
    };

    API.graphql
      // Email query pages
      .mockResolvedValueOnce(listTransfersResp([
        { id: 't1', payoutAmountGMD: 100, status: 'PAID' },
      ], 'T1'))
      .mockResolvedValueOnce(listTransfersResp([
        { id: 't2', payoutAmountGMD: 150, status: 'PAID' },
      ], null))
      // Name query pages (includes one duplicate t2)
      .mockResolvedValueOnce(listTransfersResp([
        { id: 't2', payoutAmountGMD: 150, status: 'PAID' },
        { id: 't3', payoutAmountGMD: 250, status: 'PAID' },
      ], null))
      // Manual transactions pages
      .mockResolvedValueOnce(cashflowTxResp([
        { id: 'm1', transactionType: 'TOP_UP', amount: 200, createdAt: '2026-04-01T00:00:00.000Z' },
      ], 'M1'))
      .mockResolvedValueOnce(cashflowTxResp([
        { id: 'm2', transactionType: 'ADJUSTMENT', amount: -50, createdAt: '2026-04-01T01:00:00.000Z' },
      ], null));

    const result = await farm.calculateGAgentBalance(agentBalance);

    expect(result.totalPayouts).toBe(500);
    expect(result.totalTopUps).toBe(200);
    expect(result.totalAdjustments).toBe(-50);
    expect(result.paidTransfersCount).toBe(3);
    expect(result.calculatedBalance).toBe(650);
  });

  it('calculateAgentBalance includes all pages, excludes cancelled, and applies manual txs', async () => {
    const agentBalance = {
      id: 'ab-2',
      agentType: 'AGENT',
      agentId: 'agent-1',
      agentName: 'UK Agent',
      openingBalance: 20,
      periodStartDate: null,
    };

    API.graphql
      // getAgent -> cognitoSub
      .mockResolvedValueOnce({ data: { getAgent: { id: 'agent-1', cognitoSub: 'sub-1' } } })
      // createdById pages
      .mockResolvedValueOnce(listTransfersResp([
        { id: 'a1', amount: 100, status: 'PAID', createdAt: '2026-04-01T00:00:00.000Z' },
        { id: 'a2', amount: 50, status: 'CANCELLED', createdAt: '2026-04-01T00:00:00.000Z' },
      ], 'A1'))
      .mockResolvedValueOnce(listTransfersResp([
        { id: 'a3', amount: 70, status: 'SENT', createdAt: '2026-04-01T00:00:00.000Z' },
      ], null))
      // legacy name page (includes duplicate a3)
      .mockResolvedValueOnce(listTransfersResp([
        { id: 'a3', amount: 70, status: 'SENT', createdAt: '2026-04-01T00:00:00.000Z' },
        { id: 'a4', amount: 30, status: 'PAID', createdAt: '2026-04-01T00:00:00.000Z' },
      ], null))
      // manual tx pages
      .mockResolvedValueOnce(cashflowTxResp([
        { id: 'd1', transactionType: 'DELIVERY', amount: 40, createdAt: '2026-04-01T02:00:00.000Z' },
      ], 'D1'))
      .mockResolvedValueOnce(cashflowTxResp([
        { id: 'adj1', transactionType: 'ADJUSTMENT', amount: -10, createdAt: '2026-04-01T03:00:00.000Z' },
      ], null));

    const result = await farm.calculateAgentBalance(agentBalance);

    expect(result.totalCollections).toBe(200);
    expect(result.totalDeliveries).toBe(40);
    expect(result.totalAdjustments).toBe(-10);
    expect(result.transfersCount).toBe(3);
    expect(result.calculatedBalance).toBe(170);
  });

  it('recordDelivery fails fast on partial settlement and does not reset period or create delivery tx', async () => {
    const agentBalance = {
      id: 'ab-3',
      agentType: 'AGENT',
      agentId: 'agent-3',
      agentName: 'Agent 3',
      openingBalance: 0,
      periodStartDate: null,
    };

    API.graphql
      // calculateAgentBalance -> getAgent
      .mockResolvedValueOnce({ data: { getAgent: { id: 'agent-3', cognitoSub: 'sub-3' } } })
      // createdById transfers
      .mockResolvedValueOnce(listTransfersResp([
        { id: 's1', amount: 100, status: 'PAID', createdAt: '2026-04-01T00:00:00.000Z', agentSettled: false },
        { id: 's2', amount: 80, status: 'PAID', createdAt: '2026-04-01T00:00:00.000Z', agentSettled: false },
      ], null))
      // legacy by name
      .mockResolvedValueOnce(listTransfersResp([], null))
      // manual txs
      .mockResolvedValueOnce(cashflowTxResp([], null))
      // settlement report
      .mockResolvedValueOnce({ data: { createTransferReport: { id: 'rpt-1' } } })
      // settle s1 success
      .mockResolvedValueOnce({ data: { updateTransfer: { id: 's1' } } })
      // settle s2 fails
      .mockRejectedValueOnce(new Error('network fail'));

    await expect(
      farm.recordDelivery('ab-3', 'agent-3', 'Agent 3', 50, 'delivery', 'admin', agentBalance, null)
    ).rejects.toThrow('Failed to settle 1 transfer(s) for Agent before period reset');

    const calls = API.graphql.mock.calls.map(([arg]) => arg);
    const hasPeriodReset = calls.some((c) => c?.variables?.input?.periodStartDate);
    const hasDeliveryTx = calls.some((c) => c?.variables?.input?.transactionType === 'DELIVERY');

    expect(hasPeriodReset).toBe(false);
    expect(hasDeliveryTx).toBe(false);
  });

  it('recordTopUp fails fast on partial settlement and does not reset period or create top-up tx', async () => {
    const gagentBalance = {
      id: 'ab-4',
      agentType: 'GAGENT',
      agentId: 'gagent-1',
      agentName: 'G Agent 1',
      agentEmail: 'g1@example.com',
      openingBalance: 0,
      periodStartDate: null,
    };

    API.graphql
      // calculateGAgentBalance - by email transfers
      .mockResolvedValueOnce(listTransfersResp([
        { id: 'g1', payoutAmountGMD: 120, status: 'PAID', gagentSettled: false, paid_on: '2026-04-01' },
        { id: 'g2', payoutAmountGMD: 80, status: 'PAID', gagentSettled: false, paid_on: '2026-04-01' },
      ], null))
      // calculateGAgentBalance - by name transfers
      .mockResolvedValueOnce(listTransfersResp([], null))
      // calculateGAgentBalance - manual txs
      .mockResolvedValueOnce(cashflowTxResp([], null))
      // recordTopUp - by email transfers to settle
      .mockResolvedValueOnce(listTransfersResp([
        { id: 'g1', payoutAmountGMD: 120, status: 'PAID', gagentSettled: false },
        { id: 'g2', payoutAmountGMD: 80, status: 'PAID', gagentSettled: false },
      ], null))
      // recordTopUp - by name transfers to settle
      .mockResolvedValueOnce(listTransfersResp([], null))
      // settlement report
      .mockResolvedValueOnce({ data: { createTransferReport: { id: 'rpt-2' } } })
      // settle g1 success
      .mockResolvedValueOnce({ data: { updateTransfer: { id: 'g1' } } })
      // settle g2 fails
      .mockRejectedValueOnce(new Error('network fail'));

    await expect(
      farm.recordTopUp('ab-4', 'gagent-1', 'G Agent 1', 100, 'topup', 'admin', gagentBalance)
    ).rejects.toThrow('Failed to settle 1 transfer(s) for G-Agent before period reset');

    const calls = API.graphql.mock.calls.map(([arg]) => arg);
    const hasPeriodReset = calls.some((c) => c?.variables?.input?.periodStartDate);
    const hasTopUpTx = calls.some((c) => c?.variables?.input?.transactionType === 'TOP_UP');

    expect(hasPeriodReset).toBe(false);
    expect(hasTopUpTx).toBe(false);
  });
});

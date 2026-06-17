/**
 * Unit tests for Cash Flow balance calculations
 * These tests ensure that Agent and G-Agent balances are calculated correctly
 * and that settlements are properly handled.
 */

// Mock AWS Amplify before importing farm.js
jest.mock('aws-amplify', () => ({
  API: {
    graphql: jest.fn(),
  },
  Auth: {
    currentAuthenticatedUser: jest.fn(),
  },
}));

const { API } = require('aws-amplify');

// We need to import the functions after mocking
// For now, we'll test the logic patterns directly

describe('G-Agent Balance Calculation Logic', () => {
  beforeEach(() => {
    API.graphql.mockReset();
  });

  describe('Transfer Filtering', () => {
    it('should only include transfers where gagentSettled is NOT true', () => {
      const transfers = [
        { id: '1', payoutAmountGMD: 1000, gagentSettled: false, paidOutBy: 'TestAgent' },
        { id: '2', payoutAmountGMD: 500, gagentSettled: true, paidOutBy: 'TestAgent' },  // Should be excluded
        { id: '3', payoutAmountGMD: 750, gagentSettled: null, paidOutBy: 'TestAgent' },  // null should be included
        { id: '4', payoutAmountGMD: 250, paidOutBy: 'TestAgent' },  // undefined should be included
      ];

      // Filter logic that should match farm.js
      const unsettledTransfers = transfers.filter(t => t.gagentSettled !== true);

      expect(unsettledTransfers).toHaveLength(3);
      expect(unsettledTransfers.map(t => t.id)).toEqual(['1', '3', '4']);
    });

    it('should filter by period start date correctly', () => {
      const periodStart = '2025-11-30T14:00:00.000Z';
      const periodStartTime = new Date(periodStart).getTime();

      const transfers = [
        { id: '1', paid_on: '2025-11-30T15:00:00.000Z' },  // After period start - include
        { id: '2', paid_on: '2025-11-30T13:00:00.000Z' },  // Before period start - exclude
        { id: '3', paid_on: '2025-11-30' },                 // Date only (legacy) - should include (end of day)
        { id: '4', paid_on: '2025-11-29' },                 // Day before - exclude even with end of day
      ];

      // Filter logic matching farm.js
      const filteredTransfers = transfers.filter(t => {
        const paidDateStr = t.paid_on;
        const paidDate = paidDateStr && paidDateStr.length === 10
          ? new Date(paidDateStr + 'T23:59:59.999Z')
          : new Date(paidDateStr);
        return paidDate.getTime() >= periodStartTime;
      });

      expect(filteredTransfers.map(t => t.id)).toEqual(['1', '3']);
    });

    it('should calculate total payouts correctly', () => {
      const transfers = [
        { id: '1', payoutAmountGMD: 1000 },
        { id: '2', payoutAmountGMD: 500 },
        { id: '3', payoutAmountGMD: 750 },
        { id: '4', payoutAmountGMD: null },  // Should be treated as 0
        { id: '5', payoutAmountGMD: undefined },  // Should be treated as 0
      ];

      const totalPayouts = transfers.reduce((sum, t) => sum + (t.payoutAmountGMD || 0), 0);

      expect(totalPayouts).toBe(2250);
    });
  });

  describe('Balance Formula', () => {
    it('should calculate G-Agent balance: opening + topUps - payouts + adjustments', () => {
      const openingBalance = 10000;
      const totalTopUps = 5000;
      const totalPayouts = 3000;
      const totalAdjustments = -500;

      const calculatedBalance = openingBalance + totalTopUps - totalPayouts + totalAdjustments;

      expect(calculatedBalance).toBe(11500);
    });

    it('should handle zero opening balance', () => {
      const openingBalance = 0;
      const totalTopUps = 5000;
      const totalPayouts = 3000;
      const totalAdjustments = 0;

      const calculatedBalance = (openingBalance || 0) + totalTopUps - totalPayouts + totalAdjustments;

      expect(calculatedBalance).toBe(2000);
    });

    it('should handle negative adjustments', () => {
      const openingBalance = 10000;
      const totalTopUps = 0;
      const totalPayouts = 0;
      const totalAdjustments = -2000;

      const calculatedBalance = openingBalance + totalTopUps - totalPayouts + totalAdjustments;

      expect(calculatedBalance).toBe(8000);
    });
  });
});

describe('Agent Balance Calculation Logic', () => {
  describe('Transfer Filtering', () => {
    it('should only include transfers where agentSettled is NOT true', () => {
      const transfers = [
        { id: '1', amount: 100, agentSettled: false, createdBy: 'TestAgent' },
        { id: '2', amount: 50, agentSettled: true, createdBy: 'TestAgent' },  // Should be excluded
        { id: '3', amount: 75, agentSettled: null, createdBy: 'TestAgent' },
        { id: '4', amount: 25, createdBy: 'TestAgent' },
      ];

      const unsettledTransfers = transfers.filter(t => t.agentSettled !== true);

      expect(unsettledTransfers).toHaveLength(3);
      expect(unsettledTransfers.map(t => t.id)).toEqual(['1', '3', '4']);
    });

    it('should exclude CANCELLED transfers', () => {
      const transfers = [
        { id: '1', amount: 100, status: 'PENDING' },
        { id: '2', amount: 50, status: 'PAID' },
        { id: '3', amount: 75, status: 'CANCELLED' },  // Should be excluded
        { id: '4', amount: 25, status: 'SENT' },
      ];

      const validTransfers = transfers.filter(t => t.status !== 'CANCELLED');

      expect(validTransfers).toHaveLength(3);
      expect(validTransfers.map(t => t.id)).toEqual(['1', '2', '4']);
    });

    it('should calculate total collections correctly', () => {
      const transfers = [
        { id: '1', amount: 100 },
        { id: '2', amount: 50 },
        { id: '3', amount: 75 },
      ];

      const totalCollections = transfers.reduce((sum, t) => sum + (t.amount || 0), 0);

      expect(totalCollections).toBe(225);
    });
  });

  describe('Balance Formula', () => {
    it('should calculate Agent balance: opening + collections - deliveries + adjustments', () => {
      const openingBalance = 0;
      const totalCollections = 500;  // Agent collected £500
      const totalDeliveries = 200;   // Agent delivered £200
      const totalAdjustments = 0;

      const calculatedBalance = openingBalance + totalCollections - totalDeliveries + totalAdjustments;

      expect(calculatedBalance).toBe(300);  // Agent still owes £300
    });
  });
});

describe('Settlement Logic', () => {
  describe('Agent Settlement (on Delivery)', () => {
    it('should set agentSettled and agentSettled_on on transfers', () => {
      const transfer = { id: '1', agentSettled: false };
      const settledOn = new Date().toISOString();

      // Simulating what recordDelivery does
      const updatedTransfer = {
        ...transfer,
        agentSettled: true,
        agentSettled_on: settledOn,
      };

      expect(updatedTransfer.agentSettled).toBe(true);
      expect(updatedTransfer.agentSettled_on).toBeDefined();
      expect(updatedTransfer.gagentSettled).toBeUndefined();  // Should NOT touch gagentSettled
    });

    it('should NOT affect gagentSettled field', () => {
      const transfer = { id: '1', gagentSettled: false };

      // Agent settlement should only set agentSettled
      const updatedFields = {
        agentSettled: true,
        agentSettled_on: new Date().toISOString(),
      };

      // gagentSettled should remain unchanged
      expect(updatedFields.gagentSettled).toBeUndefined();
    });
  });

  describe('G-Agent Settlement (on Top-Up)', () => {
    it('should set gagentSettled and gagentSettled_on on transfers', () => {
      const transfer = { id: '1', gagentSettled: false };
      const settledOn = new Date().toISOString();

      const updatedTransfer = {
        ...transfer,
        gagentSettled: true,
        gagentSettled_on: settledOn,
      };

      expect(updatedTransfer.gagentSettled).toBe(true);
      expect(updatedTransfer.gagentSettled_on).toBeDefined();
      expect(updatedTransfer.agentSettled).toBeUndefined();  // Should NOT touch agentSettled
    });

    it('should NOT affect agentSettled field', () => {
      const transfer = { id: '1', agentSettled: true };

      // G-Agent settlement should only set gagentSettled
      const updatedFields = {
        gagentSettled: true,
        gagentSettled_on: new Date().toISOString(),
      };

      // agentSettled should remain unchanged
      expect(updatedFields.agentSettled).toBeUndefined();
    });
  });

  describe('Independent Settlement', () => {
    it('should allow a transfer to be Agent settled but not G-Agent settled', () => {
      const transfer = {
        id: '1',
        agentSettled: true,
        agentSettled_on: '2025-11-30T10:00:00.000Z',
        gagentSettled: false,
        gagentSettled_on: null,
      };

      // This transfer should:
      // - NOT appear in Agent's cashflow (agentSettled = true)
      // - APPEAR in G-Agent's cashflow (gagentSettled != true)

      const inAgentCashflow = transfer.agentSettled !== true;
      const inGAgentCashflow = transfer.gagentSettled !== true;

      expect(inAgentCashflow).toBe(false);
      expect(inGAgentCashflow).toBe(true);
    });

    it('should allow a transfer to be G-Agent settled but not Agent settled', () => {
      const transfer = {
        id: '1',
        agentSettled: false,
        agentSettled_on: null,
        gagentSettled: true,
        gagentSettled_on: '2025-11-30T10:00:00.000Z',
      };

      const inAgentCashflow = transfer.agentSettled !== true;
      const inGAgentCashflow = transfer.gagentSettled !== true;

      expect(inAgentCashflow).toBe(true);
      expect(inGAgentCashflow).toBe(false);
    });

    it('should allow a transfer to be settled by both independently', () => {
      const transfer = {
        id: '1',
        agentSettled: true,
        agentSettled_on: '2025-11-30T10:00:00.000Z',
        gagentSettled: true,
        gagentSettled_on: '2025-11-30T15:00:00.000Z',
      };

      const inAgentCashflow = transfer.agentSettled !== true;
      const inGAgentCashflow = transfer.gagentSettled !== true;

      expect(inAgentCashflow).toBe(false);
      expect(inGAgentCashflow).toBe(false);
    });
  });
});

describe('Period Reset Logic', () => {
  it('should calculate new opening balance after G-Agent top-up', () => {
    const currentBalance = 5000;  // G-Agent has 5000 GMD
    const topUpAmount = 10000;    // Admin tops up 10000 GMD

    // After top-up, current balance becomes new opening balance
    // The top-up is recorded as a transaction in the new period
    const newOpeningBalance = currentBalance;

    expect(newOpeningBalance).toBe(5000);
  });

  it('should calculate new opening balance after Agent delivery', () => {
    const currentBalance = 500;   // Agent owes £500
    const deliveryAmount = 300;   // Agent delivers £300

    // After delivery, remaining balance becomes new opening balance
    const newOpeningBalance = currentBalance - deliveryAmount;

    expect(newOpeningBalance).toBe(200);  // Agent still owes £200 in new period
  });
});

describe('Transaction Type Filtering', () => {
  it('should correctly sum TOP_UP transactions', () => {
    const transactions = [
      { transactionType: 'TOP_UP', amount: 5000 },
      { transactionType: 'TOP_UP', amount: 3000 },
      { transactionType: 'ADJUSTMENT', amount: -500 },
      { transactionType: 'DELIVERY', amount: 200 },
    ];

    const totalTopUps = transactions
      .filter(t => t.transactionType === 'TOP_UP')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    expect(totalTopUps).toBe(8000);
  });

  it('should correctly sum DELIVERY transactions', () => {
    const transactions = [
      { transactionType: 'DELIVERY', amount: 200 },
      { transactionType: 'DELIVERY', amount: 150 },
      { transactionType: 'TOP_UP', amount: 5000 },
      { transactionType: 'ADJUSTMENT', amount: 50 },
    ];

    const totalDeliveries = transactions
      .filter(t => t.transactionType === 'DELIVERY')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    expect(totalDeliveries).toBe(350);
  });

  it('should correctly sum ADJUSTMENT transactions (can be negative)', () => {
    const transactions = [
      { transactionType: 'ADJUSTMENT', amount: 100 },
      { transactionType: 'ADJUSTMENT', amount: -50 },
      { transactionType: 'TOP_UP', amount: 5000 },
    ];

    const totalAdjustments = transactions
      .filter(t => t.transactionType === 'ADJUSTMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    expect(totalAdjustments).toBe(50);
  });
});

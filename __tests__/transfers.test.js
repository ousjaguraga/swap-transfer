/**
 * Transfer behavior tests:
 * - getTransfers pagination and date filters
 * - serializedTransfer field normalization
 * - Transfer list filtering rules that can hide items
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

const applyTransferListFilters = ({
  transfers,
  showSettled,
  filterStatus,
  filterAgent,
  isGAgent,
  waveOnly,
  searchTerm,
  customer,
}) => {
  const isFullySettled = (t) => t.agentSettled && t.gagentSettled;
  const getTransferAgentLabel = (transfer) => transfer.createdBy || transfer.paidOutBy || 'Unknown';
  const isMyTransfer = (transfer) => {
    const mySub = customer?.sub;
    const myEmail = customer?.email;
    const myName = customer?.name;

    return (
      (mySub && transfer.createdById === mySub) ||
      (myEmail && (transfer.createdBy === myEmail || transfer.paidOutById === myEmail)) ||
      (myName && (transfer.createdBy === myName || transfer.paidOutBy === myName))
    );
  };

  return transfers
    .filter((t) => showSettled || !isFullySettled(t))
    .filter((transfer) => {
      if (filterStatus !== 'ALL' && transfer.status !== filterStatus) {
        return false;
      }

      if (filterAgent === '__MINE__' && !isMyTransfer(transfer)) {
        return false;
      }

      if (filterAgent !== 'ALL' && filterAgent !== '__MINE__' && getTransferAgentLabel(transfer) !== filterAgent) {
        return false;
      }

      if (isGAgent && waveOnly && transfer.collection_method !== 'WAVE') {
        return false;
      }

      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        transfer.from?.toLowerCase().includes(searchLower) ||
        transfer.to?.toLowerCase().includes(searchLower) ||
        transfer.id?.toLowerCase().includes(searchLower)
      );
    });
};

describe('Transfer data fetching', () => {
  beforeEach(() => {
    API.graphql.mockReset();
  });

  it('getTransfers aggregates all pages when called without limit/nextToken', async () => {
    API.graphql
      .mockResolvedValueOnce(listTransfersResp([{ id: 't1' }], 'N1'))
      .mockResolvedValueOnce(listTransfersResp([{ id: 't2' }], null));

    const result = await farm.getTransfers();

    expect(result.data.listTransfers.items.map((t) => t.id)).toEqual(['t1', 't2']);
    expect(API.graphql).toHaveBeenCalledTimes(2);
  });

  it('getTransfers sends createdAt between filter when start and end dates are provided', async () => {
    API.graphql.mockResolvedValueOnce(listTransfersResp([], null));

    await farm.getTransfers({ startDate: '2026-04-01', endDate: '2026-04-10' });

    const call = API.graphql.mock.calls[0][0];
    expect(call.variables.filter.createdAt.between).toHaveLength(2);
    expect(call.variables.filter.createdAt.between[0]).toContain('2026-04-01');
    expect(call.variables.filter.createdAt.between[1]).toContain('2026-04-10');
  });

  it('getTransfers sends createdAt ge filter when only start date is provided', async () => {
    API.graphql.mockResolvedValueOnce(listTransfersResp([], null));

    await farm.getTransfers({ startDate: '2026-04-01' });

    const call = API.graphql.mock.calls[0][0];
    expect(call.variables.filter.createdAt.ge).toContain('2026-04-01');
  });

  it('getTransfers sends createdAt le filter when only end date is provided', async () => {
    API.graphql.mockResolvedValueOnce(listTransfersResp([], null));

    await farm.getTransfers({ endDate: '2026-04-10' });

    const call = API.graphql.mock.calls[0][0];
    expect(call.variables.filter.createdAt.le).toContain('2026-04-10');
  });
});

describe('Transfer serialization', () => {
  it('serializedTransfer normalizes settlement booleans and numeric amount', () => {
    const serialized = farm.serializedTransfer({
      id: 't1',
      from: 'A',
      to: 'B',
      amount: '100',
      status: 'SENT',
      agentSettled: null,
      gagentSettled: true,
      createdAt: '2026-04-10T00:00:00.000Z',
    });

    expect(serialized.amount).toBe(100);
    expect(serialized.agentSettled).toBe(false);
    expect(serialized.gagentSettled).toBe(true);
  });
});

describe('Transfer list filtering behavior', () => {
  const transfers = [
    {
      id: 't1',
      from: 'Alpha',
      to: 'One',
      status: 'PAID',
      createdBy: 'Agent A',
      createdById: 'sub-a',
      paidOutBy: 'G Agent A',
      paidOutById: 'gagent@example.com',
      collection_method: 'WAVE',
      agentSettled: true,
      gagentSettled: true,
    },
    {
      id: 't2',
      from: 'Bravo',
      to: 'Two',
      status: 'SENT',
      createdBy: 'Agent A',
      createdById: 'sub-a',
      collection_method: 'CASH',
      agentSettled: false,
      gagentSettled: false,
    },
    {
      id: 't3',
      from: 'Charlie',
      to: 'Three',
      status: 'PENDING',
      createdBy: 'Agent B',
      createdById: 'sub-b',
      collection_method: 'WAVE',
      agentSettled: false,
      gagentSettled: false,
    },
  ];

  it('hides fully settled transfers by default', () => {
    const result = applyTransferListFilters({
      transfers,
      showSettled: false,
      filterStatus: 'ALL',
      filterAgent: 'ALL',
      isGAgent: false,
      waveOnly: false,
      searchTerm: '',
      customer: null,
    });

    expect(result.map((t) => t.id)).toEqual(['t2', 't3']);
  });

  it('includes fully settled transfers when showSettled is enabled', () => {
    const result = applyTransferListFilters({
      transfers,
      showSettled: true,
      filterStatus: 'ALL',
      filterAgent: 'ALL',
      isGAgent: false,
      waveOnly: false,
      searchTerm: '',
      customer: null,
    });

    expect(result.map((t) => t.id)).toEqual(['t1', 't2', 't3']);
  });

  it('applies __MINE__ filter using sub/email/name matching', () => {
    const result = applyTransferListFilters({
      transfers,
      showSettled: true,
      filterStatus: 'ALL',
      filterAgent: '__MINE__',
      isGAgent: false,
      waveOnly: false,
      searchTerm: '',
      customer: { sub: 'sub-a', email: 'x@example.com', name: 'No Match' },
    });

    expect(result.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('applies wave-only filter for G-Agent', () => {
    const result = applyTransferListFilters({
      transfers,
      showSettled: true,
      filterStatus: 'ALL',
      filterAgent: 'ALL',
      isGAgent: true,
      waveOnly: true,
      searchTerm: '',
      customer: null,
    });

    expect(result.map((t) => t.id)).toEqual(['t1', 't3']);
  });

  it('search applies on top of active filters', () => {
    const result = applyTransferListFilters({
      transfers,
      showSettled: false,
      filterStatus: 'ALL',
      filterAgent: 'ALL',
      isGAgent: false,
      waveOnly: false,
      searchTerm: 'charlie',
      customer: null,
    });

    expect(result.map((t) => t.id)).toEqual(['t3']);
  });
});

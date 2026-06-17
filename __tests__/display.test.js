const { makeTransferRef } = require('../src/utils/display');

describe('makeTransferRef', () => {
  it('builds a reference with sender and receiver first/last initials', () => {
    const ref = makeTransferRef({
      from: 'Alpha Bravo',
      to: 'Sierra Tango',
      id: 'abc-123',
    });

    expect(ref).toMatch(/^ABST-\d{6}$/);
  });

  it('uses X fallback for missing last name parts', () => {
    const ref = makeTransferRef({
      from: 'Alpha',
      to: 'Bravo',
      id: 'single-name-id',
    });

    expect(ref).toMatch(/^AXBX-\d{6}$/);
  });

  it('uses XX fallback when names are empty or invalid', () => {
    const ref = makeTransferRef({
      from: '',
      to: null,
      id: 'fallback-id',
    });

    expect(ref).toMatch(/^XXXX-\d{6}$/);
  });

  it('is deterministic for the same transfer input', () => {
    const payload = {
      from: 'Alpha Bravo',
      to: 'Sierra Tango',
      id: 'deterministic-id',
    };

    const first = makeTransferRef(payload);
    const second = makeTransferRef(payload);

    expect(first).toBe(second);
  });

  it('changes when transfer id changes', () => {
    const refOne = makeTransferRef({
      from: 'Alpha Bravo',
      to: 'Sierra Tango',
      id: 'id-1',
    });
    const refTwo = makeTransferRef({
      from: 'Alpha Bravo',
      to: 'Sierra Tango',
      id: 'id-2',
    });

    expect(refOne).not.toBe(refTwo);
  });
});

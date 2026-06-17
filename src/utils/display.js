const SAFE_INITIAL = 'X';

const getNameInitial = (value) => {
  if (!value || typeof value !== 'string') {
    return SAFE_INITIAL;
  }

  const initial = value[0].toUpperCase();
  return /[A-Z]/.test(initial) ? initial : SAFE_INITIAL;
};

const getNameInitialPair = (name) => {
  if (!name || typeof name !== 'string') {
    return `${SAFE_INITIAL}${SAFE_INITIAL}`;
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return `${SAFE_INITIAL}${SAFE_INITIAL}`;
  }

  const firstInitial = getNameInitial(parts[0]);
  const lastInitial = parts.length > 1
    ? getNameInitial(parts[parts.length - 1])
    : SAFE_INITIAL;

  return `${firstInitial}${lastInitial}`;
};

const hashToSixDigits = (value) => {
  let hash = 2166136261;
  const input = String(value || '');

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  const unsignedHash = hash >>> 0;
  return String((unsignedHash % 900000) + 100000);
};

export const makeTransferRef = ({ from, to, id }) => {
  const senderInitials = getNameInitialPair(from);
  const receiverInitials = getNameInitialPair(to);
  const numericPart = hashToSixDigits(id);

  return `${senderInitials}${receiverInitials}-${numericPart}`;
};

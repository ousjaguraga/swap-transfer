import { generateClient } from "aws-amplify/api";

const client = generateClient();
import {
  createTransfer,
  createReceiver,
  createSender,
  updateTransfer,
  updateSender,
  updateReceiver,
  deleteSender,
  deleteReceiver,
  createTransferReport,
  updateTransferReport,
  deleteTransferReport,
  createDailyRate,
  updateDailyRate,
  deleteDailyRate,
  // Cash Flow mutations
  createAgentBalance,
  updateAgentBalance,
  deleteAgentBalance,
  createCashFlowTransaction,
  // Agent mutations
  createAgent,
  updateAgent,
} from './src/graphql/mutations';

import {
  getTransfer,
  listTransfers,
  transfersByTransferreportID,
  transfersByAgentReportID,
  transfersByGagentReportID,
  getTransferReport,
  listTransferReports,
  getSender,
  listSenders,
  getReceiver,
  listReceivers,
  receiversBySenderID,
  listDailyRates,
  getDailyRate,
  // Cash Flow queries
  listAgentBalances,
  getAgentBalance,
  agentBalancesByAgentId,
  listCashFlowTransactions,
  cashFlowTransactionsByAgentBalanceId,
  // Agent queries
  listAgents,
  getAgent,
  agentsByEmail,
  agentsByCognitoSub,
} from "./src/graphql/queries";

import {
  onCreateTransfer,
  onUpdateTransfer,
  onDeleteTransfer,
  onCreateDailyRate,
  onUpdateDailyRate,
  onDeleteDailyRate,
  onCreateSender,
  onUpdateSender,
  onDeleteSender,
  onCreateReceiver,
  onUpdateReceiver,
  onDeleteReceiver,
  onCreateCashFlowTransaction,
} from "./src/graphql/subscriptions";

import { TransferStatus } from "./src/models";


import '@azure/core-asynciterator-polyfill'


// Get the most recent daily rate
export const getLatestDailyRate = async () => {
  try {
    const response = await client.graphql({
      query: listDailyRates,
      variables: {
        limit: 100 // Fetch enough to find the latest
      }
    });

    const rates = response.data.listDailyRates.items;
    if (!rates || rates.length === 0) {
      return null;
    }

    // Sort by effectiveDate descending and get the most recent
    const sortedRates = rates.sort((a, b) => {
      return new Date(b.effectiveDate) - new Date(a.effectiveDate);
    });

    return sortedRates[0];
  } catch (error) {
    throw error;
  }
};


export const createATransfer = async (from, to, amount, rateApplied, createdBy, collectionMethod = 'CASH', createdById = null) => {
  // `from` and `to` are stored as descriptive strings (e.g. "Alice Smith" → "Bob Jones")
  // rateApplied should be passed from the frontend (fetched from getLatestDailyRate)
  // collectionMethod must be one of: CASH, WAVE, AFRIMONEY, CREDIT
  // createdById is the Cognito sub (user ID) for proper linking

  const transferInput = {
    "from": from,
    "to": to,
    "amount": Number(amount),
    // leave paid_on/settled_on undefined unless explicitly provided
    // server will set timestamps; don't provide invalid placeholder dates
    // "paid_on": null,
    // "settled_on": null,
    "status": TransferStatus.SENT,
    "createdBy": createdBy,
    "createdById": createdById,
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString()
  };

  // Add rateApplied if provided - calculate payoutAmountGMD from amount * rate
  if (rateApplied) {
    transferInput.rateApplied = Number(rateApplied);
    transferInput.payoutAmountGMD = Number(amount) * Number(rateApplied);
  }

  // Collection method (CASH, WAVE, AFRIMONEY, CREDIT)
  transferInput.collection_method = collectionMethod;
  // We can't easily get the creator here without passing it in, but the backend might handle 'createdBy' via auth. 
  // If not, we might need to pass it. For now, let's rely on backend or existing flow.

  // Debug: print the final payload sent to the GraphQL API
  try {
    // stringify safely
    console.log('createATransfer input:', JSON.stringify(sanitizeInput(transferInput)));
  } catch (e) {
    console.log('createATransfer input (stringify failed):', sanitizeInput(transferInput));
  }

  const newTransfer = await client.graphql({
    query: createTransfer,
    variables: {
      input: sanitizeInput(transferInput)
    }
  });

  return newTransfer
}

// Remove null/undefined fields and strip server-managed timestamp fields
const sanitizeInput = (obj) => {
  const out = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    if (v === null || v === undefined) return;
    // In Amplify Gen 2, createdAt/updatedAt are read-only system fields that are
    // NOT part of the create/update input types, so they must never be sent.
    if (k === 'createdAt' || k === 'updatedAt') return;
    out[k] = v;
  });
  return out;
};


const normalizeDateInput = (date, endOfDay = false) => {
  if (!date) {
    return null;
  }

  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    const copy = new Date(date.getTime());
    if (endOfDay) {
      copy.setUTCHours(23, 59, 59, 999);
    } else {
      copy.setUTCHours(0, 0, 0, 0);
    }
    return copy.toISOString();
  }

  if (typeof date !== 'string') {
    return null;
  }

  const parts = date.trim().split('-');
  if (parts.length !== 3) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) {
    return null;
  }

  const dateUtc = new Date(Date.UTC(year, monthIndex, day));
  if (Number.isNaN(dateUtc.getTime())) {
    return null;
  }

  if (endOfDay) {
    dateUtc.setUTCHours(23, 59, 59, 999);
  }

  return dateUtc.toISOString();
};

const fetchAllTransfersByFilter = async (filter, pageSize = 1000) => {
  const allItems = [];
  let token = null;

  do {
    const response = await client.graphql({
      query: listTransfers,
      variables: {
        limit: pageSize,
        ...(token ? { nextToken: token } : {}),
        ...(filter ? { filter } : {})
      }
    });

    const result = response?.data?.listTransfers;
    const items = Array.isArray(result?.items) ? result.items : [];
    allItems.push(...items);
    token = result?.nextToken || null;
  } while (token);

  return allItems;
};

const fetchAllCashFlowTransactionsByBalanceId = async (agentBalanceId, pageSize = 500) => {
  const allItems = [];
  let token = null;

  do {
    const response = await client.graphql({
      query: cashFlowTransactionsByAgentBalanceId,
      variables: {
        agentBalanceId,
        limit: pageSize,
        ...(token ? { nextToken: token } : {})
      }
    });

    const result = response?.data?.cashFlowTransactionsByAgentBalanceId;
    const items = Array.isArray(result?.items) ? result.items : [];
    allItems.push(...items);
    token = result?.nextToken || null;
  } while (token);

  return allItems;
};

export const getTransfers = async (options = {}) => {
  if (typeof options === 'string') {
    options = { id: options };
  }

  const {
    id,
    startDate,
    endDate,
    limit,
    nextToken,
    filter: filterOverrides,
    reportID
  } = options || {};

  if (id) {
    return client.graphql({
      query: getTransfer,
      variables: { id }
    });
  }

  const normalizedStart = normalizeDateInput(startDate);
  const normalizedEnd = normalizeDateInput(endDate, true);
  const filter = filterOverrides ? { ...filterOverrides } : {};

  if (normalizedStart && normalizedEnd) {
    filter.createdAt = { between: [normalizedStart, normalizedEnd] };
  } else if (normalizedStart) {
    filter.createdAt = { ge: normalizedStart };
  } else if (normalizedEnd) {
    filter.createdAt = { le: normalizedEnd };
  }

  const hasFilter = filter && Object.keys(filter).length > 0;
  const pageLimit = limit || 100;

  if (reportID) {
    // Try all three report ID types and combine results
    // This handles: old reports (transferreportID), Agent settlements (agentReportID), G-Agent settlements (gagentReportID)
    const allItems = [];

    // Try transferreportID (legacy/original reports)
    try {
      const response1 = await client.graphql({
        query: transfersByTransferreportID,
        variables: {
          transferreportID: reportID,
          ...(hasFilter ? { filter } : {}),
          limit: 1000
        }
      });
      const items1 = response1?.data?.transfersByTransferreportID?.items || [];
      allItems.push(...items1);
    } catch (e) { /* ignore */ }

    // Try agentReportID (Agent settlement reports)
    try {
      const response2 = await client.graphql({
        query: transfersByAgentReportID,
        variables: {
          agentReportID: reportID,
          ...(hasFilter ? { filter } : {}),
          limit: 1000
        }
      });
      const items2 = response2?.data?.transfersByAgentReportID?.items || [];
      allItems.push(...items2);
    } catch (e) { /* ignore */ }

    // Try gagentReportID (G-Agent settlement reports)
    try {
      const response3 = await client.graphql({
        query: transfersByGagentReportID,
        variables: {
          gagentReportID: reportID,
          ...(hasFilter ? { filter } : {}),
          limit: 1000
        }
      });
      const items3 = response3?.data?.transfersByGagentReportID?.items || [];
      allItems.push(...items3);
    } catch (e) { /* ignore */ }

    // Deduplicate by ID
    const seenIds = new Set();
    const uniqueItems = allItems.filter(item => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    return {
      data: {
        listTransfers: {
          items: uniqueItems,
          nextToken: null
        }
      }
    };
  }

  if (!limit && !nextToken) {
    const aggregatedItems = [];
    const seenIds = new Set();
    let token = nextToken || null;

    do {
      const pageResponse = await client.graphql({
        query: listTransfers,
        variables: {
          limit: pageLimit,
          ...(token ? { nextToken: token } : {}),
          ...(hasFilter ? { filter } : {})
        }
      });

      const listTransfersResult = pageResponse?.data?.listTransfers;
      const items = Array.isArray(listTransfersResult?.items)
        ? listTransfersResult.items
        : [];

      items.forEach((item) => {
        if (!item || (item.id && seenIds.has(item.id))) {
          return;
        }
        if (item.id) {
          seenIds.add(item.id);
        }
        aggregatedItems.push(item);
      });

      token = listTransfersResult?.nextToken || null;

      if (!token) {
        return {
          data: {
            listTransfers: {
              items: aggregatedItems,
              nextToken: null
            }
          }
        };
      }
    } while (true);
  }

  return client.graphql({
    query: listTransfers,
    variables: {
      limit: pageLimit,
      ...(nextToken ? { nextToken } : {}),
      ...(hasFilter ? { filter } : {})
    }
  });
};


export const updateATransfer = async (transfer, s, reportID, paidOutBy = null, paidOutById = null) => {


  // Get the current date - paid_on is AWSDate (YYYY-MM-DD only)
  const dateNow = new Date().toISOString().split('T')[0];


  if (s === "PAID") {
    const updatedTransfer = await client.graphql({
      query: updateTransfer,
      variables: {
        input: {
          "id": transfer.id,
          "paid_on": dateNow,
          "status": TransferStatus.PAID,
          ...(paidOutBy && { "paidOutBy": paidOutBy }),
          ...(paidOutById && { "paidOutById": paidOutById })
        }
      }
    });
    return updatedTransfer
  }
  if (s === "PENDING") {
    const updatedTransfer = await client.graphql({
      query: updateTransfer,
      variables: {
        input: {
          "id": transfer.id,
          "status": TransferStatus.PENDING
        }
      }
    });
  }

  if (s === "SETTLED") {
    try {
      const updatedTransfer = await client.graphql({
        query: updateTransfer,
        variables: {
          input: {
            "id": transfer.id,
            "settled": true,
            "settled_on": dateNow,
            "transferreportID": reportID
          }
        }
      });
      return updatedTransfer;
    } catch (error) {
      throw error;
    }
  }

  if (s === "CANCELLED") {
    const updatedTransfer = await client.graphql({
      query: updateTransfer,
      variables: {
        input: {
          "id": transfer.id,
          "status": TransferStatus.CANCELLED
        }
      }
    });
    return updatedTransfer;
  }

}


export const deleteATransfer = async () => {
  //const modelToDelete = await DataStore.query(Transfer, 123456789);
  //DataStore.delete(modelToDelete);
}

export const getSenders = async (options = {}) => {
  const normalizedOptions = typeof options === 'string' ? { id: options } : (options || {});
  const { id, filter: filterOverrides, limit, nextToken } = normalizedOptions;

  if (id) {
    const oneSender = await client.graphql({
      query: getSender,
      variables: { id }
    });
    return oneSender;
  }

  const hasFilter = filterOverrides && Object.keys(filterOverrides).length > 0;
  const pageLimit = limit || 1000;

  if (!limit && !nextToken) {
    const aggregatedItems = [];
    const seenIds = new Set();
    let token = nextToken || null;

    do {
      const pageResponse = await client.graphql({
        query: listSenders,
        variables: {
          limit: pageLimit,
          ...(token ? { nextToken: token } : {}),
          ...(hasFilter ? { filter: filterOverrides } : {})
        }
      });

      const listSendersResult = pageResponse?.data?.listSenders;
      const items = Array.isArray(listSendersResult?.items)
        ? listSendersResult.items
        : [];

      items.forEach((item) => {
        if (!item || (item.id && seenIds.has(item.id))) {
          return;
        }
        if (item.id) {
          seenIds.add(item.id);
        }
        aggregatedItems.push(item);
      });

      token = listSendersResult?.nextToken || null;

      if (!token) {
        return {
          data: {
            listSenders: {
              items: aggregatedItems,
              nextToken: null
            }
          }
        };
      }
    } while (true);
  }

  return client.graphql({
    query: listSenders,
    variables: {
      limit: pageLimit,
      ...(nextToken ? { nextToken } : {}),
      ...(hasFilter ? { filter: filterOverrides } : {})
    }
  });
}

export const getRecievers = async (id) => {
  if (id) {
    // Get a specific item
    const oneSender = await client.graphql({
      query: getReceiver,
      variables: { id: id }
    });
    return oneSender
  }
  // List all items
  const allSenders = await client.graphql({
    query: listReceivers
  });
  return allSenders
}

export const deleteAReceiver = async (receiverID) => {
  const deletedReceiver = await client.graphql({
    query: deleteReceiver,
    variables: {
      input: {
        id: receiverID
      }
    }
  });
}

// given a sender ID return all their receivers
export const getReceiversForSender = async (senderId) => {
  try {
    // Primary path: query by Sender -> Receiver index.
    const receivers = await client.graphql({
      query: receiversBySenderID,
      variables: { senderID: senderId, limit: 1000 }
    });
    const indexedItems = receivers?.data?.receiversBySenderID?.items || [];

    // If the index path returns data, use it.
    if (indexedItems.length > 0) {
      return receivers;
    }

    // Fallback path: list receivers and filter by senderID.
    // This helps when index-based reads are restricted but model reads are allowed.
    const allItems = [];
    let nextToken = null;

    do {
      const page = await client.graphql({
        query: listReceivers,
        variables: {
          filter: { senderID: { eq: senderId } },
          limit: 1000,
          ...(nextToken ? { nextToken } : {})
        }
      });

      const pageItems = page?.data?.listReceivers?.items || [];
      allItems.push(...pageItems);
      nextToken = page?.data?.listReceivers?.nextToken || null;
    } while (nextToken);

    return {
      data: {
        receiversBySenderID: {
          items: allItems,
          nextToken: null
        }
      }
    };
  } catch (error) {
    console.error('getReceiversForSender failed:', error);
    throw error;
  }

}

export const createReceiverForSender = async (data) => {
  try {
    const sender = await getSenders(data.senderId);


    const newReceiver = await client.graphql({
      query: createReceiver,
      variables: {
        input: {
          "name": data.name.trim(),
          "surname": data.surname.trim(),
          "number": data.number.trim(),
          "senderID": data.senderId,
          ...(data.ownerSub && { "ownerSub": data.ownerSub })
        }
      }
    });

    return newReceiver;
  } catch (error) {
    throw error
  }

}

// Create customer and return the customer created
export const createCustomer = async (name, surname, number, ownerSub = null) => {

  try {

    const newSender = await client.graphql({
      query: createSender,
      variables: {
        input: {
          "name": name.trim(),
          "surname": surname.trim(),
          "number": number.trim(),  //BUGGY if number is not a string
          //"Receivers": []
          ...(ownerSub && { "ownerSub": ownerSub })
        }
      }
    });

    if (newSender.errors && newSender.errors.length > 0) {
      const [{ message }] = newSender.errors;
      throw new Error(message || 'Failed to create customer');
    }

    return newSender

  } catch (error) {
    throw error
  }

}

// Edit Customer (sender)
export const updateACustomer = async (newCustomer) => {

  try {
    const updatedSender = await client.graphql({
      query: updateSender,
      variables: {
        input: {
          "id": newCustomer.id,
          "name": newCustomer.name,
          "surname": newCustomer.surname,
          "number": newCustomer.number,
        }
      }
    });
    return updatedSender
  } catch (error) {
    // Error handling
  }
}

export const updateAReceiver = async (receiver) => {
  const updatedReceiver = await client.graphql({
    query: updateReceiver,
    variables: {
      input: {
        "id": receiver.id,
        "name": receiver.name,
        "surname": receiver.surname,
        "number": receiver.number,
        "senderID": receiver.senderID
      }
    }
  });
}

export const deleteACustomer = async (customerID) => {
  const deletedSender = await client.graphql({
    query: deleteSender,
    variables: {
      input: {
        id: customerID
      }
    }

  });
}



// Reports

export const createAReport = async (author) => {
  try {
    const newTransferReport = await client.graphql({
      query: createTransferReport,
      variables: {
        input: {
          //"Transfers": transfers,
          "creator": author
        }
      }
    });
    return newTransferReport.data.createTransferReport.id
  } catch (error) {
    throw error;
  }
}

const wrapReportListResponse = (items) => ({
  data: {
    listTransferReports: {
      items,
      nextToken: null
    }
  }
});

const collectUniqueReportIds = (transfers, key) => {
  const ids = new Set();
  transfers.forEach((transfer) => {
    const value = transfer?.[key];
    if (value) {
      ids.add(value);
    }
  });
  return Array.from(ids);
};

const fetchReportsByIds = async (reportIds) => {
  const uniqueIds = Array.from(new Set((reportIds || []).filter(Boolean)));
  if (!uniqueIds.length) {
    return wrapReportListResponse([]);
  }

  const responses = await Promise.allSettled(
    uniqueIds.map((id) =>
      client.graphql({
        query: getTransferReport,
        variables: { id }
      })
    )
  );

  const items = responses
    .map((result) => (result.status === 'fulfilled' ? result.value?.data?.getTransferReport : null))
    .filter(Boolean)
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

  return wrapReportListResponse(items);
};

const buildAgentReportFilter = (user = {}) => {
  const filter = {
    agentReportID: { attributeExists: true }
  };
  const orConditions = [];

  if (user.sub) {
    orConditions.push({ createdById: { eq: user.sub } });
  }
  if (user.email) {
    orConditions.push({ createdBy: { eq: user.email } });
  }
  if (user.name) {
    orConditions.push({ createdBy: { eq: user.name } });
  }

  if (orConditions.length > 0) {
    filter.or = orConditions;
  }

  return filter;
};

const buildGagentReportFilter = (user = {}) => {
  const filter = {
    gagentReportID: { attributeExists: true }
  };
  const orConditions = [];

  if (user.email) {
    orConditions.push({ paidOutById: { eq: user.email } });
  }
  if (user.name) {
    orConditions.push({ paidOutBy: { eq: user.name } });
  }

  if (orConditions.length > 0) {
    filter.or = orConditions;
  }

  return filter;
};

export const getReports = async (options = {}) => {
  const normalizedOptions = typeof options === 'string' ? { id: options } : options;
  const { id, scope = 'ALL', user } = normalizedOptions || {};

  try {
    if (id) {
      return await client.graphql({
        query: getTransferReport,
        variables: { id }
      });
    }

    if (scope === 'ALL' || !user) {
      return await client.graphql({
        query: listTransferReports
      });
    }

    if (scope === 'AGENT') {
      const transfersResponse = await getTransfers({
        filter: buildAgentReportFilter(user)
      });
      const transfers = transfersResponse?.data?.listTransfers?.items || [];
      const reportIds = collectUniqueReportIds(transfers, 'agentReportID');
      return await fetchReportsByIds(reportIds);
    }

    if (scope === 'GAGENT') {
      const transfersResponse = await getTransfers({
        filter: buildGagentReportFilter(user)
      });
      const transfers = transfersResponse?.data?.listTransfers?.items || [];
      const reportIds = collectUniqueReportIds(transfers, 'gagentReportID');
      return await fetchReportsByIds(reportIds);
    }

    return wrapReportListResponse([]);
  } catch (error) {
    console.error('Error loading reports', error);
    throw error;
  }
}

export const deleteAReport = async (id) => {
  const deletedTransferReport = await client.graphql({
    query: deleteTransferReport,
    variables: {
      input: {
        id: id
      }
    }
  });
}
// Utilities

export const makeUkDateFromUsDate = (date) => {
  if (!date) {
    return "No date"
  }
  const dateComponents = date.substring(0, 10).split('-');
  return `${dateComponents[2]}-${dateComponents[1]}-${dateComponents[0]}`;
}

export const serializedSender = (sender) => {
  const s = {
    id: sender.id,
    name: sender.name,
    surname: sender.surname,
    number: sender.number,
    receivers: sender.receivers
  };
  return s
}

export const serializedTransfer = (transfer) => {
  return {
    id: transfer.id,
    from: transfer.from,
    to: transfer.to,
    createdBy: transfer.createdBy,
    createdById: transfer.createdById,
    paidOutBy: transfer.paidOutBy,
    paidOutById: transfer.paidOutById,
    transferreportID: transfer.transferreportID,
    amount: Number(transfer.amount) || 0,
    status: transfer.status,
    // New settlement fields (Agent and G-Agent settle independently)
    agentSettled: Boolean(transfer.agentSettled),
    agentSettled_on: transfer.agentSettled_on,
    agentReportID: transfer.agentReportID,
    gagentSettled: Boolean(transfer.gagentSettled),
    gagentSettled_on: transfer.gagentSettled_on,
    gagentReportID: transfer.gagentReportID,
    createdAt: transfer.createdAt,
    paid_on: transfer.paid_on,
    rateApplied: transfer.rateApplied,
    payoutAmountGMD: transfer.payoutAmountGMD,
    collection_method: transfer.collection_method,
    createdBy: transfer.createdBy,
    createdById: transfer.createdById,
    paidOutBy: transfer.paidOutBy,
    paidOutById: transfer.paidOutById
  }
}

export const isDisabled = (name, surname, isLoading) => {
  if (name.length < 3) {
    return true
  }
  if (surname.length < 3) {
    return true
  }
  if (isLoading) {
    return true
  }
  return false
}


export const capitalizeCustomer = (n) => {
  return n.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


// business logic

export const calculate2Percent = (transfers) => {
  let total = 0;
  let profits = 0;
  let agents_prof = 0;
  let isLimitError = false;
  let isTypeError = false;


  transfers.forEach(n => {
    if (isNaN(n)) {
      isTypeError = true;
      return;
    }
    if (Number(n) % 50 === 0) {
      total += Number(n);
      profits += (n * 10) / 100;
      agents_prof += (n * 2) / 100;
      return;
    } else {
      if (n >= 5 && n <= 50) {
        total += Number(n);
        profits += 5;
        agents_prof += 1;
        return;
      }
      //All other coditions tested
      else if (n >= 55 && n <= 100) {
        profits += 10;
        agents_prof += 2;
        total += Number(n);
        return;
      } else if (n >= 105 && n <= 150) {
        profits += 15;
        agents_prof += 3;
        total += Number(n);
        return;
      } else if (n >= 155 && n <= 200) {
        profits += 20;
        agents_prof += 4;
        total += Number(n);
        return;
      } else if (n >= 205 && n <= 250) {
        profits += 25;
        agents_prof += 5;
        total += Number(n);
        return;
      } else if (n >= 255 && n <= 300) {
        profits += 30;
        agents_prof += 6;
        total += Number(n);
        return;
      } else if (n >= 305 && n <= 350) {
        profits += 35;
        agents_prof += 7;
        total += Number(n);
        return;
      } else if (n >= 355 && n <= 400) {
        profits += 40;
        agents_prof += 8;
        total += Number(n);
        return;
      } else if (n >= 405 && n <= 450) {
        profits += 45;
        agents_prof += 9;
        total += Number(n);
        return;
      } else if (n >= 455 && n <= 500) {
        profits += 50;
        agents_prof += 10;
        total += Number(n);
        return;
      } else if (n >= 505 && n <= 550) {
        profits += 55;
        agents_prof += 11;
        total += Number(n);
        return;
      } else if (n >= 555 && n <= 600) {
        profits += 60;
        agents_prof += 12;
        total += Number(n);
        return;
      } else if (n >= 605 && n <= 650) {
        profits += 65;
        agents_prof += 13;
        total += Number(n);
        return;
      } else if (n >= 655 && n <= 700) {
        profits += 70;
        agents_prof += 14;
        total += Number(n);
        return;
      } else if (n >= 705 && n <= 750) {
        profits += 75;
        agents_prof += 15;
        total += Number(n);
        return;
      } else if (n >= 755 && n <= 800) {
        profits += 80;
        agents_prof += 16;
        total += Number(n);
        return;
      } else if (n >= 805 && n <= 850) {
        profits += 85;
        agents_prof += 17;
        total += Number(n);
        return;
      } else if (n >= 855 && n <= 900) {
        profits += 90;
        agents_prof += 18;
        total += Number(n);
        return;
      } else if (n >= 905 && n <= 950) {
        profits += 95;
        agents_prof += 19;
        total += Number(n);
        return;
      } else if (n >= 955 && n <= 1000) {
        profits += 100;
        agents_prof += 20;
        total += Number(n);
        return;
      }

      //handle +1000
      else if (n >= 1005 && n <= 1050) {
        profits += 105;
        agents_prof += 21;
        total += Number(n);
        return;
      } else if (n >= 1055 && n <= 1100) {
        profits += 110;
        agents_prof += 22;
        total += Number(n);
        return;
      } else if (n >= 1105 && n <= 1150) {
        profits += 115;
        agents_prof += 23;
        total += Number(n);
        return;
      } else if (n >= 1155 && n <= 1200) {
        profits += 120;
        agents_prof += 24;
        total += Number(n);
        return;
      } else if (n >= 1205 && n <= 1250) {
        profits += 125;
        agents_prof += 25;
        total += Number(n);
        return;
      } else if (n >= 1255 && n <= 1300) {
        profits += 130;
        agents_prof += 26;
        total += Number(n);
        return;
      } else if (n >= 1305 && n <= 1350) {
        profits += 135;
        agents_prof += 27;
        total += Number(n);
        return;
      } else if (n >= 1355 && n <= 1400) {
        profits += 140;
        agents_prof += 28;
        total += Number(n);
        return;
      } else if (n >= 1405 && n <= 1450) {
        profits += 145;
        agents_prof += 29;
        total += Number(n);
        return;
      } else if (n >= 1455 && n <= 1500) {
        profits += 150;
        agents_prof += 30;
        total += Number(n);
        return;
      } else if (n >= 1505 && n <= 1550) {
        profits += 155;
        agents_prof += 31;
        total += Number(n);
        return;
      } else if (n >= 1555 && n <= 1600) {
        profits += 160;
        agents_prof += 32;
        total += Number(n);
        return;
      } else if (n >= 1605 && n <= 1650) {
        profits += 165;
        agents_prof += 33;
        total += Number(n);
        return;
      } else if (n >= 1655 && n <= 1700) {
        profits += 170;
        agents_prof += 34;
        total += Number(n);
        return;
      } else if (n >= 1705 && n <= 1750) {
        profits += 175;
        agents_prof += 35;
        total += Number(n);
        return;
      } else if (n >= 1755 && n <= 1800) {
        profits += 180;
        agents_prof += 36;
        total += Number(n);
        return;
      } else if (n >= 1805 && n <= 1850) {
        profits += 185;
        agents_prof += 37;
        total += Number(n);
        return;
      } else if (n >= 1855 && n <= 1900) {
        profits += 190;
        agents_prof += 38;
        total += Number(n);
        return;
      } else if (n >= 1905 && n <= 1950) {
        profits += 195;
        agents_prof += 39;
        total += Number(n);
        return;
      } else if (n >= 1955 && n <= 2000) {
        profits += 200;
        agents_prof += 40;
        total += Number(n);
        return;
      }

      //handle + 2 thous&&s
      else if (n >= 2005 && n <= 2050) {
        profits += 205;
        agents_prof += 41;
        total += Number(n);
        return;
      } else if (n >= 2055 && n <= 2100) {
        profits += 210;
        agents_prof += 42;
        total += Number(n);
        return;
      } else if (n >= 2105 && n <= 2150) {
        profits += 215;
        agents_prof += 43;
        total += Number(n);
        return;
      } else if (n >= 2155 && n <= 2200) {
        profits += 220;
        agents_prof += 44;
        total += Number(n);
        return;
      } else if (n >= 2205 && n <= 2250) {
        profits += 225;
        agents_prof += 45;
        total += Number(n);
        return;
      } else if (n >= 2255 && n <= 2300) {
        profits += 230;
        agents_prof += 46;
        total += Number(n);
        return;
      } else if (n >= 2305 && n <= 2350) {
        profits += 235;
        agents_prof += 47;
        total += Number(n);
        return;
      } else if (n >= 2355 && n <= 2400) {
        profits += 240;
        agents_prof += 48;
        total += Number(n);
        return;
      } else if (n >= 2405 && n <= 2450) {
        profits += 245;
        agents_prof += 49;
        total += Number(n);
        return;
      } else if (n >= 2455 && n <= 2500) {
        profits += 250;
        agents_prof += 50;
        total += Number(n);
        return;
      } else if (n >= 2505 && n <= 2550) {
        profits += 255;
        agents_prof += 51;
        total += Number(n);
        return;
      } else if (n >= 2555 && n <= 2600) {
        profits += 260;
        agents_prof += 52;
        total += Number(n);
        return;
      } else if (n >= 2605 && n <= 2650) {
        profits += 265;
        agents_prof += 53;
        total += Number(n);
        return;
      } else if (n >= 2655 && n <= 2700) {
        profits += 270;
        agents_prof += 54;
        total += Number(n);
        return;
      } else if (n >= 2705 && n <= 2750) {
        profits += 275;
        agents_prof += 55;
        total += Number(n);
        return;
      } else if (n >= 2755 && n <= 2800) {
        profits += 280;
        agents_prof += 56;
        total += Number(n);
        return;
      } else if (n >= 2805 && n <= 2850) {
        profits += 285;
        agents_prof += 57;
        total += Number(n);
        return;
      } else if (n >= 2855 && n <= 2900) {
        profits += 290;
        agents_prof += 58;
        total += Number(n);
        return;
      } else if (n >= 2905 && n <= 2950) {
        profits += 295;
        agents_prof += 59;
        total += Number(n);
        return;
      } else if (n >= 2955 && n <= 3000) {
        profits += 300;
        agents_prof += 60;
        total += Number(n);
        return;
      } else {
        isLimitError = true;
      }
      // give a maximum entry of 3000 in one go.
      //return error message if it's reached
    }
    total += Number(n);
  });
  return {
    isTypeError,
    isLimitError,
    total,
    profits,
    agents_prof
  };
}

// end of business logic

// ===== DailyRate CRUD functions =====

export const getAllDailyRates = async () => {
  try {
    const response = await client.graphql({
      query: listDailyRates,
      variables: {
        limit: 1000
      }
    });
    return response.data.listDailyRates.items;
  } catch (error) {
    throw error;
  }
};

export const createADailyRate = async (effectiveDate, rate, fixedFee, percentageFee, createdBy) => {
  try {
    const response = await client.graphql({
      query: createDailyRate,
      variables: {
        input: {
          effectiveDate,
          rate: Number(rate),
          fixedFee: fixedFee || null,
          percentageFee: percentageFee || null,
          createdBy
        }
      }
    });
    return response.data.createDailyRate;
  } catch (error) {
    throw error;
  }
};

export const updateADailyRate = async (id, effectiveDate, rate, fixedFee, percentageFee) => {
  try {
    const response = await client.graphql({
      query: updateDailyRate,
      variables: {
        input: {
          id,
          effectiveDate,
          rate: Number(rate),
          fixedFee: fixedFee || null,
          percentageFee: percentageFee || null
        }
      }
    });
    return response.data.updateDailyRate;
  } catch (error) {
    throw error;
  }
};

export const deleteADailyRate = async (id) => {
  try {
    const response = await client.graphql({
      query: deleteDailyRate,
      variables: {
        input: { id }
      }
    });
    return response.data.deleteDailyRate;
  } catch (error) {
    throw error;
  }
};

// ==========================================
// Agent Management Functions
// ==========================================

/**
 * Get Agent record by email
 */
export const getAgentByEmail = async (email) => {
  try {
    const response = await client.graphql({
      query: agentsByEmail,
      variables: { email: email.toLowerCase() }
    });
    return response.data.agentsByEmail?.items?.[0] || null;
  } catch (error) {
    console.error('Error getting agent by email:', error);
    return null;
  }
};

/**
 * Get Agent record by Cognito sub (immutable user ID)
 */
export const getAgentByCognitoSub = async (cognitoSub) => {
  try {
    const response = await client.graphql({
      query: agentsByCognitoSub,
      variables: { cognitoSub }
    });
    return response.data.agentsByCognitoSub?.items?.[0] || null;
  } catch (error) {
    console.error('Error getting agent by cognitoSub:', error);
    return null;
  }
};

/**
 * Get all agents from the Agent model
 */
export const getAllAgents = async () => {
  try {
    console.log('Fetching all agents from Agent model...');
    const response = await client.graphql({
      query: listAgents,
      variables: { limit: 500 }
    });
    const agents = response.data.listAgents?.items || [];
    console.log('Fetched agents:', agents.length, agents);
    return agents;
  } catch (error) {
    console.error('Error listing agents:', error);
    throw error;
  }
};

/**
 * Create or update Agent record on login
 * Called when user in Agent/Gagent group signs in
 * @param {string} email - Agent's email
 * @param {string} name - Agent's display name
 * @param {string} agentType - 'AGENT' or 'GAGENT'
 * @param {string} cognitoSub - Cognito sub (immutable user ID)
 */
export const ensureAgentRecord = async (email, name, agentType, cognitoSub) => {
  try {
    // First try to find by cognitoSub (most reliable)
    let existingAgent = cognitoSub ? await getAgentByCognitoSub(cognitoSub) : null;

    // Fallback to email lookup for legacy records
    if (!existingAgent) {
      existingAgent = await getAgentByEmail(email);
    }

    if (existingAgent) {
      // Agent exists - check if we need to update cognitoSub or name
      const needsUpdate =
        (cognitoSub && !existingAgent.cognitoSub) || // Add cognitoSub if missing
        (existingAgent.name.startsWith('Agent (') && name && !name.includes('@')); // Update placeholder name

      if (needsUpdate) {
        const updates = { id: existingAgent.id };
        if (cognitoSub && !existingAgent.cognitoSub) {
          updates.cognitoSub = cognitoSub;
        }
        if (existingAgent.name.startsWith('Agent (') && name && !name.includes('@')) {
          updates.name = name;
        }

        const response = await client.graphql({
          query: updateAgent,
          variables: { input: updates }
        });
        return response.data.updateAgent;
      }
      return existingAgent;
    }

    // Create new Agent record
    const agentName = name && !name.includes('@') ? name : `Agent (${email})`;
    const response = await client.graphql({
      query: createAgent,
      variables: {
        input: {
          email: email.toLowerCase(),
          cognitoSub: cognitoSub,
          name: agentName,
          agentType: agentType,
          isActive: true
        }
      }
    });
    console.log('Created new Agent record:', response.data.createAgent);
    return response.data.createAgent;
  } catch (error) {
    console.error('Error ensuring agent record:', error);
    // Don't throw - this shouldn't block login
    return null;
  }
};

/**
 * Update Agent details (admin function)
 */
export const updateAgentDetails = async (id, updates) => {
  try {
    const response = await client.graphql({
      query: updateAgent,
      variables: {
        input: {
          id,
          ...updates
        }
      }
    });
    return response.data.updateAgent;
  } catch (error) {
    console.error('Error updating agent:', error);
    throw error;
  }
};

// ==========================================
// Cash Flow Management Functions
// ==========================================

/**
 * Get all agents from the Agent model for Cash Flow Dashboard
 * Agent model is the source of truth - agents must log in to be registered
 */
export const getAgentsFromModel = async () => {
  try {
    const agents = await getAllAgents();

    console.log('All agents from DB:', agents);

    // Filter active agents (include if isActive is true or not explicitly set to false)
    const activeAgents = agents.filter(a => a.isActive !== false);

    console.log('Active agents after filter:', activeAgents);

    // Deduplicate by name + type (keep first occurrence)
    const seen = new Set();
    const uniqueAgents = activeAgents.filter(agent => {
      const key = `${agent.agentType}.${agent.name.toLowerCase()}`;
      if (seen.has(key)) {
        console.warn('Duplicate Agent in DB (skipping):', agent.name, agent.agentType, agent.id);
        return false;
      }
      seen.add(key);
      return true;
    });

    return uniqueAgents.map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.agentType,
      email: agent.email,
      currency: agent.agentType === 'GAGENT' ? 'GMD' : 'GBP'
    }));
  } catch (error) {
    console.error('Error getting agents from model:', error);
    throw error;
  }
};

/**
 * Get or create AgentBalance record for an agent
 * Auto-creates if doesn't exist (for first-time agents)
 * @param {string} agentModelId - The Agent model's UUID (from Agent.id)
 * @param {string} agentName - Agent's display name
 * @param {string} agentType - 'AGENT' or 'GAGENT'
 * @param {string} agentEmail - Agent's email (optional)
 */
export const getOrCreateAgentBalance = async (agentModelId, agentName, agentType, agentEmail = null) => {
  try {
    // Use the actual Agent model ID as the foreign key
    const agentId = agentModelId;

    // Check if balance record exists
    const response = await client.graphql({
      query: agentBalancesByAgentId,
      variables: { agentId }
    });
    const existing = response.data.agentBalancesByAgentId?.items?.[0];

    if (existing) {
      return existing;
    }

    // Auto-create with opening balance of 0 (only called by admin functions)
    const currency = agentType === 'GAGENT' ? 'GMD' : 'GBP';
    const created = await createAgentBalanceRecord({
      agentId,
      agentName,
      agentEmail,
      agentType,
      openingBalance: 0,
      currency
    });

    return created;
  } catch (error) {
    console.error('Error getting or creating agent balance:', error);
    throw error;
  }
};

/**
 * Get agent balance without creating (for non-admin users)
 * @param {string} agentModelId - The Agent model's UUID
 */
export const getAgentBalanceOnly = async (agentModelId) => {
  try {
    const response = await client.graphql({
      query: agentBalancesByAgentId,
      variables: { agentId: agentModelId }
    });
    return response.data.agentBalancesByAgentId?.items?.[0] || null;
  } catch (error) {
    console.error('Error getting agent balance:', error);
    return null;
  }
};

/**
 * Calculate balance directly from transfers (without needing AgentBalance record)
 * Used for agents who don't have a balance record yet
 */
export const calculateBalanceFromTransfers = async (agentName, agentType) => {
  try {
    const typePrefix = agentType === 'GAGENT' ? 'gagent' : 'agent';

    if (agentType === 'GAGENT') {
      // G-Agent: Sum of payouts from PAID transfers
      const paidTransfers = await fetchAllTransfersByFilter({
        paidOutBy: { eq: agentName },
        status: { eq: 'PAID' }
      });
      const totalPayouts = paidTransfers.reduce((sum, t) => sum + (t.payoutAmountGMD || 0), 0);

      return {
        agentName,
        agentType,
        agentId: `${typePrefix}.${agentName.toLowerCase().replace(/\s+/g, '.')}`,
        currency: 'GMD',
        openingBalance: 0,
        currentBalance: -totalPayouts, // Negative because they've paid out without top-ups
        calculation: {
          totalPayouts,
          paidTransfersCount: paidTransfers.length,
          totalTopUps: 0,
          totalAdjustments: 0
        }
      };
    } else {
      // UK Agent: Sum of ALL collections (all payment methods - CASH, WAVE, AFRIMONEY, CREDIT)
      const allTransfers = await fetchAllTransfersByFilter({
        createdBy: { eq: agentName }
      });
      const validTransfers = allTransfers.filter(t => t.status !== 'CANCELLED');
      const totalCollections = validTransfers.reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        agentName,
        agentType,
        agentId: `${typePrefix}.${agentName.toLowerCase().replace(/\s+/g, '.')}`,
        currency: 'GBP',
        openingBalance: 0,
        currentBalance: totalCollections, // Positive = they owe you
        calculation: {
          totalCollections,
          transfersCount: validTransfers.length,
          totalDeliveries: 0,
          totalAdjustments: 0
        }
      };
    }
  } catch (error) {
    console.error('Error calculating balance from transfers:', error);
    throw error;
  }
};

/**
 * Get all agents with their balances - from Agent model
 * This is the main function for the Cash Flow Dashboard (Admin only)
 */
export const getAllAgentsWithBalances = async () => {
  try {
    // Get agents from the Agent model (not derived from transfers)
    const agents = await getAgentsFromModel();

    // Deduplicate agents by agentId (same name + type = same agent)
    const uniqueAgents = [];
    const seenAgentIds = new Set();
    for (const agent of agents) {
      const key = `${agent.agentType}.${agent.agentName.toLowerCase()}`;
      if (!seenAgentIds.has(key)) {
        seenAgentIds.add(key);
        uniqueAgents.push(agent);
      } else {
        console.warn('Duplicate agent detected and skipped:', agent.agentName, agent.agentType);
      }
    }

    // For each agent, get or create balance record and calculate current balance
    const agentsWithBalances = await Promise.all(
      uniqueAgents.map(async (agent) => {
        const balanceRecord = await getOrCreateAgentBalance(agent.agentId, agent.agentName, agent.agentType, agent.email);

        // If balance record exists but has no email, update it
        if (balanceRecord && !balanceRecord.agentEmail && agent.email) {
          await updateAgentBalanceRecord(balanceRecord.id, { agentEmail: agent.email });
          balanceRecord.agentEmail = agent.email;
        }

        const withCalc = await getAgentBalanceWithCalculation(balanceRecord);
        return {
          ...withCalc,
          email: agent.email // Include email for reference
        };
      })
    );

    // Final deduplication by balance record ID (safety net)
    const uniqueBalances = [];
    const seenIds = new Set();
    for (const balance of agentsWithBalances) {
      if (!seenIds.has(balance.id)) {
        seenIds.add(balance.id);
        uniqueBalances.push(balance);
      } else {
        console.warn('Duplicate balance record detected and skipped:', balance.agentName, balance.id);
      }
    }

    return uniqueBalances;
  } catch (error) {
    console.error('Error getting all agents with balances:', error);
    throw error;
  }
};

/**
 * Get single agent's balance - for agents viewing their own data
 * Does NOT create a balance record (agents don't have permission)
 * @param {string} cognitoSub - Agent's Cognito sub (immutable user ID)
 */
export const getMyAgentBalance = async (cognitoSub) => {
  try {
    // Look up Agent model record by cognitoSub
    const agentRecord = await getAgentByCognitoSub(cognitoSub);

    if (!agentRecord) {
      console.log('No Agent record found for cognitoSub:', cognitoSub);
      return null;
    }

    // Use Agent model ID to find balance record
    const balanceRecord = await getAgentBalanceOnly(agentRecord.id);

    if (balanceRecord) {
      // Has a record, calculate with it
      const withCalc = await getAgentBalanceWithCalculation(balanceRecord);
      return withCalc;
    }

    // No balance record yet - calculate directly from transfers
    const calculated = await calculateBalanceFromTransfers(agentRecord.name, agentRecord.agentType);
    return {
      ...calculated,
      agentId: agentRecord.id // Use actual Agent ID
    };
  } catch (error) {
    console.error('Error getting my agent balance:', error);
    throw error;
  }
};

// Get all agent balances (Admin use) - legacy, use getAllAgentsWithBalances instead
export const getAgentBalances = async () => {
  try {
    const response = await client.graphql({
      query: listAgentBalances,
      variables: { limit: 100 }
    });
    return response.data.listAgentBalances.items;
  } catch (error) {
    console.error('Error fetching agent balances:', error);
    throw error;
  }
};

// Get agent balance by agent ID (for agents to see their own)
export const getAgentBalanceByAgentId = async (agentId) => {
  try {
    const response = await client.graphql({
      query: agentBalancesByAgentId,
      variables: { agentId }
    });
    const items = response.data.agentBalancesByAgentId?.items || [];
    return items[0] || null; // Return first match or null
  } catch (error) {
    console.error('Error fetching agent balance by ID:', error);
    throw error;
  }
};

// Get single agent balance by record ID
export const getAgentBalanceById = async (id) => {
  try {
    const response = await client.graphql({
      query: getAgentBalance,
      variables: { id }
    });
    return response.data.getAgentBalance;
  } catch (error) {
    console.error('Error fetching agent balance:', error);
    throw error;
  }
};

// Create new agent balance record
export const createAgentBalanceRecord = async ({ agentId, agentName, agentEmail, agentType, openingBalance, currency }) => {
  try {
    const response = await client.graphql({
      query: createAgentBalance,
      variables: {
        input: {
          agentId,
          agentName,
          agentEmail,
          agentType,
          openingBalance: openingBalance || 0,
          currentBalance: openingBalance || 0, // Will be recalculated
          currency,
          lastUpdated: new Date().toISOString()
        }
      }
    });
    return response.data.createAgentBalance;
  } catch (error) {
    console.error('Error creating agent balance:', error);
    throw error;
  }
};

// Update agent balance record (for editing name, opening balance, etc.)
export const updateAgentBalanceRecord = async (id, updates) => {
  try {
    const response = await client.graphql({
      query: updateAgentBalance,
      variables: {
        input: {
          id,
          ...updates,
          lastUpdated: new Date().toISOString()
        }
      }
    });
    return response.data.updateAgentBalance;
  } catch (error) {
    console.error('Error updating agent balance:', error);
    throw error;
  }
};

// Get transactions for an agent balance (manual entries: TOP_UP, DELIVERY, ADJUSTMENT)
export const getCashFlowTransactions = async (agentBalanceId) => {
  try {
    return await fetchAllCashFlowTransactionsByBalanceId(agentBalanceId);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Create cash flow transaction (manual: TOP_UP, DELIVERY, ADJUSTMENT)
export const createCashFlowTransactionRecord = async ({
  agentBalanceId,
  agentId,
  agentName,
  transactionType,
  amount,
  currency,
  description,
  createdBy
}) => {
  try {
    const response = await client.graphql({
      query: createCashFlowTransaction,
      variables: {
        input: {
          agentBalanceId,
          agentId,
          agentName,
          transactionType,
          amount,
          currency,
          description,
          createdBy
        }
      }
    });
    return response.data.createCashFlowTransaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Alias for screen usage
export { createCashFlowTransactionRecord as createCashFlowTransaction };

/**
 * Calculate G-Agent balance from transfers and manual transactions
 * Formula: openingBalance + SUM(TOP_UPs) - SUM(payoutAmountGMD from PAID transfers) + SUM(ADJUSTMENTs)
 */
export const calculateGAgentBalance = async (agentBalance, includeAllUnsettled = false) => {
  try {
    const periodStart = agentBalance.periodStartDate;
    // Use agentEmail from balance record, or email from parent object
    const gagentEmail = agentBalance.agentEmail || agentBalance.email;
    const gagentName = agentBalance.agentName;

    console.log('calculateGAgentBalance - agent:', gagentName, 'email:', gagentEmail);

    let paidTransfers = [];

    // Query by email if available (new transfers)
    if (gagentEmail) {
      const byEmailTransfers = await fetchAllTransfersByFilter({
        paidOutById: { eq: gagentEmail },
        status: { eq: 'PAID' },
        gagentSettled: { ne: true }
      });
      paidTransfers = byEmailTransfers;
      console.log(`Found ${paidTransfers.length} transfers by email`);
    }

    // Also query by name (for old transfers without paidOutById)
    if (gagentName) {
      const byNameTransfers = await fetchAllTransfersByFilter({
        paidOutBy: { eq: gagentName },
        paidOutById: { attributeExists: false },
        status: { eq: 'PAID' },
        gagentSettled: { ne: true }
      });
      console.log(`Found ${byNameTransfers.length} transfers by name (legacy)`);

      // Merge, avoiding duplicates
      const existingIds = new Set(paidTransfers.map(t => t.id));
      byNameTransfers.forEach(t => {
        if (!existingIds.has(t.id)) {
          paidTransfers.push(t);
        }
      });
    }

    console.log('Total', paidTransfers.length, 'unsettled PAID transfers for this G-Agent');

    // For display purposes, filter by period
    let transfersForCalculation = paidTransfers;
    if (periodStart) {
      const periodStartTime = new Date(periodStart).getTime();
      transfersForCalculation = paidTransfers.filter(t => {
        const paidDateStr = t.paid_on || t.updatedAt;
        const paidDate = paidDateStr && paidDateStr.length === 10
          ? new Date(paidDateStr + 'T23:59:59.999Z')
          : new Date(paidDateStr);
        return paidDate.getTime() >= periodStartTime;
      });
      console.log(`Period filter: ${paidTransfers.length} -> ${transfersForCalculation.length} transfers`);
    }

    // Sum of payouts (GMD paid out) - use filtered transfers for display
    const totalPayouts = transfersForCalculation.reduce((sum, t) => sum + (t.payoutAmountGMD || 0), 0);

    // Get manual transactions (TOP_UP, ADJUSTMENT) - only in current period
    const allTransactions = await getCashFlowTransactions(agentBalance.id);
    const transactions = periodStart
      ? allTransactions.filter(t => new Date(t.createdAt) >= new Date(periodStart))
      : allTransactions;

    const totalTopUps = transactions
      .filter(t => t.transactionType === 'TOP_UP')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalAdjustments = transactions
      .filter(t => t.transactionType === 'ADJUSTMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate balance
    const calculatedBalance = (agentBalance.openingBalance || 0) + totalTopUps - totalPayouts + totalAdjustments;

    return {
      calculatedBalance,
      totalTopUps,
      totalPayouts,
      totalAdjustments,
      paidTransfersCount: transfersForCalculation.length,
      transfers: paidTransfers,
      transfersInPeriod: transfersForCalculation,
      periodStartDate: periodStart
    };
  } catch (error) {
    console.error('Error calculating G-Agent balance:', error);
    throw error;
  }
};

/**
 * Calculate Agent balance from transfers and manual transactions
 * Formula: openingBalance + SUM(amount from transfers created by agent) - SUM(DELIVERYs) + SUM(ADJUSTMENTs)
 * Note: Agent owes money, so positive balance = they owe you
 */
export const calculateAgentBalance = async (agentBalance) => {
  try {
    console.log('Calculating balance for agent:', agentBalance.agentName, 'ID:', agentBalance.id, 'agentId:', agentBalance.agentId);
    const periodStart = agentBalance.periodStartDate;

    // Get the Agent record to find cognitoSub for transfer lookup
    let cognitoSub = null;
    if (agentBalance.agentId) {
      try {
        const agentRecord = await client.graphql({
          query: getAgent,
          variables: { id: agentBalance.agentId }
        });
        cognitoSub = agentRecord.data.getAgent?.cognitoSub;
        console.log('Found cognitoSub for agent:', cognitoSub);
      } catch (err) {
        console.log('Could not fetch Agent record:', err);
      }
    }

    // Get transfers created by this agent - try by Cognito sub first, then fallback to name
    let allTransfers = [];

    // Primary: Query by createdById (Cognito sub) - for new transfers
    if (cognitoSub) {
      const byIdTransfers = await fetchAllTransfersByFilter({
        createdById: { eq: cognitoSub },
        agentSettled: { ne: true }
      });
      allTransfers = byIdTransfers;
      console.log(`Found ${allTransfers.length} transfers by createdById (cognitoSub)`);
    }

    // Fallback: Also query by createdBy (name) for legacy transfers without createdById
    if (agentBalance.agentName) {
      const byNameTransfers = await fetchAllTransfersByFilter({
        createdBy: { eq: agentBalance.agentName },
        createdById: { attributeExists: false },
        agentSettled: { ne: true }
      });
      console.log(`Found ${byNameTransfers.length} transfers by createdBy (legacy)`);

      // Merge, avoiding duplicates
      const existingIds = new Set(allTransfers.map(t => t.id));
      byNameTransfers.forEach(t => {
        if (!existingIds.has(t.id)) {
          allTransfers.push(t);
        }
      });
    }

    // Only count non-cancelled transfers
    let validTransfers = allTransfers.filter(t => t.status !== 'CANCELLED');

    // Filter by period start date if set
    if (periodStart) {
      validTransfers = validTransfers.filter(t =>
        new Date(t.createdAt) >= new Date(periodStart)
      );
    }

    // Sum of collections (GBP collected) - includes ALL payment methods
    const totalCollections = validTransfers.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Get manual transactions (DELIVERY, ADJUSTMENT) - only in current period
    const allTransactions = await getCashFlowTransactions(agentBalance.id);
    const transactions = periodStart
      ? allTransactions.filter(t => new Date(t.createdAt) >= new Date(periodStart))
      : allTransactions;

    console.log('Found transactions for', agentBalance.agentName, ':', transactions.length, transactions);

    const totalDeliveries = transactions
      .filter(t => t.transactionType === 'DELIVERY')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalAdjustments = transactions
      .filter(t => t.transactionType === 'ADJUSTMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate balance (positive = agent owes money)
    const calculatedBalance = (agentBalance.openingBalance || 0) + totalCollections - totalDeliveries + totalAdjustments;

    console.log('Balance calc for', agentBalance.agentName, ':', {
      openingBalance: agentBalance.openingBalance || 0,
      totalCollections,
      totalDeliveries,
      totalAdjustments,
      calculatedBalance,
      periodStart
    });

    return {
      calculatedBalance,
      totalCollections,
      totalDeliveries,
      totalAdjustments,
      transfersCount: validTransfers.length,
      transfers: validTransfers,
      periodStartDate: periodStart
    };
  } catch (error) {
    console.error('Error calculating Agent balance:', error);
    throw error;
  }
};

/**
 * Get agent balance with calculated current balance
 */
export const getAgentBalanceWithCalculation = async (agentBalance) => {
  try {
    let calculation;
    if (agentBalance.agentType === 'GAGENT') {
      calculation = await calculateGAgentBalance(agentBalance);
    } else {
      calculation = await calculateAgentBalance(agentBalance);
    }

    return {
      ...agentBalance,
      currentBalance: calculation.calculatedBalance,
      calculation
    };
  } catch (error) {
    console.error('Error getting balance with calculation:', error);
    return agentBalance;
  }
};

/**
 * Get all agent balances with calculated current balances
 */
export const getAgentBalancesWithCalculations = async () => {
  try {
    const balances = await getAgentBalances();
    const balancesWithCalc = await Promise.all(
      balances.map(b => getAgentBalanceWithCalculation(b))
    );
    return balancesWithCalc;
  } catch (error) {
    console.error('Error getting balances with calculations:', error);
    throw error;
  }
};

/**
 * Record a delivery (Agent delivers cash to Admin)
 * This also settles all CASH transfers in the period and creates a report
 * The period resets and current balance becomes opening balance
 * AND credits the Admin's balance with the delivered amount
 * @param {Object} adminBalance - Optional: Admin's AgentBalance record to credit
 */
export const recordDelivery = async (agentBalanceId, agentId, agentName, amount, description, createdBy, agentBalance = null, adminBalance = null) => {
  try {
    let reportId = null;

    // If we have the current agent balance, reset the period and settle transfers
    if (agentBalance) {
      // Get the current calculated balance to set as new opening balance
      const calc = await calculateAgentBalance(agentBalance);
      const newOpeningBalance = calc.calculatedBalance - amount; // After this delivery

      // Settle all CASH transfers in this period (mark them as settled)
      const transfersToSettle = calc.transfers || [];
      console.log(`Settling ${transfersToSettle.length} transfers for Agent ${agentName}`);

      // Create a settlement report if there are transfers to settle
      if (transfersToSettle.length > 0) {
        try {
          const periodStart = agentBalance.periodStartDate
            ? new Date(agentBalance.periodStartDate).toLocaleDateString('en-GB')
            : 'Start';
          const periodEnd = new Date().toLocaleDateString('en-GB');
          const settledOn = new Date().toISOString();

          const reportResponse = await client.graphql({
            query: createTransferReport,
            variables: {
              input: {
                creator: `${createdBy} (Agent Settlement: ${agentName}, Period: ${periodStart} - ${periodEnd})`,
                reportType: 'AGENT_SETTLEMENT'
              }
            }
          });
          reportId = reportResponse.data.createTransferReport.id;
          console.log('Created Agent settlement report:', reportId, 'at', settledOn);
        } catch (err) {
          console.error('Error creating Agent settlement report:', err);
        }
      }

      // Settle transfers for Agent and link them to the report
      const settledOn = new Date().toISOString();
      const failedTransferIds = [];
      for (const transfer of transfersToSettle) {
        if (!transfer.agentSettled) {
          try {
            await client.graphql({
              query: updateTransfer,
              variables: {
                input: {
                  id: transfer.id,
                  agentSettled: true,
                  agentSettled_on: settledOn,
                  ...(reportId && { agentReportID: reportId })
                }
              }
            });
            console.log('Agent settled transfer:', transfer.id);
          } catch (err) {
            console.error('Error settling transfer for Agent:', transfer.id, err);
            failedTransferIds.push(transfer.id);
          }
        }
      }

      if (failedTransferIds.length > 0) {
        throw new Error(`Failed to settle ${failedTransferIds.length} transfer(s) for Agent before period reset`);
      }

      // Update the agent balance record to start a new period
      // IMPORTANT: Set periodStartDate to NOW + 1 second to ensure the delivery transaction
      // (which is recorded right after) falls BEFORE the new period start
      const newPeriodStart = new Date(Date.now() + 1000).toISOString();
      await updateAgentBalanceRecord(agentBalanceId, {
        openingBalance: newOpeningBalance,
        periodStartDate: newPeriodStart
      });
      console.log('Reset Agent period, new opening balance:', newOpeningBalance, 'new period starts:', newPeriodStart);
    }

    // Record the delivery transaction (this happens BEFORE the new period starts)
    await createCashFlowTransactionRecord({
      agentBalanceId,
      agentId,
      agentName,
      transactionType: 'DELIVERY',
      amount: amount,
      currency: 'GBP',
      description: description || `Cash delivery (Report: ${reportId || 'N/A'})`,
      createdBy
    });

    // Credit the Admin's balance with the delivered amount
    // Use the adminBalance passed from the caller (already loaded in CashFlowDashboard)
    if (adminBalance && adminBalance.id) {
      try {
        console.log(`Crediting Admin ${adminBalance.agentName} with £${amount} from Agent ${agentName} delivery`);
        await createCashFlowTransactionRecord({
          agentBalanceId: adminBalance.id,
          agentId: adminBalance.agentId,
          agentName: adminBalance.agentName,
          transactionType: 'ADJUSTMENT',
          amount: amount, // Positive amount - adds to admin's balance
          currency: 'GBP',
          description: `Agent ${agentName} delivery${reportId ? ` (Report: ${reportId})` : ''}`,
          createdBy
        });
        console.log(`Admin ${adminBalance.agentName} balance credited with £${amount}`);
      } catch (creditError) {
        // Don't fail the whole operation if admin credit fails
        console.error('Error crediting Admin balance:', creditError);
      }
    } else {
      console.log(`No Admin balance provided - skipping credit. Admin needs an AgentBalance record to receive credits.`);
    }

    return { success: true, reportId };
  } catch (error) {
    console.error('Error recording delivery:', error);
    throw error;
  }
};

/**
 * Record a top-up (Admin gives GMD to G-Agent)
 * This also resets the period - current balance becomes opening balance
 * AND settles all PAID transfers in the period (so they can't be reverted)
 * AND creates a settlement report for historical record
 */
export const recordTopUp = async (agentBalanceId, agentId, agentName, amount, description, createdBy, agentBalance = null) => {
  try {
    let reportId = null;
    const settledOn = new Date().toISOString(); // Full ISO timestamp for proper tracking

    // If we have the current agent balance, reset the period and settle transfers
    if (agentBalance) {
      // Get the current calculated balance to set as new opening balance
      const calc = await calculateGAgentBalance(agentBalance);
      // IMPORTANT: Include the new top-up in the opening balance since we're resetting the period
      const newOpeningBalance = calc.calculatedBalance + amount;

      // Match by paidOutById (email) - unique identifier
      // Use agentEmail from balance record, or email from parent object
      const gagentEmail = agentBalance.agentEmail || agentBalance.email;
      const gagentName = agentBalance.agentName;

      // Fetch ALL unsettled PAID transfers for this G-Agent
      // Try by email first (new transfers), fallback to name (old transfers)
      console.log('Fetching unsettled transfers for G-Agent:', gagentName, 'email:', gagentEmail);

      let transfersToSettle = [];

      // Query by email if available
      if (gagentEmail) {
        const byEmailTransfers = await fetchAllTransfersByFilter({
          paidOutById: { eq: gagentEmail },
          status: { eq: 'PAID' },
          gagentSettled: { ne: true }
        });
        transfersToSettle = byEmailTransfers;
        console.log(`Found ${transfersToSettle.length} transfers by email`);
      }

      // Also query by name (for old transfers without paidOutById)
      if (gagentName) {
        const byNameTransfers = await fetchAllTransfersByFilter({
          paidOutBy: { eq: gagentName },
          paidOutById: { attributeExists: false },
          status: { eq: 'PAID' },
          gagentSettled: { ne: true }
        });
        console.log(`Found ${byNameTransfers.length} transfers by name (legacy)`);

        // Merge, avoiding duplicates
        const existingIds = new Set(transfersToSettle.map(t => t.id));
        byNameTransfers.forEach(t => {
          if (!existingIds.has(t.id)) {
            transfersToSettle.push(t);
          }
        });
      }

      console.log(`Total ${transfersToSettle.length} unsettled transfers to settle:`, transfersToSettle.map(t => t.id));

      // Create a settlement report if there are transfers to settle
      if (transfersToSettle.length > 0) {
        try {
          // Create the report first - include time for easy spotting
          const periodStart = agentBalance.periodStartDate
            ? new Date(agentBalance.periodStartDate).toLocaleString('en-GB')
            : 'Start';
          const periodEnd = new Date().toLocaleString('en-GB');

          const reportResponse = await client.graphql({
            query: createTransferReport,
            variables: {
              input: {
                creator: `${createdBy} (G-Agent Settlement: ${agentName}, Period: ${periodStart} - ${periodEnd})`,
                reportType: 'GAGENT_SETTLEMENT'
              }
            }
          });
          reportId = reportResponse.data.createTransferReport.id;
          console.log('Created G-Agent settlement report:', reportId, 'at', settledOn);
        } catch (err) {
          console.error('Error creating G-Agent settlement report:', err);
        }

        // Settle each transfer
        const failedTransferIds = [];
        for (const transfer of transfersToSettle) {
          try {
            console.log('Settling transfer:', transfer.id);
            await client.graphql({
              query: updateTransfer,
              variables: {
                input: {
                  id: transfer.id,
                  gagentSettled: true,
                  gagentSettled_on: settledOn,
                  ...(reportId && { gagentReportID: reportId })
                }
              }
            });
            console.log('Successfully settled transfer:', transfer.id);
          } catch (err) {
            console.error('Error settling transfer:', transfer.id, err);
            failedTransferIds.push(transfer.id);
          }
        }

        if (failedTransferIds.length > 0) {
          throw new Error(`Failed to settle ${failedTransferIds.length} transfer(s) for G-Agent before period reset`);
        }
      } else {
        console.log('No unsettled transfers found for G-Agent:', agentName);
      }

      // Update the agent balance record to start a new period
      // IMPORTANT: Set periodStartDate to NOW + 1 second to ensure the top-up transaction
      // (which is recorded right after) falls BEFORE the new period start
      const newPeriodStart = new Date(Date.now() + 1000).toISOString();
      await updateAgentBalanceRecord(agentBalanceId, {
        openingBalance: newOpeningBalance,
        periodStartDate: newPeriodStart
      });
      console.log('Reset G-Agent period, new opening balance:', newOpeningBalance, 'new period starts:', newPeriodStart);
    }

    // Record the top-up transaction (this happens BEFORE the new period starts)
    await createCashFlowTransactionRecord({
      agentBalanceId,
      agentId,
      agentName,
      transactionType: 'TOP_UP',
      amount: amount,
      currency: 'GMD',
      description: description || `Top-up (Report: ${reportId || 'N/A'})`,
      createdBy
    });
    return { success: true, reportId };
  } catch (error) {
    console.error('Error recording top-up:', error);
    throw error;
  }
};

/**
 * Record an adjustment (can be positive or negative)
 */
export const recordAdjustment = async (agentBalanceId, agentId, agentName, amount, currency, description, createdBy) => {
  try {
    await createCashFlowTransactionRecord({
      agentBalanceId,
      agentId,
      agentName,
      transactionType: 'ADJUSTMENT',
      amount: amount,
      currency: currency,
      description: description || 'Balance adjustment',
      createdBy
    });
    return true;
  } catch (error) {
    console.error('Error recording adjustment:', error);
    throw error;
  }
};

// ==========================================
// Real-time Subscriptions
// ==========================================

/**
 * Subscribe to transfer updates (create, update, delete)
 * Returns an object with unsubscribe methods for cleanup
 */
export const subscribeToTransfers = (callbacks = {}) => {
  const { onCreate, onUpdate, onDelete } = callbacks;
  const subscriptions = [];

  if (onCreate) {
    const createSub = client.graphql({
      query: onCreateTransfer
    }).subscribe({
      next: ({ value }) => {
        const transfer = value.data.onCreateTransfer;
        console.log('New transfer created:', transfer.id);
        onCreate(transfer);
      },
      error: (err) => console.error('Create subscription error:', err)
    });
    subscriptions.push(createSub);
  }

  if (onUpdate) {
    const updateSub = client.graphql({
      query: onUpdateTransfer
    }).subscribe({
      next: ({ value }) => {
        const transfer = value.data.onUpdateTransfer;
        console.log('Transfer updated:', transfer.id);
        onUpdate(transfer);
      },
      error: (err) => console.error('Update subscription error:', err)
    });
    subscriptions.push(updateSub);
  }

  if (onDelete) {
    const deleteSub = client.graphql({
      query: onDeleteTransfer
    }).subscribe({
      next: ({ value }) => {
        const transfer = value.data.onDeleteTransfer;
        console.log('Transfer deleted:', transfer.id);
        onDelete(transfer);
      },
      error: (err) => console.error('Delete subscription error:', err)
    });
    subscriptions.push(deleteSub);
  }

  // Return unsubscribe function
  return {
    unsubscribe: () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    }
  };
};

/**
 * Subscribe to daily rate updates (create, update, delete)
 * Returns an object with unsubscribe method for cleanup
 */
export const subscribeToDailyRates = (callbacks = {}) => {
  const { onCreate, onUpdate, onDelete } = callbacks;
  const subscriptions = [];

  if (onCreate) {
    const createSub = client.graphql({
      query: onCreateDailyRate
    }).subscribe({
      next: ({ value }) => {
        const rate = value.data.onCreateDailyRate;
        console.log('New daily rate created:', rate.id);
        onCreate(rate);
      },
      error: (err) => console.error('DailyRate create subscription error:', err)
    });
    subscriptions.push(createSub);
  }

  if (onUpdate) {
    const updateSub = client.graphql({
      query: onUpdateDailyRate
    }).subscribe({
      next: ({ value }) => {
        const rate = value.data.onUpdateDailyRate;
        console.log('Daily rate updated:', rate.id);
        onUpdate(rate);
      },
      error: (err) => console.error('DailyRate update subscription error:', err)
    });
    subscriptions.push(updateSub);
  }

  if (onDelete) {
    const deleteSub = client.graphql({
      query: onDeleteDailyRate
    }).subscribe({
      next: ({ value }) => {
        const rate = value.data.onDeleteDailyRate;
        console.log('Daily rate deleted:', rate.id);
        onDelete(rate);
      },
      error: (err) => console.error('DailyRate delete subscription error:', err)
    });
    subscriptions.push(deleteSub);
  }

  // Return unsubscribe function
  return {
    unsubscribe: () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    }
  };
};

/**
 * Subscribe to sender (contact) updates
 */
export const subscribeToSenders = (callbacks = {}) => {
  const { onCreate, onUpdate, onDelete } = callbacks;
  const subscriptions = [];

  if (onCreate) {
    const sub = client.graphql({ query: onCreateSender }).subscribe({
      next: ({ value }) => onCreate(value.data.onCreateSender),
      error: (err) => console.error('Sender create subscription error:', err)
    });
    subscriptions.push(sub);
  }

  if (onUpdate) {
    const sub = client.graphql({ query: onUpdateSender }).subscribe({
      next: ({ value }) => onUpdate(value.data.onUpdateSender),
      error: (err) => console.error('Sender update subscription error:', err)
    });
    subscriptions.push(sub);
  }

  if (onDelete) {
    const sub = client.graphql({ query: onDeleteSender }).subscribe({
      next: ({ value }) => onDelete(value.data.onDeleteSender),
      error: (err) => console.error('Sender delete subscription error:', err)
    });
    subscriptions.push(sub);
  }

  return { unsubscribe: () => subscriptions.forEach(sub => sub.unsubscribe()) };
};

/**
 * Subscribe to receiver updates
 */
export const subscribeToReceivers = (callbacks = {}) => {
  const { onCreate, onUpdate, onDelete } = callbacks;
  const subscriptions = [];

  if (onCreate) {
    const sub = client.graphql({ query: onCreateReceiver }).subscribe({
      next: ({ value }) => onCreate(value.data.onCreateReceiver),
      error: (err) => console.error('Receiver create subscription error:', err)
    });
    subscriptions.push(sub);
  }

  if (onUpdate) {
    const sub = client.graphql({ query: onUpdateReceiver }).subscribe({
      next: ({ value }) => onUpdate(value.data.onUpdateReceiver),
      error: (err) => console.error('Receiver update subscription error:', err)
    });
    subscriptions.push(sub);
  }

  if (onDelete) {
    const sub = client.graphql({ query: onDeleteReceiver }).subscribe({
      next: ({ value }) => onDelete(value.data.onDeleteReceiver),
      error: (err) => console.error('Receiver delete subscription error:', err)
    });
    subscriptions.push(sub);
  }

  return { unsubscribe: () => subscriptions.forEach(sub => sub.unsubscribe()) };
};

/**
 * Subscribe to CashFlowTransaction updates (for real-time updates in CashFlowDetail)
 */
export const subscribeToCashFlowTransactions = (callbacks = {}) => {
  const { onCreate } = callbacks;
  const subscriptions = [];

  if (onCreate) {
    const sub = client.graphql({ query: onCreateCashFlowTransaction }).subscribe({
      next: ({ value }) => {
        const transaction = value.data.onCreateCashFlowTransaction;
        console.log('New CashFlowTransaction created:', transaction.id);
        onCreate(transaction);
      },
      error: (err) => console.error('CashFlowTransaction subscription error:', err)
    });
    subscriptions.push(sub);
  }

  return { unsubscribe: () => subscriptions.forEach(sub => sub.unsubscribe()) };
};

// ==========================================
// Cash Flow Report Functions
// ==========================================

/**
 * Get cash flow report for an agent - historical daily summary
 * Groups activity by date to show Opening, Top-Ups, Payouts, Adjustments, Closing for each day.
 */
export const getCashFlowReport = async (agentBalance, startDate, endDate) => {
  try {
    const isGAgent = agentBalance.agentType === 'GAGENT';
    const currency = isGAgent ? 'GMD' : 'GBP';
    const symbol = isGAgent ? 'D' : '£';

    const startDateTime = startDate ? new Date(startDate + 'T00:00:00.000Z') : null;
    const endDateTime = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date();

    // 1. Fetch ALL relevant activity (transfers and manual transactions)
    // We need ALL records because we reconstruct the balance from the reference period

    // FETCH TRANSFERS
    let allTransfers = [];
    if (isGAgent) {
      const gagentEmail = agentBalance.agentEmail || agentBalance.email;
      const gagentName = agentBalance.agentName;

      const fetchTransfers = async (filter) => {
        let items = [];
        let token = null;
        do {
          const resp = await client.graphql({ query: listTransfers, variables: { limit: 1000, nextToken: token, filter } });
          const result = resp.data.listTransfers;
          items = [...items, ...(result?.items || [])];
          token = result?.nextToken;
        } while (token);
        return items;
      };

      if (gagentEmail) {
        const items = await fetchTransfers({ paidOutById: { eq: gagentEmail }, status: { eq: 'PAID' } });
        allTransfers = items;
      }
      if (gagentName) {
        const items = await fetchTransfers({ paidOutBy: { eq: gagentName }, paidOutById: { attributeExists: false }, status: { eq: 'PAID' } });
        const ids = new Set(allTransfers.map(t => t.id));
        items.forEach(t => { if (!ids.has(t.id)) allTransfers.push(t); });
      }
    } else {
      const agentName = agentBalance.agentName;
      let cognitoSub = null;
      if (agentBalance.agentId) {
        try {
          const resp = await client.graphql({ query: getAgent, variables: { id: agentBalance.agentId } });
          cognitoSub = resp.data.getAgent?.cognitoSub;
        } catch (e) { }
      }

      const fetchTransfers = async (filter) => {
        let items = [];
        let token = null;
        do {
          const resp = await client.graphql({ query: listTransfers, variables: { limit: 1000, nextToken: token, filter } });
          const result = resp.data.listTransfers;
          items = [...items, ...(result?.items || [])];
          token = result?.nextToken;
        } while (token);
        return items;
      };

      if (cognitoSub) {
        const items = await fetchTransfers({ createdById: { eq: cognitoSub } });
        allTransfers = items;
      }
      if (agentName) {
        const items = await fetchTransfers({ createdBy: { eq: agentName }, createdById: { attributeExists: false } });
        const ids = new Set(allTransfers.map(t => t.id));
        items.forEach(t => { if (!ids.has(t.id)) allTransfers.push(t); });
      }
      allTransfers = allTransfers.filter(t => t.status !== 'CANCELLED');
    }

    // FETCH MANUAL TRANSACTIONS
    let allManualTx = [];
    if (agentBalance.id) {
      let token = null;
      do {
        const resp = await client.graphql({
          query: cashFlowTransactionsByAgentBalanceId,
          variables: { agentBalanceId: agentBalance.id, limit: 500, nextToken: token }
        });
        const result = resp.data.cashFlowTransactionsByAgentBalanceId;
        allManualTx = [...allManualTx, ...(result?.items || [])];
        token = result?.nextToken;
      } while (token);
    }

    // 2. Combine and sort all activity
    const allActivity = [];
    allTransfers.forEach(t => {
      const date = isGAgent
        ? (t.paid_on ? new Date(t.paid_on + 'T12:00:00.000Z') : new Date(t.updatedAt))
        : new Date(t.createdAt);
      const amt = isGAgent ? (t.payoutAmountGMD || 0) : (t.amount || 0);
      // G-Agent: Payouts decrease balance. Agent: Collections increase balance.
      allActivity.push({
        date,
        type: 'PAYOUT', // "PAYOUT" for GAgent is Outflow, for Agent it's actually "COLLECTION" (Inflow)
        amount: isGAgent ? -amt : amt,
        original: t
      });
    });
    allManualTx.forEach(t => {
      let amt = t.amount || 0;
      // Normalizing manual tx signs
      if (isGAgent) {
        if (t.transactionType === 'TOP_UP') amt = Math.abs(amt); // Inflow
        else if (t.transactionType === 'DELIVERY') amt = -Math.abs(amt); // Outflow (if G-Agent ever delivers)
      } else {
        if (t.transactionType === 'DELIVERY') amt = -Math.abs(amt); // Outflow
        else if (t.transactionType === 'TOP_UP') amt = Math.abs(amt); // Inflow
      }
      // ADJUSTMENTs keep their sign from input
      allActivity.push({ date: new Date(t.createdAt), type: t.transactionType, amount: amt, original: t });
    });

    allActivity.sort((a, b) => a.date - b.date);

    // 3. Reconstruct Balance Timeline
    // Reference Point: agentBalance.openingBalance at agentBalance.periodStartDate
    const refOpeningBalance = agentBalance.openingBalance || 0;
    const refDate = agentBalance.periodStartDate ? new Date(agentBalance.periodStartDate) : new Date(0);

    // Calculate balance at startDateTime
    let balanceAtStart = refOpeningBalance;
    if (startDateTime) {
      if (startDateTime > refDate) {
        // Report starts AFTER reference date. Add activity from refDate to startDateTime.
        const gapActivity = allActivity.filter(a => a.date >= refDate && a.date < startDateTime);
        gapActivity.forEach(a => { balanceAtStart += a.amount; });
      } else if (startDateTime < refDate) {
        // Report starts BEFORE reference date. Subtract activity from startDateTime to refDate.
        const gapActivity = allActivity.filter(a => a.date >= startDateTime && a.date < refDate);
        gapActivity.forEach(a => { balanceAtStart -= a.amount; });
      }
    }

    const reportOpeningBalance = balanceAtStart;

    // 4. Group activity within range by day
    const inRangeActivity = allActivity.filter(a =>
      (!startDateTime || a.date >= startDateTime) &&
      (!endDateTime || a.date <= endDateTime)
    );

    const dailyGroups = {};
    inRangeActivity.forEach(a => {
      const dayKey = a.date.toISOString().split('T')[0];
      if (!dailyGroups[dayKey]) dailyGroups[dayKey] = { in: 0, out: 0, adjustments: 0, transactions: [] };

      if (isGAgent) {
        if (a.type === 'TOP_UP') dailyGroups[dayKey].in += a.amount;
        else if (a.type === 'PAYOUT') dailyGroups[dayKey].out += a.amount;
        else if (a.type === 'ADJUSTMENT') dailyGroups[dayKey].adjustments += a.amount;
        else if (a.type === 'DELIVERY') dailyGroups[dayKey].out += a.amount;
      } else {
        if (a.type === 'PAYOUT') dailyGroups[dayKey].in += a.amount; // Collections
        else if (a.type === 'DELIVERY') dailyGroups[dayKey].out += a.amount; // Deliveries
        else if (a.type === 'ADJUSTMENT') dailyGroups[dayKey].adjustments += a.amount;
        else if (a.type === 'TOP_UP') dailyGroups[dayKey].in += a.amount;
      }
      dailyGroups[dayKey].transactions.push({
        ...a,
        date: a.date.toISOString()
      });
    });

    const dailySummaries = [];
    const sortedDays = Object.keys(dailyGroups).sort();

    let currentBal = reportOpeningBalance;
    sortedDays.forEach(day => {
      const g = dailyGroups[day];
      const initial = currentBal;
      currentBal += (g.in + g.out + g.adjustments);
      dailySummaries.push({
        date: day,
        opening: initial,
        topUps: Math.abs(g.in), // "In" column
        payouts: -Math.abs(g.out), // "Out" column
        adjustments: g.adjustments,
        closing: currentBal,
        count: g.transactions.length,
        transactions: g.transactions
      });
    });

    // 5. Build final report object
    const totalTopUps = dailySummaries.reduce((sum, day) => sum + day.topUps, 0);
    const totalPayouts = dailySummaries.reduce((sum, day) => sum + Math.abs(day.payouts), 0);
    const totalAdjustments = dailySummaries.reduce((sum, day) => sum + day.adjustments, 0);

    return {
      agent: { id: agentBalance.id, name: agentBalance.agentName, type: agentBalance.agentType },
      period: { startDate: startDate || null, endDate: endDate || new Date().toISOString().split('T')[0] },
      currency, symbol,
      openingBalance: reportOpeningBalance,
      closingBalance: currentBal,
      dailySummaries,
      items: inRangeActivity.map(i => ({ ...i, date: i.date.toISOString() })),
      totals: {
        totalTopUps,
        totalPayouts,
        totalAdjustments,
        payoutCount: isGAgent ? inRangeActivity.filter(i => i.type === 'PAYOUT').length : inRangeActivity.filter(i => i.type === 'DELIVERY').length,
        topUpCount: isGAgent ? inRangeActivity.filter(i => i.type === 'TOP_UP').length : inRangeActivity.filter(i => i.type === 'PAYOUT').length,
        adjustmentCount: inRangeActivity.filter(i => i.type === 'ADJUSTMENT').length
      }
    };
  } catch (error) {
    console.error('Error generating cashflow report:', error);
    throw error;
  }
};

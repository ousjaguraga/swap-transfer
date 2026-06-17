/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getDailyRate = /* GraphQL */ `query GetDailyRate($id: ID!) {
  getDailyRate(id: $id) {
    id
    effectiveDate
    rate
    createdBy
    createdAt
    fixedFee
    percentageFee
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetDailyRateQueryVariables,
  APITypes.GetDailyRateQuery
>;
export const listDailyRates = /* GraphQL */ `query ListDailyRates(
  $filter: ModelDailyRateFilterInput
  $limit: Int
  $nextToken: String
) {
  listDailyRates(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      effectiveDate
      rate
      createdBy
      createdAt
      fixedFee
      percentageFee
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListDailyRatesQueryVariables,
  APITypes.ListDailyRatesQuery
>;
export const getTransferReport = /* GraphQL */ `query GetTransferReport($id: ID!) {
  getTransferReport(id: $id) {
    id
    Transfers {
      nextToken
      __typename
    }
    AgentTransfers {
      nextToken
      __typename
    }
    GagentTransfers {
      nextToken
      __typename
    }
    creator
    reportType
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTransferReportQueryVariables,
  APITypes.GetTransferReportQuery
>;
export const listTransferReports = /* GraphQL */ `query ListTransferReports(
  $filter: ModelTransferReportFilterInput
  $limit: Int
  $nextToken: String
) {
  listTransferReports(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      creator
      reportType
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListTransferReportsQueryVariables,
  APITypes.ListTransferReportsQuery
>;
export const getTransfer = /* GraphQL */ `query GetTransfer($id: ID!) {
  getTransfer(id: $id) {
    id
    from
    to
    amount
    paid_on
    status
    transferreportID
    collection_method
    payoutAmountGMD
    createdBy
    createdById
    paidOutBy
    paidOutById
    rateApplied
    createdAt
    updatedAt
    agentSettled
    agentSettled_on
    agentReportID
    gagentSettled
    gagentSettled_on
    gagentReportID
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTransferQueryVariables,
  APITypes.GetTransferQuery
>;
export const listTransfers = /* GraphQL */ `query ListTransfers(
  $filter: ModelTransferFilterInput
  $limit: Int
  $nextToken: String
) {
  listTransfers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      from
      to
      amount
      paid_on
      status
      transferreportID
      collection_method
      payoutAmountGMD
      createdBy
      createdById
      paidOutBy
      paidOutById
      rateApplied
      createdAt
      updatedAt
      agentSettled
      agentSettled_on
      agentReportID
      gagentSettled
      gagentSettled_on
      gagentReportID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListTransfersQueryVariables,
  APITypes.ListTransfersQuery
>;
export const transfersByTransferreportID = /* GraphQL */ `query TransfersByTransferreportID(
  $transferreportID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelTransferFilterInput
  $limit: Int
  $nextToken: String
) {
  transfersByTransferreportID(
    transferreportID: $transferreportID
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      from
      to
      amount
      paid_on
      status
      transferreportID
      collection_method
      payoutAmountGMD
      createdBy
      createdById
      paidOutBy
      paidOutById
      rateApplied
      createdAt
      updatedAt
      agentSettled
      agentSettled_on
      agentReportID
      gagentSettled
      gagentSettled_on
      gagentReportID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TransfersByTransferreportIDQueryVariables,
  APITypes.TransfersByTransferreportIDQuery
>;
export const transfersByCreatedById = /* GraphQL */ `query TransfersByCreatedById(
  $createdById: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelTransferFilterInput
  $limit: Int
  $nextToken: String
) {
  transfersByCreatedById(
    createdById: $createdById
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      from
      to
      amount
      paid_on
      status
      transferreportID
      collection_method
      payoutAmountGMD
      createdBy
      createdById
      paidOutBy
      paidOutById
      rateApplied
      createdAt
      updatedAt
      agentSettled
      agentSettled_on
      agentReportID
      gagentSettled
      gagentSettled_on
      gagentReportID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TransfersByCreatedByIdQueryVariables,
  APITypes.TransfersByCreatedByIdQuery
>;
export const transfersByPaidOutById = /* GraphQL */ `query TransfersByPaidOutById(
  $paidOutById: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelTransferFilterInput
  $limit: Int
  $nextToken: String
) {
  transfersByPaidOutById(
    paidOutById: $paidOutById
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      from
      to
      amount
      paid_on
      status
      transferreportID
      collection_method
      payoutAmountGMD
      createdBy
      createdById
      paidOutBy
      paidOutById
      rateApplied
      createdAt
      updatedAt
      agentSettled
      agentSettled_on
      agentReportID
      gagentSettled
      gagentSettled_on
      gagentReportID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TransfersByPaidOutByIdQueryVariables,
  APITypes.TransfersByPaidOutByIdQuery
>;
export const transfersByAgentReportID = /* GraphQL */ `query TransfersByAgentReportID(
  $agentReportID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelTransferFilterInput
  $limit: Int
  $nextToken: String
) {
  transfersByAgentReportID(
    agentReportID: $agentReportID
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      from
      to
      amount
      paid_on
      status
      transferreportID
      collection_method
      payoutAmountGMD
      createdBy
      createdById
      paidOutBy
      paidOutById
      rateApplied
      createdAt
      updatedAt
      agentSettled
      agentSettled_on
      agentReportID
      gagentSettled
      gagentSettled_on
      gagentReportID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TransfersByAgentReportIDQueryVariables,
  APITypes.TransfersByAgentReportIDQuery
>;
export const transfersByGagentReportID = /* GraphQL */ `query TransfersByGagentReportID(
  $gagentReportID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelTransferFilterInput
  $limit: Int
  $nextToken: String
) {
  transfersByGagentReportID(
    gagentReportID: $gagentReportID
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      from
      to
      amount
      paid_on
      status
      transferreportID
      collection_method
      payoutAmountGMD
      createdBy
      createdById
      paidOutBy
      paidOutById
      rateApplied
      createdAt
      updatedAt
      agentSettled
      agentSettled_on
      agentReportID
      gagentSettled
      gagentSettled_on
      gagentReportID
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TransfersByGagentReportIDQueryVariables,
  APITypes.TransfersByGagentReportIDQuery
>;
export const getReceiver = /* GraphQL */ `query GetReceiver($id: ID!) {
  getReceiver(id: $id) {
    id
    name
    surname
    number
    senderID
    ownerSub
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetReceiverQueryVariables,
  APITypes.GetReceiverQuery
>;
export const listReceivers = /* GraphQL */ `query ListReceivers(
  $filter: ModelReceiverFilterInput
  $limit: Int
  $nextToken: String
) {
  listReceivers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      surname
      number
      senderID
      ownerSub
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListReceiversQueryVariables,
  APITypes.ListReceiversQuery
>;
export const receiversBySenderID = /* GraphQL */ `query ReceiversBySenderID(
  $senderID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelReceiverFilterInput
  $limit: Int
  $nextToken: String
) {
  receiversBySenderID(
    senderID: $senderID
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      name
      surname
      number
      senderID
      ownerSub
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ReceiversBySenderIDQueryVariables,
  APITypes.ReceiversBySenderIDQuery
>;
export const receiversByOwnerSub = /* GraphQL */ `query ReceiversByOwnerSub(
  $ownerSub: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelReceiverFilterInput
  $limit: Int
  $nextToken: String
) {
  receiversByOwnerSub(
    ownerSub: $ownerSub
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      name
      surname
      number
      senderID
      ownerSub
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ReceiversByOwnerSubQueryVariables,
  APITypes.ReceiversByOwnerSubQuery
>;
export const getSender = /* GraphQL */ `query GetSender($id: ID!) {
  getSender(id: $id) {
    id
    name
    surname
    number
    Receivers {
      nextToken
      __typename
    }
    ownerSub
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetSenderQueryVariables, APITypes.GetSenderQuery>;
export const listSenders = /* GraphQL */ `query ListSenders(
  $filter: ModelSenderFilterInput
  $limit: Int
  $nextToken: String
) {
  listSenders(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      surname
      number
      ownerSub
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSendersQueryVariables,
  APITypes.ListSendersQuery
>;
export const sendersByOwnerSub = /* GraphQL */ `query SendersByOwnerSub(
  $ownerSub: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelSenderFilterInput
  $limit: Int
  $nextToken: String
) {
  sendersByOwnerSub(
    ownerSub: $ownerSub
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      name
      surname
      number
      ownerSub
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SendersByOwnerSubQueryVariables,
  APITypes.SendersByOwnerSubQuery
>;
export const getAgent = /* GraphQL */ `query GetAgent($id: ID!) {
  getAgent(id: $id) {
    id
    email
    cognitoSub
    name
    agentType
    phone
    location
    isActive
    notes
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetAgentQueryVariables, APITypes.GetAgentQuery>;
export const listAgents = /* GraphQL */ `query ListAgents(
  $filter: ModelAgentFilterInput
  $limit: Int
  $nextToken: String
) {
  listAgents(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      email
      cognitoSub
      name
      agentType
      phone
      location
      isActive
      notes
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAgentsQueryVariables,
  APITypes.ListAgentsQuery
>;
export const agentsByEmail = /* GraphQL */ `query AgentsByEmail(
  $email: String!
  $sortDirection: ModelSortDirection
  $filter: ModelAgentFilterInput
  $limit: Int
  $nextToken: String
) {
  agentsByEmail(
    email: $email
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      email
      cognitoSub
      name
      agentType
      phone
      location
      isActive
      notes
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.AgentsByEmailQueryVariables,
  APITypes.AgentsByEmailQuery
>;
export const agentsByCognitoSub = /* GraphQL */ `query AgentsByCognitoSub(
  $cognitoSub: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelAgentFilterInput
  $limit: Int
  $nextToken: String
) {
  agentsByCognitoSub(
    cognitoSub: $cognitoSub
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      email
      cognitoSub
      name
      agentType
      phone
      location
      isActive
      notes
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.AgentsByCognitoSubQueryVariables,
  APITypes.AgentsByCognitoSubQuery
>;
export const getAgentBalance = /* GraphQL */ `query GetAgentBalance($id: ID!) {
  getAgentBalance(id: $id) {
    id
    agentId
    agentName
    agentEmail
    agentType
    openingBalance
    currentBalance
    currency
    lastUpdated
    periodStartDate
    transactions {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAgentBalanceQueryVariables,
  APITypes.GetAgentBalanceQuery
>;
export const listAgentBalances = /* GraphQL */ `query ListAgentBalances(
  $filter: ModelAgentBalanceFilterInput
  $limit: Int
  $nextToken: String
) {
  listAgentBalances(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      agentId
      agentName
      agentEmail
      agentType
      openingBalance
      currentBalance
      currency
      lastUpdated
      periodStartDate
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAgentBalancesQueryVariables,
  APITypes.ListAgentBalancesQuery
>;
export const agentBalancesByAgentId = /* GraphQL */ `query AgentBalancesByAgentId(
  $agentId: String!
  $sortDirection: ModelSortDirection
  $filter: ModelAgentBalanceFilterInput
  $limit: Int
  $nextToken: String
) {
  agentBalancesByAgentId(
    agentId: $agentId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      agentId
      agentName
      agentEmail
      agentType
      openingBalance
      currentBalance
      currency
      lastUpdated
      periodStartDate
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.AgentBalancesByAgentIdQueryVariables,
  APITypes.AgentBalancesByAgentIdQuery
>;
export const agentBalancesByAgentEmail = /* GraphQL */ `query AgentBalancesByAgentEmail(
  $agentEmail: String!
  $sortDirection: ModelSortDirection
  $filter: ModelAgentBalanceFilterInput
  $limit: Int
  $nextToken: String
) {
  agentBalancesByAgentEmail(
    agentEmail: $agentEmail
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      agentId
      agentName
      agentEmail
      agentType
      openingBalance
      currentBalance
      currency
      lastUpdated
      periodStartDate
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.AgentBalancesByAgentEmailQueryVariables,
  APITypes.AgentBalancesByAgentEmailQuery
>;
export const getCashFlowTransaction = /* GraphQL */ `query GetCashFlowTransaction($id: ID!) {
  getCashFlowTransaction(id: $id) {
    id
    agentBalanceId
    agentId
    agentName
    transactionType
    amount
    balanceAfter
    currency
    description
    transferId
    createdBy
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetCashFlowTransactionQueryVariables,
  APITypes.GetCashFlowTransactionQuery
>;
export const listCashFlowTransactions = /* GraphQL */ `query ListCashFlowTransactions(
  $filter: ModelCashFlowTransactionFilterInput
  $limit: Int
  $nextToken: String
) {
  listCashFlowTransactions(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      agentBalanceId
      agentId
      agentName
      transactionType
      amount
      balanceAfter
      currency
      description
      transferId
      createdBy
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListCashFlowTransactionsQueryVariables,
  APITypes.ListCashFlowTransactionsQuery
>;
export const cashFlowTransactionsByAgentBalanceId = /* GraphQL */ `query CashFlowTransactionsByAgentBalanceId(
  $agentBalanceId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelCashFlowTransactionFilterInput
  $limit: Int
  $nextToken: String
) {
  cashFlowTransactionsByAgentBalanceId(
    agentBalanceId: $agentBalanceId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      agentBalanceId
      agentId
      agentName
      transactionType
      amount
      balanceAfter
      currency
      description
      transferId
      createdBy
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.CashFlowTransactionsByAgentBalanceIdQueryVariables,
  APITypes.CashFlowTransactionsByAgentBalanceIdQuery
>;
export const cashFlowTransactionsByAgentId = /* GraphQL */ `query CashFlowTransactionsByAgentId(
  $agentId: String!
  $sortDirection: ModelSortDirection
  $filter: ModelCashFlowTransactionFilterInput
  $limit: Int
  $nextToken: String
) {
  cashFlowTransactionsByAgentId(
    agentId: $agentId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      agentBalanceId
      agentId
      agentName
      transactionType
      amount
      balanceAfter
      currency
      description
      transferId
      createdBy
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.CashFlowTransactionsByAgentIdQueryVariables,
  APITypes.CashFlowTransactionsByAgentIdQuery
>;

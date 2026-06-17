/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getDailyRate = /* GraphQL */ `
  query GetDailyRate($id: ID!) {
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
`;
export const listDailyRates = /* GraphQL */ `
  query ListDailyRates(
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
`;
export const getTransferReport = /* GraphQL */ `
  query GetTransferReport($id: ID!) {
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
`;
export const listTransferReports = /* GraphQL */ `
  query ListTransferReports(
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
`;
export const getTransfer = /* GraphQL */ `
  query GetTransfer($id: ID!) {
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
`;
export const listTransfers = /* GraphQL */ `
  query ListTransfers(
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
`;
export const transfersByTransferreportID = /* GraphQL */ `
  query TransfersByTransferreportID(
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
`;
export const transfersByCreatedById = /* GraphQL */ `
  query TransfersByCreatedById(
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
`;
export const transfersByPaidOutById = /* GraphQL */ `
  query TransfersByPaidOutById(
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
`;
export const transfersByAgentReportID = /* GraphQL */ `
  query TransfersByAgentReportID(
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
`;
export const transfersByGagentReportID = /* GraphQL */ `
  query TransfersByGagentReportID(
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
`;
export const getReceiver = /* GraphQL */ `
  query GetReceiver($id: ID!) {
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
`;
export const listReceivers = /* GraphQL */ `
  query ListReceivers(
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
`;
export const receiversBySenderID = /* GraphQL */ `
  query ReceiversBySenderID(
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
`;
export const receiversByOwnerSub = /* GraphQL */ `
  query ReceiversByOwnerSub(
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
`;
export const getSender = /* GraphQL */ `
  query GetSender($id: ID!) {
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
`;
export const listSenders = /* GraphQL */ `
  query ListSenders(
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
`;
export const sendersByOwnerSub = /* GraphQL */ `
  query SendersByOwnerSub(
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
`;
export const getAgent = /* GraphQL */ `
  query GetAgent($id: ID!) {
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
`;
export const listAgents = /* GraphQL */ `
  query ListAgents(
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
`;
export const agentsByEmail = /* GraphQL */ `
  query AgentsByEmail(
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
`;
export const agentsByCognitoSub = /* GraphQL */ `
  query AgentsByCognitoSub(
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
`;
export const getAgentBalance = /* GraphQL */ `
  query GetAgentBalance($id: ID!) {
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
`;
export const listAgentBalances = /* GraphQL */ `
  query ListAgentBalances(
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
`;
export const agentBalancesByAgentId = /* GraphQL */ `
  query AgentBalancesByAgentId(
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
`;
export const agentBalancesByAgentEmail = /* GraphQL */ `
  query AgentBalancesByAgentEmail(
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
`;
export const getCashFlowTransaction = /* GraphQL */ `
  query GetCashFlowTransaction($id: ID!) {
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
`;
export const listCashFlowTransactions = /* GraphQL */ `
  query ListCashFlowTransactions(
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
`;
export const cashFlowTransactionsByAgentBalanceId = /* GraphQL */ `
  query CashFlowTransactionsByAgentBalanceId(
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
`;
export const cashFlowTransactionsByAgentId = /* GraphQL */ `
  query CashFlowTransactionsByAgentId(
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
`;

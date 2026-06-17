/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createDailyRate = /* GraphQL */ `
  mutation CreateDailyRate(
    $input: CreateDailyRateInput!
    $condition: ModelDailyRateConditionInput
  ) {
    createDailyRate(input: $input, condition: $condition) {
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
export const updateDailyRate = /* GraphQL */ `
  mutation UpdateDailyRate(
    $input: UpdateDailyRateInput!
    $condition: ModelDailyRateConditionInput
  ) {
    updateDailyRate(input: $input, condition: $condition) {
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
export const deleteDailyRate = /* GraphQL */ `
  mutation DeleteDailyRate(
    $input: DeleteDailyRateInput!
    $condition: ModelDailyRateConditionInput
  ) {
    deleteDailyRate(input: $input, condition: $condition) {
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
export const createTransferReport = /* GraphQL */ `
  mutation CreateTransferReport(
    $input: CreateTransferReportInput!
    $condition: ModelTransferReportConditionInput
  ) {
    createTransferReport(input: $input, condition: $condition) {
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
export const updateTransferReport = /* GraphQL */ `
  mutation UpdateTransferReport(
    $input: UpdateTransferReportInput!
    $condition: ModelTransferReportConditionInput
  ) {
    updateTransferReport(input: $input, condition: $condition) {
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
export const deleteTransferReport = /* GraphQL */ `
  mutation DeleteTransferReport(
    $input: DeleteTransferReportInput!
    $condition: ModelTransferReportConditionInput
  ) {
    deleteTransferReport(input: $input, condition: $condition) {
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
export const createTransfer = /* GraphQL */ `
  mutation CreateTransfer(
    $input: CreateTransferInput!
    $condition: ModelTransferConditionInput
  ) {
    createTransfer(input: $input, condition: $condition) {
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
export const updateTransfer = /* GraphQL */ `
  mutation UpdateTransfer(
    $input: UpdateTransferInput!
    $condition: ModelTransferConditionInput
  ) {
    updateTransfer(input: $input, condition: $condition) {
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
export const deleteTransfer = /* GraphQL */ `
  mutation DeleteTransfer(
    $input: DeleteTransferInput!
    $condition: ModelTransferConditionInput
  ) {
    deleteTransfer(input: $input, condition: $condition) {
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
export const createReceiver = /* GraphQL */ `
  mutation CreateReceiver(
    $input: CreateReceiverInput!
    $condition: ModelReceiverConditionInput
  ) {
    createReceiver(input: $input, condition: $condition) {
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
export const updateReceiver = /* GraphQL */ `
  mutation UpdateReceiver(
    $input: UpdateReceiverInput!
    $condition: ModelReceiverConditionInput
  ) {
    updateReceiver(input: $input, condition: $condition) {
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
export const deleteReceiver = /* GraphQL */ `
  mutation DeleteReceiver(
    $input: DeleteReceiverInput!
    $condition: ModelReceiverConditionInput
  ) {
    deleteReceiver(input: $input, condition: $condition) {
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
export const createSender = /* GraphQL */ `
  mutation CreateSender(
    $input: CreateSenderInput!
    $condition: ModelSenderConditionInput
  ) {
    createSender(input: $input, condition: $condition) {
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
export const updateSender = /* GraphQL */ `
  mutation UpdateSender(
    $input: UpdateSenderInput!
    $condition: ModelSenderConditionInput
  ) {
    updateSender(input: $input, condition: $condition) {
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
export const deleteSender = /* GraphQL */ `
  mutation DeleteSender(
    $input: DeleteSenderInput!
    $condition: ModelSenderConditionInput
  ) {
    deleteSender(input: $input, condition: $condition) {
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
export const createAgent = /* GraphQL */ `
  mutation CreateAgent(
    $input: CreateAgentInput!
    $condition: ModelAgentConditionInput
  ) {
    createAgent(input: $input, condition: $condition) {
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
export const updateAgent = /* GraphQL */ `
  mutation UpdateAgent(
    $input: UpdateAgentInput!
    $condition: ModelAgentConditionInput
  ) {
    updateAgent(input: $input, condition: $condition) {
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
export const deleteAgent = /* GraphQL */ `
  mutation DeleteAgent(
    $input: DeleteAgentInput!
    $condition: ModelAgentConditionInput
  ) {
    deleteAgent(input: $input, condition: $condition) {
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
export const createAgentBalance = /* GraphQL */ `
  mutation CreateAgentBalance(
    $input: CreateAgentBalanceInput!
    $condition: ModelAgentBalanceConditionInput
  ) {
    createAgentBalance(input: $input, condition: $condition) {
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
export const updateAgentBalance = /* GraphQL */ `
  mutation UpdateAgentBalance(
    $input: UpdateAgentBalanceInput!
    $condition: ModelAgentBalanceConditionInput
  ) {
    updateAgentBalance(input: $input, condition: $condition) {
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
export const deleteAgentBalance = /* GraphQL */ `
  mutation DeleteAgentBalance(
    $input: DeleteAgentBalanceInput!
    $condition: ModelAgentBalanceConditionInput
  ) {
    deleteAgentBalance(input: $input, condition: $condition) {
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
export const createCashFlowTransaction = /* GraphQL */ `
  mutation CreateCashFlowTransaction(
    $input: CreateCashFlowTransactionInput!
    $condition: ModelCashFlowTransactionConditionInput
  ) {
    createCashFlowTransaction(input: $input, condition: $condition) {
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
export const updateCashFlowTransaction = /* GraphQL */ `
  mutation UpdateCashFlowTransaction(
    $input: UpdateCashFlowTransactionInput!
    $condition: ModelCashFlowTransactionConditionInput
  ) {
    updateCashFlowTransaction(input: $input, condition: $condition) {
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
export const deleteCashFlowTransaction = /* GraphQL */ `
  mutation DeleteCashFlowTransaction(
    $input: DeleteCashFlowTransactionInput!
    $condition: ModelCashFlowTransactionConditionInput
  ) {
    deleteCashFlowTransaction(input: $input, condition: $condition) {
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

/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateDailyRate = /* GraphQL */ `subscription OnCreateDailyRate($filter: ModelSubscriptionDailyRateFilterInput) {
  onCreateDailyRate(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateDailyRateSubscriptionVariables,
  APITypes.OnCreateDailyRateSubscription
>;
export const onUpdateDailyRate = /* GraphQL */ `subscription OnUpdateDailyRate($filter: ModelSubscriptionDailyRateFilterInput) {
  onUpdateDailyRate(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateDailyRateSubscriptionVariables,
  APITypes.OnUpdateDailyRateSubscription
>;
export const onDeleteDailyRate = /* GraphQL */ `subscription OnDeleteDailyRate($filter: ModelSubscriptionDailyRateFilterInput) {
  onDeleteDailyRate(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteDailyRateSubscriptionVariables,
  APITypes.OnDeleteDailyRateSubscription
>;
export const onCreateTransferReport = /* GraphQL */ `subscription OnCreateTransferReport(
  $filter: ModelSubscriptionTransferReportFilterInput
) {
  onCreateTransferReport(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateTransferReportSubscriptionVariables,
  APITypes.OnCreateTransferReportSubscription
>;
export const onUpdateTransferReport = /* GraphQL */ `subscription OnUpdateTransferReport(
  $filter: ModelSubscriptionTransferReportFilterInput
) {
  onUpdateTransferReport(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateTransferReportSubscriptionVariables,
  APITypes.OnUpdateTransferReportSubscription
>;
export const onDeleteTransferReport = /* GraphQL */ `subscription OnDeleteTransferReport(
  $filter: ModelSubscriptionTransferReportFilterInput
) {
  onDeleteTransferReport(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteTransferReportSubscriptionVariables,
  APITypes.OnDeleteTransferReportSubscription
>;
export const onCreateTransfer = /* GraphQL */ `subscription OnCreateTransfer(
  $filter: ModelSubscriptionTransferFilterInput
  $createdById: String
) {
  onCreateTransfer(filter: $filter, createdById: $createdById) {
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
` as GeneratedSubscription<
  APITypes.OnCreateTransferSubscriptionVariables,
  APITypes.OnCreateTransferSubscription
>;
export const onUpdateTransfer = /* GraphQL */ `subscription OnUpdateTransfer(
  $filter: ModelSubscriptionTransferFilterInput
  $createdById: String
) {
  onUpdateTransfer(filter: $filter, createdById: $createdById) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateTransferSubscriptionVariables,
  APITypes.OnUpdateTransferSubscription
>;
export const onDeleteTransfer = /* GraphQL */ `subscription OnDeleteTransfer(
  $filter: ModelSubscriptionTransferFilterInput
  $createdById: String
) {
  onDeleteTransfer(filter: $filter, createdById: $createdById) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteTransferSubscriptionVariables,
  APITypes.OnDeleteTransferSubscription
>;
export const onCreateReceiver = /* GraphQL */ `subscription OnCreateReceiver(
  $filter: ModelSubscriptionReceiverFilterInput
  $ownerSub: String
) {
  onCreateReceiver(filter: $filter, ownerSub: $ownerSub) {
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
` as GeneratedSubscription<
  APITypes.OnCreateReceiverSubscriptionVariables,
  APITypes.OnCreateReceiverSubscription
>;
export const onUpdateReceiver = /* GraphQL */ `subscription OnUpdateReceiver(
  $filter: ModelSubscriptionReceiverFilterInput
  $ownerSub: String
) {
  onUpdateReceiver(filter: $filter, ownerSub: $ownerSub) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateReceiverSubscriptionVariables,
  APITypes.OnUpdateReceiverSubscription
>;
export const onDeleteReceiver = /* GraphQL */ `subscription OnDeleteReceiver(
  $filter: ModelSubscriptionReceiverFilterInput
  $ownerSub: String
) {
  onDeleteReceiver(filter: $filter, ownerSub: $ownerSub) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteReceiverSubscriptionVariables,
  APITypes.OnDeleteReceiverSubscription
>;
export const onCreateSender = /* GraphQL */ `subscription OnCreateSender(
  $filter: ModelSubscriptionSenderFilterInput
  $ownerSub: String
) {
  onCreateSender(filter: $filter, ownerSub: $ownerSub) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSenderSubscriptionVariables,
  APITypes.OnCreateSenderSubscription
>;
export const onUpdateSender = /* GraphQL */ `subscription OnUpdateSender(
  $filter: ModelSubscriptionSenderFilterInput
  $ownerSub: String
) {
  onUpdateSender(filter: $filter, ownerSub: $ownerSub) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSenderSubscriptionVariables,
  APITypes.OnUpdateSenderSubscription
>;
export const onDeleteSender = /* GraphQL */ `subscription OnDeleteSender(
  $filter: ModelSubscriptionSenderFilterInput
  $ownerSub: String
) {
  onDeleteSender(filter: $filter, ownerSub: $ownerSub) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSenderSubscriptionVariables,
  APITypes.OnDeleteSenderSubscription
>;
export const onCreateAgent = /* GraphQL */ `subscription OnCreateAgent($filter: ModelSubscriptionAgentFilterInput) {
  onCreateAgent(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAgentSubscriptionVariables,
  APITypes.OnCreateAgentSubscription
>;
export const onUpdateAgent = /* GraphQL */ `subscription OnUpdateAgent($filter: ModelSubscriptionAgentFilterInput) {
  onUpdateAgent(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAgentSubscriptionVariables,
  APITypes.OnUpdateAgentSubscription
>;
export const onDeleteAgent = /* GraphQL */ `subscription OnDeleteAgent($filter: ModelSubscriptionAgentFilterInput) {
  onDeleteAgent(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAgentSubscriptionVariables,
  APITypes.OnDeleteAgentSubscription
>;
export const onCreateAgentBalance = /* GraphQL */ `subscription OnCreateAgentBalance(
  $filter: ModelSubscriptionAgentBalanceFilterInput
) {
  onCreateAgentBalance(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAgentBalanceSubscriptionVariables,
  APITypes.OnCreateAgentBalanceSubscription
>;
export const onUpdateAgentBalance = /* GraphQL */ `subscription OnUpdateAgentBalance(
  $filter: ModelSubscriptionAgentBalanceFilterInput
) {
  onUpdateAgentBalance(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAgentBalanceSubscriptionVariables,
  APITypes.OnUpdateAgentBalanceSubscription
>;
export const onDeleteAgentBalance = /* GraphQL */ `subscription OnDeleteAgentBalance(
  $filter: ModelSubscriptionAgentBalanceFilterInput
) {
  onDeleteAgentBalance(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAgentBalanceSubscriptionVariables,
  APITypes.OnDeleteAgentBalanceSubscription
>;
export const onCreateCashFlowTransaction = /* GraphQL */ `subscription OnCreateCashFlowTransaction(
  $filter: ModelSubscriptionCashFlowTransactionFilterInput
) {
  onCreateCashFlowTransaction(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateCashFlowTransactionSubscriptionVariables,
  APITypes.OnCreateCashFlowTransactionSubscription
>;
export const onUpdateCashFlowTransaction = /* GraphQL */ `subscription OnUpdateCashFlowTransaction(
  $filter: ModelSubscriptionCashFlowTransactionFilterInput
) {
  onUpdateCashFlowTransaction(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateCashFlowTransactionSubscriptionVariables,
  APITypes.OnUpdateCashFlowTransactionSubscription
>;
export const onDeleteCashFlowTransaction = /* GraphQL */ `subscription OnDeleteCashFlowTransaction(
  $filter: ModelSubscriptionCashFlowTransactionFilterInput
) {
  onDeleteCashFlowTransaction(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteCashFlowTransactionSubscriptionVariables,
  APITypes.OnDeleteCashFlowTransactionSubscription
>;

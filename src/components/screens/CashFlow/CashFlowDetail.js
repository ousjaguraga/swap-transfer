import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectCustomerInfo } from '../../../state/reducers/store';
import appColor from '../../../styles/brand';
import { getCashFlowTransactions, makeUkDateFromUsDate, subscribeToCashFlowTransactions, subscribeToTransfers, getAgentBalanceById, getAgentBalanceWithCalculation } from '../../../../farm';

function CashFlowDetail({ route, navigation }) {
  const { agent: initialAgent } = route.params;
  const [agent, setAgent] = useState(initialAgent);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('transfers'); // 'transfers' or 'transactions'

  const customer = useSelector(selectCustomerInfo);
  const isAdmin = customer?.groups?.includes('Admin');

  // Check if agent has a database record (id) or is calculated from transfers
  const hasDbRecord = !!agent.id;
  
  // Get transfers from calculation (these affect the balance)
  const transfers = agent.calculation?.transfers || [];
  const isGAgentType = agent.agentType === 'GAGENT';

  // Reload agent balance data (for real-time updates)
  const loadAgentData = useCallback(async () => {
    if (!hasDbRecord) return;
    try {
      const balanceRecord = await getAgentBalanceById(agent.id);
      if (balanceRecord) {
        const withCalc = await getAgentBalanceWithCalculation(balanceRecord);
        setAgent(prev => ({ ...prev, ...withCalc }));
      }
    } catch (error) {
      console.error('Error reloading agent data:', error);
    }
  }, [agent.id, hasDbRecord]);
  const loadTransactions = useCallback(async () => {
    try {
      // Only fetch transactions if agent has a database record
      if (hasDbRecord) {
        const result = await getCashFlowTransactions(agent.id);
        // Sort by date descending (newest first)
        const sorted = (result || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setTransactions(sorted);
      } else {
        // No database record - transactions come from transfer data (shown in calculation)
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Don't show error for permission issues - just show empty
      setTransactions([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [agent.id, hasDbRecord]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Real-time subscription for CashFlowTransactions and Transfers
  useEffect(() => {
    const transactionSub = subscribeToCashFlowTransactions({
      onCreate: (newTransaction) => {
        // Only reload if this transaction is for the current agent
        if (newTransaction.agentBalanceId === agent.id) {
          console.log('New transaction for this agent, reloading...');
          loadTransactions();
          loadAgentData(); // Also reload balance data
        }
      }
    });

    const transferSub = subscribeToTransfers({
      onCreate: () => {
        loadTransactions();
        loadAgentData();
      },
      onUpdate: () => {
        loadTransactions();
        loadAgentData();
      },
    });

    return () => {
      transactionSub.unsubscribe();
      transferSub.unsubscribe();
    };
  }, [agent.id, loadTransactions, loadAgentData]);

  useEffect(() => {
    navigation.setOptions({
      title: agent.agentName,
    });
  }, [navigation, agent]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTransactions(), loadAgentData()]);
    setRefreshing(false);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'TOP_UP':
        return { name: 'arrow-down-circle', color: '#28a745' };
      case 'PAYOUT':
        return { name: 'arrow-up-circle', color: '#dc3545' };
      case 'COLLECTION':
        return { name: 'arrow-down-circle', color: '#28a745' };
      case 'DELIVERY':
        return { name: 'arrow-up-circle', color: '#17a2b8' };
      case 'ADJUSTMENT':
        return { name: 'pencil-circle', color: '#6c757d' };
      default:
        return { name: 'circle', color: '#666' };
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'TOP_UP':
        return 'Top Up';
      case 'PAYOUT':
        return 'Payout';
      case 'COLLECTION':
        return 'Collection';
      case 'DELIVERY':
        return 'Delivery';
      case 'ADJUSTMENT':
        return 'Adjustment';
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount, currency) => {
    const symbol = currency === 'GBP' ? '£' : 'D';
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${amount >= 0 ? '+' : '-'}${symbol}${formatted}`;
  };

  // Render a transfer item (payout/collection from transfers)
  const renderTransfer = ({ item }) => {
    // Determine display based on agent type
    // G-Agent: paid out transfers (show GMD amount - payoutAmountGMD)
    // Agent: collected transfers (show GBP amount - amount field)
    const isGAgent = isGAgentType;
    const transferAmount = isGAgent ? (item.payoutAmountGMD || 0) : (item.amount || 0);
    const currency = isGAgent ? 'GMD' : 'GBP';
    const symbol = isGAgent ? 'D' : '£';
    
    // For G-Agent, this is money they paid out
    // For Agent, this is money they collected
    const displayAmount = Math.abs(transferAmount);

    return (
      <Pressable 
        style={styles.transferCard}
        onPress={() => {
          // Navigate to transfer detail if needed
        }}
      >
        <View style={styles.transferHeader}>
          <View style={styles.transferIcon}>
            <MaterialCommunityIcons
              name={isGAgent ? 'cash-minus' : 'cash-register'}
              size={28}
              color={isGAgent ? '#dc3545' : '#28a745'}
            />
          </View>
          <View style={styles.transferInfo}>
            <Text style={styles.transferSender}>{item.from || 'Unknown Sender'}</Text>
            <Text style={styles.transferReceiver}>
              <MaterialCommunityIcons name="arrow-right" size={12} color="#666" />
              {' '}{item.to || 'Unknown Receiver'}
            </Text>
            <Text style={styles.transferDate}>
              {makeUkDateFromUsDate(item.paid_on || item.createdAt)}
            </Text>
          </View>
          <View style={styles.transferAmount}>
            <Text style={[styles.amountText, { color: isGAgent ? '#dc3545' : '#28a745' }]}>
              {isGAgent ? '-' : '+'}{symbol}{displayAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Text style={styles.transferStatus}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Show both amounts for context */}
        <View style={styles.transferMeta}>
          <Text style={styles.metaText}>
            £{(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} → D{(item.payoutAmountGMD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.metaText}>
            {isGAgent ? `Paid by: ${item.paidOutBy || 'N/A'}` : `Collected by: ${item.createdBy || 'N/A'}`}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderTransaction = ({ item }) => {
    const icon = getTransactionIcon(item.transactionType);
    const isPositive = item.amount >= 0;

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionIcon}>
            <MaterialCommunityIcons
              name={icon.name}
              size={28}
              color={icon.color}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>
              {getTransactionLabel(item.transactionType)}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text
              style={[
                styles.amountText,
                { color: isPositive ? '#28a745' : '#dc3545' },
              ]}
            >
              {formatCurrency(item.amount, item.currency)}
            </Text>
            <Text style={styles.balanceAfter}>
              Balance: {item.currency === 'GBP' ? '£' : 'D'}
              {item.balanceAfter?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <View style={styles.transactionMeta}>
          <Text style={styles.metaText}>By: {item.createdBy}</Text>
          {item.transferId && (
            <Text style={styles.metaText}>Transfer: {item.transferId}</Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={appColor.primary} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  const balanceColor =
    agent.currentBalance > 0
      ? '#28a745'
      : agent.currentBalance < 0
      ? '#dc3545'
      : '#666';

  // Extract calculation values for cash flow display
  const calc = agent.calculation || {};
  const openingBalance = agent.openingBalance || 0;
  const symbol = agent.currency === 'GBP' ? '£' : 'D';
  const periodStart = agent.periodStartDate || calc.periodStartDate;
  
  // For G-Agent: openingBalance + topUps - payouts + adjustments = currentBalance
  // For Agent: openingBalance + collections - deliveries + adjustments = currentBalance
  const totalIn = isGAgentType ? (calc.totalTopUps || 0) : (calc.totalCollections || 0);
  const totalOut = isGAgentType ? (calc.totalPayouts || 0) : (calc.totalDeliveries || 0);
  const totalAdjustments = calc.totalAdjustments || 0;

  // Find the last TOP_UP or DELIVERY transaction (the one that reset the period)
  const lastSettlement = isGAgentType
    ? transactions.find(t => t.transactionType === 'TOP_UP')
    : transactions.find(t => t.transactionType === 'DELIVERY');
  const lastSettlementAmount = lastSettlement?.amount || 0;

  // Format period start date with time
  const formatPeriodDateTime = (dateString) => {
    if (!dateString) return 'All time';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Agent Header */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <MaterialCommunityIcons
            name={isGAgentType ? 'account-cash' : 'account-tie'}
            size={40}
            color={appColor.primary}
          />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryName}>{agent.agentName}</Text>
            <Text style={styles.summaryType}>
              {isGAgentType ? 'G-Agent (Gambia)' : 'Agent (UK)'}
            </Text>
            {periodStart && (
              <Text style={styles.periodText}>
                Period started: {formatPeriodDateTime(periodStart)}
              </Text>
            )}
          </View>
        </View>

        {/* Cash Flow Breakdown */}
        <View style={styles.cashFlowBreakdown}>
          {/* Opening Balance */}
          <View style={styles.cashFlowRow}>
            <View style={styles.cashFlowLabelRow}>
              <MaterialCommunityIcons name="wallet" size={16} color={appColor.primary} />
              <Text style={[styles.cashFlowLabel, { color: appColor.primary }]}>Opening Balance</Text>
            </View>
            <Text style={[styles.cashFlowValue, { color: appColor.primary }]}>
              {symbol}{openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Last Settlement (Top Up for G-Agent, Delivery for Agent) */}
          {lastSettlementAmount > 0 && (
            <View style={styles.cashFlowRow}>
              <View style={styles.cashFlowLabelRow}>
                <MaterialCommunityIcons name={isGAgentType ? "plus-circle" : "minus-circle"} size={16} color={isGAgentType ? "#28a745" : "#dc3545"} />
                <Text style={[styles.cashFlowLabel, { color: isGAgentType ? '#28a745' : '#dc3545' }]}>
                  {isGAgentType ? 'Last Top Up' : 'Last Delivery'}
                </Text>
              </View>
              <Text style={[styles.cashFlowValue, { color: isGAgentType ? '#28a745' : '#dc3545' }]}>
                {isGAgentType ? '+' : '-'}{symbol}{lastSettlementAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          {/* Money In for Agent (Cash Collected) */}
          {!isGAgentType && (
            <View style={styles.cashFlowRow}>
              <View style={styles.cashFlowLabelRow}>
                <MaterialCommunityIcons name="plus-circle" size={16} color="#28a745" />
                <Text style={[styles.cashFlowLabel, { color: '#28a745' }]}>
                  Cash Collected
                </Text>
              </View>
              <Text style={[styles.cashFlowValue, { color: '#28a745' }]}>
                +{symbol}{totalIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          {/* Money Out for G-Agent (Payouts Made) */}
          {isGAgentType && (
            <View style={styles.cashFlowRow}>
              <View style={styles.cashFlowLabelRow}>
                <MaterialCommunityIcons name="minus-circle" size={16} color="#dc3545" />
                <Text style={[styles.cashFlowLabel, { color: '#dc3545' }]}>
                  Payouts Made
                </Text>
              </View>
              <Text style={[styles.cashFlowValue, { color: '#dc3545' }]}>
                -{symbol}{totalOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          {/* Adjustments (if any) */}
          {totalAdjustments !== 0 && (
            <View style={styles.cashFlowRow}>
              <View style={styles.cashFlowLabelRow}>
                <MaterialCommunityIcons name="pencil-circle" size={16} color="#6c757d" />
                <Text style={[styles.cashFlowLabel, { color: '#6c757d' }]}>Adjustments</Text>
              </View>
              <Text style={[styles.cashFlowValue, { color: totalAdjustments >= 0 ? '#28a745' : '#dc3545' }]}>
                {totalAdjustments >= 0 ? '+' : ''}{symbol}{totalAdjustments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.cashFlowDivider} />

          {/* Current Balance - For Agents, positive means they owe the business */}
          <View style={styles.cashFlowRow}>
            <View style={styles.cashFlowLabelRow}>
              <MaterialCommunityIcons name="cash-fast" size={16} color={balanceColor} />
              <Text style={[styles.cashFlowLabel, styles.cashFlowTotalLabel, { color: balanceColor }]}>
                {isGAgentType ? 'Current Balance' : (agent.currentBalance >= 0 ? 'Cash to Deliver' : 'Overpaid')}
              </Text>
            </View>
            <Text style={[styles.cashFlowTotalValue, { color: balanceColor }]}>
              {symbol}{Math.abs(agent.currentBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Transfer Count Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{transfers.length}</Text>
            <Text style={styles.statLabel}>{isGAgentType ? 'Payouts' : 'Collections'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Adjustments</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'transfers' && styles.activeTab]}
          onPress={() => setActiveTab('transfers')}
        >
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={18}
            color={activeTab === 'transfers' ? appColor.primary : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'transfers' && styles.activeTabText]}>
            Transfers ({transfers.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={18}
            color={activeTab === 'transactions' ? appColor.primary : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
            Adjustments ({transactions.length})
          </Text>
        </Pressable>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'transfers' ? (
        <FlatList
          data={transfers}
          renderItem={renderTransfer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={64}
                color="#ccc"
              />
              <Text style={styles.emptyText}>No transfers yet</Text>
              <Text style={styles.emptySubtext}>
                {isGAgentType 
                  ? 'Transfers you pay out will appear here'
                  : 'Transfers you collect will appear here'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="cash-multiple"
                size={64}
                color="#ccc"
              />
              <Text style={styles.emptyText}>No adjustments yet</Text>
              <Text style={styles.emptySubtext}>
                Top-ups, deliveries, and manual adjustments will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  periodText: {
    fontSize: 12,
    color: appColor.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Cash flow breakdown styles
  cashFlowBreakdown: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  cashFlowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cashFlowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cashFlowLabel: {
    fontSize: 14,
    color: '#555',
  },
  cashFlowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cashFlowDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  cashFlowTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cashFlowTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceAfter: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  metaText: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: appColor.primaryLight,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: appColor.primary,
    fontWeight: '600',
  },
  // Transfer card styles
  transferCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transferHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transferIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  transferInfo: {
    flex: 1,
  },
  transferSender: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transferReceiver: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transferDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transferAmount: {
    alignItems: 'flex-end',
  },
  transferStatus: {
    fontSize: 11,
    color: '#28a745',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  transferMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});

export default CashFlowDetail;

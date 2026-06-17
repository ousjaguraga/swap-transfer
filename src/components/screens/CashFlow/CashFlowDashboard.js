import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCustomerInfo } from '../../../state/reducers/store';
import { signOut } from 'aws-amplify/auth';
import appColor from '../../../styles/brand';
import {
  getAllAgentsWithBalances,
  getMyAgentBalance,
  recordTopUp,
  recordDelivery,
  recordAdjustment,
  subscribeToTransfers,
  subscribeToCashFlowTransactions,
} from '../../../../farm';

function CashFlowDashboard({ navigation }) {
  const dispatch = useDispatch();
  const autoLogoutTimerRef = useRef(null);
  const [balances, setBalances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState(null); // null = all, 'AGENT', 'GAGENT'
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const customer = useSelector(selectCustomerInfo);
  const isAdmin = customer?.groups?.includes('Admin');
  const isAgent = customer?.groups?.includes('Agent');
  const isGAgent = customer?.groups?.includes('Gagent');
  const isDash = customer?.groups?.includes('Dash');
  const canViewAllBalances = isAdmin || isDash;
  const canOpenDetails = !isDash;
  const currentUserName = customer?.name || customer?.email;
  const currentUserEmail = customer?.email;
  const currentUserSub = customer?.sub;
  const DASH_AUTO_LOGOUT_MS = 10 * 60 * 1000;

  const clearAutoLogoutTimer = useCallback(() => {
    if (autoLogoutTimerRef.current) {
      clearTimeout(autoLogoutTimerRef.current);
      autoLogoutTimerRef.current = null;
    }
  }, []);

  const runDashAutoLogout = useCallback(async () => {
    if (!isDash) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert('Dashboard session expired. Please log in again.');
    } else {
      Alert.alert('Session expired', 'Dashboard session expired. Please log in again.');
    }

    try {
      await signOut();
    } catch (error) {
      // If sign-out fails, still clear local session.
    } finally {
      dispatch(logout());
    }
  }, [dispatch, isDash]);

  const resetDashAutoLogoutTimer = useCallback(() => {
    if (!isDash) {
      return;
    }

    clearAutoLogoutTimer();
    autoLogoutTimerRef.current = setTimeout(() => {
      runDashAutoLogout();
    }, DASH_AUTO_LOGOUT_MS);
  }, [clearAutoLogoutTimer, isDash, runDashAutoLogout]);

  const handleManualLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      // Keep local logout even if remote sign-out fails.
    } finally {
      dispatch(logout());
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable style={styles.headerLogoutBtn} onPress={handleManualLogout}>
          <MaterialCommunityIcons name="logout" size={18} color="#fff" />
        </Pressable>
      ),
    });
  }, [navigation]);

  // Filtered balances based on selected filter
  const visibleBalances = isDash
    ? balances.filter((b) => b.agentType === 'AGENT')
    : balances;

  const filteredBalances = filterType
    ? visibleBalances.filter(b => b.agentType === filterType)
    : visibleBalances;

  const agentAliasMap = useMemo(() => {
    if (!isDash) {
      return {};
    }

    const ordered = [...visibleBalances].sort((a, b) =>
      String(a?.agentName || '').localeCompare(String(b?.agentName || ''))
    );

    const map = {};
    ordered.forEach((agent, index) => {
      const key = agent.id || agent.agentId || agent.agentName;
      if (key) {
        map[key] = `Agent${index + 1}`;
      }
    });

    return map;
  }, [isDash, visibleBalances]);

  const loadBalances = useCallback(async () => {
    try {
      if (canViewAllBalances) {
        // Admin sees all agents derived from transfers - no manual registration needed
        const result = await getAllAgentsWithBalances();
        const allBalances = result || [];
        setBalances(isDash ? allBalances.filter((b) => b.agentType === 'AGENT') : allBalances);
      } else if (isAgent || isGAgent) {
        // Agent/G-Agent sees only their own balance
        // Look up by cognitoSub to get Agent model ID
        const myBalance = await getMyAgentBalance(currentUserSub);
        setBalances(myBalance ? [myBalance] : []);
      } else {
        setBalances([]);
      }
    } catch (error) {
      console.error('Error loading balances:', error);
      Alert.alert('Error', 'Failed to load cash flow data');
    } finally {
      setLastUpdatedAt(new Date());
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [canViewAllBalances, isAgent, isGAgent, currentUserSub]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  // Refresh balances whenever the screen comes into focus (e.g. navigating back)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Dashboard focused - refreshing balances');
      loadBalances();
    });
    return unsubscribe;
  }, [navigation, loadBalances]);

  useEffect(() => {
    if (!isDash) {
      clearAutoLogoutTimer();
      return;
    }

    resetDashAutoLogoutTimer();
    return () => {
      clearAutoLogoutTimer();
    };
  }, [clearAutoLogoutTimer, isDash, resetDashAutoLogoutTimer]);

  // Real-time subscription - reload balances when transfers change
  useEffect(() => {
    const subscription = subscribeToTransfers({
      onCreate: () => {
        console.log('Transfer created - refreshing balances');
        loadBalances();
      },
      onUpdate: () => {
        console.log('Transfer updated - refreshing balances');
        loadBalances();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadBalances]);

  useEffect(() => {
    const transactionSub = subscribeToCashFlowTransactions({
      onCreate: () => {
        console.log('Cashflow transaction created - refreshing balances');
        loadBalances();
      },
    });

    return () => {
      transactionSub.unsubscribe();
    };
  }, [loadBalances]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBalances();
  };

  const parseAmountInput = (value) => {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return NaN;
    }

    const raw = String(value).trim();
    if (!raw) {
      return NaN;
    }

    // Normalize all whitespace separators first, then handle comma/dot formats.
    let normalized = raw.replace(/\s+/g, '');
    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');

    if (hasComma && hasDot) {
      // Assume commas are thousand separators when both are present: 1,234.56
      normalized = normalized.replace(/,/g, '');
    } else if (hasComma && !hasDot) {
      // If comma groups by thousands (1,234 or 1,234,567), remove commas.
      // Otherwise treat comma as decimal separator (12,5 -> 12.5).
      const thousandGrouped = /^[+-]?\d{1,3}(,\d{3})+$/.test(normalized);
      normalized = thousandGrouped ? normalized.replace(/,/g, '') : normalized.replace(',', '.');
    }

    if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) {
      return NaN;
    }

    return Number(normalized);
  };

  const openActionModal = (agent, action) => {
    if ((action === 'TOP_UP' || action === 'DELIVERY') && !isAdmin) {
      Alert.alert('Not Allowed', 'Only Admin can perform top-ups and deliveries.');
      return;
    }

    setSelectedAgent(agent);
    setActionType(action);
    setAmount('');
    setDescription('');
    setModalVisible(true);
  };

  const handleAction = async () => {
    if ((actionType === 'TOP_UP' || actionType === 'DELIVERY') && !isAdmin) {
      Alert.alert('Not Allowed', 'Only Admin can perform top-ups and deliveries.');
      return;
    }

    const numAmount = parseAmountInput(amount);

    if (!amount || isNaN(numAmount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (actionType !== 'ADJUSTMENT' && numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be greater than 0');
      return;
    }

    // Validate agent has database record
    if (!selectedAgent.id) {
      Alert.alert('Error', 'Agent does not have a balance record. Please refresh and try again.');
      return;
    }

    const submitAction = async () => {
      console.log('Recording action:', actionType, {
        agentBalanceId: selectedAgent.id,
        agentId: selectedAgent.agentId,
        agentName: selectedAgent.agentName,
        amount: numAmount
      });

      setIsSubmitting(true);
      try {
        if (actionType === 'TOP_UP') {
          await recordTopUp(
            selectedAgent.id,
            selectedAgent.agentId,
            selectedAgent.agentName,
            numAmount,
            description,
            currentUserName,
            selectedAgent // Pass the full agent balance object to reset the period
          );
        } else if (actionType === 'DELIVERY') {
          // Find admin's balance from already-loaded balances to credit them
          const adminBalance = balances.find(b =>
            b.agentType === 'AGENT' && (
              (currentUserEmail && b.agentEmail?.toLowerCase() === currentUserEmail.toLowerCase()) ||
              b.agentName?.toLowerCase() === currentUserName?.toLowerCase()
            )
          );
          await recordDelivery(
            selectedAgent.id,
            selectedAgent.agentId,
            selectedAgent.agentName,
            numAmount,
            description,
            currentUserName,
            selectedAgent, // Pass the full agent balance object to settle transfers and reset period
            adminBalance // Pass admin's balance for crediting
          );
        } else if (actionType === 'ADJUSTMENT') {
          await recordAdjustment(
            selectedAgent.id,
            selectedAgent.agentId,
            selectedAgent.agentName,
            numAmount,
            selectedAgent.currency,
            description,
            currentUserName
          );
        }

        Alert.alert('Success', `${actionType.replace('_', ' ')} recorded successfully`);
        setModalVisible(false);
        loadBalances();
      } catch (error) {
        console.error('Error processing action:', error);
        Alert.alert('Error', `Failed to process action: ${error.message || 'Unknown error'}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    await submitAction();
  };

  const renderBalanceCard = ({ item }) => {
    const isGAgentType = item.agentType === 'GAGENT';
    const rawBalance = item.currentBalance || 0;
    // Match status logic to 2-decimal display to avoid "Owes 0" from tiny float residues.
    const balance = Math.abs(rawBalance) < 0.005 ? 0 : rawBalance;

    // Check if this is the current user - must match name AND role type
    const nameMatches = item.agentName?.toLowerCase() === currentUserName?.toLowerCase();
    const typeMatches = (isGAgentType && isGAgent) || (!isGAgentType && isAgent);
    const isCurrentUser = nameMatches && typeMatches;
    const aliasKey = item.id || item.agentId || item.agentName;
    const displayName = isDash ? (agentAliasMap[aliasKey] || 'Agent') : item.agentName;

    // For G-Agent: positive = they have your money (funds available)
    // For Agent: positive = they owe you money (collected but not delivered)
    let balanceColor = appColor.secondary;
    let statusText = '';

    if (isGAgentType) {
      balanceColor = balance >= 0 ? appColor.secondary : '#e74c3c';
      statusText = balance >= 0 ? 'Available' : 'Deficit';
    } else {
      balanceColor = balance > 0 ? '#e67e22' : balance < 0 ? '#e74c3c' : appColor.secondary;
      statusText = balance > 0 ? 'Owes' : balance < 0 ? 'Overpaid' : 'Settled';
    }

    return (
      <Pressable
        style={styles.card}
        onPress={canOpenDetails ? () => navigation.navigate('CashFlowDetail', { agent: item }) : undefined}
        disabled={!canOpenDetails}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <View style={[styles.avatarCircle, { backgroundColor: isGAgentType ? '#27ae60' : '#3498db' }]}>
              <MaterialCommunityIcons
                name={isGAgentType ? 'account-cash' : 'account-tie'}
                size={20}
                color="#fff"
              />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.agentName}>{displayName}</Text>
                {isCurrentUser && <Text style={styles.youBadge}>You</Text>}
              </View>
              <Text style={styles.agentType}>
                {isGAgentType ? 'G-Agent • GMD' : 'Agent • GBP'}
              </Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.balanceAmount, { color: balanceColor }]}>
              {item.currency === 'GBP' ? '£' : 'D'}{Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.statusText, { color: balanceColor }]}>{statusText}</Text>
          </View>
        </View>

        {isAdmin && (
          <View style={styles.actionButtons}>
            {isGAgentType ? (
              <Pressable
                style={styles.actionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  openActionModal(item, 'TOP_UP');
                }}
              >
                <MaterialCommunityIcons name="plus" size={16} color={appColor.secondary} />
                <Text style={styles.actionBtnText}>Top Up</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.actionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  openActionModal(item, 'DELIVERY');
                }}
              >
                <MaterialCommunityIcons name="cash-check" size={16} color={appColor.secondary} />
                <Text style={styles.actionBtnText}>Delivery</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.actionBtn}
              onPress={(e) => {
                e.stopPropagation();
                openActionModal(item, 'ADJUSTMENT');
              }}
            >
              <MaterialCommunityIcons name="pencil" size={16} color={appColor.secondary} />
              <Text style={styles.actionBtnText}>Adjust</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={appColor.secondary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Calculate totals
  const totalGBP = visibleBalances.filter(b => b.agentType === 'AGENT').reduce((sum, b) => sum + (b.currentBalance || 0), 0);
  const totalGMD = visibleBalances.filter(b => b.agentType === 'GAGENT').reduce((sum, b) => sum + (b.currentBalance || 0), 0);
  const agentCount = visibleBalances.filter(b => b.agentType === 'AGENT').length;
  const gAgentCount = visibleBalances.filter(b => b.agentType === 'GAGENT').length;
  const updatedAtLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <View
      style={styles.container}
      onTouchStart={isDash ? resetDashAutoLogoutTimer : undefined}
      onStartShouldSetResponderCapture={isDash ? () => {
        resetDashAutoLogoutTimer();
        return false;
      } : undefined}
    >
      {isDash && (
        <View style={styles.totalCenterContainer}>
          <Text style={styles.totalCenterValue}>
            £{totalGBP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.totalCenterUpdated}>Updated {updatedAtLabel}</Text>
        </View>
      )}

      {/* Stats Header */}
      {!isDash && canViewAllBalances && visibleBalances.length > 0 && (
        <View style={styles.statsContainer}>
          <Pressable
            style={[styles.statBox, filterType === 'AGENT' && styles.statBoxActive]}
            onPress={() => setFilterType(filterType === 'AGENT' ? null : 'AGENT')}
          >
            <MaterialCommunityIcons name="account-tie" size={24} color={appColor.secondary} />
            <Text style={styles.statValue}>£{totalGBP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={styles.statLabel}>{agentCount} Agents</Text>
          </Pressable>
          {!isDash && (
            <>
              <View style={styles.statDivider} />
              <Pressable
                style={[styles.statBox, filterType === 'GAGENT' && styles.statBoxActive]}
                onPress={() => setFilterType(filterType === 'GAGENT' ? null : 'GAGENT')}
              >
                <MaterialCommunityIcons name="account-cash" size={24} color={appColor.secondary} />
                <Text style={styles.statValue}>D{totalGMD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.statLabel}>{gAgentCount} G-Agents</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {/* Balance List */}
      <FlatList
        data={filteredBalances}
        renderItem={renderBalanceCard}
        keyExtractor={(item) => item.id || item.agentId || item.agentName}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[appColor.secondary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-group" size={64} color="#555" />
            <Text style={styles.emptyText}>No agent activity yet</Text>
            <Text style={styles.emptySubtext}>
              Agents will appear here once they process transfers
            </Text>
          </View>
        }
      />

      {/* Action Modal (Top-Up / Delivery / Adjustment) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'TOP_UP' && 'Top Up G-Agent'}
              {actionType === 'DELIVERY' && 'Record Cash Delivery'}
              {actionType === 'ADJUSTMENT' && 'Adjust Balance'}
            </Text>
            <Text style={styles.modalSubtitle}>{selectedAgent?.agentName}</Text>

            {actionType === 'TOP_UP' && (
              <Text style={styles.modalHint}>
                Record GMD funds given to this G-Agent
              </Text>
            )}
            {actionType === 'DELIVERY' && (
              <Text style={styles.modalHint}>
                Record GBP cash delivered by this Agent
              </Text>
            )}
            {actionType === 'ADJUSTMENT' && (
              <Text style={styles.modalHint}>
                Use negative amount to reduce balance (e.g., -50)
              </Text>
            )}

            {(actionType === 'ADJUSTMENT' || actionType === 'TOP_UP' || actionType === 'DELIVERY') && (() => {
              const parsed = parseAmountInput(amount);
              if (!amount || isNaN(parsed)) {
                return null;
              }

              const currentBalance = Number(selectedAgent?.currentBalance || 0);
              const delta = actionType === 'DELIVERY' ? -parsed : parsed;
              const newBalance = currentBalance + delta;
              const symbol = selectedAgent?.currency === 'GBP' ? '£' : 'D';
              const isAdjustment = actionType === 'ADJUSTMENT';

              let warningText = '';
              if (isAdjustment) {
                const actionWord = parsed >= 0 ? 'adding' : 'removing';
                const direction = parsed >= 0 ? 'to' : 'from';
                warningText = `You are ${actionWord} ${symbol}${Math.abs(parsed).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${direction} ${selectedAgent?.agentName}'s account.`;
              } else if (actionType === 'TOP_UP') {
                warningText = `You are topping up ${selectedAgent?.agentName} with ${symbol}${Math.abs(parsed).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
              } else {
                warningText = `You are recording a delivery of ${symbol}${Math.abs(parsed).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${selectedAgent?.agentName}.`;
              }

              return (
                <Text style={styles.actionWarning}>
                  {warningText} This will change balance from {symbol}{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to {symbol}{newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                </Text>
              );
            })()}

            <Text style={styles.inputLabel}>
              Amount ({selectedAgent?.currency})
            </Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType={actionType === 'ADJUSTMENT' ? 'numbers-and-punctuation' : 'decimal-pad'}
              placeholder={actionType === 'ADJUSTMENT' ? 'Enter amount (can be negative)' : 'Enter amount'}
            />
            <Text style={styles.inputHint}>You can use separators, e.g. 2,000,000 or 2 000 000</Text>

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note..."
              multiline
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.primary,
  },
  headerLogoutBtn: {
    marginRight: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  totalCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: appColor.primaryDark,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  totalCenterValue: {
    color: appColor.secondary,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  totalCenterUpdated: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColor.primary,
  },
  loadingText: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  header: {
    backgroundColor: appColor.primary,
    padding: 20,
    paddingTop: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    padding: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  statBoxActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  totalCashContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  totalCashLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  totalCashValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: appColor.secondary,
  },
  totalCashSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: appColor.primaryDark,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  summaryCardActive: {
    borderColor: appColor.secondary,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColor.secondary,
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
    paddingTop: 5,
  },
  card: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    padding: 15,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  youBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: appColor.primary,
    backgroundColor: appColor.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  agentType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 11,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  actionBtnText: {
    color: appColor.secondary,
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 5,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
  },
  modalHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionWarning: {
    fontSize: 12,
    color: '#1f2f1f',
    backgroundColor: '#f1d27a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
    marginTop: 10,
  },
  inputHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  typeBtnActive: {
    backgroundColor: appColor.secondary,
    borderColor: appColor.secondary,
  },
  typeBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: appColor.secondary,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CashFlowDashboard;

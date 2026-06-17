import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  getTransfers,
  serializedTransfer,
  makeUkDateFromUsDate,
  subscribeToTransfers,
} from "../../../../farm";
import appColor from "../../../styles/brand";
import { makeTransferRef } from '../../../utils/display';

// UK Date format: DD-MM-YYYY
const UK_DATE_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;

const parseUkDateInput = (value) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.trim().match(UK_DATE_REGEX);
  if (!match) return null;
  const [, dayStr, monthStr, yearStr] = match;
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) return null;
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) return null;
  return date;
};

// Convert UK date (DD-MM-YYYY) to API format (YYYY-MM-DD)
const ukToApiDate = (ukDate) => {
  const match = ukDate.trim().match(UK_DATE_REGEX);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
};

// Format date object to UK format
const formatToUkDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Calendar Picker Component
const CalendarPicker = ({ visible, onClose, onSelectDate, selectedDate }) => {
  const today = new Date();
  // Parse selectedDate string to Date object, fallback to today
  const getInitialDate = () => {
    if (selectedDate) {
      const parsed = parseUkDateInput(selectedDate);
      if (parsed) return parsed;
    }
    return today;
  };
  const [viewDate, setViewDate] = useState(getInitialDate());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectDay = (day) => {
    if (day) {
      const selected = new Date(year, month, day);
      onSelectDate(formatToUkDate(selected));
      onClose();
    }
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const parsed = parseUkDateInput(selectedDate);
    if (!parsed) return false;
    return parsed.getDate() === day && parsed.getMonth() === month && parsed.getFullYear() === year;
  };

  const isToday = (day) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={calendarStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={calendarStyles.container} onPress={(e) => e.stopPropagation()}>
          <View style={calendarStyles.header}>
            <TouchableOpacity onPress={prevMonth} style={calendarStyles.navButton}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={calendarStyles.title}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={calendarStyles.navButton}>
              <MaterialCommunityIcons name="chevron-right" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={calendarStyles.weekRow}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <Text key={d} style={calendarStyles.weekDay}>{d}</Text>
            ))}
          </View>
          <View style={calendarStyles.grid}>
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  calendarStyles.day,
                  isSelected(day) && calendarStyles.daySelected,
                  isToday(day) && !isSelected(day) && calendarStyles.dayToday,
                ]}
                onPress={() => selectDay(day)}
                disabled={!day}
              >
                <Text style={[
                  calendarStyles.dayText,
                  !day && calendarStyles.dayEmpty,
                  isSelected(day) && calendarStyles.dayTextSelected,
                  isToday(day) && !isSelected(day) && calendarStyles.dayTextToday,
                ]}>
                  {day || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={calendarStyles.actions}>
            <TouchableOpacity
              style={calendarStyles.todayButton}
              onPress={() => { onSelectDate(formatToUkDate(today)); onClose(); }}
            >
              <Text style={calendarStyles.todayText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={calendarStyles.clearButton}
              onPress={() => { onSelectDate(''); onClose(); }}
            >
              <Text style={calendarStyles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const calendarStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 350,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', color: '#888', fontSize: 12, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  daySelected: { backgroundColor: appColor.secondary },
  dayToday: { borderWidth: 1, borderColor: appColor.secondary },
  dayText: { fontSize: 14, color: '#fff' },
  dayEmpty: { color: 'transparent' },
  dayTextSelected: { color: '#fff', fontWeight: '600' },
  dayTextToday: { color: appColor.secondary },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  todayButton: { paddingVertical: 8, paddingHorizontal: 16 },
  todayText: { color: appColor.secondary, fontWeight: '500' },
  clearButton: { paddingVertical: 8, paddingHorizontal: 16 },
  clearText: { color: '#f44336', fontWeight: '500' },
});

// redux
import { selectCustomerInfo, selectTransfers } from "../../../state/reducers/store";
import { useDispatch, useSelector } from "react-redux";
import { setTransfers } from "../../../state/reducers/store";

const STATUS_CONFIG = {
  PAID: { color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.15)', icon: 'check-circle', label: 'Paid' },
  SENT: { color: '#2196F3', bgColor: 'rgba(33, 150, 243, 0.15)', icon: 'send-check', label: 'Sent' },
  PENDING: { color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.15)', icon: 'clock-outline', label: 'Pending' },
  CANCELLED: { color: '#f44336', bgColor: 'rgba(244, 67, 54, 0.15)', icon: 'close-circle', label: 'Cancelled' },
};

const COLLECTION_METHOD_LABELS = {
  CASH: 'Cash Pickup',
  WAVE: 'Wave',
  AFRIMONEY: 'Afrimoney',
  CREDIT: 'Credit',
};

function TransferList({ navigation }) {
  const transfers = useSelector(selectTransfers);
  const customer = useSelector(selectCustomerInfo);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAgent, setFilterAgent] = useState('ALL');
  const [waveOnly, setWaveOnly] = useState(false);
  const [showSettled, setShowSettled] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const dispatch = useDispatch();

  // Real-time subscription for transfer updates
  useEffect(() => {
    const subscription = subscribeToTransfers({
      onCreate: (newTransfer) => {
        // Add new transfer to the list
        dispatch(setTransfers([serializedTransfer(newTransfer), ...transfers]));
      },
      onUpdate: (updatedTransfer) => {
        // Update the transfer in the list
        const updated = transfers.map(t =>
          t.id === updatedTransfer.id ? serializedTransfer(updatedTransfer) : t
        );
        dispatch(setTransfers(updated));
      },
      onDelete: (deletedTransfer) => {
        // Remove the transfer from the list
        const filtered = transfers.filter(t => t.id !== deletedTransfer.id);
        dispatch(setTransfers(filtered));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [transfers, dispatch]);

  const fetchTransfers = async (overrideParams = {}) => {
    try {
      // Build params for date filter
      const params = {};
      const effectiveStartDate = overrideParams.startDate !== undefined ? overrideParams.startDate : startDate;
      const effectiveEndDate = overrideParams.endDate !== undefined ? overrideParams.endDate : endDate;

      if (effectiveStartDate) {
        const apiStart = ukToApiDate(effectiveStartDate);
        if (apiStart) params.startDate = apiStart;
      }
      if (effectiveEndDate) {
        const apiEnd = ukToApiDate(effectiveEndDate);
        if (apiEnd) params.endDate = apiEnd;
      }

      const transfersData = await getTransfers(params);
      // Fetch all transfers, filter by settled status in UI
      const data = transfersData.data.listTransfers.items
        .map((transfer) => serializedTransfer(transfer));
      dispatch(setTransfers(data));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setFilterStatus('ALL');
    setFilterAgent('ALL');
    setWaveOnly(false);
    setShowSettled(true);
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setIsLoading(true);
    fetchTransfers({ startDate: '', endDate: '' });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTransfers().finally(() => setRefreshing(false));
  }, [startDate, endDate]);

  // A transfer is considered "settled" when BOTH agent and g-agent have settled
  const isFullySettled = (t) => t.agentSettled && t.gagentSettled;

  const isAdmin = customer?.groups?.includes('Admin');
  const isGAgent = customer?.groups?.includes('Gagent');

  const getTransferAgentLabel = (transfer) => {
    return transfer.createdBy || transfer.paidOutBy || 'Unknown';
  };

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

  const availableAgents = Array.from(
    new Set(transfers.map((t) => getTransferAgentLabel(t)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const isPaidByMe = (transfer) => {
    const myEmail = customer?.email;
    const myName = customer?.name;
    return (
      (myEmail && transfer.paidOutById === myEmail) ||
      (myName && transfer.paidOutBy === myName)
    );
  };

  const filteredTransfers = transfers
    .filter((t) => showSettled || !isFullySettled(t))
    // G-Agents see PENDING/SENT transfers (to action them), but only their own PAID/CANCELLED transfers
    .filter((t) => !isGAgent || ['PENDING', 'SENT'].includes(t.status) || isPaidByMe(t))
    .filter((transfer) => {
      // Status filter
      if (filterStatus !== "ALL" && transfer.status !== filterStatus) {
        return false;
      }

      // Agent filter
      if (filterAgent === '__MINE__' && !isMyTransfer(transfer)) {
        return false;
      }

      if (filterAgent !== 'ALL' && filterAgent !== '__MINE__' && getTransferAgentLabel(transfer) !== filterAgent) {
        return false;
      }

      // Collection method filter
      if (isGAgent && waveOnly && transfer.collection_method !== 'WAVE') {
        return false;
      }

      // Search filter
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const displayRef = makeTransferRef({
        from: transfer.from,
        to: transfer.to,
        id: transfer.id,
      }).toLowerCase();

      return (
        transfer.from?.toLowerCase().includes(searchLower) ||
        transfer.to?.toLowerCase().includes(searchLower) ||
        transfer.id?.toLowerCase().includes(searchLower) ||
        displayRef.includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  useEffect(() => {
    fetchTransfers();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={appColor.secondary} />
        <Text style={styles.loadingText}>Loading transfers...</Text>
      </View>
    );
  }

  // Exclude cancelled transfers from totals
  const activeTransfers = filteredTransfers.filter(t => t.status !== 'CANCELLED');
  const totalAmount = activeTransfers.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalPayout = activeTransfers.reduce((sum, t) => sum + Number(t.payoutAmountGMD || 0), 0);

  // Check if any filters are active
  const hasActiveFilters = filterStatus !== 'ALL' || filterAgent !== 'ALL' || startDate || endDate || showSettled || (isGAgent && waveOnly);

  return (
    <View style={styles.container}>
      {/* Compact Header Stats — Admins see all stats, G-Agents see total sent only */}
      {isAdmin && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{filteredTransfers.length}</Text>
            <Text style={styles.statLabel}>Transfers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>£{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>D{totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={styles.statLabel}>Payout</Text>
          </View>
        </View>
      )}
      {!isAdmin && isGAgent && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>£{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>D{totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={styles.statLabel}>Payout</Text>
          </View>
        </View>
      )}

      {/* Search Bar with Filter Toggle */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={22} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sender, receiver, or ID..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#666"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.filterToggle, hasActiveFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <MaterialCommunityIcons
            name={showFilters ? "filter-off" : "filter-variant"}
            size={20}
            color={hasActiveFilters ? '#fff' : appColor.secondary}
          />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Collapsible Filters */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Status Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsRow}>
            {['ALL', 'SENT', 'PENDING', 'PAID', 'CANCELLED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterPill,
                  filterStatus === status && styles.filterPillActive,
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[
                  styles.filterPillText,
                  filterStatus === status && styles.filterPillTextActive,
                ]}>
                  {status === 'ALL' ? 'All' : STATUS_CONFIG[status]?.label || status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Agent Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                filterAgent === 'ALL' && styles.filterPillActive,
              ]}
              onPress={() => setFilterAgent('ALL')}
            >
              <Text style={[
                styles.filterPillText,
                filterAgent === 'ALL' && styles.filterPillTextActive,
              ]}>
                All
              </Text>
            </TouchableOpacity>

            {!isAdmin && (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterAgent === '__MINE__' && styles.filterPillActive,
                ]}
                onPress={() => setFilterAgent('__MINE__')}
              >
                <Text style={[
                  styles.filterPillText,
                  filterAgent === '__MINE__' && styles.filterPillTextActive,
                ]}>
                  Mine
                </Text>
              </TouchableOpacity>
            )}

            {isAdmin && availableAgents.map((agentName) => (
              <TouchableOpacity
                key={agentName}
                style={[
                  styles.filterPill,
                  filterAgent === agentName && styles.filterPillActive,
                ]}
                onPress={() => setFilterAgent(agentName)}
              >
                <Text style={[
                  styles.filterPillText,
                  filterAgent === agentName && styles.filterPillTextActive,
                ]}>
                  {agentName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date Range */}
          <View style={styles.dateFilterRow}>
            <TouchableOpacity
              style={styles.dateInputWrapper}
              onPress={() => setShowStartPicker(true)}
            >
              <MaterialCommunityIcons name="calendar-start" size={18} color={appColor.secondary} />
              <Text style={[styles.dateText, !startDate && styles.datePlaceholder]}>
                {startDate || 'Start date'}
              </Text>
              {startDate && (
                  <TouchableOpacity
                    onPress={() => {
                      setStartDate('');
                      setIsLoading(true);
                      fetchTransfers({ startDate: '', endDate });
                    }}
                  >
                  <MaterialCommunityIcons name="close" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#666" />
            <TouchableOpacity
              style={styles.dateInputWrapper}
              onPress={() => setShowEndPicker(true)}
            >
              <MaterialCommunityIcons name="calendar-end" size={18} color={appColor.secondary} />
              <Text style={[styles.dateText, !endDate && styles.datePlaceholder]}>
                {endDate || 'End date'}
              </Text>
              {endDate && (
                  <TouchableOpacity
                    onPress={() => {
                      setEndDate('');
                      setIsLoading(true);
                      fetchTransfers({ startDate, endDate: '' });
                    }}
                  >
                  <MaterialCommunityIcons name="close" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Settled Toggle & Apply */}
          <View style={styles.filterActions}>
            {isGAgent && (
              <TouchableOpacity
                style={[styles.settledToggle, waveOnly && styles.settledToggleActive]}
                onPress={() => setWaveOnly(!waveOnly)}
              >
                <MaterialCommunityIcons
                  name={waveOnly ? "check-circle" : "circle-outline"}
                  size={18}
                  color={waveOnly ? appColor.secondary : '#666'}
                />
                <Text style={[styles.settledText, waveOnly && styles.settledTextActive]}>
                  Wave Only
                </Text>
              </TouchableOpacity>
            )}

            {isAdmin && (
            <TouchableOpacity
              style={[styles.settledToggle, showSettled && styles.settledToggleActive]}
              onPress={() => setShowSettled(!showSettled)}
            >
              <MaterialCommunityIcons
                name={showSettled ? "check-circle" : "circle-outline"}
                size={18}
                color={showSettled ? appColor.secondary : '#666'}
              />
              <Text style={[styles.settledText, showSettled && styles.settledTextActive]}>
                Include Settled
              </Text>
            </TouchableOpacity>
            )}

            {(startDate || endDate) && (
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setIsLoading(true);
                  fetchTransfers();
                }}
              >
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            )}

              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <MaterialCommunityIcons name="filter-remove-outline" size={16} color="#fff" />
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Transfer List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={appColor.secondary}
          />
        }
      >
        {filteredTransfers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="inbox-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No transfers found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchTerm || hasActiveFilters ? 'Try adjusting your filters' : 'Pull down to refresh'}
            </Text>
          </View>
        ) : (
          filteredTransfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              onPress={() => navigation.navigate("Detail", transfer)}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Calendar Pickers */}
      <CalendarPicker
        visible={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        onSelectDate={(date) => {
          setStartDate(date);
          setShowStartPicker(false);
        }}
        selectedDate={startDate}
      />
      <CalendarPicker
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        onSelectDate={(date) => {
          setEndDate(date);
          setShowEndPicker(false);
        }}
        selectedDate={endDate}
      />
    </View>
  );
}

function TransferCard({ transfer, onPress }) {
  const statusConfig = STATUS_CONFIG[transfer.status] || STATUS_CONFIG.PENDING;
  const transferRef = makeTransferRef({
    from: transfer.from,
    to: transfer.to,
    id: transfer.id,
  });

  // Use stored payoutAmountGMD if available (preserves precise values when user entered Dalasis)
  // Only fall back to calculation if payoutAmountGMD is null/undefined
  const payoutAmount = transfer.payoutAmountGMD != null
    ? Number(transfer.payoutAmountGMD)
    : (Number(transfer.amount) * Number(transfer.rateApplied || 0));

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Settled Badge */}
      {transfer.settled && (
        <View style={styles.settledBadge}>
          <MaterialCommunityIcons name="check-circle" size={12} color="#fff" />
          <Text style={styles.settledBadgeText}>SETTLED</Text>
        </View>
      )}
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.transferParties}>
          <View style={styles.partyRow}>
            <MaterialCommunityIcons name="account" size={18} color={appColor.secondary} />
            <Text style={styles.partyName} numberOfLines={1}>{transfer.from}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#666" style={styles.arrowIcon} />
          <View style={styles.partyRow}>
            <MaterialCommunityIcons name="account-check" size={18} color={appColor.secondary} />
            <Text style={styles.partyName} numberOfLines={1}>{transfer.to}</Text>
          </View>
        </View>
        <View style={styles.statusColumn}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}> 
            <MaterialCommunityIcons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}> 
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.transferRefText}>{transferRef}</Text>
        </View>
      </View>

      {/* Amounts Row */}
      <View style={styles.amountContainer}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Sent</Text>
          <Text style={styles.amountValue}>£{Number(transfer.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.exchangeRate}>
          <MaterialCommunityIcons name="swap-horizontal" size={18} color="#666" />
          <Text style={styles.rateText}>
            @{Number(transfer.rateApplied || 0).toFixed(2)}
          </Text>
        </View>
        <View style={[styles.amountBox, styles.amountBoxRight]}>
          <Text style={styles.amountLabel}>Receives</Text>
          <Text style={styles.payoutValue}>
            D{payoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="wallet-outline" size={14} color="#999" />
          <Text style={styles.footerText}>
            {COLLECTION_METHOD_LABELS[transfer.collection_method] || transfer.collection_method || 'Cash'}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color="#999" />
          <Text style={styles.footerText}>
            {transfer.createdAt ? makeUkDateFromUsDate(transfer.createdAt) : 'N/A'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={appColor.primaryLight} />
      </View>
    </TouchableOpacity>
  );
}

export default TransferList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColor.backgroundOne,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ccc',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: appColor.primaryLight,
    marginVertical: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
  filterToggle: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: appColor.backgroundOne,
  },
  filterToggleActive: {
    backgroundColor: appColor.secondary,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
  },
  filtersPanel: {
    marginHorizontal: 15,
    marginTop: 10,
    backgroundColor: appColor.primaryDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  filterPillsRow: {
    marginBottom: 10,
    maxHeight: 36,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: appColor.backgroundOne,
    marginRight: 8,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  filterPillActive: {
    backgroundColor: appColor.secondary,
    borderColor: appColor.secondary,
  },
  filterPillText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.backgroundOne,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  dateText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    marginLeft: 8,
  },
  datePlaceholder: {
    color: '#666',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settledToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: appColor.backgroundOne,
  },
  settledToggleActive: {
    backgroundColor: 'rgba(247, 159, 31, 0.15)',
  },
  settledText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 8,
  },
  settledTextActive: {
    color: appColor.secondary,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.secondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  applyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64748b',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  resetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  },
  listContainer: {
    flex: 1,
    paddingTop: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#ccc',
    fontWeight: '600',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  card: {
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    overflow: 'hidden',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  settledBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: appColor.primary,
  },
  transferParties: {
    flex: 1,
    marginRight: 10,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 26,
    marginVertical: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusColumn: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  transferRefText: {
    marginTop: 6,
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: appColor.primary,
  },
  amountBox: {
    flex: 1,
  },
  amountBoxRight: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '600',
    color: appColor.secondary,
  },
  exchangeRate: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  rateText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
});

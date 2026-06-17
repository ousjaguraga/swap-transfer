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
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  getTransfers,
  serializedTransfer,
  makeUkDateFromUsDate,
} from "../../../../farm";
import appColor from "../../../styles/brand";
import { makeTransferRef } from '../../../utils/display';

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

const getTransferDalasiAmount = (transfer) => {
  const rawPayout = transfer?.payoutAmountGMD;
  if (rawPayout !== undefined && rawPayout !== null && rawPayout !== '') {
    const parsedPayout = Number(rawPayout);
    if (Number.isFinite(parsedPayout)) {
      return parsedPayout;
    }
  }

  const amount = Number(transfer?.amount);
  const rate = Number(transfer?.rateApplied);
  if (Number.isFinite(amount) && Number.isFinite(rate)) {
    return amount * rate;
  }

  return null;
};

const sortTransfersByCreatedAtDesc = (items = []) => {
  return [...items].sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
};

function ReportDetailScreen({ route, navigation }) {
  const [transfers, setTransfers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const report = route.params;

  const fetchTransfers = async () => {
    try {
      const transfersData = await getTransfers({ reportID: report.id });
      const items = transfersData?.data?.listTransfers?.items || [];
      const data = items.map((transfer) => serializedTransfer(transfer));
      const sorted = sortTransfersByCreatedAtDesc(data);
      setTransfers(sorted);
    } catch (error) {
      // Error fetching transfers
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTransfers().finally(() => setRefreshing(false));
  }, []);

  const filteredTransfers = transfers.filter((transfer) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const transferRef = makeTransferRef({
      from: transfer.from,
      to: transfer.to,
      id: transfer.id,
    }).toLowerCase();
    return (
      transfer.from?.toLowerCase().includes(searchLower) ||
      transfer.to?.toLowerCase().includes(searchLower) ||
      transferRef.includes(searchLower)
    );
  });

  // Calculate totals
  const totalAmount = filteredTransfers.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalPayout = filteredTransfers.reduce((sum, transfer) => {
    const payoutAmount = getTransferDalasiAmount(transfer);
    return sum + (payoutAmount || 0);
  }, 0);
  const paidCount = filteredTransfers.filter(t => t.status === 'PAID').length;

  // Calculate period (earliest and latest transfer dates)
  const getTransferPeriod = () => {
    if (transfers.length === 0) return null;
    const dates = transfers
      .map(t => t.createdAt ? new Date(t.createdAt) : null)
      .filter(d => d && !isNaN(d.getTime()));
    if (dates.length === 0) return null;
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    return {
      start: makeUkDateFromUsDate(earliest.toISOString()),
      end: makeUkDateFromUsDate(latest.toISOString())
    };
  };
  const period = getTransferPeriod();

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

  return (
    <View style={styles.container}>
      {/* Report Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Report #{report.id.substring(0, 8)}</Text>
          <View style={styles.headerMeta}>
            <MaterialCommunityIcons name="account" size={14} color="#999" />
            <Text style={styles.headerMetaText}>{report.creator || 'Unknown'}</Text>
            <MaterialCommunityIcons name="calendar" size={14} color="#999" style={{ marginLeft: 12 }} />
            <Text style={styles.headerMetaText}>
              {report.createdAt ? makeUkDateFromUsDate(report.createdAt) : 'N/A'}
            </Text>
          </View>
          {period && (
            <View style={styles.periodRow}>
              <MaterialCommunityIcons name="calendar-range" size={14} color={appColor.secondary} />
              <Text style={styles.periodText}>
                Period: {period.start} to {period.end}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredTransfers.length}</Text>
          <Text style={styles.statLabel}>Transfers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>£{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.statLabel}>Total GBP</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>D{totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.statLabel}>Total GMD</Text>
        </View>
      </View>
      
      {/* Paid Stats */}
      <View style={styles.paidStatsRow}>
        <MaterialCommunityIcons name="check-circle" size={18} color={appColor.secondary} />
        <Text style={styles.paidStatsText}>
          {paidCount} of {filteredTransfers.length} transfers paid out
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
        <MaterialCommunityIcons name="magnify" size={20} color="#999" />
        <TextInput
          style={[styles.searchInput, Platform.OS === 'web' && styles.inputWebNoOutline]}
          placeholder="Search transfers..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholderTextColor="#999"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

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
            <MaterialCommunityIcons name="inbox-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>No transfers in this report</Text>
          </View>
        ) : (
          filteredTransfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              onPress={() => navigation.navigate("TransferDetail", transfer)}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function TransferCard({ transfer, onPress }) {
  const statusConfig = STATUS_CONFIG[transfer.status] || STATUS_CONFIG.PENDING;
  const payoutAmount = getTransferDalasiAmount(transfer) || 0;
  const transferRef = makeTransferRef({
    from: transfer.from,
    to: transfer.to,
    id: transfer.id,
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={styles.parties}>
          <Text style={styles.partyName} numberOfLines={1}>{transfer.from}</Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color="#666" style={{ marginHorizontal: 6 }} />
          <Text style={styles.partyName} numberOfLines={1}>{transfer.to}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <MaterialCommunityIcons name={statusConfig.icon} size={12} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </View>

      <Text style={styles.transferRefText}>{transferRef}</Text>

      {/* Amount Row */}
      <View style={styles.amountRow}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Sent</Text>
          <Text style={styles.amountValue}>£{Number(transfer.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Receives</Text>
          <Text style={[styles.amountValue, styles.payoutValue]}>
            D{payoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Dates Row */}
      <View style={styles.datesRow}>
        <View style={styles.dateItem}>
          <MaterialCommunityIcons name="calendar-plus" size={14} color="#999" />
          <Text style={styles.dateText}>
            Created: {transfer.createdAt ? makeUkDateFromUsDate(transfer.createdAt) : 'N/A'}
          </Text>
        </View>
        {transfer.status === 'PAID' && transfer.paid_on && transfer.paid_on !== '1970-01-01Z' && (
          <View style={styles.dateItem}>
            <MaterialCommunityIcons name="calendar-check" size={14} color="#4CAF50" />
            <Text style={[styles.dateText, { color: '#4CAF50' }]}>
              Paid: {makeUkDateFromUsDate(transfer.paid_on)}
            </Text>
          </View>
        )}
      </View>

      {/* Collection Method */}
      <View style={styles.collectionRow}>
        <MaterialCommunityIcons name="wallet-outline" size={14} color="#999" />
        <Text style={styles.collectionText}>
          {COLLECTION_METHOD_LABELS[transfer.collection_method] || transfer.collection_method || 'Cash Pickup'}
        </Text>
        {transfer.paidOutBy && (
          <>
            <Text style={styles.separator}>•</Text>
            <MaterialCommunityIcons name="account-check" size={14} color="#999" />
            <Text style={styles.collectionText}>Paid by: {transfer.paidOutBy}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default ReportDetailScreen;

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
  header: {
    backgroundColor: appColor.primaryDark,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: appColor.primaryLight,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerMetaText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 5,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  periodText: {
    fontSize: 13,
    color: appColor.secondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: appColor.primaryLight,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  paidStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  paidStatsText: {
    color: '#ccc',
    fontSize: 13,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  searchContainerFocused: {
    borderColor: appColor.secondary,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
    marginLeft: 8,
  },
  inputWebNoOutline: {
    outlineStyle: 'none',
    outlineWidth: 0,
    boxShadow: 'none',
  },
  listContainer: {
    flex: 1,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  card: {
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  parties: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  transferRefText: {
    fontSize: 12,
    color: '#9fb7b4',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: appColor.primary,
    borderBottomWidth: 1,
    borderBottomColor: appColor.primary,
  },
  amountItem: {},
  amountLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  payoutValue: {
    color: appColor.secondary,
    textAlign: 'right',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: appColor.primary,
  },
  collectionText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  separator: {
    color: '#666',
    marginHorizontal: 8,
  },
});

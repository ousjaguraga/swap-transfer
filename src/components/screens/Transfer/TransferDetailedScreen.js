import React, { useState, useEffect, useRef } from 'react';
import { captureRef } from 'react-native-view-shot';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, ImageBackground, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import appColor from '../../../styles/brand';
import { makeTransferRef } from '../../../utils/display';

// redux
import { useDispatch, useSelector } from 'react-redux';
import { setTransfers, selectCustomerInfo } from '../../../state/reducers/store';
import { makeUkDateFromUsDate, updateATransfer, getTransfers, serializedTransfer, getSenders, getReceiversForSender, subscribeToTransfers } from '../../../../farm';

const STATUS_CONFIG = {
  PAID: { color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.15)', icon: 'check-circle' },
  SENT: { color: '#2196F3', bgColor: 'rgba(33, 150, 243, 0.15)', icon: 'send-check' },
  PENDING: { color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.15)', icon: 'clock-outline' },
  CANCELLED: { color: '#f44336', bgColor: 'rgba(244, 67, 54, 0.15)', icon: 'close-circle' },
};

const COLLECTION_METHOD_LABELS = {
  CASH: 'Cash Pickup',
  WAVE: 'Wave',
  AFRIMONEY: 'Afrimoney',
  CREDIT: 'Credit',
};

const RECEIPT_THEME = {
  bgImage: require('../../../../assets/wc.jpeg'),
  overlayBg: 'rgba(15, 23, 42, 0.85)',
  overlayBorder: 'rgba(255, 255, 255, 0.24)',
  textPrimary: '#FFFFFF',
  textMuted: '#E2E8F0',
  accent: '#FDE68A',
  divider: 'rgba(255, 255, 255, 0.25)',
  payout: '#BBF7D0',
};

const ReceiptCardView = React.forwardRef(function ReceiptCardView(
  { transfer, transferRef, payoutAmount, receiverPhone, transferStatus, collectionMethod },
  ref
) {
  const { from, to, amount } = transfer;
  const methodLabel = COLLECTION_METHOD_LABELS[collectionMethod] || collectionMethod || 'Cash Pickup';
  const statusConfig = STATUS_CONFIG[transferStatus] || STATUS_CONFIG.PENDING;

  return (
    <View ref={ref} style={receiptCardStyles.card}>
      <ImageBackground source={RECEIPT_THEME.bgImage} style={receiptCardStyles.bgSurface} resizeMode="cover">
        <View style={receiptCardStyles.backdropTint} />
        <View style={[receiptCardStyles.overlay, { backgroundColor: RECEIPT_THEME.overlayBg, borderColor: RECEIPT_THEME.overlayBorder }]}>
          <View style={receiptCardStyles.headerRow}>
            <Text style={[receiptCardStyles.receiptTitle, { color: RECEIPT_THEME.textPrimary }]}>Receipt</Text>
            <View style={[receiptCardStyles.statusPill, { borderColor: statusConfig.color, backgroundColor: `${statusConfig.color}22` }]}>
              <Text style={[receiptCardStyles.statusPillText, { color: statusConfig.color }]}>{transferStatus}</Text>
            </View>
          </View>

          <View style={receiptCardStyles.refChip}>
            <MaterialCommunityIcons name="identifier" size={12} color={RECEIPT_THEME.accent} />
            <Text style={[receiptCardStyles.refText, { color: RECEIPT_THEME.textMuted }]}>{transferRef}</Text>
          </View>

          <View style={receiptCardStyles.partiesRow}>
            <View style={{ flex: 1 }}>
              <Text style={[receiptCardStyles.partyLabel, { color: RECEIPT_THEME.accent }]}>FROM</Text>
              <Text style={[receiptCardStyles.partyName, { color: RECEIPT_THEME.textPrimary }]} numberOfLines={2} adjustsFontSizeToFit>{from}</Text>
            </View>
            <Text style={[receiptCardStyles.arrowText, { color: RECEIPT_THEME.accent }]}>→</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[receiptCardStyles.partyLabel, { color: RECEIPT_THEME.accent }]}>TO</Text>
              <Text style={[receiptCardStyles.partyName, { color: RECEIPT_THEME.textPrimary, textAlign: 'right' }]} numberOfLines={2} adjustsFontSizeToFit>{to}</Text>
            </View>
          </View>

          <View style={[receiptCardStyles.overlayDivider, { backgroundColor: RECEIPT_THEME.divider }]} />

          <View style={receiptCardStyles.amountsRow}>
            <View>
              <Text style={[receiptCardStyles.amountLabel, { color: RECEIPT_THEME.accent }]}>SENT</Text>
              <Text style={[receiptCardStyles.amountGBP, { color: RECEIPT_THEME.textPrimary }]}>
                £{Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[receiptCardStyles.amountLabel, { color: RECEIPT_THEME.accent }]}>RECEIVES</Text>
              <Text style={[receiptCardStyles.amountGMD, { color: RECEIPT_THEME.payout }]}>
                D{payoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View style={[receiptCardStyles.overlayDivider, { backgroundColor: RECEIPT_THEME.divider }]} />

          <View style={receiptCardStyles.detailRow}>
            <Text style={[receiptCardStyles.detailLabel, { color: RECEIPT_THEME.textMuted }]}>Rate</Text>
            <Text style={[receiptCardStyles.detailValue, { color: RECEIPT_THEME.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>£1 = D{Number(transfer.rateApplied || 0).toFixed(2)}</Text>
          </View>
          <View style={receiptCardStyles.detailRow}>
            <Text style={[receiptCardStyles.detailLabel, { color: RECEIPT_THEME.textMuted }]}>Method</Text>
            <Text style={[receiptCardStyles.detailValue, { color: RECEIPT_THEME.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{methodLabel}</Text>
          </View>
          {receiverPhone && (
            <View style={receiptCardStyles.detailRow}>
              <Text style={[receiptCardStyles.detailLabel, { color: RECEIPT_THEME.textMuted }]}>Number</Text>
              <Text style={[receiptCardStyles.detailValue, { color: RECEIPT_THEME.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{receiverPhone}</Text>
            </View>
          )}
          <View style={receiptCardStyles.detailRow}>
            <Text style={[receiptCardStyles.detailLabel, { color: RECEIPT_THEME.textMuted }]}>Date</Text>
            <Text style={[receiptCardStyles.detailValue, { color: RECEIPT_THEME.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {transfer.createdAt ? makeUkDateFromUsDate(transfer.createdAt) : 'N/A'}
            </Text>
          </View>
          <View style={receiptCardStyles.detailRow}>
            <Text style={[receiptCardStyles.detailLabel, { color: RECEIPT_THEME.textMuted }]}>Status</Text>
            <Text style={[receiptCardStyles.detailValue, { color: statusConfig.color }]} numberOfLines={1}>{transferStatus}</Text>
          </View>

        </View>
      </ImageBackground>
    </View>
  );
});

const receiptCardStyles = StyleSheet.create({
  card: {
    width: 390,
    height: 620,
    overflow: 'hidden',
    borderRadius: 0,
  },
  bgSurface: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
  },
  overlay: {
    margin: 18,
    marginTop: 22,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  refChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderRadius: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  refText: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  partiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  partyLabel: {
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 2,
    fontWeight: '700',
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 0,
  },
  arrowText: {
    fontSize: 18,
    paddingHorizontal: 8,
  },
  overlayDivider: {
    height: 1,
    marginVertical: 9,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  amountLabel: {
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 2,
    fontWeight: '700',
  },
  amountGBP: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  amountGMD: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
  },
  detailLabel: {
    fontSize: 11,
    textAlign: 'left',
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
});

function TransferDetailScreen({ route, navigation }) {
  // Initial values from route params (may be stale)
  const initialData = route.params;

  // State for fresh transfer data
  const [transfer, setTransfer] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);

  const { from, to, amount, status, createdAt, paid_on, id, agentSettled, agentSettled_on, gagentSettled, gagentSettled_on } = transfer;
  const [transferStatus, setTransferStatus] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [receiverPhone, setReceiverPhone] = useState(null);

  // Fetch fresh transfer data on mount
  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        const response = await getTransfers({ id: initialData.id });
        const freshData = response?.data?.getTransfer;
        if (freshData) {
          setTransfer(freshData);
          setTransferStatus(freshData.status);
        }
      } catch (error) {
        console.error('Error fetching transfer:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransfer();
  }, [initialData.id]);

  // Always show a back button to the Transfer list, regardless of how the screen was reached
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Transfer')}
          style={{ marginLeft: 4, padding: 4 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Real-time subscription for this specific transfer
  useEffect(() => {
    const subscription = subscribeToTransfers({
      onUpdate: (updatedTransfer) => {
        if (updatedTransfer.id === initialData.id) {
          console.log('Transfer updated in real-time:', updatedTransfer.id);
          setTransfer(updatedTransfer);
          setTransferStatus(updatedTransfer.status);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialData.id]);

  const dispatch = useDispatch();
  const customer = useSelector(selectCustomerInfo);
  const isAdmin = customer?.groups?.includes('Admin');
  const isGAgent = customer?.groups?.includes('Gagent');
  const statusConfig = STATUS_CONFIG[transferStatus] || STATUS_CONFIG.PENDING;
  const transferRef = makeTransferRef({ from, to, id });

  const isMobilePayment = ['WAVE', 'AFRIMONEY', 'CREDIT'].includes(route.params.collection_method);

  // Use stored payoutAmountGMD if available (preserves precise values when user entered Dalasis)
  // Only fall back to calculation if payoutAmountGMD is null/undefined
  // Use fresh transfer data instead of route.params for accurate values
  const payoutAmount = transfer.payoutAmountGMD != null
    ? Number(transfer.payoutAmountGMD)
    : (Number(amount) * Number(transfer.rateApplied || 0));

  // Fetch receiver phone for mobile payments
  useEffect(() => {
    const fetchReceiverPhone = async () => {
      if (!isMobilePayment || !to || !from) return;

      try {
        // 1. Get all senders and find the one matching 'from'
        const sendersResponse = await getSenders();
        const senders = sendersResponse?.data?.listSenders?.items || [];

        // Match sender by name (from field contains "Name Surname")
        const matchedSender = senders.find(s => {
          const fullName = [s.name, s.surname].filter(Boolean).join(' ').trim();
          return fullName.toLowerCase() === from.toLowerCase();
        });

        if (!matchedSender) return;

        // 2. Get receivers for this specific sender
        const receiversResponse = await getReceiversForSender(matchedSender.id);
        const receivers = receiversResponse?.data?.receiversBySenderID?.items || [];

        // 3. Match receiver by name within this sender's receivers
        const matchedReceiver = receivers.find(r => {
          const fullName = [r.name, r.surname].filter(Boolean).join(' ').trim();
          return fullName.toLowerCase() === to.toLowerCase();
        });

        if (matchedReceiver?.number) {
          setReceiverPhone(matchedReceiver.number);
        }
      } catch (error) {
        // Silently fail - phone is optional
      }
    };

    fetchReceiverPhone();
  }, [from, to, isMobilePayment]);

  const refreshTransfers = async () => {
    const transfersData = await getTransfers();
    const data = transfersData.data.listTransfers.items.map((transfer) =>
      serializedTransfer(transfer)
    );
    dispatch(setTransfers(data));
  };

  const handleStatusChange = async (newStatus) => {
    // Only Admin can cancel transfers
    if (newStatus === 'CANCELLED' && !isAdmin) {
      Alert.alert("Not Allowed", "Only administrators can cancel transfers.");
      return;
    }

    // Block cancellation if transfer has been settled by Agent or G-Agent
    if (newStatus === 'CANCELLED' && (agentSettled || gagentSettled)) {
      const settledBy = agentSettled && gagentSettled ? "Agent and G-Agent" : agentSettled ? "Agent" : "G-Agent";
      Alert.alert("Cannot Cancel", `This transfer has been settled by ${settledBy}. Settled transfers cannot be cancelled.`);
      return;
    }

    // Only G-Agents can mark transfers as PAID (they're the ones physically paying out)
    if (newStatus === 'PAID' && !isGAgent) {
      Alert.alert("Not Allowed", "Only G-Agents can mark transfers as paid.");
      return;
    }

    // Cannot revert a G-Agent SETTLED transfer - it's part of a closed period
    if (gagentSettled && newStatus === 'PENDING') {
      Alert.alert("Not Allowed", "This transfer has been settled by G-Agent and cannot be reverted. The period has been closed.");
      return;
    }

    // Only Admin can revert a PAID transfer to PENDING (if not G-Agent settled)
    if (transferStatus === 'PAID' && newStatus === 'PENDING' && !isAdmin) {
      Alert.alert("Not Allowed", "Only administrators can revert a paid transfer.");
      return;
    }

    setIsUpdating(true);
    try {
      const agentName = customer?.name || customer?.email || 'Unknown';
      const agentEmail = customer?.email || null; // Email is unique identifier
      console.log('Updating transfer:', transfer.id, 'to status:', newStatus, 'paidOutBy:', agentName, 'paidOutById (email):', agentEmail);
      await updateATransfer(transfer, newStatus, null, agentName, agentEmail);
      setTransferStatus(newStatus);

      // Refresh this transfer's data
      const response = await getTransfers({ id: transfer.id });
      const freshData = response?.data?.getTransfer;
      if (freshData) {
        setTransfer(freshData);
      }

      await refreshTransfers();
      Alert.alert("Success", `Transfer marked as ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating transfer:', error);
      Alert.alert("Error", `Failed to update transfer status: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [imageCopyFeedback, setImageCopyFeedback] = useState(false);
  const receiptCardRef = useRef(null);

  const buildReceiptText = () => {
    // Prefix every row: emoji rows use "EMOJI " (display 3), plain rows use "   " (3 spaces = display 3)
    // This keeps values aligned regardless of whether the label has an emoji.
    const P = '   '; // plain prefix — same display width as "emoji + space"
    const row = (prefix, label, value) => `${prefix}${label.padEnd(9)}  ${value}`;
    const statusEmoji = { PAID: '✅', SENT: '📤', PENDING: '🕐', CANCELLED: '❌' }[transferStatus] || '🔄';
    const methodLabel = COLLECTION_METHOD_LABELS[route.params.collection_method] || route.params.collection_method || 'Cash Pickup';
    const lines = [
      '```',
      row('💡 ',      'REF',      transferRef),
      row('👤 ',      'FROM',     from || 'N/A'),
      row(P,         'TO',       to || 'N/A'),
      row('💷 ',      'SENT',     `£${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`),
      row('💰 ',      'RECEIVES', `D${payoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`),
      row(P,         'RATE',     `£1 = D${Number(transfer.rateApplied || 0).toFixed(2)}`),
      row(P,     'METHOD',   methodLabel),
      ...(route.params.collection_method === 'WAVE' && receiverPhone ? [row('📞 ', 'NUMBER', receiverPhone)] : []),
      row(`${statusEmoji} `, 'STATUS', transferStatus),
      row(P,         'DATE',     createdAt ? makeUkDateFromUsDate(createdAt) : 'N/A'),
      '```',
      'Thank you!',
    ];
    return lines.join('\n');
  };

  const tryCopyImageBase64 = async (base64) => {
    if (Platform.OS === 'web') {
      try {
        const clipboardApi = typeof navigator !== 'undefined' ? navigator.clipboard : null;
        const ClipboardItemCtor = typeof window !== 'undefined' ? window.ClipboardItem : null;

        if (clipboardApi?.write && ClipboardItemCtor) {
          const dataUrl = `data:image/png;base64,${base64}`;
          const blob = await (await fetch(dataUrl)).blob();
          await clipboardApi.write([new ClipboardItemCtor({ 'image/png': blob })]);
          return true;
        }
      } catch {
        // Continue to Expo clipboard fallback
      }
    }

    try {
      await Clipboard.setImageAsync(base64);
      return true;
    } catch {
      return false;
    }
  };

  const downloadImageBase64 = (base64) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const safeRef = (transferRef || 'receipt').replace(/[^a-z0-9-_]/gi, '_');
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `${safeRef}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTextReceipt = async () => {
    try {
      const text = buildReceiptText();
      await Clipboard.setStringAsync(text);
      setImageCopyFeedback(false);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      Alert.alert('Copy failed', 'Could not copy text receipt.');
    }
  };

  const handleCopyImageReceipt = async () => {
    try {
      const base64 = await captureRef(receiptCardRef, {
        format: 'png',
        quality: 1,
        result: 'base64',
        pixelRatio: 3,
      });

      const copied = await tryCopyImageBase64(base64);
      if (!copied) {
        if (Platform.OS === 'web') {
          downloadImageBase64(base64);
          Alert.alert('Image download started', 'Browser blocked image copy. Downloaded instead, share the file in WhatsApp.');
        } else {
          Alert.alert('Copy failed', 'Could not copy image receipt.');
        }
        return;
      }

      setCopyFeedback(false);
      setImageCopyFeedback(true);

      if (Platform.OS !== 'web') {
        try {
          await Linking.openURL('whatsapp://send');
        } catch {
          Alert.alert('WhatsApp not found', 'Receipt image copied. Open WhatsApp and paste it into the chat.');
        }
      } else {
        Alert.alert('Receipt image copied', 'Open WhatsApp Web and paste to send.');
      }

      setTimeout(() => setImageCopyFeedback(false), 2500);
    } catch {
      Alert.alert('Copy failed', 'Could not copy image receipt.');
    }
  };

  return (
    <>
    <ScrollView style={styles.container}>
      {/* Single Unified Card */}
      <View style={styles.card}>
        {/* Header with Status */}
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <MaterialCommunityIcons name={statusConfig.icon} size={16} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{transferStatus}</Text>
          </View>
          <Text style={styles.transferId}>{transferRef}</Text>
        </View>

        {/* Sender → Receiver */}
        <View style={styles.partiesSection}>
          <View style={styles.partyBox}>
            <MaterialCommunityIcons name="account" size={24} color={appColor.secondary} />
            <Text style={styles.partyLabel}>From</Text>
            <Text style={styles.partyName}>{from}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#666" />
          <View style={styles.partyBox}>
            <MaterialCommunityIcons name="account-check" size={24} color={appColor.secondary} />
            <Text style={styles.partyLabel}>To</Text>
            <Text style={styles.partyName}>{to}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Sent (GBP)</Text>
              <Text style={styles.amountValue}>£{Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Receives (GMD)</Text>
              <Text style={[styles.amountValue, styles.payoutValue]}>
                D{payoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
          {transfer.rateApplied && (
            <View style={styles.rateRow}>
              <MaterialCommunityIcons name="swap-horizontal" size={14} color="#999" />
              <Text style={styles.rateText}>Rate: £1 = D{Number(transfer.rateApplied).toFixed(2)}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <DetailRow
            icon="wallet-outline"
            label="Collection"
            value={COLLECTION_METHOD_LABELS[route.params.collection_method] || route.params.collection_method || 'Cash Pickup'}
          />
          <DetailRow
            icon="account-tie"
            label="Created By"
            value={route.params.createdBy || 'N/A'}
          />
          {route.params.paidOutBy && (
            <DetailRow
              icon="account-check-outline"
              label="Paid Out By"
              value={route.params.paidOutBy}
            />
          )}
          <DetailRow
            icon="calendar"
            label="Created"
            value={createdAt ? makeUkDateFromUsDate(createdAt) : 'N/A'}
          />
          {transferStatus === "PAID" && paid_on && paid_on !== '1970-01-01Z' && (
            <DetailRow
              icon="calendar-check"
              label="Paid On"
              value={makeUkDateFromUsDate(paid_on)}
              valueColor="#4CAF50"
            />
          )}
          {/* Agent Settlement Status */}
          <DetailRow
            icon={agentSettled ? "check-decagram" : "clock-outline"}
            label="Agent Settled"
            value={agentSettled ? "Yes" : "No"}
            valueColor={agentSettled ? '#4CAF50' : '#FF9800'}
          />
          {agentSettled && agentSettled_on && (
            <DetailRow
              icon="calendar-check-outline"
              label="Agent Settled On"
              value={makeUkDateFromUsDate(agentSettled_on)}
              valueColor="#4CAF50"
            />
          )}
          {/* G-Agent Settlement Status */}
          <DetailRow
            icon={gagentSettled ? "check-decagram" : "clock-outline"}
            label="G-Agent Settled"
            value={gagentSettled ? "Yes" : "No"}
            valueColor={gagentSettled ? '#4CAF50' : '#FF9800'}
          />
          {gagentSettled && gagentSettled_on && (
            <DetailRow
              icon="calendar-check-outline"
              label="G-Agent Settled On"
              value={makeUkDateFromUsDate(gagentSettled_on)}
              valueColor="#4CAF50"
            />
          )}

          {/* Receiver Phone - Show if available for mobile payments */}
          {receiverPhone && (
            <DetailRow
              icon="phone"
              label="Receiver Phone"
              value={receiverPhone}
            />
          )}
        </View>

        {/* Mobile Payment Verification Notice */}
        {isMobilePayment && (
          <View style={styles.mobilePaymentNotice}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#f39c12" />
            <View style={styles.noticeTextContainer}>
              <Text style={styles.noticeTitle}>
                {COLLECTION_METHOD_LABELS[route.params.collection_method]} Payment
              </Text>
              <Text style={styles.noticeText}>
                Please verify the {COLLECTION_METHOD_LABELS[route.params.collection_method]} number with the customer before making the payout.
                {receiverPhone && `\nPhone: ${receiverPhone}`}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons - Inside Card */}
        {/* G-Agents can mark as paid, Admin can cancel or revert to pending */}
        {transferStatus !== 'CANCELLED' && (isGAgent || isAdmin) && (
          <>
            <View style={styles.divider} />
            <View style={styles.actionsSection}>
              {isUpdating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={appColor.secondary} />
                  <Text style={styles.loadingText}>Updating...</Text>
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  {/* Only G-Agents can mark as PAID */}
                  {transferStatus !== 'PAID' && isGAgent && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.paidButton]}
                      onPress={() => handleStatusChange('PAID')}
                    >
                      <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Mark Paid</Text>
                    </TouchableOpacity>
                  )}

                  {/* Only Admin can revert PAID to PENDING - but NOT if G-Agent settled */}
                  {transferStatus === 'PAID' && isAdmin && !gagentSettled && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.pendingButton]}
                      onPress={() => handleStatusChange('PENDING')}
                    >
                      <MaterialCommunityIcons name="clock-outline" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Revert to Pending</Text>
                    </TouchableOpacity>
                  )}

                  {/* Only Admin can cancel transfers - and only if not settled and not paid */}
                  {transferStatus !== 'CANCELLED' && transferStatus !== 'PAID' && isAdmin && !agentSettled && !gagentSettled && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          if (window.confirm('Are you sure you want to cancel this transfer?')) {
                            handleStatusChange('CANCELLED');
                          }
                        } else {
                          Alert.alert(
                            "Cancel Transfer",
                            "Are you sure you want to cancel this transfer?",
                            [
                              { text: "No", style: "cancel" },
                              { text: "Yes", onPress: () => handleStatusChange('CANCELLED') }
                            ]
                          );
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        {/* Copy Receipt */}
        <View style={styles.divider} />
        <View style={styles.copyButtonsRow}>
          <TouchableOpacity style={[styles.copyReceiptButton, styles.copyTextButton]} onPress={handleCopyTextReceipt}>
            <MaterialCommunityIcons
              name={copyFeedback ? 'check-circle' : 'text-box-outline'}
              size={20}
              color={copyFeedback ? '#4CAF50' : '#E2E8F0'}
            />
            <Text style={[styles.copyReceiptText, copyFeedback && { color: '#4CAF50' }]}> 
              {copyFeedback ? 'Text copied' : 'Copy Text'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.copyReceiptButton, styles.copyImageButton]} onPress={handleCopyImageReceipt}>
            <MaterialCommunityIcons
              name={imageCopyFeedback ? 'whatsapp' : 'image-outline'}
              size={20}
              color={imageCopyFeedback ? '#4CAF50' : appColor.secondary}
            />
            <Text style={[styles.copyReceiptText, imageCopyFeedback && { color: '#4CAF50' }]}> 
              {imageCopyFeedback ? 'Image copied' : 'Copy Image'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    <View style={{ position: 'absolute', left: -9999, top: 0 }} pointerEvents="none">
      <ReceiptCardView
        ref={receiptCardRef}
        transfer={transfer}
        transferRef={transferRef}
        payoutAmount={payoutAmount}
        receiverPhone={receiverPhone}
        transferStatus={transferStatus}
        collectionMethod={route.params.collection_method}
      />
    </View>
    </>
  );
}

function DetailRow({ icon, label, value, valueColor }) {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={18} color={appColor.secondary} style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  card: {
    backgroundColor: appColor.primaryDark,
    margin: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  transferId: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'monospace',
  },
  partiesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  partyBox: {
    alignItems: 'center',
    flex: 1,
  },
  partyLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 5,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: appColor.primaryLight,
  },
  amountSection: {
    padding: 15,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountItem: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 3,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  payoutValue: {
    color: appColor.secondary,
    textAlign: 'right',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  rateText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  detailsSection: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#999',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  actionsSection: {
    padding: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#999',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  paidButton: {
    backgroundColor: '#4CAF50',
  },
  pendingButton: {
    backgroundColor: '#FF9800',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  mobilePaymentNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  noticeTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f39c12',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
  copyButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  copyReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  copyTextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  copyImageButton: {
    backgroundColor: 'rgba(0, 176, 95, 0.12)',
    borderColor: 'rgba(0, 176, 95, 0.35)',
  },
  copyReceiptText: {
    fontSize: 14,
    fontWeight: '600',
    color: appColor.secondary,
  },
});

export default TransferDetailScreen;

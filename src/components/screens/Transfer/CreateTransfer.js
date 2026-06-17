import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, ActivityIndicator, RefreshControl, Alert, Keyboard, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import appColor from '../../../styles/brand';
import { selectSenders, setSenders, setTransfers, selectCustomerInfo } from '../../../state/reducers/store';
import {
  getLatestDailyRate,
  getSenders,
  createATransfer,
  getTransfers,
  serializedTransfer,
  getReceiversForSender,
  makeUkDateFromUsDate,
  subscribeToDailyRates,
  subscribeToSenders,
  subscribeToReceivers
} from '../../../../farm';

function HomeScreen({ navigation }) {
  const [dailyRate, setDailyRate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [amount, setAmount] = useState('');
  const [receiverGets, setReceiverGets] = useState('');
  const [receivers, setReceivers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [collectionMethod, setCollectionMethod] = useState('CASH');
  const latestReceiverRequest = useRef(0);


  const collectionMethods = [
    { value: 'CASH', label: 'Cash Pickup' },
    { value: 'WAVE', label: 'Wave' },
    { value: 'AFRIMONEY', label: 'Afrimoney' },
    { value: 'CREDIT', label: 'Credit' },
  ];

  const customer = useSelector(selectCustomerInfo);
  const senders = useSelector(selectSenders);
  const dispatch = useDispatch();

  const userName = customer?.name || customer?.email?.split('@')[0] || 'User';

  const loadDailyRate = async () => {
    try {
      const rate = await getLatestDailyRate();
      setDailyRate(rate);
    } catch (error) {
      // Error loading daily rate
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadReceiversForSender = async (senderID) => {
    if (!senderID) {
      setReceivers([]);
      return;
    }

    const requestId = ++latestReceiverRequest.current;

    try {
      const r = await getReceiversForSender(senderID);
      const rawItems = r?.data?.receiversBySenderID?.items || [];
      const uniqueMap = new Map();

      rawItems
        .filter(item => item && item.senderID === senderID)
        .forEach((item) => {
          if (item.id && !uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
          }
        });

      const items = Array.from(uniqueMap.values()).sort((a, b) =>
        `${a.name || ''} ${a.surname || ''}`.localeCompare(`${b.name || ''} ${b.surname || ''}`)
      );

      // Ignore stale responses when sender selection changes quickly.
      if (requestId === latestReceiverRequest.current) {
        setReceivers(items);
      }
    } catch (error) {
      if (requestId === latestReceiverRequest.current) {
        setReceivers([]);
      }
    }
  };

  const handleTransfer = async () => {
    if (!from || !to || !amount) {
      Alert.alert('Missing Info', 'Please fill all fields');
      return;
    }

    if (!dailyRate || !dailyRate.rate) {
      Alert.alert('Rate not available', 'Please try again later');
      return;
    }

    setIsSending(true);
    try {
      const normalizedAmount = Number(amount);

      const result = await createATransfer(from.label, to.label, normalizedAmount, dailyRate.rate, userName, collectionMethod, customer?.sub);

      const newTransfer = result?.data?.createTransfer;

      const transfers = await getTransfers();
      const data = [];
      const items = transfers?.data?.listTransfers?.items || [];
      items.filter((t) => !t.settled).forEach((t) => {
        data.push(serializedTransfer(t));
      });
      dispatch(setTransfers(data));

      setFrom(null);
      setTo(null);
      setAmount('');
      setReceiverGets('');
      setReceivers([]);

      if (newTransfer) {
        navigation.navigate('TransferStack', {
          screen: 'Detail',
          params: serializedTransfer(newTransfer),
        });
      }
    } catch (error) {
      Alert.alert('Transfer Failed', String(error?.message || error));
    } finally {
      setIsSending(false);
    }
  };

  // Handle amount change - update receiverGets based on rate
  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./, '$1');
    setAmount(cleaned);
    if (cleaned && dailyRate?.rate) {
      const payout = (Number(cleaned) * dailyRate.rate).toFixed(2);
      setReceiverGets(payout);
    } else {
      setReceiverGets('');
    }
  };

  // Handle receiverGets change - update amount based on rate
  const handleReceiverGetsChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./, '$1');
    setReceiverGets(cleaned);
    if (cleaned && dailyRate?.rate) {
      // Round UP the GBP amount so customer always gets at least what they asked for
      const rawGbp = Number(cleaned) / dailyRate.rate;
      const sendAmount = (Math.ceil(rawGbp * 100) / 100).toFixed(2);
      setAmount(sendAmount);
    } else {
      setAmount('');
    }
  };

  const isFormValid = from?.id && to?.id && amount && Number(amount) >= 1;

  const onRefresh = () => {
    setRefreshing(true);
    loadDailyRate();
  };

  useEffect(() => {
    loadDailyRate();
    const loadSenders = async () => {
      try {
        const s = await getSenders();
        const items = s?.data?.listSenders?.items || [];
        dispatch(setSenders(items));
      } catch (error) {
        // Error loading senders
      }
    };
    loadSenders();
  }, []);

  // Real-time subscription - update rate when admin changes it
  useEffect(() => {
    const subscription = subscribeToDailyRates({
      onCreate: (newRate) => {
        // Check if this is a newer rate than current
        if (!dailyRate || new Date(newRate.effectiveDate) >= new Date(dailyRate.effectiveDate)) {
          console.log('New daily rate detected:', newRate.rate);
          setDailyRate(newRate);
        }
      },
      onUpdate: (updatedRate) => {
        // If current rate was updated, refresh it
        if (dailyRate && updatedRate.id === dailyRate.id) {
          console.log('Current daily rate updated:', updatedRate.rate);
          setDailyRate(updatedRate);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [dailyRate]);

  // Real-time subscription for senders (customers)
  useEffect(() => {
    const subscription = subscribeToSenders({
      onCreate: (newSender) => {
        dispatch(setSenders([...senders, newSender]));
      },
      onUpdate: (updatedSender) => {
        dispatch(setSenders(senders.map(s => s.id === updatedSender.id ? updatedSender : s)));
      },
      onDelete: (deletedSender) => {
        dispatch(setSenders(senders.filter(s => s.id !== deletedSender.id)));
        if (from?.id === deletedSender.id) setFrom(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [senders, dispatch, from]);

  // Real-time subscription for receivers
  useEffect(() => {
    if (!from?.id) return;

    const subscription = subscribeToReceivers({
      onCreate: (newReceiver) => {
        if (newReceiver.senderID === from.id) {
          setReceivers(prev => [...prev, newReceiver]);
        }
      },
      onUpdate: (updatedReceiver) => {
        if (updatedReceiver.senderID === from.id) {
          setReceivers(prev => prev.map(r => r.id === updatedReceiver.id ? updatedReceiver : r));
        }
      },
      onDelete: (deletedReceiver) => {
        setReceivers(prev => prev.filter(r => r.id !== deletedReceiver.id));
        if (to?.id === deletedReceiver.id) setTo(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [from, to]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={appColor.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const rateDisplay = dailyRate?.rate ? dailyRate.rate.toFixed(2) : '0.00';
  const payoutAmount = amount && dailyRate?.rate ? (Number(amount) * dailyRate.rate).toFixed(2) : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>🔄</Text>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Welcome back, {userName}!</Text>
          <Text style={styles.subtitle}>Swap Transfer</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="currency-gbp" size={24} color={appColor.secondary} />
          <Text style={styles.cardTitle}>Today's Exchange Rate</Text>
        </View>
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>Rate:</Text>
          <Text style={styles.rateValue}>£1 = D{rateDisplay}</Text>
        </View>
        {dailyRate?.effectiveDate && (
          <Text style={styles.effectiveDate}>
            Effective: {makeUkDateFromUsDate(dailyRate.effectiveDate)}
          </Text>
        )}
      </View>

      <View style={styles.sendMoneySection}>
        <Text style={styles.sectionTitle}>Send Money</Text>

        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          containerStyle={styles.dropdownContainer}
          activeColor={appColor.primaryLight}
          itemTextStyle={styles.dropdownText}
          data={senders.map(s => ({
            id: s.id,
            label: [s.name, s.surname].filter(Boolean).join(' ').trim() || 'Unknown'
          }))}
          search
          maxHeight={300}
          labelField="label"
          valueField="id"
          placeholder="Select sender"
          searchPlaceholder="Search..."
          value={from?.id || null}
          onChange={item => {
            setFrom(item);
            setTo(null);
            setReceivers([]);
            loadReceiversForSender(item.id);
          }}
          renderLeftIcon={() => (
            <MaterialCommunityIcons name="account" size={20} color={appColor.primary} style={styles.dropdownIcon} />
          )}
        />

        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          itemTextStyle={styles.dropdownText}
          iconStyle={styles.iconStyle}
          containerStyle={styles.dropdownContainer}
          activeColor={appColor.primaryLight}
          data={receivers.map(r => ({
            id: r.id,
            label: [r.name, r.surname].filter(Boolean).join(' ').trim() || 'Unknown'
          }))}
          search
          maxHeight={300}
          labelField="label"
          valueField="id"
          placeholder={from ? "Select receiver" : "Select sender first"}
          searchPlaceholder="Search..."
          value={to?.id || null}
          onChange={item => setTo(item)}
          renderLeftIcon={() => (
            <MaterialCommunityIcons name="account-arrow-right" size={20} color={appColor.primary} style={styles.dropdownIcon} />
          )}
        />

        <TextInput
          style={styles.amountInput}
          value={amount}
          placeholderTextColor="#999"
          placeholder="Amount (GBP £)"
          keyboardType="decimal-pad"
          onChangeText={handleAmountChange}
        />

        <TextInput
          style={styles.amountInput}
          value={receiverGets}
          placeholderTextColor="#999"
          placeholder={dailyRate?.rate ? `Receiver Gets (GMD) - rate: ${dailyRate.rate}` : 'Receiver Gets (GMD)'}
          keyboardType="decimal-pad"
          onChangeText={handleReceiverGetsChange}
        />

        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          iconStyle={styles.iconStyle}
          containerStyle={styles.dropdownContainer}
          activeColor={appColor.primaryLight}
          itemTextStyle={styles.dropdownText}
          data={collectionMethods}
          maxHeight={200}
          labelField="label"
          valueField="value"
          placeholder="Collection Method"
          value={collectionMethod}
          onChange={item => setCollectionMethod(item.value)}
          renderLeftIcon={() => (
            <MaterialCommunityIcons name="cash" size={20} color={appColor.primary} style={styles.dropdownIcon} />
          )}
        />



        <Pressable
          disabled={!isFormValid || isSending}
          style={[styles.sendButton, (!isFormValid || isSending) && styles.disabledButton]}
          onPress={handleTransfer}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Send Transfer</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.quickActions}>
        <Pressable style={styles.actionCard} onPress={() => navigation.navigate('TransferStack')}>
          <MaterialCommunityIcons name="book-open" size={32} color={appColor.secondary} />
          <Text style={styles.actionCardText}>View Transfers</Text>
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => navigation.navigate('CustomerStack')}>
          <MaterialCommunityIcons name="account-group" size={32} color={appColor.secondary} />
          <Text style={styles.actionCardText}>Customers</Text>
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => navigation.navigate('more', { screen: 'DailyRates' })}>
          <MaterialCommunityIcons name="chart-line" size={32} color={appColor.secondary} />
          <Text style={styles.actionCardText}>Exchange Rates</Text>
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => navigation.navigate('more')}>
          <MaterialCommunityIcons name="dots-horizontal" size={32} color={appColor.secondary} />
          <Text style={styles.actionCardText}>More</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColor.backgroundOne,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
    backgroundColor: appColor.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    fontSize: 60,
    marginRight: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: appColor.secondaryLight,
    fontWeight: '600',
  },
  card: {
    backgroundColor: appColor.primaryDark,
    margin: 15,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rateLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  rateValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: appColor.secondary,
  },
  effectiveDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sendMoneySection: {
    backgroundColor: appColor.primaryDark,
    margin: 15,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: appColor.primary,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  dropdownIcon: {
    marginRight: 10,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#ccc',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#fff',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    backgroundColor: appColor.primary,
    color: '#fff',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dropdownContainer: {
    backgroundColor: appColor.primary,
    borderColor: appColor.primaryLight,
    borderWidth: 1,
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#fff',
  },
  amountInput: {
    backgroundColor: appColor.primary,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  payoutPreview: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: appColor.primary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColor.secondary,
  },
  payoutLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  payoutValue: {
    color: appColor.secondary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: appColor.secondary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: appColor.primaryDark,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: appColor.primary,
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
});

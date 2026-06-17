import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    ScrollView,
    Platform,
    Modal,
    FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    getAllAgentsWithBalances,
    getMyAgentBalance,
    getCashFlowReport,
    makeUkDateFromUsDate,
} from '../../../../farm';
import appColor from '../../../styles/brand';
import * as Print from 'expo-print';
import { useSelector } from 'react-redux';
import { selectCustomerInfo } from '../../../state/reducers/store';

// UK Date format: DD-MM-YYYY
const UK_DATE_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;

const parseUkDateInput = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }
    const match = value.trim().match(UK_DATE_REGEX);
    if (!match) {
        return null;
    }
    const [, dayStr, monthStr, yearStr] = match;
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const day = Number(dayStr);
    if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) {
        return null;
    }
    const date = new Date(Date.UTC(year, monthIndex, day));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== monthIndex ||
        date.getUTCDate() !== day
    ) {
        return null;
    }
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

// Format ISO date to readable UK format with time
const formatDateTime = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Generate PDF filename
const generatePdfFilename = (agentName) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const safeName = (agentName || 'agent')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    return `cashflow_report_${safeName}_${day}-${month}-${year}`;
};

// Calendar Picker Component
const CalendarPicker = ({ visible, onClose, onSelectDate, selectedDate }) => {
    const today = new Date();
    const [viewDate, setViewDate] = useState(selectedDate || today);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const prevMonth = () => {
        setViewDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(year, month + 1, 1));
    };

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
        return parsed.getDate() === day &&
            parsed.getMonth() === month &&
            parsed.getFullYear() === year;
    };

    const isToday = (day) => {
        return day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.calendarOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.calendarContainer}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={prevMonth} style={styles.calendarNavButton}>
                            <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.calendarTitle}>{monthNames[month]} {year}</Text>
                        <TouchableOpacity onPress={nextMonth} style={styles.calendarNavButton}>
                            <MaterialCommunityIcons name="chevron-right" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.calendarWeekRow}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                            <Text key={d} style={styles.calendarWeekDay}>{d}</Text>
                        ))}
                    </View>

                    <View style={styles.calendarGrid}>
                        {days.map((day, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.calendarDay,
                                    isSelected(day) && styles.calendarDaySelected,
                                    isToday(day) && !isSelected(day) && styles.calendarDayToday,
                                ]}
                                onPress={() => selectDay(day)}
                                disabled={!day}
                            >
                                <Text style={[
                                    styles.calendarDayText,
                                    !day && styles.calendarDayEmpty,
                                    isSelected(day) && styles.calendarDayTextSelected,
                                    isToday(day) && !isSelected(day) && styles.calendarDayTextToday,
                                ]}>
                                    {day || ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.calendarActions}>
                        <TouchableOpacity
                            style={styles.calendarTodayButton}
                            onPress={() => {
                                onSelectDate(formatToUkDate(today));
                                onClose();
                            }}
                        >
                            <Text style={styles.calendarTodayText}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.calendarClearButton}
                            onPress={() => {
                                onSelectDate('');
                                onClose();
                            }}
                        >
                            <Text style={styles.calendarClearText}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

// Build HTML for PDF export
const buildCashFlowReportHtml = (reportData) => {
    const { agent, period, openingBalance, closingBalance, dailySummaries, currency, symbol, totals } = reportData;
    const isGAgent = agent.type === 'GAGENT';

    const formatCurrencyValue = (amt) => {
        return amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'PAYOUT': return isGAgent ? 'Payout' : 'Collection';
            case 'TOP_UP': return 'Top Up';
            case 'DELIVERY': return 'Delivery';
            case 'ADJUSTMENT': return 'Adjustment';
            default: return type;
        }
    };

    const dailySections = dailySummaries.map(day => {
        const transactionRows = day.transactions.map(t => `
      <tr>
        <td style="font-size: 11px; color: #666;">${new Date(t.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
        <td style="font-size: 12px; font-weight: 600;">${getTypeLabel(t.type)}</td>
        <td style="font-size: 12px; color: #444;">${t.original?.description || (t.type === 'PAYOUT' ? (isGAgent ? `Transf to ${t.original?.to}` : `Transf from ${t.original?.from}`) : '-')}</td>
        <td style="text-align: right; font-size: 12px; color: ${t.amount >= 0 ? '#27ae60' : '#e74c3c'};">
          ${t.amount > 0 ? '+' : ''}${symbol}${formatCurrencyValue(Math.abs(t.amount))}
        </td>
      </tr>
    `).join('');

        return `
    <div class="day-section">
      <div class="day-header">
        <span class="day-date">${new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span class="day-opening">Opening: ${symbol}${formatCurrencyValue(day.opening)}</span>
      </div>
      
      <table class="transaction-table">
        <tbody>
          ${transactionRows}
        </tbody>
      </table>
      
      <div class="day-footer">
        <div class="day-stat"><span>In:</span> <span style="color: #27ae60;">+${symbol}${formatCurrencyValue(day.topUps)}</span></div>
        <div class="day-stat"><span>Out:</span> <span style="color: #e74c3c;">-${symbol}${formatCurrencyValue(Math.abs(day.payouts))}</span></div>
        <div class="day-stat"><span>Adjust:</span> <span style="color: #9b59b6;">${day.adjustments >= 0 ? '+' : ''}${symbol}${formatCurrencyValue(day.adjustments)}</span></div>
        <div class="day-stat" style="font-weight: bold;"><span>Closing:</span> <span>${symbol}${formatCurrencyValue(day.closing)}</span></div>
      </div>
    </div>
    `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 25px; color: #333; line-height: 1.4; background: #fff; }
    .header { margin-bottom: 25px; border-bottom: 2px solid #008979; padding-bottom: 12px; }
    .header h1 { margin: 0; color: #1a1a1a; font-size: 22px; }
    .header p { margin: 4px 0 0; color: #666; font-size: 13px; }
    
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
    .summary-card { background: #f8f9fa; padding: 12px; border-radius: 6px; border: 1px solid #eee; }
    .summary-card .label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; font-weight: 600; }
    .summary-card .value { font-size: 16px; font-weight: bold; color: #008979; }
    
    .day-section { margin-bottom: 25px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
    .day-header { background: #008979; color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
    .day-date { font-weight: bold; font-size: 14px; }
    .day-opening { font-size: 12px; opacity: 0.9; }
    
    .transaction-table { width: 100%; border-collapse: collapse; }
    .transaction-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    .transaction-table tr:last-child td { border-bottom: none; }
    
    .day-footer { background: #fcfcfc; padding: 10px 12px; display: flex; justify-content: space-between; border-top: 1px solid #eee; }
    .day-stat { font-size: 11px; color: #555; }
    .day-stat span:first-child { color: #888; margin-right: 4px; }
    
    .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cash Flow Statement</h1>
    <p>Agent: <strong>${agent.name}</strong> (${isGAgent ? 'G-Agent' : 'Agent'})</p>
    <p>Period: ${new Date(period.startDate).toLocaleDateString('en-GB')} to ${new Date(period.endDate).toLocaleDateString('en-GB')}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Opening Balance</div>
      <div class="value">${symbol}${formatCurrencyValue(openingBalance)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Inflow</div>
      <div class="value" style="color: #27ae60;">+${symbol}${formatCurrencyValue(totals.totalTopUps)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Outflow</div>
      <div class="value" style="color: #e74c3c;">-${symbol}${formatCurrencyValue(totals.totalPayouts)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Net Balance</div>
      <div class="value" style="color: #008979;">${symbol}${formatCurrencyValue(closingBalance)}</div>
    </div>
  </div>

  ${dailySections}

  <div class="footer">
    Generated via Swap Transfer on ${new Date().toLocaleString('en-GB')}
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        try { window.focus(); window.print(); } catch (e) {}
      }, 500);
    });
  </script>
</body>
</html>`;
};

// Export PDF on Web
const exportPdfWeb = (html, filename) => {
    if (typeof window === 'undefined') {
        Alert.alert('Error', 'Cannot export PDF: window object not available');
        return false;
    }
    try {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank', 'width=900,height=700');
        if (!printWindow) {
            Alert.alert('Popup Blocked', 'Please allow popups for this site and try again.');
            URL.revokeObjectURL(url);
            return false;
        }
        printWindow.document.title = filename;
        setTimeout(() => { URL.revokeObjectURL(url); }, 5000);
        return true;
    } catch (error) {
        Alert.alert('Error', `Failed to open PDF window: ${error.message} `);
        return false;
    }
};

// function CashFlowReportScreen remains...

function CashFlowReportScreen({ navigation, route }) {
    const initialAgent = route?.params?.agent || null;

    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(initialAgent);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingAgents, setIsLoadingAgents] = useState(!initialAgent);
    const [report, setReport] = useState(null);
    const [showAgentPicker, setShowAgentPicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const customer = useSelector(selectCustomerInfo);
    const isAdmin = customer?.groups?.includes('Admin');
    const isAgent = customer?.groups?.includes('Agent');
    const isGAgentUser = customer?.groups?.includes('Gagent');

    // Load agents (Admin) or self balance (Agent/G-Agent) on mount
    useEffect(() => {
        if (!initialAgent && isAdmin) {
            loadAgents();
            return;
        }

        if (!initialAgent && (isAgent || isGAgentUser)) {
            loadMyAgent();
            return;
        }

        // We already have initialAgent via route.
        setIsLoadingAgents(false);
    }, [isAdmin, isAgent, isGAgentUser, initialAgent, customer?.sub]);

    const loadAgents = async () => {
        setIsLoadingAgents(true);
        try {
            const result = await getAllAgentsWithBalances();
            setAgents(result || []);
        } catch (error) {
            console.error('Error loading agents:', error);
        } finally {
            setIsLoadingAgents(false);
        }
    };

    const loadMyAgent = async () => {
        setIsLoadingAgents(true);
        try {
            const myBalance = await getMyAgentBalance(customer?.sub);
            if (myBalance) {
                setSelectedAgent(myBalance);
            }
        } catch (error) {
            console.error('Error loading self agent balance for report:', error);
        } finally {
            setIsLoadingAgents(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!selectedAgent) {
            showAlert('Select Agent', 'Please select an agent to generate the report for.');
            return;
        }

        if (!startDate.trim()) {
            showAlert('Start Date Required', 'Please enter a start date.');
            return;
        }

        const start = parseUkDateInput(startDate);
        if (!start) {
            showAlert('Invalid Date', 'Start date must be in DD-MM-YYYY format.');
            return;
        }

        let end = null;
        if (endDate.trim()) {
            end = parseUkDateInput(endDate);
            if (!end) {
                showAlert('Invalid Date', 'End date must be in DD-MM-YYYY format.');
                return;
            }
            if (end.getTime() < start.getTime()) {
                showAlert('Invalid Range', 'End date cannot be before start date.');
                return;
            }
        }

        setIsLoading(true);
        setReport(null);

        try {
            const apiStartDate = ukToApiDate(startDate);
            const apiEndDate = endDate.trim() ? ukToApiDate(endDate) : null;

            const reportData = await getCashFlowReport(selectedAgent, apiStartDate, apiEndDate);
            setReport(reportData);

            if (reportData.items.length === 0) {
                showAlert('No Activity', 'No transactions found in this period.');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            showAlert('Error', `Failed to generate report: ${error.message || 'Unknown error'} `);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPdf = async () => {
        if (!report) return;

        setIsLoading(true);
        try {
            const pdfFilename = generatePdfFilename(report.agent.name);
            const html = buildCashFlowReportHtml(report);

            if (Platform.OS === 'web') {
                const success = exportPdfWeb(html, pdfFilename);
                if (!success) {
                    throw new Error('Failed to open PDF export window.');
                }
                showAlert('PDF Ready', 'The PDF is opening in a new tab. Use your browser print dialog to save.');
            } else {
                await Print.printAsync({ html });
            }
        } catch (error) {
            showAlert('Error', `Failed to export PDF: ${error.message} `);
        } finally {
            setIsLoading(false);
        }
    };

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title} \n\n${message} `);
        } else {
            Alert.alert(title, message);
        }
    };

    const isGAgent = selectedAgent?.agentType === 'GAGENT';
    const symbol = isGAgent ? 'D' : '£';

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <MaterialCommunityIcons name="chart-line" size={32} color={appColor.secondary} />
                    </View>
                    <Text style={styles.title}>Cash Flow Report</Text>
                    <Text style={styles.subtitle}>
                        {isAdmin ? 'Generate detailed statement for an agent' : 'Generate your detailed statement'}
                    </Text>
                </View>

                {/* Agent Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{isAdmin ? 'Select Agent' : 'Your Account'}</Text>

                    {isLoadingAgents ? (
                        <ActivityIndicator color={appColor.secondary} style={{ marginVertical: 20 }} />
                    ) : (
                        <TouchableOpacity
                            style={styles.agentSelector}
                            onPress={() => isAdmin && setShowAgentPicker(true)}
                            disabled={!isAdmin}
                        >
                            {selectedAgent ? (
                                <View style={styles.selectedAgent}>
                                    <View style={[styles.agentAvatar, { backgroundColor: isGAgent ? '#27ae60' : '#3498db' }]}>
                                        <MaterialCommunityIcons
                                            name={isGAgent ? 'account-cash' : 'account-tie'}
                                            size={20}
                                            color="#fff"
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.agentName}>{selectedAgent.agentName}</Text>
                                        <Text style={styles.agentType}>{isGAgent ? 'G-Agent • GMD' : 'Agent • GBP'}</Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.placeholderText}>
                                    {isAdmin ? 'Tap to select an agent...' : 'Loading your account...'}
                                </Text>
                            )}
                            <MaterialCommunityIcons
                                name={isAdmin ? 'chevron-down' : 'lock'}
                                size={24}
                                color="#999"
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Date Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Date Range</Text>

                    <Text style={styles.inputLabel}>Start Date *</Text>
                    <View style={styles.dateInputRow}>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="calendar-start" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="DD-MM-YYYY"
                                placeholderTextColor="#666"
                                value={startDate}
                                onChangeText={setStartDate}
                            />
                        </View>
                        <TouchableOpacity style={styles.calendarButton} onPress={() => setShowStartPicker(true)}>
                            <MaterialCommunityIcons name="calendar-month" size={24} color={appColor.secondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>End Date (optional)</Text>
                    <View style={styles.dateInputRow}>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="calendar-end" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="DD-MM-YYYY"
                                placeholderTextColor="#666"
                                value={endDate}
                                onChangeText={setEndDate}
                            />
                        </View>
                        <TouchableOpacity style={styles.calendarButton} onPress={() => setShowEndPicker(true)}>
                            <MaterialCommunityIcons name="calendar-month" size={24} color={appColor.secondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.generateButton, isLoading && styles.buttonDisabled]}
                        onPress={handleGenerateReport}
                        disabled={isLoading}
                    >
                        {isLoading && !report ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="file-chart" size={20} color="#fff" />
                                <Text style={styles.buttonText}>Generate Report</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Report Results */}
                {report && (
                    <>
                        {/* Summary Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Opening</Text>
                                <Text style={styles.statValue}>
                                    {symbol}{report.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Inflow</Text>
                                <Text style={[styles.statValue, { color: '#27ae60' }]}>
                                    +{symbol}{report.totals.totalTopUps.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Outflow</Text>
                                <Text style={[styles.statValue, { color: '#e74c3c' }]}>
                                    -{symbol}{report.totals.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Closing</Text>
                                <Text style={[styles.statValue, { color: report.closingBalance >= 0 ? '#27ae60' : '#e74c3c' }]}>
                                    {symbol}{report.closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        </View>

                        {/* Daily Summary List */}
                        <View style={styles.transactionsCard}>
                            <Text style={styles.cardTitle}>Daily Activity Summary</Text>
                            {report.dailySummaries.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="file-document-outline" size={48} color="#666" />
                                    <Text style={styles.emptyText}>No activity in this period</Text>
                                </View>
                            ) : (
                                report.dailySummaries.map((daySummary) => (
                                    <View key={daySummary.date} style={styles.dailyItem}>
                                        <View style={styles.dailyHeader}>
                                            <Text style={styles.dailyDate}>
                                                {new Date(daySummary.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </Text>
                                            <Text style={styles.dailyClosing}>
                                                {symbol}{daySummary.closing.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>

                                        <View style={styles.dailyTransactions}>
                                            {daySummary.transactions.map((t, idx) => (
                                                <View key={idx} style={styles.miniTransaction}>
                                                    <View style={styles.miniLeft}>
                                                        <Text style={styles.miniTime}>{new Date(t.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
                                                        <View style={styles.miniInfo}>
                                                            <Text style={styles.miniType}>{t.type === 'PAYOUT' ? (isGAgent ? 'Payout' : 'Collection') : t.type}</Text>
                                                            <Text style={styles.miniDesc} numberOfLines={1}>
                                                                {t.original?.description || (t.type === 'PAYOUT' ? (isGAgent ? `Trans to ${t.original?.to}` : `Trans from ${t.original?.from}`) : '-')}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text style={[styles.miniAmount, { color: t.amount >= 0 ? '#27ae60' : '#e74c3c' }]}>
                                                        {t.amount > 0 ? '+' : ''}{symbol}{Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>

                                        <View style={styles.dailyItemFooter}>
                                            <Text style={styles.footerLabel}>Closing</Text>
                                            <Text style={styles.footerValue}>{symbol}{daySummary.closing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Export Button */}
                        {report.items.length > 0 && (
                            <TouchableOpacity
                                style={styles.exportButton}
                                onPress={handleExportPdf}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="file-pdf-box" size={22} color="#fff" />
                                        <Text style={styles.exportButtonText}>Export to PDF</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Agent Picker Modal */}
            <Modal
                visible={showAgentPicker && isAdmin}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAgentPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Agent</Text>
                            <TouchableOpacity onPress={() => setShowAgentPicker(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={agents}
                            keyExtractor={(item) => item.id || item.agentId}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.agentOption}
                                    onPress={() => {
                                        setSelectedAgent(item);
                                        setShowAgentPicker(false);
                                        setReport(null);
                                    }}
                                >
                                    <View style={[styles.agentAvatar, { backgroundColor: item.agentType === 'GAGENT' ? '#27ae60' : '#3498db' }]}>
                                        <MaterialCommunityIcons
                                            name={item.agentType === 'GAGENT' ? 'account-cash' : 'account-tie'}
                                            size={20}
                                            color="#fff"
                                        />
                                    </View>
                                    <View style={styles.agentOptionInfo}>
                                        <Text style={styles.agentOptionName}>{item.agentName}</Text>
                                        <Text style={styles.agentOptionType}>
                                            {item.agentType === 'GAGENT' ? 'G-Agent • GMD' : 'Agent • GBP'}
                                        </Text>
                                    </View>
                                    {selectedAgent?.id === item.id && (
                                        <MaterialCommunityIcons name="check-circle" size={24} color={appColor.secondary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No agents found</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Calendar Pickers */}
            <CalendarPicker
                visible={showStartPicker}
                onClose={() => setShowStartPicker(false)}
                onSelectDate={setStartDate}
                selectedDate={startDate}
            />
            <CalendarPicker
                visible={showEndPicker}
                onClose={() => setShowEndPicker(false)}
                onSelectDate={setEndDate}
                selectedDate={endDate}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appColor.primary,
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 10,
    },
    headerIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: appColor.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    card: {
        backgroundColor: appColor.primaryDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: appColor.primaryLight,
        padding: 15,
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 15,
    },
    agentSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: appColor.primaryLight,
        borderRadius: 10,
        padding: 12,
    },
    selectedAgent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    agentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
    placeholderText: {
        color: '#666',
        fontSize: 15,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 6,
        marginTop: 10,
    },
    dateInputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: appColor.primaryLight,
        borderRadius: 10,
    },
    inputIcon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#fff',
    },
    calendarButton: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: appColor.secondary,
        borderRadius: 10,
        padding: 14,
        marginTop: 20,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: appColor.primaryDark,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: appColor.primaryLight,
        padding: 12,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: appColor.secondary,
    },
    transactionsCard: {
        backgroundColor: appColor.primaryDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: appColor.primaryLight,
        padding: 15,
        marginBottom: 15,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    transactionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionType: {
        fontSize: 12,
        fontWeight: '600',
    },
    transactionDate: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
    },
    transactionDesc: {
        fontSize: 13,
        color: '#fff',
        marginTop: 2,
    },
    conversionNote: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
    },
    transactionAmounts: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    runningBalance: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#c0392b',
        borderRadius: 10,
        padding: 14,
        gap: 8,
    },
    exportButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: 30,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        marginTop: 10,
        fontSize: 14,
    },
    dailyItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dailyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    dailyDate: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    dailyClosing: {
        fontSize: 14,
        fontWeight: 'bold',
        color: appColor.secondary,
    },
    dailyBreakdown: {
        gap: 4,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    breakdownLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    breakdownValue: {
        fontSize: 12,
        fontWeight: '500',
        color: '#fff',
    },
    dailyQuickStats: {
        flexDirection: 'row',
        gap: 8,
    },
    quickStatText: {
        fontSize: 11,
        fontWeight: '600',
    },
    dailyTransactions: {
        marginTop: 5,
        marginBottom: 10,
    },
    miniTransaction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    miniLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    miniTime: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        width: 45,
    },
    miniInfo: {
        flex: 1,
        marginLeft: 5,
    },
    miniType: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    miniDesc: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
    },
    miniAmount: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    dailyItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    footerLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    footerValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: appColor.secondary,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: appColor.primaryDark,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: appColor.primaryLight,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    agentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: appColor.primaryLight,
    },
    agentOptionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    agentOptionName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    agentOptionType: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    // Calendar styles
    calendarOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarContainer: {
        backgroundColor: appColor.primaryDark,
        borderRadius: 15,
        padding: 15,
        width: 320,
        borderWidth: 1,
        borderColor: appColor.primaryLight,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    calendarNavButton: {
        padding: 5,
    },
    calendarTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    calendarWeekRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    calendarWeekDay: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    calendarDaySelected: {
        backgroundColor: appColor.secondary,
    },
    calendarDayToday: {
        borderWidth: 1,
        borderColor: appColor.secondary,
    },
    calendarDayText: {
        fontSize: 14,
        color: '#fff',
    },
    calendarDayEmpty: {
        color: 'transparent',
    },
    calendarDayTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    calendarDayTextToday: {
        color: appColor.secondary,
    },
    calendarActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: appColor.primaryLight,
    },
    calendarTodayButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: appColor.secondary,
        borderRadius: 8,
    },
    calendarTodayText: {
        color: '#fff',
        fontWeight: '600',
    },
    calendarClearButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    calendarClearText: {
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
});

export default CashFlowReportScreen;

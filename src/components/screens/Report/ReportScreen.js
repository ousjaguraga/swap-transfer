import React, { useEffect, useState } from 'react';
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
  getTransfers,
  getAllAgents,
  makeUkDateFromUsDate,
  updateATransfer,
  createAReport,
  serializedTransfer
} from '../../../../farm';
import appColor from '../../../styles/brand';
import { makeTransferRef } from '../../../utils/display';
import * as Print from 'expo-print';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

// Generate PDF filename: swap_report_gagentname_dd-mm-yy
const generatePdfFilename = (gagentName) => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2); // Last 2 digits
  const safeName = (gagentName || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `swap_report_${safeName}_${day}-${month}-${year}`;
};

// Format date object to UK format
const formatToUkDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
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

// Sort by paid_on ascending (order in which transfers were paid); unpaid go to the end
const sortTransfersByPaidOnAsc = (items = []) => {
  return [...items].sort((a, b) => {
    const aTime = a?.paid_on ? new Date(a.paid_on).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b?.paid_on ? new Date(b.paid_on).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
};

const sortTransfersForReport = (items = [], sortMode = 'paid_on_asc') => {
  if (sortMode === 'created_desc') {
    return sortTransfersByCreatedAtDesc(items);
  }
  return sortTransfersByPaidOnAsc(items);
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
  // Adjust for Monday start (UK style)
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
          {/* Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={prevMonth} style={styles.calendarNavButton}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.calendarNavButton}>
              <MaterialCommunityIcons name="chevron-right" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Day Names (UK: Mon-Sun) */}
          <View style={styles.calendarWeekRow}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <Text key={d} style={styles.calendarWeekDay}>{d}</Text>
            ))}
          </View>
          
          {/* Days Grid */}
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
          
          {/* Quick Actions */}
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

const buildReportHtml = (transfers, totalAmount, totalGMD, startDate, endDate, filename, reportOwner, reportType = 'PREVIEW', sortMode = 'paid_on_asc') => {
  const isSettled = reportType === 'SETTLED';
  const statusColor = isSettled ? '#27ae60' : '#f39c12';
  const statusLabel = isSettled ? 'SETTLED' : 'PREVIEW';
  const orderedTransfers = sortTransfersForReport(transfers, sortMode);
  
  // Count cancelled transfers for display
  const cancelledCount = orderedTransfers.filter(t => t.status === 'CANCELLED').length;
  
  let rank = 0;
  const rows = orderedTransfers
    .map((transfer) => {
      const isCancelled = transfer.status === 'CANCELLED';
      if (!isCancelled) rank++;
      const payoutAmount = getTransferDalasiAmount(transfer);
      const rowStyle = isCancelled ? 'background-color: rgba(244, 67, 54, 0.1); color: #999;' : '';
      const cancelledBadge = isCancelled ? '<span style="background-color: #f44336; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px;">CANCELLED</span>' : '';
      const transferRef = makeTransferRef({
        from: transfer.from,
        to: transfer.to,
        id: transfer.id,
      });
      const paidOnDisplay = transfer.paid_on && transfer.paid_on !== '1970-01-01Z'
        ? makeUkDateFromUsDate(transfer.paid_on)
        : (isCancelled ? '-' : 'Unpaid');
      return `
      <tr style="${rowStyle}">
        <td style="text-align:center; font-weight:bold; color:${isCancelled ? '#ccc' : '#555'};">${isCancelled ? '-' : rank}</td>
        <td>${paidOnDisplay}${cancelledBadge}</td>
        <td>${transfer.from || 'N/A'}</td>
        <td>${transfer.to || 'N/A'}</td>
        <td style="text-align: right;${isCancelled ? ' text-decoration: line-through;' : ''}">£${transfer.amount ?? ''}</td>
        <td style="text-align: right;${isCancelled ? ' text-decoration: line-through;' : ''}">${payoutAmount !== null ? `D${payoutAmount.toFixed(2)}` : 'N/A'}</td>
        <td style="text-align: right;">${transfer.rateApplied ? transfer.rateApplied.toFixed(4) : 'N/A'}</td>
        <td style="font-family: monospace; font-size: 0.9em;">${transferRef}</td>
      </tr>
    `;})
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename || 'Swap Transfer Report'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
    h1 { text-align: center; color: #333; }
    .status-badge { 
      display: inline-block; 
      padding: 6px 16px; 
      border-radius: 20px; 
      font-weight: bold; 
      font-size: 14px;
      color: white;
      background-color: ${statusColor};
      margin-bottom: 10px;
    }
    .meta { text-align: center; color: #666; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #008979; color: white; font-weight: 600; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    tr:hover { background-color: #f5f5f5; }
    .total-row { font-weight: bold; background-color: #e0f2f1 !important; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <h1>Swap Transfer Report</h1>
  <div class="meta">
    <span class="status-badge">${statusLabel}</span>
    <p><strong>Owner:</strong> ${reportOwner || 'Unknown'}</p>
    <p><strong>Period:</strong> ${startDate}${endDate ? ` to ${endDate}` : ''}</p>
    ${cancelledCount > 0 ? `<p style="color: #f44336;"><strong>Note:</strong> ${cancelledCount} cancelled transfer${cancelledCount > 1 ? 's' : ''} excluded from totals</p>` : ''}
    <p><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</p>
    <p><strong>Total Transfers:</strong> ${orderedTransfers.length}</p>
    <p><strong>Total GBP:</strong> £${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    <p><strong>Total GMD:</strong> D${totalGMD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 36px; text-align: center;">#</th>
        <th>Date Paid</th>
        <th>From</th>
        <th>To</th>
        <th style="text-align: right;">Amount (£)</th>
        <th style="text-align: right;">Payout (GMD)</th>
        <th style="text-align: right;">Rate</th>
        <th>Transfer Ref</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td></td>
        <td colspan="3" style="text-align: right;">TOTAL:</td>
        <td style="text-align: right;">£${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="text-align: right;">D${totalGMD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
};

const exportPdfWeb = ({ transfers = [], totalAmount = 0, totalGMD = 0, startDate = '', endDate = '', filename = 'swap_report', reportOwner = 'Unknown', reportType = 'PREVIEW', sortMode = 'paid_on_asc' }) => {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    const title = 'Swap Transfer Report';
    const statusLabel = reportType === 'SETTLED' ? 'SETTLED' : 'PREVIEW';
    const generatedAt = new Date().toLocaleString('en-GB');
    const periodText = `${startDate || 'N/A'}${endDate ? ` to ${endDate}` : ''}`;

    doc.setFontSize(18);
    doc.text(title, 40, 40);

    doc.setFontSize(11);
    doc.text(`Status: ${statusLabel}`, 40, 62);
    doc.text(`Owner: ${reportOwner || 'Unknown'}`, 40, 78);
    doc.text(`Period: ${periodText}`, 40, 94);
    doc.text(`Generated: ${generatedAt}`, 40, 110);
    doc.text(`Transfers: ${transfers.length}`, 40, 126);
    doc.text(`Total GBP: £${Number(totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 260, 126);
    doc.text(`Total GMD: D${Number(totalGMD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 460, 126);

    let pdfRank = 0;
    const bodyRows = sortTransfersForReport(transfers, sortMode).map((transfer) => {
      const isCancelled = transfer.status === 'CANCELLED';
      if (!isCancelled) pdfRank++;
      const payoutAmount = getTransferDalasiAmount(transfer);
      const transferRef = makeTransferRef({
        from: transfer.from,
        to: transfer.to,
        id: transfer.id,
      });
      const paidOnDisplay = transfer.paid_on && transfer.paid_on !== '1970-01-01Z'
        ? makeUkDateFromUsDate(transfer.paid_on)
        : (isCancelled ? '-' : 'Unpaid');

      return [
        isCancelled ? '-' : String(pdfRank),
        paidOnDisplay,
        transfer.from || 'N/A',
        transfer.to || 'N/A',
        `£${Number(transfer.amount || 0).toFixed(2)}`,
        payoutAmount !== null ? `D${Number(payoutAmount).toFixed(2)}` : 'N/A',
        transfer.rateApplied ? Number(transfer.rateApplied).toFixed(4) : 'N/A',
        transfer.status || 'N/A',
        transferRef,
      ];
    });

    bodyRows.push([
      '',
      'TOTAL',
      '',
      '',
      `£${Number(totalAmount || 0).toFixed(2)}`,
      `D${Number(totalGMD || 0).toFixed(2)}`,
      '',
      '',
      '',
    ]);

    autoTable(doc, {
      startY: 146,
      head: [[
        '#',
        'Date Paid',
        'From',
        'To',
        'Amount (GBP)',
        'Payout (GMD)',
        'Rate',
        'Status',
        'Transfer Ref',
      ]],
      body: bodyRows,
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [0, 137, 121],
        textColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      didParseCell: (data) => {
        if (data.row.index === bodyRows.length - 1) {
          data.cell.styles.fillColor = [224, 242, 241];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 62 },
        2: { cellWidth: 90 },
        3: { cellWidth: 90 },
        4: { halign: 'right', cellWidth: 68 },
        5: { halign: 'right', cellWidth: 72 },
        6: { halign: 'right', cellWidth: 46 },
        7: { cellWidth: 50 },
        8: { cellWidth: 90 },
      },
    });

    doc.save(`${filename || 'swap_report'}.pdf`);
    return true;
  } catch (error) {
    Alert.alert('Error', `Failed to generate PDF: ${error.message}`);
    return false;
  }
};

const buildCsvValue = (value) => {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildPreviewCsv = (items, reportOwner, totalAmount, totalGMD, sortMode = 'paid_on_asc') => {
  const headers = [
    '#',
    'Owner',
    'Date_Paid',
    'From',
    'To',
    'Amount_GBP',
    'Payout_GMD',
    'Rate',
    'Status',
    'Transfer_Ref',
  ];

  let csvRank = 0;
  const rows = sortTransfersForReport(items || [], sortMode).map((transfer) => {
    const isCancelled = transfer.status === 'CANCELLED';
    if (!isCancelled) csvRank++;
    const payoutAmount = getTransferDalasiAmount(transfer);
    const transferRef = makeTransferRef({
      from: transfer.from,
      to: transfer.to,
      id: transfer.id,
    });
    const paidOnDisplay = transfer.paid_on && transfer.paid_on !== '1970-01-01Z'
      ? makeUkDateFromUsDate(transfer.paid_on)
      : (isCancelled ? '-' : 'Unpaid');

    return [
      isCancelled ? '-' : String(csvRank),
      reportOwner || 'Unknown',
      paidOnDisplay,
      transfer.from || 'N/A',
      transfer.to || 'N/A',
      Number(transfer.amount || 0).toFixed(2),
      Number(payoutAmount || 0).toFixed(2),
      Number(transfer.rateApplied || 0).toFixed(4),
      transfer.status || 'N/A',
      transferRef,
    ];
  });

  const totalsRow = [
    '',
    'TOTAL',
    '',
    '',
    '',
    Number(totalAmount || 0).toFixed(2),
    Number(totalGMD || 0).toFixed(2),
    '',
    '',
    '',
  ];

  return [headers, ...rows, totalsRow]
    .map((row) => row.map((value) => buildCsvValue(value)).join(','))
    .join('\n');
};

// Transfer Preview Card Component
const TransferPreviewCard = ({ transfer, rank }) => {
  const initials = `${transfer.from?.charAt(0) || ''}${transfer.to?.charAt(0) || ''}`.toUpperCase();
  const payoutAmount = getTransferDalasiAmount(transfer);
  const isCancelled = transfer.status === 'CANCELLED';
  const paidOnDisplay = transfer.paid_on && transfer.paid_on !== '1970-01-01Z'
    ? makeUkDateFromUsDate(transfer.paid_on)
    : (isCancelled ? 'Cancelled' : 'Unpaid');
  
  return (
    <View style={styles.transferCard}>
      <View style={styles.transferRankBadge}>
        <Text style={styles.transferRankText}>{isCancelled ? '–' : rank}</Text>
      </View>
      <View style={styles.transferAvatar}>
        <Text style={styles.transferAvatarText}>{initials}</Text>
      </View>
      <View style={styles.transferInfo}>
        <Text style={styles.transferNames}>{transfer.from || 'N/A'} → {transfer.to || 'N/A'}</Text>
        <View style={styles.transferMeta}>
          <MaterialCommunityIcons name="calendar-check" size={12} color="#999" />
          <Text style={styles.transferMetaText}>{paidOnDisplay}</Text>
        </View>
      </View>
      <View style={styles.transferAmounts}>
        <Text style={styles.transferGBP}>£{Number(transfer.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.transferGMD}>D{Number(payoutAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>
    </View>
  );
};

function ReportScreen({ navigation }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [filterType, setFilterType] = useState('unsettled'); // 'unsettled' or 'all'
  const [agents, setAgents] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [focusedDateInput, setFocusedDateInput] = useState(null);

  const customer = useSelector(selectCustomerInfo);
  const isAdmin = customer?.groups?.includes('Admin');
  const isAgent = customer?.groups?.includes('Agent');
  const isGAgent = customer?.groups?.includes('Gagent');
  const isManualGAgentReport = selectedTarget?.agentType === 'GAGENT';
  // Both G-Agent scope and Admin ALL scope show only PAID transfers by paid_on date
  const isPaidTransfersReport = isManualGAgentReport || selectedTarget?.agentType === 'ALL';
  const reportOwnerLabel = selectedTarget?.agentName || customer?.name || customer?.email || 'Unknown';

  useEffect(() => {
    if (isAdmin) {
      setSelectedTarget({
        id: '__ALL__',
        agentName: 'All Agents and G-Agents',
        agentType: 'ALL',
      });
      return;
    }

    if (isAgent || isGAgent) {
      setSelectedTarget({
        id: customer?.sub || customer?.email || '__SELF__',
        agentId: customer?.sub,
        email: customer?.email,
        agentName: customer?.name || customer?.email || 'My Transfers',
        agentType: isGAgent ? 'GAGENT' : 'AGENT',
      });
    }
  }, [customer, isAdmin, isAgent, isGAgent]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const loadTargets = async () => {
      setIsLoadingTargets(true);
      try {
        const fetchedAgents = await getAllAgents();
        const actorAgents = (fetchedAgents || [])
          .filter((agent) => agent?.isActive !== false)
          .filter((agent) => agent?.agentType === 'AGENT' || agent?.agentType === 'GAGENT')
          .map((agent) => ({
            id: agent.id,
            cognitoSub: agent.cognitoSub,
            email: agent.email,
            agentName: agent.name,
            agentType: agent.agentType,
          }));

        // Deduplicate by cognitoSub/email/name+type.
        const seen = new Set();
        const uniqueActors = actorAgents.filter((agent) => {
          const key = [
            agent.cognitoSub || '',
            agent.email || '',
            agent.agentName || '',
            agent.agentType || '',
          ].join('|').toLowerCase();

          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });

        setAgents(uniqueActors);
      } catch (error) {
        setAgents([]);
      } finally {
        setIsLoadingTargets(false);
      }
    };

    loadTargets();
  }, [isAdmin]);

  const getScopeFilter = () => {
    if (!selectedTarget || selectedTarget.agentType === 'ALL') {
      return null;
    }

    if (selectedTarget.agentType === 'AGENT') {
      const orConditions = [];

      if (selectedTarget.cognitoSub || selectedTarget.agentId) {
        orConditions.push({ createdById: { eq: selectedTarget.cognitoSub || selectedTarget.agentId } });
      }
      if (selectedTarget.email) {
        orConditions.push({ createdBy: { eq: selectedTarget.email } });
      }
      if (selectedTarget.agentName) {
        orConditions.push({ createdBy: { eq: selectedTarget.agentName } });
      }

      return orConditions.length ? { or: orConditions } : null;
    }

    if (selectedTarget.agentType === 'GAGENT') {
      const orConditions = [];

      if (selectedTarget.email) {
        orConditions.push({ paidOutById: { eq: selectedTarget.email } });
      }
      if (selectedTarget.agentName) {
        orConditions.push({ paidOutBy: { eq: selectedTarget.agentName } });
      }

      return orConditions.length ? { or: orConditions } : null;
    }

    return null;
  };

  const handleFetchTransfers = async () => {
    if ((isAdmin || isAgent || isGAgent) && !selectedTarget) {
      if (Platform.OS === 'web') {
        window.alert('Please select who to generate the report for.');
      } else {
        Alert.alert('Selection required', 'Please select who to generate the report for.');
      }
      return;
    }

    if (!startDate.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a start date in DD-MM-YYYY format.');
      } else {
        Alert.alert('Start date required', 'Please enter a start date in DD-MM-YYYY format.');
      }
      return;
    }

    const start = parseUkDateInput(startDate);
    if (!start) {
      if (Platform.OS === 'web') {
        window.alert('Start date must be in DD-MM-YYYY format.');
      } else {
        Alert.alert('Invalid date', 'Start date must be in DD-MM-YYYY format.');
      }
      return;
    }

    let end = null;
    if (endDate.trim()) {
      end = parseUkDateInput(endDate);
      if (!end) {
        if (Platform.OS === 'web') {
          window.alert('End date must be in DD-MM-YYYY format or left blank.');
        } else {
          Alert.alert('Invalid date', 'End date must be in DD-MM-YYYY format or left blank.');
        }
        return;
      }
      if (end.getTime() < start.getTime()) {
        if (Platform.OS === 'web') {
          window.alert('End date cannot be before start date.');
        } else {
          Alert.alert('Invalid range', 'End date cannot be before start date.');
        }
        return;
      }
    }

    setIsLoading(true);
    setShowResults(false);
    try {
      // Convert UK dates to API format
      const apiStartDate = ukToApiDate(startDate);
      const apiEndDate = endDate.trim() ? ukToApiDate(endDate) : undefined;
      const scopeFilter = getScopeFilter();
      const requestOptions = {
        ...(scopeFilter ? { filter: scopeFilter } : {}),
      };

      // Paid-transfers reports (G-Agent + ALL) are periodized by paid_on.
      // Include both PAID and SETTLED so previously-settled transfers still appear.
      // Skip createdAt date filtering — the period is determined client-side by paid_on.
      if (isPaidTransfersReport) {
        // No server-side status filter — include everything; paid_on date range is the only criterion.
      } else {
        requestOptions.startDate = apiStartDate;
        requestOptions.endDate = apiEndDate;
      }
      
      const response = await getTransfers(requestOptions);
      const items = response?.data?.listTransfers?.items || [];
      let sanitized = items.map((item) => serializedTransfer(item));

      // Admin "All" should mean all Agent/G-Agent activity, not unrelated/admin actors.
      if (isAdmin && selectedTarget?.agentType === 'ALL' && agents.length > 0) {
        const allowedSubs = new Set(agents.map((a) => a.cognitoSub).filter(Boolean));
        const allowedEmails = new Set(agents.map((a) => a.email).filter(Boolean));
        const allowedNames = new Set(agents.map((a) => a.agentName).filter(Boolean));

        sanitized = sanitized.filter((t) => {
          const createdByIdMatch = t.createdById && allowedSubs.has(t.createdById);
          const createdByMatch = t.createdBy && (allowedEmails.has(t.createdBy) || allowedNames.has(t.createdBy));
          const paidOutByIdMatch = t.paidOutById && allowedEmails.has(t.paidOutById);
          const paidOutByMatch = t.paidOutBy && allowedNames.has(t.paidOutBy);

          return createdByIdMatch || createdByMatch || paidOutByIdMatch || paidOutByMatch;
        });
      }
      
      // Helper: filter a list to only transfers whose paid_on falls within [start, end].
      // No status check — any transfer with a paid_on date in the period is included.
      const filterByPaidOnRange = (list) => list.filter((t) => {
        const paidDate = t.paid_on ? new Date(`${t.paid_on}T12:00:00.000Z`) : null;
        if (!paidDate || Number.isNaN(paidDate.getTime())) return false;
        const inStartRange = paidDate.getTime() >= start.getTime();
        const inEndRange = !end || paidDate.getTime() <= end.getTime();
        return inStartRange && inEndRange;
      });

      // For G-Agent scope: restrict to transfers paid out BY this specific G-agent in the period.
      if (selectedTarget?.agentType === 'GAGENT') {
        sanitized = filterByPaidOnRange(sanitized).filter((t) => {
          const matchesById = selectedTarget?.email && t.paidOutById === selectedTarget.email;
          const matchesByName = selectedTarget?.agentName && t.paidOutBy === selectedTarget.agentName;
          return Boolean(matchesById || matchesByName);
        });
      }

      // For ALL scope: restrict to any PAID transfer whose paid_on falls in the period.
      if (selectedTarget?.agentType === 'ALL') {
        sanitized = filterByPaidOnRange(sanitized);
      }

      // Filter based on selected filter type (only applies to non-paid-transfers reports)
      const filtered = isPaidTransfersReport
        ? sanitized
        : filterType === 'unsettled'
        ? sanitized.filter((t) => !t.settled)
        : sanitized;

      const reportSortMode = isPaidTransfersReport ? 'created_desc' : 'paid_on_asc';
      setTransfers(sortTransfersForReport(filtered, reportSortMode));
      setShowResults(true);

      if (filtered.length === 0) {
        const msg = isPaidTransfersReport
          ? 'No paid transfers found for this period.'
          : filterType === 'unsettled'
          ? 'No unsettled transfers found in this period.'
          : 'No transfers found in this period.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('No results', msg);
        }
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to fetch transfers.';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettleAndExport = async () => {
    if (!isAdmin) {
      if (Platform.OS === 'web') {
        window.alert('Only Admin can settle transfers.');
      } else {
        Alert.alert('Not allowed', 'Only Admin can settle transfers.');
      }
      return;
    }

    if (!transfers.length) {
      return;
    }

    // Only settle non-cancelled transfers
    const transfersToSettle = transfers.filter(t => t.status !== 'CANCELLED');
    const cancelledCount = transfers.filter(t => t.status === 'CANCELLED').length;

    setIsLoading(true);
    try {
      // 1. Create the report container
      const reportID = await createAReport(customer?.email || 'Unknown');
      if (!reportID) {
        throw new Error('Failed to create a report ID. Please try again.');
      }

      // 2. Settle only non-cancelled transfers and link them to the report
      const results = await Promise.allSettled(
        transfersToSettle.map(async (transfer) => {
          const fresh = await getTransfers(transfer.id);
          if (!fresh?.data?.getTransfer) {
            throw new Error(`Transfer ${transfer.id} not found`);
          }
          await updateATransfer(fresh.data.getTransfer, 'SETTLED', reportID);
        })
      );

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        const warningMsg = `${failed.length} transfers failed to settle. The report may be incomplete.`;
        if (Platform.OS === 'web') {
          window.alert(warningMsg);
        } else {
          Alert.alert('Warning', warningMsg);
        }
      }

      // 3. Generate PDF - totals exclude cancelled transfers
      const totalAmount = transfersToSettle.reduce(
        (sum, transfer) => sum + (Number(transfer.amount) || 0),
        0
      );
      const totalGMD = transfersToSettle.reduce((sum, transfer) => {
        const payoutAmount = getTransferDalasiAmount(transfer);
        return sum + (payoutAmount || 0);
      }, 0);
      
      // Generate filename: swap_report_gagentname_dd-mm-yy
      const pdfFilename = generatePdfFilename(customer?.name || customer?.email);

      if (Platform.OS === 'web') {
        const success = exportPdfWeb({
          transfers,
          totalAmount,
          totalGMD,
          startDate,
          endDate,
          filename: pdfFilename,
          reportOwner: reportOwnerLabel,
          reportType: 'SETTLED',
          sortMode: isPaidTransfersReport ? 'created_desc' : 'paid_on_asc',
        });
        if (!success) {
          throw new Error('Failed to generate PDF file.');
        }
      } else {
        const html = buildReportHtml(
          transfers,
          totalAmount,
          totalGMD,
          startDate,
          endDate,
          pdfFilename,
          reportOwnerLabel,
          'SETTLED',
          isPaidTransfersReport ? 'created_desc' : 'paid_on_asc'
        );
        await Print.printAsync({ html });
      }

      const successSuffix = Platform.OS === 'web'
        ? `The PDF "${pdfFilename}.pdf" was downloaded.`
        : 'Use the system print dialog to share or save the PDF.';

      const settledCount = transfersToSettle.length - failed.length;
      const cancelledNote = cancelledCount > 0 ? ` (${cancelledCount} cancelled excluded)` : '';
      const successMsg = `${settledCount} transfers settled${cancelledNote}. ${successSuffix}`;
      if (Platform.OS === 'web') {
        window.alert(successMsg);
      } else {
        Alert.alert('Success', successMsg);
      }

      // Reset state
      setTransfers([]);
      setShowResults(false);
      setStartDate('');
      setEndDate('');
    } catch (error) {
      const errorMsg = error.message || 'Failed to settle transfers.';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Export preview PDF without settling
  const handleExportPreview = async () => {
    if (!transfers.length) {
      return;
    }

    setIsLoading(true);
    try {
      // Exclude cancelled transfers from totals
      const activeTransfers = transfers.filter(t => t.status !== 'CANCELLED');
      const totalAmount = activeTransfers.reduce(
        (sum, transfer) => sum + (Number(transfer.amount) || 0),
        0
      );
      const totalGMD = activeTransfers.reduce((sum, transfer) => {
        const payoutAmount = getTransferDalasiAmount(transfer);
        return sum + (payoutAmount || 0);
      }, 0);
      
      // Generate filename with preview suffix
      const pdfFilename = generatePdfFilename(customer?.name || customer?.email) + '_preview';

      if (Platform.OS === 'web') {
        const success = exportPdfWeb({
          transfers,
          totalAmount,
          totalGMD,
          startDate,
          endDate,
          filename: pdfFilename,
          reportOwner: reportOwnerLabel,
          reportType: 'PREVIEW',
          sortMode: isPaidTransfersReport ? 'created_desc' : 'paid_on_asc',
        });
        if (!success) {
          throw new Error('Failed to generate PDF file.');
        }
      } else {
        const html = buildReportHtml(
          transfers,
          totalAmount,
          totalGMD,
          startDate,
          endDate,
          pdfFilename,
          reportOwnerLabel,
          'PREVIEW',
          isPaidTransfersReport ? 'created_desc' : 'paid_on_asc'
        );
        await Print.printAsync({ html });
      }

      const successSuffix = Platform.OS === 'web'
        ? `The preview PDF "${pdfFilename}.pdf" was downloaded.`
        : 'Use the system print dialog to share or save the PDF.';

      const successMsg = `Preview generated for ${transfers.length} transfers. ${successSuffix}`;
      if (Platform.OS === 'web') {
        window.alert(successMsg);
      } else {
        Alert.alert('Preview Ready', successMsg);
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to generate preview.';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPreviewExcel = async () => {
    if (!transfers.length) {
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert('Not available', 'Excel export is currently available on web.');
      return;
    }

    setIsLoading(true);
    try {
      const activeTransfers = transfers.filter((t) => t.status !== 'CANCELLED');
      const totalAmountForCsv = activeTransfers.reduce(
        (sum, transfer) => sum + (Number(transfer.amount) || 0),
        0
      );
      const totalGmdForCsv = activeTransfers.reduce((sum, transfer) => {
        const payoutAmount = getTransferDalasiAmount(transfer);
        return sum + (payoutAmount || 0);
      }, 0);

      const csvContent = buildPreviewCsv(
        transfers,
        reportOwnerLabel,
        totalAmountForCsv,
        totalGmdForCsv,
        isPaidTransfersReport ? 'created_desc' : 'paid_on_asc'
      );
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      const safeDate = new Date().toISOString().slice(0, 10);

      link.setAttribute('href', url);
      link.setAttribute('download', `swap_preview_${safeDate}.csv`);
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMsg = error.message || 'Failed to export preview Excel.';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Exclude cancelled transfers from totals (but still show them in the list)
  const activeTransfers = transfers.filter(t => t.status !== 'CANCELLED');
  const cancelledTransfers = transfers.filter(t => t.status === 'CANCELLED');
  
  const totalAmount = activeTransfers.reduce(
    (sum, transfer) => sum + (Number(transfer.amount) || 0),
    0
  );
  
  const totalGMD = activeTransfers.reduce((sum, transfer) => {
    const payoutAmount = getTransferDalasiAmount(transfer);
    return sum + (payoutAmount || 0);
  }, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="file-document-outline" size={32} color={appColor.secondary} />
          </View>
          <Text style={styles.title}>Generate Report</Text>
          <Text style={styles.subtitle}>Settle transfers and export PDF</Text>
        </View>

        {/* View Reports Link */}
        <TouchableOpacity
          style={styles.viewReportsLink}
          onPress={() => navigation.navigate('Report')}
        >
          <MaterialCommunityIcons name="folder-open-outline" size={20} color={appColor.secondary} />
          <Text style={styles.viewReportsText}>View Previous Reports</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>

        {/* Date Selection Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Report Scope</Text>

          {isLoadingTargets ? (
            <ActivityIndicator color={appColor.secondary} style={{ marginVertical: 12 }} />
          ) : (
            <TouchableOpacity
              style={styles.targetSelector}
              onPress={() => isAdmin && setShowTargetPicker(true)}
              disabled={!isAdmin}
            >
              <View>
                <Text style={styles.targetLabel}>Generate for</Text>
                <Text style={styles.targetValue}>{selectedTarget?.agentName || 'Select target'}</Text>
                <Text style={styles.targetType}>
                  {selectedTarget?.agentType === 'ALL'
                    ? 'Admin scope'
                    : selectedTarget?.agentType === 'GAGENT'
                      ? 'G-Agent transfers'
                      : 'Agent transfers'}
                </Text>
              </View>
              {isAdmin ? (
                <MaterialCommunityIcons name="chevron-down" size={24} color="#999" />
              ) : (
                <MaterialCommunityIcons name="lock" size={20} color="#666" />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Date Range</Text>
          
          {/* Start Date */}
          <Text style={styles.inputLabel}>Start Date *</Text>
          <View style={styles.dateInputRow}>
            <View style={[
              styles.inputWrapper,
              focusedDateInput === 'start' && styles.inputWrapperFocused,
            ]}>
              <MaterialCommunityIcons name="calendar-start" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && styles.inputWebNoOutline]}
                placeholder="DD-MM-YYYY"
                placeholderTextColor="#666"
                value={startDate}
                onChangeText={setStartDate}
                onFocus={() => setFocusedDateInput('start')}
                onBlur={() => setFocusedDateInput(null)}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity 
              style={styles.calendarButton}
              onPress={() => setShowStartPicker(true)}
            >
              <MaterialCommunityIcons name="calendar-month" size={24} color={appColor.secondary} />
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <Text style={styles.inputLabel}>End Date (optional)</Text>
          <View style={styles.dateInputRow}>
            <View style={[
              styles.inputWrapper,
              focusedDateInput === 'end' && styles.inputWrapperFocused,
            ]}>
              <MaterialCommunityIcons name="calendar-end" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && styles.inputWebNoOutline]}
                placeholder="DD-MM-YYYY"
                placeholderTextColor="#666"
                value={endDate}
                onChangeText={setEndDate}
                onFocus={() => setFocusedDateInput('end')}
                onBlur={() => setFocusedDateInput(null)}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity 
              style={styles.calendarButton}
              onPress={() => setShowEndPicker(true)}
            >
              <MaterialCommunityIcons name="calendar-month" size={24} color={appColor.secondary} />
            </TouchableOpacity>
          </View>

          {/* Filter Toggle: only shown for Agent scope (non-paid-transfers reports) */}
          {!isPaidTransfersReport && (
            <>
              <Text style={styles.inputLabel}>Transfer Filter</Text>
              <View style={styles.filterToggle}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterType === 'unsettled' && styles.filterOptionActive
                  ]}
                  onPress={() => setFilterType('unsettled')}
                >
                  <MaterialCommunityIcons 
                    name="clock-outline" 
                    size={16} 
                    color={filterType === 'unsettled' ? '#fff' : '#999'} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    filterType === 'unsettled' && styles.filterOptionTextActive
                  ]}>Unsettled Only</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterType === 'all' && styles.filterOptionActive
                  ]}
                  onPress={() => setFilterType('all')}
                >
                  <MaterialCommunityIcons 
                    name="format-list-bulleted" 
                    size={16} 
                    color={filterType === 'all' ? '#fff' : '#999'} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    filterType === 'all' && styles.filterOptionTextActive
                  ]}>All Transfers</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.fetchButton, isLoading && styles.buttonDisabled]}
            onPress={handleFetchTransfers}
            disabled={isLoading}
          >
            {isLoading && !showResults ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
                <Text style={styles.buttonText}>Fetch Transfers</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {showResults && (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{transfers.length}</Text>
                <Text style={styles.statLabel}>Transfers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>£{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.statLabel}>Total GBP</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>D{totalGMD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.statLabel}>Total GMD</Text>
              </View>
            </View>

            {transfers.length > 0 && (
              <>
                {/* Transfer List Preview */}
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>
                    {isManualGAgentReport
                      ? 'Transfers Paid By Selected G-Agent'
                      : selectedTarget?.agentType === 'ALL'
                        ? 'Paid Transfers (All G-Agents)'
                        : (filterType === 'unsettled' ? 'Unsettled Transfers' : 'All Transfers')}
                  </Text>
                  {(() => {
                    let previewRank = 0;
                    return transfers.slice(0, 5).map((t) => {
                      if (t.status !== 'CANCELLED') previewRank++;
                      return <TransferPreviewCard key={t.id} transfer={t} rank={previewRank} />;
                    });
                  })()}
                  {transfers.length > 5 && (
                    <View style={styles.moreRow}>
                      <MaterialCommunityIcons name="dots-horizontal" size={20} color="#999" />
                      <Text style={styles.moreText}>
                        and {transfers.length - 5} more transfer{transfers.length - 5 !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  {/* Preview Button */}
                  <TouchableOpacity
                    style={[styles.previewButton, isLoading && styles.buttonDisabled]}
                    onPress={handleExportPreview}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="eye-outline" size={20} color="#fff" />
                        <Text style={styles.previewButtonText}>Export PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.excelButton, isLoading && styles.buttonDisabled]}
                    onPress={handleExportPreviewExcel}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="microsoft-excel" size={20} color="#fff" />
                        <Text style={styles.previewButtonText}>Export Excel</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Settle Button - agent-scope only, never for G-agent/ALL reports */}
                {isAdmin && !isPaidTransfersReport && filterType === 'unsettled' && (
                  <View style={styles.settleButtonRow}>
                    <TouchableOpacity
                      style={[styles.settleButton, isLoading && styles.buttonDisabled]}
                      onPress={handleSettleAndExport}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check-decagram" size={20} color="#fff" />
                          <Text style={styles.settleButtonText}>Settle & Export</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {transfers.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="inbox-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>
                  {filterType === 'unsettled' ? 'No unsettled transfers found' : 'No transfers found'}
                </Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your date range</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

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

      <Modal
        visible={showTargetPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTargetPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Report Scope</Text>
              <TouchableOpacity onPress={() => setShowTargetPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[
                {
                  id: '__ALL__',
                  agentName: 'All Agents and G-Agents',
                  agentType: 'ALL',
                },
                ...agents,
              ]}
              keyExtractor={(item) => item.id || item.agentId || item.agentName}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.targetOption}
                  onPress={() => {
                    setSelectedTarget(item);
                    setShowTargetPicker(false);
                    setTransfers([]);
                    setShowResults(false);
                  }}
                >
                  <View>
                    <Text style={styles.targetOptionName}>{item.agentName}</Text>
                    <Text style={styles.targetOptionType}>
                      {item.agentType === 'ALL'
                        ? 'All transfer records'
                        : item.agentType === 'GAGENT'
                          ? 'G-Agent scope'
                          : 'Agent scope'}
                    </Text>
                  </View>
                  {selectedTarget?.id === item.id && (
                    <MaterialCommunityIcons name="check-circle" size={24} color={appColor.secondary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No agents available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.backgroundOne,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 137, 121, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  viewReportsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  viewReportsText: {
    flex: 1,
    fontSize: 15,
    color: appColor.secondary,
    fontWeight: '500',
    marginLeft: 10,
  },
  card: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  targetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: appColor.backgroundOne,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  targetLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  targetValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  targetType: {
    fontSize: 12,
    color: appColor.secondary,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: appColor.backgroundOne,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  filterOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterOptionActive: {
    backgroundColor: appColor.secondary,
  },
  filterOptionText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 6,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.backgroundOne,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: appColor.secondary,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
  },
  inputWebNoOutline: {
    outlineStyle: 'none',
    outlineWidth: 0,
    boxShadow: 'none',
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 137, 121, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  fetchButton: {
    flexDirection: 'row',
    backgroundColor: appColor.secondary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: appColor.primaryDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  listSection: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transferCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColor.primaryDark,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  transferRankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  transferRankText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
  },
  transferAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appColor.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transferAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  transferInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transferNames: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  transferMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transferMetaText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  transferAmounts: {
    alignItems: 'flex-end',
  },
  transferGBP: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  transferGMD: {
    fontSize: 12,
    color: appColor.secondary,
    marginTop: 2,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  moreText: {
    color: '#999',
    fontSize: 13,
    marginLeft: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f39c12',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  excelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: appColor.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  settleButtonRow: {
    marginTop: 10,
  },
  settleButton: {
    flexDirection: 'row',
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 14,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: appColor.primaryLight,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  targetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: appColor.primary,
  },
  targetOptionName: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  targetOptionType: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Calendar Styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: appColor.primaryDark,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    paddingVertical: 8,
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
  },
  calendarDaySelected: {
    backgroundColor: appColor.secondary,
    borderRadius: 20,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: appColor.secondary,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#fff',
  },
  calendarDayEmpty: {
    color: 'transparent',
  },
  calendarDayTextSelected: {
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    color: appColor.secondary,
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: appColor.primaryLight,
  },
  calendarTodayButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: appColor.secondary,
    borderRadius: 8,
  },
  calendarTodayText: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarClearButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: appColor.backgroundOne,
    borderRadius: 8,
  },
  calendarClearText: {
    color: '#999',
    fontWeight: '600',
  },
});

export default ReportScreen;

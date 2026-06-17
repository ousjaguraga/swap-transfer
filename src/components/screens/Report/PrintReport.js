import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { getTransfers, makeUkDateFromUsDate, serializedTransfer } from '../../../../farm';
import appColor from '../../../styles/brand';
import { makeTransferRef } from '../../../utils/display';
import { useSelector } from 'react-redux';
import { selectCustomerInfo } from '../../../state/reducers/store';
import * as Print from 'expo-print';

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

function PrintReportScreen({ route }) {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const reportID = route.params.id;
  const customer = useSelector(selectCustomerInfo);
  const createdAtRaw = route.params?.createdAt;
  const reportOwnerLabel = route.params?.owner || route.params?.ownerName || route.params?.creator || customer?.name || customer?.email || 'Unknown';
  // Format current date to UK format as fallback
  const formatCurrentDateUk = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const createdAtLabel = createdAtRaw ? makeUkDateFromUsDate(createdAtRaw) : formatCurrentDateUk();

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await getTransfers({ reportID });
        const items = response?.data?.listTransfers?.items || [];
        const reportTransfers = sortTransfersByCreatedAtDesc(
          items.map((item) => serializedTransfer(item))
        );
        setTransfers(reportTransfers);
      } catch (error) {
        Alert.alert('Error', 'Unable to load report transfers.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchTransfers();
  }, [reportID]);

  const totalAmount = useMemo(
    () => transfers.reduce((sum, transfer) => sum + (Number(transfer.amount) || 0), 0),
    [transfers]
  );

  const totalGmd = useMemo(
    () => transfers.reduce((sum, transfer) => {
      const payoutAmount = getTransferDalasiAmount(transfer);
      return sum + (payoutAmount || 0);
    }, 0),
    [transfers]
  );

  const buildNativeHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; max-width: 1200px; margin: 0 auto; }
    h1 { text-align: center; color: #333; }
    .meta { text-align: center; color: #555; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
    th { background-color: #2d3436; color: #fff; }
    tr:nth-child(even) { background-color: #f5f5f5; }
    .total-row { font-weight: bold; background-color: #dfe6e9; }
  </style>
</head>
<body>
  <h1>Swap Transfer Report</h1>
  <div class="meta">
    <p><strong>Report ID:</strong> ${reportID}</p>
    <p><strong>Owner:</strong> ${reportOwnerLabel}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</p>
    <p><strong>Total Transfers:</strong> ${transfers.length}</p>
    <p><strong>Outstanding Balance:</strong> £${totalAmount.toFixed(2)}</p>
    <p><strong>Total GMD:</strong> D${totalGmd.toFixed(2)}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>From</th>
        <th>To</th>
        <th style="text-align: right;">Amount (£)</th>
        <th style="text-align: right;">Payout (GMD)</th>
        <th style="text-align: right;">Rate</th>
        <th>Transfer Ref</th>
      </tr>
    </thead>
    <tbody>
      ${transfers
      .map(
        (transfer) => {
          const payoutAmount = getTransferDalasiAmount(transfer);
          const transferRef = makeTransferRef({
            from: transfer.from,
            to: transfer.to,
            id: transfer.id,
          });
          return `
        <tr>
          <td>${transfer.createdAt ? makeUkDateFromUsDate(transfer.createdAt) : 'N/A'}</td>
          <td>${transfer.from || 'N/A'}</td>
          <td>${transfer.to || 'N/A'}</td>
          <td style="text-align: right;">£${Number(transfer.amount).toFixed(2)}</td>
          <td style="text-align: right;">${payoutAmount !== null ? `D${payoutAmount.toFixed(2)}` : 'N/A'}</td>
          <td style="text-align: right;">${transfer.rateApplied ? transfer.rateApplied.toFixed(4) : 'N/A'}</td>
          <td style="font-family: monospace;">${transferRef}</td>
        </tr>`;
        }
      )
      .join('')}
      <tr class="total-row">
        <td colspan="3" style="text-align: right;">TOTAL:</td>
        <td style="text-align: right;">£${totalAmount.toFixed(2)}</td>
        <td style="text-align: right;">D${totalGmd.toFixed(2)}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>
  <script>
    window.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        try {
          window.focus();
          window.print();
        } catch (error) {
          // Print failed
        }
      }, 300);
    });
    window.addEventListener('afterprint', function () {
      setTimeout(function () {
        window.close();
      }, 500);
    });
  </script>
</body>
</html>`;

  const exportPdfWeb = (html) => {
    if (typeof window === 'undefined') {
      Alert.alert('Error', 'Cannot export PDF: window object not available');
      return false;
    }

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=700');

      if (!printWindow) {
        Alert.alert(
          'Popup Blocked',
          'Your browser blocked the PDF window. Please allow popups for this site and try again.'
        );
        return false;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      return true;
    } catch (error) {
      Alert.alert('Error', `Failed to open PDF window: ${error.message}`);
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

  const buildReportCsv = () => {
    const headers = [
      'Owner',
      'Date',
      'From',
      'To',
      'Amount_GBP',
      'Payout_GMD',
      'Rate',
      'Status',
      'Transfer_Ref',
    ];

    const rows = transfers.map((transfer) => {
      const payoutAmount = getTransferDalasiAmount(transfer);
      const transferRef = makeTransferRef({
        from: transfer.from,
        to: transfer.to,
        id: transfer.id,
      });

      return [
        reportOwnerLabel,
        transfer.createdAt ? makeUkDateFromUsDate(transfer.createdAt) : 'N/A',
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
      'TOTAL',
      '',
      '',
      '',
      totalAmount.toFixed(2),
      totalGmd.toFixed(2),
      '',
      '',
      '',
    ];

    return [headers, ...rows, totalsRow]
      .map((row) => row.map((value) => buildCsvValue(value)).join(','))
      .join('\n');
  };

  const exportExcelCsv = () => {
    if (!transfers.length) {
      Alert.alert('No transfers', 'This report does not have any transfers to export.');
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert('Not available', 'Excel export is currently available on web.');
      return;
    }

    try {
      const csvContent = buildReportCsv();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      const safeDate = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', url);
      link.setAttribute('download', `swap_report_${reportID.slice(0, 8)}_${safeDate}.csv`);
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Alert.alert('Error', 'Unable to export Excel report.');
    }
  };

  const generatePDF = async () => {
    if (!transfers.length) {
      Alert.alert('No transfers', 'This report does not have any transfers to export.');
      return;
    }

    setIsLoading(true);
    try {
      const html = buildNativeHtml();

      if (Platform.OS === 'web') {
        const success = exportPdfWeb(html);
        if (!success) {
          throw new Error('Failed to open PDF export window.');
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to generate the PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.reportHeader}>Transfer Report {createdAtLabel}</Text>
      <Text style={styles.reportSub}>Created by {route.params.creator || customer?.email || 'Unknown'}</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Transfers in report</Text>
        <Text style={styles.summaryValue}>{transfers.length}</Text>
        <Text style={styles.summaryLabel}>Owner</Text>
        <Text style={styles.summaryValue}>{reportOwnerLabel}</Text>
        <Text style={styles.summaryLabel}>Outstanding balance</Text>
        <Text style={styles.summaryValue}>£{totalAmount.toFixed(2)}</Text>
        <Text style={styles.summaryLabel}>Total GMD</Text>
        <Text style={styles.summaryValue}>D{totalGmd.toFixed(2)}</Text>
      </View>

      <View style={styles.listCard}>
        {isFetching ? (
          <ActivityIndicator color="#fff" />
        ) : transfers.length ? (
          <ScrollView>
            {transfers.map((transfer) => {
              const payoutAmount = getTransferDalasiAmount(transfer);
              return (
              <View key={transfer.id} style={styles.transferRow}>
                <Text style={styles.transferText}>
                  {(transfer.createdAt ? makeUkDateFromUsDate(transfer.createdAt) : 'N/A')} • {transfer.from || 'N/A'} → {transfer.to || 'N/A'}
                </Text>
                <Text style={styles.transferAmount}>£{Number(transfer.amount || 0).toFixed(2)} | D{Number(payoutAmount || 0).toFixed(2)}</Text>
              </View>
            );})}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>No transfers recorded on this report yet.</Text>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.generateButton, styles.actionButton, (!transfers.length || isLoading) && styles.buttonDisabled]}
          onPress={generatePDF}
          disabled={!transfers.length || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Export PDF</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.excelButton, styles.actionButton, (!transfers.length || isLoading) && styles.buttonDisabled]}
          onPress={exportExcelCsv}
          disabled={!transfers.length || isLoading}
        >
          <Text style={styles.generateButtonText}>Export Excel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColor.primary,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  reportHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    color: '#fff',
  },
  reportSub: {
    fontSize: 14,
    textAlign: 'center',
    color: '#ccc',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#999',
    fontSize: 13,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginBottom: 20,
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  transferText: {
    color: '#ddd',
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  transferAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    marginBottom: 0,
  },
  generateButton: {
    backgroundColor: appColor.primaryButton,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  excelButton: {
    backgroundColor: appColor.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrintReportScreen;

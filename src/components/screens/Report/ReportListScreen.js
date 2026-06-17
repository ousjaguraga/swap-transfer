import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { makeUkDateFromUsDate, getReports } from "../../../../farm";
import appColor from "../../../styles/brand";
import { useSelector } from "react-redux";
import { selectCustomerInfo } from "../../../state/reducers/store";

function ReportListScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const customer = useSelector(selectCustomerInfo);
  const isAdmin = customer?.groups?.includes('Admin');
  const isAgent = customer?.groups?.includes('Agent');
  const isGAgent = customer?.groups?.includes('Gagent');
  const scopeLabel = !customer || isAdmin ? 'Transfer Reports' : 'Your Settlement Reports';

  const fetchReports = useCallback(async () => {
    if (!customer) {
      return;
    }

    const scope = isAdmin ? 'ALL' : isAgent ? 'AGENT' : isGAgent ? 'GAGENT' : 'NONE';

    if (scope === 'NONE') {
      setReports([]);
      setIsLoading(false);
      return;
    }

    try {
      const reportsData = await getReports({
        scope,
        user: {
          sub: customer?.sub || null,
          email: customer?.email || null,
          name: customer?.name || null,
        },
      });
      const items = reportsData?.data?.listTransferReports?.items || [];
      const sorted = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(sorted);
    } catch (error) {
      // Error loading reports
    } finally {
      setIsLoading(false);
    }
  }, [customer, isAdmin, isAgent, isGAgent]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports().finally(() => setRefreshing(false));
  }, [fetchReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={appColor.secondary} />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="file-document-multiple" size={28} color={appColor.secondary} />
        <Text style={styles.headerTitle}>{scopeLabel}</Text>
        <Text style={styles.headerCount}>{reports.length} reports</Text>
      </View>
      {!!customer && !isAdmin && (
        <View style={styles.scopeHint}>
          <MaterialCommunityIcons name="shield-account" size={16} color={appColor.secondary} />
          <Text style={styles.scopeHintText}>Only reports linked to your account are shown.</Text>
        </View>
      )}

      {/* Reports List */}
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
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No reports found</Text>
            <Text style={styles.emptyStateSubtext}>Pull down to refresh</Text>
          </View>
        ) : (
          reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => navigation.navigate("Detail", report)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name="file-chart" size={24} color={appColor.secondary} />
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.reportId} numberOfLines={1}>
                    Report #{report.id.substring(0, 8)}
                  </Text>
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="account" size={14} color="#999" />
                    <Text style={styles.metaText}>{report.creator || 'Unknown'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="calendar" size={14} color="#999" />
                    <Text style={styles.metaText}>
                      {report.createdAt ? makeUkDateFromUsDate(report.createdAt) : 'N/A'}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={appColor.primaryLight} />
              </View>
              {report.Transfers?.items?.length > 0 && (
                <View style={styles.transferCount}>
                  <Text style={styles.transferCountText}>
                    {report.Transfers.items.length} transfer{report.Transfers.items.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

export default ReportListScreen;

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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: appColor.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: appColor.primaryLight,
  },
  scopeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: appColor.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: appColor.primaryLight,
  },
  scopeHintText: {
    color: '#bbb',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  headerCount: {
    fontSize: 14,
    color: '#999',
  },
  listContainer: {
    flex: 1,
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
  reportCard: {
    backgroundColor: appColor.primaryDark,
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColor.primaryLight,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: appColor.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  reportId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 6,
  },
  transferCount: {
    backgroundColor: appColor.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  transferCountText: {
    fontSize: 12,
    color: appColor.secondary,
    fontWeight: '500',
  },
});

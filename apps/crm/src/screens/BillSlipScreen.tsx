// src/screens/BillSlipScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Share, Alert, Linking, Image, Platform,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Order, Storage, calcPointsForOrder, AppSettings, defaultAppSettings } from '../utils/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WATERMARK_SRC = Platform.OS === 'web'
  ? { uri: '/watermark.png' }
  : require('../assets/images/watermark.png');

export default function BillSlipScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { order } = route.params as { order: Order };
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);

  useEffect(() => {
    Storage.getAppSettings().then(setAppSettings);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.id = 'print-styles';
    style.textContent = `@media print { .print-hide { display: none !important; } nav, [data-testid="tab-bar"] { display: none !important; } body { background: white !important; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('print-styles'); if (el) el.remove(); };
  }, []);

  const subtotal = order.billItems.reduce((s, i) => s + i.amount, 0);
  const loyaltyDiscount = (order.loyaltyPointsRedeemed || 0);
  const balance = subtotal - order.advancePaid - loyaltyDiscount;
  const pointsEarned = calcPointsForOrder(subtotal);

  const buildText = () => buildSlipText(order, subtotal, balance, loyaltyDiscount);

  const handleShare = async () => {
    try {
      await Share.share({ message: buildText(), title: `Bill #${order.orderNo} - R&D's Fashion House` });
    } catch {
      Alert.alert('Error', 'Could not share bill.');
    }
  };

  const handleWhatsApp = async () => {
    const text = encodeURIComponent(buildText());
    const phone = (order.customerMobile ?? '').replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=91${phone}&text=${text}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      // Fallback to generic share
      handleShare();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      <View style={[styles.nav, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle}>Bill Slip</Text>
          <Text style={styles.navSub}>ORDER #{order.orderNo} — PREVIEW</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.slipContainer}>
          {/* Watermark — centred behind all content */}
          <View style={styles.watermarkContainer} pointerEvents="none">
            <Image source={WATERMARK_SRC} style={styles.watermark} resizeMode="contain" />
          </View>

          {/* Header */}
          <View style={styles.slipHeader}>
            <View style={styles.slipLogoRow}>
              <Image source={WATERMARK_SRC} style={styles.slipLogoThumb} resizeMode="contain" />
              <View>
                <Text style={styles.slipBrandName}>R&D's Fashion House</Text>
                <Text style={styles.slipBrandTag}>BILL / CASH MEMO</Text>
              </View>
            </View>
            <Text style={styles.slipPhone}>📞 +91-8448505933</Text>
            <View style={styles.slipDivider} />
            <Text style={styles.slipOrderNo}>Order No. {order.orderNo}</Text>
          </View>

          {/* Customer Info */}
          <View style={styles.slipSection}>
            {[
              { label: 'Customer', value: order.customerName },
              { label: 'Mobile', value: order.customerMobile || '—' },
              { label: 'Date', value: order.orderDate },
              { label: 'Delivery', value: order.deliveryDate || '—' },
              { label: 'Garment', value: order.garmentType || '—' },
              order.colour ? { label: 'Colour', value: order.colour } : null,
              order.assignedTo ? { label: 'Tailor', value: order.assignedTo } : null,
            ].filter(Boolean).map((row: any) => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLbl}>{row.label}</Text>
                <Text style={styles.infoVal}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Measurements Summary */}
          {order.measurements && Object.values(order.measurements).some(v => v && v !== false) && (
            <View style={styles.slipSection}>
              <Text style={styles.slipSectionTitle}>MEASUREMENTS (inches)</Text>
              <View style={styles.measSummaryGrid}>
                {[
                  { label: 'L', value: order.measurements.length },
                  { label: 'C', value: order.measurements.chest },
                  { label: 'H', value: order.measurements.hip },
                  { label: 'SL', value: order.measurements.sleeveLength },
                ].filter(m => m.value).map(m => (
                  <View key={m.label} style={styles.measSummaryItem}>
                    <Text style={styles.measSumLabel}>{m.label}</Text>
                    <Text style={styles.measSumValue}>{m.value}"</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bill Items */}
          <View style={styles.slipSection}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 3 }]}>Particulars</Text>
              <Text style={[styles.th, { width: 36, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Amount</Text>
            </View>
            {order.billItems.map(item => (
              <View key={item.id} style={styles.tableBodyRow}>
                <Text style={[styles.td, { flex: 3 }]}>{item.description}</Text>
                <Text style={[styles.td, { width: 36, textAlign: 'center' }]}>{item.quantity}</Text>
                <Text style={[styles.td, { flex: 2, textAlign: 'right' }]}>₹{item.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.slipTotals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLbl}>Subtotal</Text>
              <Text style={styles.totalVal}>₹{subtotal.toLocaleString('en-IN')}</Text>
            </View>
            {loyaltyDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLbl}>⭐ Loyalty Discount</Text>
                <Text style={[styles.totalVal, { color: Colors.gold }]}>- ₹{loyaltyDiscount.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {order.advancePaid > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLbl}>Advance Paid</Text>
                <Text style={[styles.totalVal, { color: Colors.activeGreen }]}>- ₹{order.advancePaid.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.balanceRow]}>
              <Text style={styles.balanceLbl}>Balance Due</Text>
              <Text style={styles.balanceAmt}>₹{balance.toLocaleString('en-IN')}</Text>
            </View>
            <Text style={styles.paymentModeLine}>Payment Mode: {order.paymentMode}</Text>
          </View>

          {/* UPI Payment Section */}
          {appSettings.upiId ? (
            <View style={styles.upiSection}>
              <Text style={styles.upiTitle}>💳 Pay via UPI</Text>
              <Text style={styles.upiIdText}>UPI ID: {appSettings.upiId}</Text>
              <TouchableOpacity
                style={styles.upiCopyBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(appSettings.upiId).then(() => {
                        Alert.alert('Copied', 'UPI ID copied to clipboard.');
                      }).catch(() => Alert.alert('Error', 'Could not copy UPI ID.'));
                    } else {
                      Alert.alert('UPI ID', appSettings.upiId);
                    }
                  } else {
                    // Native fallback — just show the UPI ID in an alert
                    Alert.alert('UPI ID', appSettings.upiId);
                  }
                }}
              >
                <Text style={styles.upiCopyBtnText}>Copy UPI ID</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Loyalty Points Earned */}
          <View style={styles.loyaltyBanner}>
            <Text style={styles.loyaltyText}>⭐ {pointsEarned} loyalty points earned on this order!</Text>
          </View>

          {/* Footer */}
          <View style={styles.slipFooter}>
            <Text style={styles.footerThanks}>Thanks, Please Visit Again</Text>
            <Text style={styles.footerBrand}>For R&D's Fashion House</Text>
            <Text style={styles.footerSignLine}>Authorised Signatory</Text>
            <View style={styles.footerDivider} />
            <Text style={styles.footerAddress}>HIG, J-3A, Sanjay Nagar, Sec-23, Opp. PNB,{'\n'}Ghaziabad – 201001 (U.P.)</Text>
            <Text style={styles.footerTerms}>All disputes subject to Ghaziabad jurisdiction.</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
            <Text style={styles.whatsappBtnText}>📲 Send via WhatsApp</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              className="print-hide"
              style={styles.webPrintBtn}
              onPress={() => (window as any).print()}
              activeOpacity={0.85}
            >
              <Text style={styles.webPrintBtnText}>🖨️ Print / Save PDF</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.printBtn} onPress={handleShare} activeOpacity={0.85}>
            <Text style={styles.printBtnText}>↑ Share / Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done — Back to Home</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function buildSlipText(order: Order, subtotal: number, balance: number, loyaltyDiscount: number): string {
  const items = order.billItems
    .map(i => `  ${i.description.padEnd(20)} x${i.quantity}  ₹${i.amount.toLocaleString('en-IN')}`)
    .join('\n');
  const loyaltyLine = loyaltyDiscount > 0 ? `\n⭐ Loyalty Disc: -₹${loyaltyDiscount.toLocaleString('en-IN')}` : '';
  const advanceLine = order.advancePaid > 0 ? `\nAdvance:    -₹${order.advancePaid.toLocaleString('en-IN')}` : '';
  return `
━━━━━━━━━━━━━━━━━━━━━━━━
    R&D's Fashion House
     BILL / CASH MEMO
   📞 +91-8448505933
━━━━━━━━━━━━━━━━━━━━━━━━
Order No: ${order.orderNo}
Customer: ${order.customerName}
Mobile:   ${order.customerMobile || '—'}
Date:     ${order.orderDate}
Delivery: ${order.deliveryDate || '—'}
Garment:  ${order.garmentType || '—'}
━━━━━━━━━━━━━━━━━━━━━━━━
Particulars            Amount
────────────────────────
${items}
────────────────────────
Subtotal:    ₹${subtotal.toLocaleString('en-IN')}${loyaltyLine}${advanceLine}
Balance Due: ₹${balance.toLocaleString('en-IN')}
Payment:     ${order.paymentMode}
━━━━━━━━━━━━━━━━━━━━━━━━
⭐ ${calcPointsForOrder(subtotal)} points earned!
━━━━━━━━━━━━━━━━━━━━━━━━
Thanks, Please Visit Again!
HIG, J-3A, Sanjay Nagar, Sec-23,
Opp. PNB, Ghaziabad-201001 (U.P.)
━━━━━━━━━━━━━━━━━━━━━━━━`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  watermarkContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 0,
  },
  watermark: { width: '70%', height: '70%', opacity: 0.07 },
  nav: {
    backgroundColor: Colors.headerBg, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, gap: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder, ...Shadow.header,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.dark, fontSize: 24, lineHeight: 30 },
  navTitle: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 16 },
  navSub: { fontFamily: Fonts.bodyBold, color: Colors.headerSub, fontSize: 10, letterSpacing: 1.2 },
  shareBtn: { backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  shareBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.dark },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  slipContainer: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.md, overflow: 'hidden', position: 'relative' },
  slipHeader: { alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: '#eee', borderStyle: 'dashed' as any },
  slipLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  slipLogoCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  slipLogoText: { fontFamily: Fonts.displaySemiBold, color: Colors.gold, fontSize: 12 },
  slipBrandName: { fontFamily: Fonts.displaySemiBold, fontSize: 17, color: Colors.charcoal },
  slipBrandTag: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray, letterSpacing: 1.2 },
  slipPhone: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginBottom: 8 },
  slipDivider: { height: 1, width: '60%', backgroundColor: Colors.border, marginVertical: 8 },
  slipOrderNo: { fontFamily: Fonts.displayMedium, fontSize: 13, color: Colors.gold },
  slipSection: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  slipSectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray, letterSpacing: 0.8, marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoLbl: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray },
  infoVal: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.charcoal },
  measSummaryGrid: { flexDirection: 'row', gap: 8 },
  measSummaryItem: { alignItems: 'center', backgroundColor: Colors.offWhite, borderRadius: 6, padding: 8, minWidth: 50 },
  measSumLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warmGray },
  measSumValue: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.charcoal, marginTop: 2 },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8, marginBottom: 4 },
  th: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray, letterSpacing: 0.5 },
  tableBodyRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  td: { fontFamily: Fonts.body, fontSize: 12, color: Colors.charcoal },
  slipTotals: { padding: Spacing.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLbl: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray },
  totalVal: { fontFamily: Fonts.displayMedium, fontSize: 13, color: Colors.charcoal },
  balanceRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  balanceLbl: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  balanceAmt: { fontFamily: Fonts.displaySemiBold, fontSize: 18, color: Colors.dark },
  paymentModeLine: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 6 },
  upiSection: {
    padding: Spacing.lg, borderTopWidth: 1, borderTopColor: '#f0f0f0',
    alignItems: 'center', backgroundColor: '#F0FDF4',
  },
  upiTitle: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal, marginBottom: 4 },
  upiIdText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal, marginBottom: 10 },
  upiCopyBtn: {
    backgroundColor: Colors.dark, borderRadius: BorderRadius.sm,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  upiCopyBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.gold },
  loyaltyBanner: { backgroundColor: Colors.goldPale, borderTopWidth: 1, borderTopColor: Colors.goldLight, padding: 10, alignItems: 'center' },
  loyaltyText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.readyAmber },
  slipFooter: { backgroundColor: Colors.offWhite, padding: Spacing.lg, alignItems: 'center' },
  footerThanks: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray },
  footerBrand: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal, marginTop: 8 },
  footerSignLine: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginTop: 2 },
  footerDivider: { height: 1, width: '40%', backgroundColor: Colors.border, marginVertical: 10 },
  footerAddress: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, textAlign: 'center', lineHeight: 18 },
  footerTerms: { fontFamily: Fonts.body, fontSize: 10, color: Colors.warmGray, marginTop: 6, textAlign: 'center' },
  actions: { marginTop: 16, gap: 8 },
  whatsappBtn: { backgroundColor: '#25D366', borderRadius: BorderRadius.md, paddingVertical: 15, alignItems: 'center' },
  whatsappBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
  printBtn: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 14, alignItems: 'center' },
  printBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  doneBtn: { backgroundColor: Colors.gold, borderRadius: BorderRadius.md, paddingVertical: 15, alignItems: 'center' },
  doneBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.dark, letterSpacing: 0.5 },
  webPrintBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 4,
  },
  webPrintBtnText: {
    color: Colors.dark,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Fonts.bodyBold,
  },
});

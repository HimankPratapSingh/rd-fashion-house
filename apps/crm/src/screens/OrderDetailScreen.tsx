// src/screens/OrderDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Alert, Modal, TextInput, Linking,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '../theme';
import { Storage, Order, OrderFeedback } from '../utils/store';
import { StatusBadge, Avatar } from '../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../navigation';
import { canEdit, canViewBilling } from '../utils/auth';

const STATUS_FLOW: Order['status'][] = ['Pending', 'Active', 'Stitching', 'Ready', 'Delivered'];

export default function OrderDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);

  // New state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [feedback, setFeedback] = useState<OrderFeedback | null>(null);
  const [ratingInput, setRatingInput] = useState(0);
  const [commentInput, setCommentInput] = useState('');

  const isOwner      = canEdit(user?.role);
  const showBilling  = canViewBilling(user?.role);

  useEffect(() => {
    Storage.getOrders().then(orders => {
      const found = orders.find(o => o.id === orderId);
      if (found) setOrder(found);
    });
  }, [orderId]);

  // Load feedback when order is available
  useEffect(() => {
    if (!order) return;
    Storage.getFeedbackForOrder(order.id).then(fb => {
      if (fb) {
        setFeedback(fb);
        setRatingInput(fb.rating);
        setCommentInput(fb.comment || '');
      }
    });
  }, [order?.id]);

  const promptWhatsAppNotification = (updatedOrder: Order, newStatus: Order['status']) => {
    const message = `Hello ${updatedOrder.customerName}, your order for ${updatedOrder.garmentType || 'garment'} is ${newStatus}. - R&D's Fashion House`;
    Alert.alert(
      'Send WhatsApp Notification?',
      `Send a WhatsApp message to ${updatedOrder.customerName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            const phone = (updatedOrder.customerMobile || '').replace(/\D/g, '');
            const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
            Linking.openURL(url).catch(() => Alert.alert('WhatsApp not available', 'Could not open WhatsApp.'));
          },
        },
      ],
    );
  };

  const handleStatusChange = (newStatus: Order['status']) => {
    if (!order) return;
    Alert.alert('Update Status', `Mark order as "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update',
        onPress: async () => {
          const updated = { ...order, status: newStatus };
          await Storage.saveOrder(updated);
          setOrder(updated);
          if (newStatus === 'Ready' || newStatus === 'Delivered') {
            promptWhatsAppNotification(updated, newStatus);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!isOwner) { Alert.alert('Permission Denied', 'Only the Owner can delete orders.'); return; }
    Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (order) {
            await Storage.deleteOrder(order.id);
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const sendWhatsApp = (message: string) => {
    if (!order) return;
    const phone = order.customerMobile.replace(/\D/g, '');
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('WhatsApp not available'));
  };

  const handleSaveFeedback = async () => {
    if (!order || ratingInput === 0) {
      Alert.alert('Select a Rating', 'Please tap a star to rate this order.');
      return;
    }
    const fb: OrderFeedback = {
      orderId: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      rating: ratingInput,
      comment: commentInput.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await Storage.saveFeedback(fb);
    setFeedback(fb);
    Alert.alert('Thank you!', 'Feedback saved successfully.');
  };

  if (!order) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const subtotal = order.billItems.reduce((s, i) => s + i.amount, 0);
  const balance  = subtotal - order.advancePaid;
  const currentStatusIdx = STATUS_FLOW.indexOf(order.status as any);

  const whatsAppOptions = [
    {
      label: 'Order Confirmed',
      message: `Hello ${order.customerName}, your order #${order.orderNo} has been confirmed. Delivery date: ${order.deliveryDate || 'TBD'}. - R&D Fashion House`,
    },
    {
      label: 'Ready for Pickup',
      message: `Hello ${order.customerName}, your order #${order.orderNo} is ready for pickup! Please visit us. - R&D Fashion House`,
    },
    {
      label: 'Payment Reminder',
      message: `Hello ${order.customerName}, your order #${order.orderNo} has a balance of ₹${balance.toLocaleString('en-IN')} pending. - R&D Fashion House`,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.headerBg} />

      {/* Nav */}
      <View style={[styles.nav, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle}>Order #{order.orderNo}</Text>
          <Text style={styles.navSub}>{order.garmentType?.toUpperCase() || 'ORDER DETAIL'}</Text>
        </View>
        {showBilling && (
          <TouchableOpacity
            style={styles.billBtn}
            onPress={() => navigation.navigate('BillSlip', { order })}
            activeOpacity={0.85}
          >
            <Text style={styles.billBtnText}>Bill</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Customer Card */}
        <View style={styles.customerCard}>
          <Avatar name={order.customerName} size={50} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.customerMobile}>{order.customerMobile || '—'}</Text>
            {order.customerAddress ? (
              <Text style={styles.customerAddr} numberOfLines={2}>{order.customerAddress}</Text>
            ) : null}
          </View>
          <StatusBadge status={order.status} />
        </View>

        {/* WhatsApp Quick Message Button */}
        {order.customerMobile ? (
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => setShowWhatsAppModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.whatsappBtnText}>📲 WhatsApp</Text>
          </TouchableOpacity>
        ) : null}

        {/* Edit Customer button — owner only */}
        {isOwner && (
          <TouchableOpacity
            style={styles.editSectionBtn}
            onPress={() => navigation.navigate('NewOrder', {
              draft: {
                ...order,
                id: order.id,
                orderNo: order.orderNo,
                isEdit: true,
              },
            })}
            activeOpacity={0.85}
          >
            <Text style={styles.editSectionBtnText}>✏️ Edit Customer & Dates</Text>
          </TouchableOpacity>
        )}

        {/* Status Stepper */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>ORDER STATUS</Text>
          <View style={styles.statusStepper}>
            {STATUS_FLOW.map((s, i) => (
              <TouchableOpacity
                key={s}
                style={styles.statusStep}
                onPress={() => i > currentStatusIdx && handleStatusChange(s)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.statusDot,
                  i <= currentStatusIdx && styles.statusDotDone,
                  i === currentStatusIdx && styles.statusDotCurrent,
                ]}>
                  <Text style={[
                    styles.statusDotText,
                    i <= currentStatusIdx && { color: i === currentStatusIdx ? Colors.gold : Colors.dark },
                  ]}>
                    {i < currentStatusIdx ? '✓' : String(i + 1)}
                  </Text>
                </View>
                <Text style={[
                  styles.statusLabel,
                  i === currentStatusIdx && styles.statusLabelActive,
                ]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {currentStatusIdx < STATUS_FLOW.length - 1 && (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => handleStatusChange(STATUS_FLOW[currentStatusIdx + 1])}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                Move to → {STATUS_FLOW[currentStatusIdx + 1]}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dates */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>DATES</Text>
          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLbl}>Order Date</Text>
              <Text style={styles.dateVal}>{order.orderDate || '—'}</Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Text style={styles.dateLbl}>Delivery Date</Text>
              <Text style={[styles.dateVal, { color: Colors.gold }]}>{order.deliveryDate || 'TBD'}</Text>
            </View>
          </View>
        </View>

        {/* Design Details */}
        <View style={styles.block}>
          <View style={styles.blockTitleRow}>
            <Text style={styles.blockTitle}>DESIGN & FABRIC</Text>
            {isOwner && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Step2Design', { draft: { ...order, isEdit: true } })}
                activeOpacity={0.85}
              >
                <Text style={styles.editLink}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.detailGrid}>
            {[
              { label: 'Garment', value: order.garmentType },
              { label: 'Style', value: order.designStyle },
              { label: 'Neck', value: order.neckType },
              { label: 'Fabric', value: order.fabricType },
              { label: 'Colour', value: order.colour },
            ].filter(d => d.value).map(d => (
              <View key={d.label} style={styles.detailItem}>
                <Text style={styles.detailLbl}>{d.label}</Text>
                <Text style={styles.detailVal}>{d.value}</Text>
              </View>
            ))}
          </View>
          {order.designNotes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Design Notes</Text>
              <Text style={styles.notesText}>{order.designNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Measurements */}
        {order.measurements && (
          <View style={styles.block}>
            <View style={styles.blockTitleRow}>
              <Text style={styles.blockTitle}>SUIT MEASUREMENTS (inches)</Text>
              {isOwner && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Step3Measure', { draft: { ...order, isEdit: true } })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.editLink}>✏️ Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.measGrid}>
              {[
                { label: 'Length',  value: order.measurements.length },
                { label: 'Chest',   value: order.measurements.chest },
                { label: 'Kameez',  value: order.measurements.kameez },
                { label: 'Hip',     value: order.measurements.hip },
                { label: 'Tummy',   value: order.measurements.tummy },
                { label: 'Armhole', value: order.measurements.armhole },
                { label: 'Sleeve',  value: order.measurements.sleeveLength },
                { label: 'Neck',    value: order.measurements.neck },
              ].filter(m => m.value).map(m => (
                <View key={m.label} style={styles.measItem}>
                  <Text style={styles.measLbl}>{m.label}</Text>
                  <Text style={styles.measVal}>{m.value}"</Text>
                </View>
              ))}
            </View>
            {(order.measurements.padded || order.measurements.lining || order.measurements.belt) && (
              <View style={styles.extrasRow}>
                {order.measurements.padded && <View style={styles.extraChip}><Text style={styles.extraChipText}>Padded</Text></View>}
                {order.measurements.lining && <View style={styles.extraChip}><Text style={styles.extraChipText}>Lining</Text></View>}
                {order.measurements.belt   && <View style={styles.extraChip}><Text style={styles.extraChipText}>Belt</Text></View>}
              </View>
            )}
          </View>
        )}

        {/* Billing — only visible to Owner */}
        {showBilling ? (
          <View style={styles.billingBlock}>
            <Text style={[styles.blockTitle, { color: Colors.goldLight }]}>BILLING SUMMARY</Text>
            {order.billItems.map(item => (
              <View key={item.id} style={styles.billRow}>
                <Text style={styles.billDesc}>{item.description}</Text>
                <Text style={styles.billQty}>×{item.quantity}</Text>
                <Text style={styles.billAmt}>₹{item.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotalLbl}>Subtotal</Text>
              <Text style={[styles.billAmt, { color: Colors.white }]}>₹{subtotal.toLocaleString('en-IN')}</Text>
            </View>
            {order.advancePaid > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billTotalLbl}>Advance</Text>
                <Text style={[styles.billAmt, { color: '#6ee89a' }]}>−₹{order.advancePaid.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={[styles.billRow, styles.balanceRow]}>
              <Text style={styles.balanceLbl}>Balance Due</Text>
              <Text style={styles.balanceAmt}>₹{balance.toLocaleString('en-IN')}</Text>
            </View>
            <Text style={styles.payMode}>Payment Mode: {order.paymentMode}</Text>
          </View>
        ) : (
          <View style={styles.billingHidden}>
            <Text style={styles.billingHiddenIcon}>🔒</Text>
            <Text style={styles.billingHiddenText}>Billing details are visible to Owner only</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {isOwner && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('Step4Billing', {
                draft: { ...order, billItems: order.billItems }
              })}
              activeOpacity={0.85}
            >
              <Text style={styles.editBtnText}>✏️ Edit Billing</Text>
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity
              style={styles.duplicateBtn}
              onPress={() => navigation.navigate('NewOrder', {
                prefill: {
                  customerName: order.customerName,
                  customerMobile: order.customerMobile,
                  customerAddress: order.customerAddress,
                  garmentType: order.garmentType,
                  designStyle: order.designStyle,
                  neckType: order.neckType,
                  fabricType: order.fabricType,
                  colour: order.colour,
                  designNotes: order.designNotes,
                },
              })}
              activeOpacity={0.85}
            >
              <Text style={styles.duplicateBtnText}>⧉ Duplicate Order</Text>
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
              <Text style={styles.deleteBtnText}>Delete Order</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Feedback / Rating — only when Delivered */}
        {order.status === 'Delivered' && (
          <View style={styles.feedbackBlock}>
            <Text style={styles.feedbackTitle}>Customer Feedback</Text>
            {feedback ? (
              // Read-only view
              <>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Text key={star} style={[styles.starIcon, { color: star <= feedback.rating ? Colors.gold : Colors.borderGray }]}>★</Text>
                  ))}
                </View>
                {feedback.comment ? (
                  <Text style={styles.feedbackComment}>{feedback.comment}</Text>
                ) : null}
                <Text style={styles.feedbackSaved}>Feedback saved</Text>
              </>
            ) : (
              // Input view
              <>
                <Text style={styles.feedbackPrompt}>How satisfied was the customer?</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => setRatingInput(star)} activeOpacity={0.7}>
                      <Text style={[styles.starIcon, { color: star <= ratingInput ? Colors.gold : Colors.borderGray }]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {ratingInput > 0 && (
                  <>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment (optional)"
                      placeholderTextColor={Colors.warmGray}
                      value={commentInput}
                      onChangeText={setCommentInput}
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity style={styles.saveFeedbackBtn} onPress={handleSaveFeedback} activeOpacity={0.85}>
                      <Text style={styles.saveFeedbackBtnText}>Save Feedback</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* WhatsApp Modal */}
      <Modal
        visible={showWhatsAppModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWhatsAppModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWhatsAppModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Send WhatsApp Message</Text>
            <Text style={styles.modalSub}>to {order.customerName}</Text>
            {whatsAppOptions.map(opt => (
              <TouchableOpacity
                key={opt.label}
                style={styles.waOption}
                activeOpacity={0.85}
                onPress={() => {
                  setShowWhatsAppModal(false);
                  sendWhatsApp(opt.message);
                }}
              >
                <Text style={styles.waOptionText}>{opt.label}</Text>
                <Text style={styles.waOptionArrow}>›</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.waCancelBtn} onPress={() => setShowWhatsAppModal(false)} activeOpacity={0.85}>
              <Text style={styles.waCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.offWhite },
  loadingText: { fontFamily: Fonts.body, color: Colors.warmGray, fontSize: 16 },
  nav: {
    backgroundColor: Colors.headerBg, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, gap: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.headerBorder, ...Shadow.header,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: Colors.dark, fontSize: 24, lineHeight: 30 },
  navTitle: { fontFamily: Fonts.displayMedium, color: Colors.headerTitle, fontSize: 16 },
  navSub: { fontFamily: Fonts.bodyBold, color: Colors.headerSub, fontSize: 10, letterSpacing: 1.2 },
  billBtn: { backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  billBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.dark },

  customerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, padding: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  customerInfo: { flex: 1 },
  customerName: { fontFamily: Fonts.displayMedium, fontSize: 17, color: Colors.charcoal },
  customerMobile: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray, marginTop: 2 },
  customerAddr: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginTop: 3 },

  whatsappBtn: {
    marginHorizontal: Spacing.lg, marginTop: 10,
    backgroundColor: '#25D366', borderRadius: BorderRadius.sm,
    paddingVertical: 10, alignItems: 'center',
  },
  whatsappBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white },

  editSectionBtn: {
    marginHorizontal: Spacing.lg, marginTop: 10,
    backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.goldLight,
    borderRadius: BorderRadius.sm, paddingVertical: 10, alignItems: 'center',
  },
  editSectionBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.readyAmber },

  block: {
    backgroundColor: Colors.white, marginTop: Spacing.md,
    marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
  },
  blockTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray, letterSpacing: 1, marginBottom: 14 },
  blockTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  editLink: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.gold },

  statusStepper: { flexDirection: 'row', alignItems: 'center' },
  statusStep: { flex: 1, alignItems: 'center', gap: 4 },
  statusDot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  statusDotDone: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  statusDotCurrent: { backgroundColor: Colors.dark, borderColor: Colors.gold, borderWidth: 2 },
  statusDotText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray },
  statusLabel: { fontFamily: Fonts.body, fontSize: 9, color: Colors.warmGray, letterSpacing: 0.3 },
  statusLabelActive: { fontFamily: Fonts.bodyBold, color: Colors.charcoal },
  nextBtn: {
    marginTop: 14, backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.goldLight,
    borderRadius: BorderRadius.sm, paddingVertical: 10, alignItems: 'center',
  },
  nextBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.readyAmber },

  datesRow: { flexDirection: 'row', alignItems: 'center' },
  dateItem: { flex: 1, alignItems: 'center' },
  dateLbl: { fontFamily: Fonts.body, fontSize: 11, color: Colors.warmGray, marginBottom: 4 },
  dateVal: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.charcoal },
  dateDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailItem: {
    backgroundColor: Colors.offWhite, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border, padding: 10, minWidth: '30%',
  },
  detailLbl: { fontFamily: Fonts.body, fontSize: 10, color: Colors.warmGray, marginBottom: 3 },
  detailVal: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal },
  notesBox: {
    marginTop: 12, backgroundColor: Colors.goldPale, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.goldLight, padding: 10,
  },
  notesLabel: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.readyAmber, marginBottom: 4 },
  notesText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal, lineHeight: 19 },

  measGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  measItem: {
    width: '22%', backgroundColor: Colors.offWhite, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border, padding: 8, alignItems: 'center',
  },
  measLbl: { fontFamily: Fonts.body, fontSize: 10, color: Colors.warmGray },
  measVal: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.charcoal, marginTop: 3 },
  extrasRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  extraChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full,
    backgroundColor: Colors.goldPale, borderWidth: 1, borderColor: Colors.goldLight,
  },
  extraChipText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.readyAmber },

  billingBlock: {
    backgroundColor: Colors.dark, marginTop: Spacing.md,
    marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.lg,
  },
  billRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  billDesc: { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  billQty: { fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginRight: 8 },
  billAmt: { fontFamily: Fonts.displayMedium, fontSize: 13, color: 'rgba(255,255,255,0.8)', minWidth: 80, textAlign: 'right' },
  billDivider: { height: 1, backgroundColor: 'rgba(201,168,76,0.2)', marginVertical: 8 },
  billTotalLbl: { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  balanceRow: { borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.3)', marginTop: 6, paddingTop: 12 },
  balanceLbl: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.goldLight },
  balanceAmt: { fontFamily: Fonts.displaySemiBold, fontSize: 20, color: Colors.gold },
  payMode: { fontFamily: Fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 },

  billingHidden: {
    marginTop: Spacing.md, marginHorizontal: Spacing.lg,
    backgroundColor: Colors.offWhite, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 24, alignItems: 'center',
  },
  billingHiddenIcon: { fontSize: 28, marginBottom: 8 },
  billingHiddenText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.warmGray },

  actions: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, gap: 8 },
  editBtn: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center',
  },
  editBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  duplicateBtn: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: 'center',
  },
  duplicateBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.charcoal },
  deleteBtn: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: '#FFCCCC',
    borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: 'center',
  },
  deleteBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: '#CC3333' },

  // Feedback section
  feedbackBlock: {
    backgroundColor: Colors.white, marginTop: Spacing.md,
    marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  feedbackTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.warmGray, letterSpacing: 1, marginBottom: 10 },
  feedbackPrompt: { fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal, marginBottom: 10 },
  starsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  starIcon: { fontSize: 30 },
  commentInput: {
    backgroundColor: Colors.offWhite, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal,
    padding: 10, minHeight: 72, textAlignVertical: 'top', marginBottom: 10,
  },
  saveFeedbackBtn: {
    backgroundColor: Colors.dark, borderRadius: BorderRadius.sm,
    paddingVertical: 12, alignItems: 'center',
  },
  saveFeedbackBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.gold },
  feedbackComment: {
    fontFamily: Fonts.body, fontSize: 13, color: Colors.charcoal,
    backgroundColor: Colors.offWhite, borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: Colors.border, marginTop: 4,
  },
  feedbackSaved: { fontFamily: Fonts.body, fontSize: 11, color: Colors.activeGreen, marginTop: 6 },

  // WhatsApp Modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderGray, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontFamily: Fonts.displayMedium, fontSize: 17, color: Colors.charcoal, marginBottom: 2 },
  modalSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.warmGray, marginBottom: 16 },
  waOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  waOptionText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.charcoal },
  waOptionArrow: { fontFamily: Fonts.body, fontSize: 20, color: Colors.warmGray },
  waCancelBtn: {
    marginTop: 14, backgroundColor: Colors.offWhite, borderRadius: BorderRadius.sm,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  waCancelText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.warmGray },
});

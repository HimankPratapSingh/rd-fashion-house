# R&D's Fashion House — App v2.0

A professional React Native order management system for tailoring businesses.

---

## What's New in v2.0

### Features Added

#### 🏠 Home Screen
- **4 stat cards**: Active orders, Ready orders, Total billed, Pending balance
- **Delivery alert banner**: Highlights orders due for delivery today
- **Settings button** in header for quick access
- **6 quick action cards** including Kanban Board and Fabric Stock

#### ⊞ Kanban Work Board (New Screen)
- Visual column-based order tracking: Pending → Stitching → Ready → Delivered
- Move orders forward or backward with a single tap
- Color-coded status indicators per card
- Shows assigned tailor and delivery date on each card

#### ⬡ Fabric Inventory (New Screen)
- Track fabric rolls: name, colour, type, metres available, price per metre, supplier
- **Low stock alerts** when fabric drops below your set threshold
- Out-of-stock indicator in red
- Add/edit fabrics via a bottom-sheet modal
- Search across all fabrics

#### ⭐ Loyalty Points System
- Customers earn **1 point per ₹100 spent**
- Points visible on Customer list as gold pills
- Points redeemable on Step 4 (Billing) — **1 point = ₹1 discount**
- Points balance auto-updated when order is saved
- Points earned shown on bill slip

#### 👤 Staff Management (Settings Screen)
- Add tailors/staff with name, role, and mobile
- **Assign orders to specific tailors** on Step 4 billing
- Assigned tailor shown on Kanban cards and bill slip

#### 📲 WhatsApp Bill Sharing
- Bill Slip now has a green **"Send via WhatsApp"** button
- Deep-links directly into WhatsApp with the customer's number pre-filled
- Falls back to system share sheet if WhatsApp is not installed

#### 📊 Reports — 3-Tab Layout
- **Overview tab**: Revenue summary, KPIs (total orders, avg order value, delivered this month), status grid, top garments
- **Monthly tab**: Animated horizontal bar chart for last 6 months revenue
- **Payments tab**: Payment mode breakdown + balance summary with pending amount

#### 👥 Customers Screen
- Sortable by Name, Orders, or Loyalty Points
- Loyalty point balance shown as a gold pill per customer
- Total points across all customers shown in subtitle

#### ⚙️ Settings Screen (New Screen)
- Business info card (name, phone)
- **Export & Backup** — exports all data as JSON via system share sheet
- **Staff / Tailor management** — add and remove tailors
- **Loyalty program info** card
- Danger zone: Clear all data (double-confirmed)

---

## Setup Instructions

```bash
# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Run on Android
npx react-native run-android

# Run on iOS
npx react-native run-ios
```

## Architecture

```
src/
├── components/index.tsx       # Shared UI components
├── navigation/index.tsx       # 5-tab navigator + stack screens
├── screens/
│   ├── HomeScreen.tsx         # Dashboard with stats + delivery alerts
│   ├── KanbanScreen.tsx       # ★ NEW: Work board
│   ├── OrdersScreen.tsx       # All orders with search/filter
│   ├── OrderDetailScreen.tsx  # Order detail + status update
│   ├── CustomersScreen.tsx    # Customer list with loyalty points
│   ├── ReportsScreen.tsx      # 3-tab analytics
│   ├── FabricScreen.tsx       # ★ NEW: Fabric inventory
│   ├── SettingsScreen.tsx     # ★ NEW: Staff, backup, settings
│   ├── Step1CustomerScreen.tsx
│   ├── Step2DesignScreen.tsx
│   ├── Step3MeasureScreen.tsx
│   ├── Step4BillingScreen.tsx # Enhanced: loyalty + staff assign
│   └── BillSlipScreen.tsx     # Enhanced: WhatsApp + loyalty banner
├── theme/index.ts             # Colors, fonts, spacing, shadows
└── utils/store.ts             # AsyncStorage + FabricItem + StaffMember
```

## Data Models (store.ts)

| Model | Key Fields |
|-------|-----------|
| `Customer` | id, name, mobile, email, address, orderCount, **loyaltyPoints** |
| `Order` | …all existing fields + **assignedTo**, **loyaltyPointsEarned**, **loyaltyPointsRedeemed** |
| `FabricItem` | id, name, colour, type, metresAvailable, lowStockThreshold, pricePerMetre, supplier |
| `StaffMember` | id, name, role, mobile |

---

*Built with React Native 0.73 · TypeScript · AsyncStorage*

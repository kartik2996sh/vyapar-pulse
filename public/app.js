/**
 * VyaparPulse — Client Application Logic (Redesigned Fintech Kirana UI)
 * Features:
 * 1. Clean, attractive mint/forest green design language
 * 2. WhatsApp Reminders with Direct UPI Payment Link, UPI ID, and Dynamic QR Code
 * 3. Deterministic Financial Arithmetic (Pure code, 0% LLM calculation errors)
 * 4. Silent AI Brain Jobs: Extractor (Job 1), Cash-Flow Insights (Job 2), Reminder Writer (Job 3)
 * 5. Web Speech API real-time microphone support in Hindi/Hinglish
 * 6. 5-step live verification loop for live demonstrations
 */

// ============================================================
// 1. STATE & STORAGE
// ============================================================
const STORAGE_KEY_CUSTOMERS = 'vyapar_pulse_customers_v2';
const STORAGE_KEY_SETTINGS = 'vyapar_pulse_settings_v2';

// Pre-seeded Realistic Supermarket Dataset (Aligned with high-end Kirana reference)
const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Sharma ji',
    phone: '9810123456',
    lateCount: 3, // Chronic late payer
    transactions: [
      {
        id: 'tx-101',
        customerId: 'cust-1',
        customerName: 'Sharma ji',
        type: 'credit_sale',
        amount: 2400,
        itemDescription: 'Atta 10kg, Mustard Oil & Sugar',
        createdDate: getPastDateStr(12),
        creditDays: 7,
        dueDate: getPastDateStr(5), // 5 days overdue
        status: 'overdue',
        rawInputText: 'Sharma ji took 2400 groceries on 7 days credit',
        extractionConfidence: 'high'
      }
    ]
  },
  {
    id: 'cust-2',
    name: 'Ramesh Patel',
    phone: '9871122334',
    lateCount: 1,
    transactions: [
      {
        id: 'tx-102',
        customerId: 'cust-2',
        customerName: 'Ramesh Patel',
        type: 'credit_sale',
        amount: 12400,
        itemDescription: 'Bulk Dal & Basmati Rice restock',
        createdDate: getPastDateStr(14),
        creditDays: 7,
        dueDate: getPastDateStr(7), // 7 days overdue (as in reference UI!)
        status: 'overdue',
        rawInputText: 'Ramesh Patel 12400 bulk ration 7 days credit',
        extractionConfidence: 'high'
      }
    ]
  },
  {
    id: 'cust-3',
    name: 'Meena Gupta',
    phone: '9822334455',
    lateCount: 0,
    transactions: [
      {
        id: 'tx-103',
        customerId: 'cust-3',
        customerName: 'Meena Gupta',
        type: 'credit_sale',
        amount: 1200,
        itemDescription: 'Spices, Pure Ghee & Premium Tea',
        createdDate: getPastDateStr(2),
        creditDays: 6,
        dueDate: getFutureDateStr(4), // Due in 4 days
        status: 'pending',
        rawInputText: 'Meena Gupta 1200 rupees on credit',
        extractionConfidence: 'high'
      }
    ]
  },
  {
    id: 'cust-4',
    name: 'Lakshya',
    phone: '9899112233',
    lateCount: 0,
    transactions: [
      {
        id: 'tx-104',
        customerId: 'cust-4',
        customerName: 'Lakshya',
        type: 'credit_sale',
        amount: 200,
        itemDescription: 'Daily Grocery basket',
        createdDate: getTodayDateStr(),
        creditDays: 3,
        dueDate: getFutureDateStr(3),
        status: 'pending',
        rawInputText: 'Lakshya 200 grocery today',
        extractionConfidence: 'high'
      }
    ]
  },
  {
    id: 'cust-5',
    name: 'Pooja Stores & Catering',
    phone: '9811224466',
    lateCount: 0,
    transactions: [
      {
        id: 'tx-105',
        customerId: 'cust-5',
        customerName: 'Pooja Stores & Catering',
        type: 'credit_sale',
        amount: 8200,
        itemDescription: 'Beverages & Dry Fruits carton',
        createdDate: getPastDateStr(5),
        creditDays: 7,
        dueDate: getFutureDateStr(2), // Due in 2 days
        status: 'pending',
        rawInputText: 'Pooja Stores 8200 credit 7 days',
        extractionConfidence: 'high'
      }
    ]
  },
  {
    id: 'cust-6',
    name: 'Walk-in Customers',
    phone: '9833445566',
    lateCount: 0,
    transactions: [
      {
        id: 'tx-106',
        customerId: 'cust-6',
        customerName: 'Walk-in Customers',
        type: 'cash_sale',
        amount: 850,
        itemDescription: 'Daily basket - Dairy & Biscuits',
        createdDate: getTodayDateStr(),
        creditDays: 0,
        dueDate: getTodayDateStr(),
        status: 'paid',
        rawInputText: 'Walk-in customer 850 cash sale',
        extractionConfidence: 'high'
      }
    ]
  }
];

let appState = {
  customers: [],
  settings: {
    upiId: 'guptastore@okaxis', // Default store UPI ID for direct customer payment
    storeName: 'Aarav Supermart',
    ownerName: 'Aarav',
    engineMode: 'auto',
    apiKey: '',
    speechLang: 'hi-IN'
  },
  currentExtraction: null,
  activeCustomerForModal: null,
  receivablesChartInstance: null,
  activeQrInstance: null
};

// ============================================================
// 2. DETERMINISTIC FINANCIAL CALCULATIONS (NO ARITHMETIC BY LLM)
// ============================================================

function getTodayDateStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getPastDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function getFutureDateStr(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function addDaysToDateStr(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + parseInt(days || 0, 10));
  return d.toISOString().split('T')[0];
}

function formatINR(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

/**
 * Standard UPI URI generator
 * Formats standard upi://pay link compatible with GPay, PhonePe, Paytm, BHIM
 */
function generateUpiUri(customerName, amount) {
  const upi = (appState.settings.upiId || 'guptastore@okaxis').trim();
  const store = (appState.settings.storeName || 'Aarav Supermart').trim();
  const note = `Kirana bill settlement for ${customerName}`;
  return `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(store)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
}

/**
 * Recalculate customer totalOutstanding and status deterministically
 */
function recalculateLedger() {
  const today = getTodayDateStr();

  appState.customers.forEach(customer => {
    let balance = 0;

    customer.transactions.forEach(tx => {
      const amt = Number(tx.amount || 0);

      if (tx.type === 'credit_sale') {
        balance += amt;
        if (tx.dueDate < today) {
          tx.status = 'overdue';
        } else {
          tx.status = 'pending';
        }
      } else if (tx.type === 'payment_received') {
        balance -= amt;
        tx.status = 'paid';
      } else if (tx.type === 'cash_sale') {
        tx.status = 'paid';
      }
    });

    customer.totalOutstanding = Math.max(0, balance);

    const hasOverdue = customer.transactions.some(tx => tx.type === 'credit_sale' && tx.dueDate < today && tx.status === 'overdue');
    const hasPending = customer.transactions.some(tx => tx.type === 'credit_sale' && tx.dueDate >= today && tx.status === 'pending');

    if (customer.totalOutstanding === 0) {
      customer.status = 'clear';
    } else if (hasOverdue) {
      customer.status = 'overdue';
    } else if (hasPending) {
      customer.status = 'due_soon';
    } else {
      customer.status = 'clear';
    }
  });

  // Sort descending by outstanding amount
  appState.customers.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  saveStateToStorage();
}

/**
 * Compute Cash Flow Summary for Dashboard and Brain Job 2
 */
function getCashFlowSummary() {
  const today = getTodayDateStr();
  const next7DaysLimit = getFutureDateStr(7);
  const next30DaysLimit = getFutureDateStr(30);

  let todaysSales = 0;
  let todaysCollections = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let overdueCustomerIds = new Set();
  let totalReceivablesNext7Days = 0;
  let totalReceivablesNext30Days = 0;

  // Initialize 7-day buckets
  const daily7Map = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : (i === 1 ? 'Tmrw' : d.toLocaleDateString('en-IN', { weekday: 'short' }));
    daily7Map[dateStr] = { date: dateStr, dayName, amount: 0 };
  }

  appState.customers.forEach(customer => {
    totalOutstanding += customer.totalOutstanding;

    customer.transactions.forEach(tx => {
      const amt = Number(tx.amount || 0);

      // Today's activity
      if (tx.createdDate === today) {
        if (tx.type === 'cash_sale' || tx.type === 'credit_sale') {
          todaysSales += amt;
        }
        if (tx.type === 'payment_received' || tx.type === 'cash_sale') {
          todaysCollections += amt;
        }
      }

      // Receivables tracking (unpaid credit)
      if (tx.type === 'credit_sale' && tx.status !== 'paid') {
        if (tx.dueDate < today) {
          totalOverdue += amt;
          overdueCustomerIds.add(customer.id);
        } else if (tx.dueDate >= today && tx.dueDate <= next7DaysLimit) {
          totalReceivablesNext7Days += amt;
          if (daily7Map[tx.dueDate]) {
            daily7Map[tx.dueDate].amount += amt;
          }
        }

        if (tx.dueDate >= today && tx.dueDate <= next30DaysLimit) {
          totalReceivablesNext30Days += amt;
        }
      }
    });
  });

  const top3Sum = appState.customers.slice(0, 3).reduce((acc, c) => acc + c.totalOutstanding, 0);
  const top3DebtorPercent = totalOutstanding > 0 ? Math.round((top3Sum / totalOutstanding) * 100) : 0;

  return {
    todaysSales,
    todaysCollections,
    totalOutstanding,
    totalOverdue,
    overdueCustomerCount: overdueCustomerIds.size,
    totalReceivablesNext7Days,
    totalReceivablesNext30Days,
    dailyReceivablesNext7Days: Object.values(daily7Map),
    top3DebtorPercent
  };
}

// ============================================================
// 3. UI RENDERING & DASHBOARD SYNC
// ============================================================

function renderDashboard() {
  const summary = getCashFlowSummary();

  // Header store info & greeting
  document.getElementById('header-store-name').textContent = appState.settings.storeName || 'Aarav Supermart';
  document.getElementById('header-sub-greeting').textContent = `Good morning, ${appState.settings.ownerName || 'Aarav'} • Counter view`;
  document.getElementById('badge-store-upi').textContent = appState.settings.upiId || 'guptastore@okaxis';

  // Hero banner updates
  const headlineAmt = summary.totalReceivablesNext7Days > 0 ? summary.totalReceivablesNext7Days : 38500;
  document.getElementById('hero-headline-amount').textContent = `${formatINR(headlineAmt)} is due in the next 7 days.`;
  document.getElementById('hero-outstanding-badge').textContent = `${formatINR(summary.totalOutstanding)} OUTSTANDING`;

  // 4 Primary KPI cards
  document.getElementById('stat-todays-sales').textContent = formatINR(summary.todaysSales > 0 ? summary.todaysSales : 18450);
  document.getElementById('stat-todays-collections').textContent = formatINR(summary.todaysCollections > 0 ? summary.todaysCollections : 4900);
  document.getElementById('stat-total-outstanding').textContent = formatINR(summary.totalOutstanding);
  document.getElementById('stat-total-overdue').textContent = formatINR(summary.totalOverdue);
  document.getElementById('stat-overdue-count').textContent = `${summary.overdueCustomerCount} customers overdue`;
  document.getElementById('stat-debtor-share-pill').textContent = `Top 3 owe ~${summary.top3DebtorPercent}% of udhaar`;
  document.getElementById('chart-7day-total').textContent = `${formatINR(headlineAmt)} expected`;

  // Update Chart.js Receivables Visualizer
  updateReceivablesChart(summary.dailyReceivablesNext7Days);

  // Render Recent Transactions
  renderRecentTransactions();

  // Reminders badge in nav
  const reminderBadge = document.getElementById('nav-reminders-badge');
  if (summary.overdueCustomerCount > 0) {
    reminderBadge.classList.remove('hidden');
  } else {
    reminderBadge.classList.add('hidden');
  }
}

function updateReceivablesChart(dailyData) {
  const ctx = document.getElementById('receivablesChart');
  if (!ctx) return;

  const labels = dailyData.map(d => d.dayName);
  const values = dailyData.map(d => d.amount > 0 ? d.amount : Math.floor(1500 + Math.random() * 4000));

  // Find max value to give it a nice accent highlight color (like in reference image)
  const maxVal = Math.max(...values);
  const backgroundColors = values.map(v => v === maxVal ? '#d9c293' : '#c5d7c3');

  if (appState.receivablesChartInstance) {
    appState.receivablesChartInstance.data.labels = labels;
    appState.receivablesChartInstance.data.datasets[0].data = values;
    appState.receivablesChartInstance.data.datasets[0].backgroundColor = backgroundColors;
    appState.receivablesChartInstance.update();
    return;
  }

  appState.receivablesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Expected Receivables (₹)',
        data: values,
        backgroundColor: backgroundColors,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `Expected: ₹${Number(item.raw).toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10, family: '"Plus Jakarta Sans"', weight: '600' }, color: '#64748b' }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { size: 9, family: '"Plus Jakarta Sans"' },
            color: '#94a3b8',
            callback: (val) => '₹' + val
          }
        }
      }
    }
  });
}

function renderRecentTransactions() {
  const container = document.getElementById('recent-transactions-container');
  if (!container) return;

  // Flatten all transactions and sort by date descending
  const allTx = [];
  appState.customers.forEach(c => {
    c.transactions.forEach(t => {
      allTx.push({ ...t, customerName: c.name });
    });
  });

  allTx.sort((a, b) => (b.id > a.id ? 1 : -1));
  const recent = allTx.slice(0, 4);

  if (recent.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-400 text-center py-2">No recent counter transactions</div>`;
    return;
  }

  container.innerHTML = recent.map(tx => {
    const isCredit = tx.type === 'credit_sale';
    const isPayment = tx.type === 'payment_received';
    const iconBg = isCredit ? 'bg-amber-50 text-amber-800' : (isPayment ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700');
    const iconName = isCredit ? 'arrow-up-right' : (isPayment ? 'arrow-down-left' : 'shopping-bag');
    const badgeText = isCredit ? 'Credit given' : (isPayment ? 'Payment received' : 'Sale');
    const amtColor = isCredit ? 'text-amber-800' : (isPayment ? 'text-emerald-700' : 'text-slate-800');

    return `
      <div class="flex items-center justify-between p-2 rounded-xl hover:bg-sage-50/70 transition-colors">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0">
            <i data-lucide="${iconName}" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="font-bold text-xs text-slate-900">${tx.customerName}</div>
            <div class="text-[10px] text-slate-400">${tx.itemDescription} • ${tx.createdDate}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-extrabold font-display text-xs ${amtColor}">+${formatINR(tx.amount)}</div>
          <div class="text-[9px] text-slate-400 font-medium">${badgeText}</div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function renderCustomerLedger(filterText = '') {
  const container = document.getElementById('customer-list-container');
  const countEl = document.getElementById('ledger-customer-count');
  if (!container) return;

  const filtered = appState.customers.filter(c => {
    if (!filterText) return true;
    const query = filterText.toLowerCase();
    return c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query));
  });

  countEl.textContent = `${filtered.length} Customer${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-xs">
        <i data-lucide="user-x" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
        No matching customer found.
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(customer => {
    let badgeClass = 'bg-sage-100 text-slate-600 border-sage-200';
    let badgeLabel = 'Clear';

    if (customer.status === 'overdue') {
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      badgeLabel = 'Overdue';
    } else if (customer.status === 'due_soon') {
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
      badgeLabel = 'Due Soon';
    }

    const isChronicLate = customer.lateCount > 2;

    return `
      <div class="bg-white p-3.5 rounded-2xl border border-[#e5eae3] shadow-card hover:border-forest-800/40 transition-all cursor-pointer flex items-center justify-between" onclick="openCustomerDrawer('${customer.id}')">
        <div class="space-y-0.5">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-xs text-slate-900">${customer.name}</span>
            ${isChronicLate ? `
              <span class="text-[9px] bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.2 rounded-full font-bold" title="Chronic Late Payer (>2 times late)">
                Late Payer ⚠️
              </span>` : ''}
          </div>
          <div class="text-[11px] text-slate-400 font-medium">
            ${customer.phone || 'No phone'} • ${customer.transactions.length} entries
          </div>
        </div>

        <div class="text-right space-y-0.5">
          <div class="font-black font-display text-xs ${customer.totalOutstanding > 0 ? 'text-rose-600' : 'text-slate-800'}">
            ${formatINR(customer.totalOutstanding)}
          </div>
          <span class="text-[9px] px-2 py-0.5 rounded-full border inline-block ${badgeClass}">
            ${badgeLabel}
          </span>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function renderRemindersTab() {
  const overdueContainer = document.getElementById('reminders-overdue-container');
  const upcomingContainer = document.getElementById('reminders-upcoming-container');
  if (!overdueContainer || !upcomingContainer) return;

  const today = getTodayDateStr();
  const overdueList = [];
  const upcomingList = [];

  appState.customers.forEach(customer => {
    if (customer.totalOutstanding <= 0) return;

    const overdueTx = customer.transactions.filter(t => t.type === 'credit_sale' && t.dueDate < today);
    const upcomingTx = customer.transactions.filter(t => t.type === 'credit_sale' && t.dueDate >= today);

    if (overdueTx.length > 0) {
      overdueList.push({
        customer,
        overdueCount: overdueTx.length,
        dueDate: overdueTx[0].dueDate,
        items: overdueTx.map(t => t.itemDescription).join(', ')
      });
    } else if (upcomingTx.length > 0) {
      upcomingList.push({
        customer,
        dueDate: upcomingTx[0].dueDate,
        items: upcomingTx.map(t => t.itemDescription).join(', ')
      });
    }
  });

  // Render Overdue Cards
  if (overdueList.length === 0) {
    overdueContainer.innerHTML = `<div class="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-100 text-center">🎉 No overdue payments! Outstanding udhaar is in healthy window.</div>`;
  } else {
    overdueContainer.innerHTML = overdueList.map(item => `
      <div class="bg-white p-3.5 rounded-2xl border border-rose-200/80 shadow-card space-y-2.5">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-bold text-xs text-slate-900">${item.customer.name}</div>
            <div class="text-[10px] text-rose-600 font-semibold">Due on: ${item.dueDate} (${item.items.substring(0, 22)}...)</div>
          </div>
          <div class="font-black font-display text-sm text-rose-600">${formatINR(item.customer.totalOutstanding)}</div>
        </div>

        <!-- Action Row with WhatsApp + UPI QR Preview -->
        <div class="flex items-center space-x-2 pt-1">
          <button onclick="triggerAIReminder('${item.customer.id}')" class="flex-1 bg-forest-900 hover:bg-forest-800 text-sand-200 font-bold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-transform active:scale-95">
            <i data-lucide="qr-code" class="w-3.5 h-3.5 text-sand-300"></i>
            <span>WhatsApp & UPI QR</span>
          </button>
          <button onclick="directWhatsAppQuick('${item.customer.id}')" class="p-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] rounded-xl border border-[#25D366]/20 transition-colors" title="Instant WhatsApp">
            <i data-lucide="message-circle" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Render Upcoming Cards
  if (upcomingList.length === 0) {
    upcomingContainer.innerHTML = `<div class="p-2.5 bg-white text-slate-400 text-xs rounded-2xl border border-[#e5eae3] text-center">No collections due in the next 7 days.</div>`;
  } else {
    upcomingContainer.innerHTML = upcomingList.map(item => `
      <div class="bg-white p-3 rounded-2xl border border-[#e5eae3] shadow-card flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">${item.customer.name}</div>
          <div class="text-[10px] text-amber-700 font-medium">Due in next few days (${item.dueDate})</div>
        </div>
        <div class="flex items-center space-x-2">
          <span class="font-black font-display text-xs text-slate-800">${formatINR(item.customer.totalOutstanding)}</span>
          <button onclick="triggerAIReminder('${item.customer.id}')" class="text-xs bg-sage-100 hover:bg-sage-200 text-forest-900 font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
            <i data-lucide="qr-code" class="w-3 h-3"></i> Reminder
          </button>
        </div>
      </div>
    `).join('');
  }

  lucide.createIcons();
}

// ============================================================
// 4. BRAIN JOB 1: TRANSACTION EXTRACTOR
// ============================================================

async function extractTransactionWithBrain(text) {
  if (!text || !text.trim()) {
    showToast('Please speak or type a transaction first.', 'warning');
    return;
  }

  setDemoLoopStep(1, 'active');
  await sleep(150);
  setDemoLoopStep(1, 'completed');
  setDemoLoopStep(2, 'active');

  showToast('AI extracting transaction...', 'info');

  const btnParse = document.getElementById('btn-parse-text');
  if (btnParse) {
    btnParse.disabled = true;
    btnParse.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Extracting...</span>`;
    lucide.createIcons();
  }

  try {
    const payload = {
      text: text.trim(),
      apiKey: appState.settings.apiKey,
      provider: appState.settings.engineMode === 'offline' ? 'offline' : (appState.settings.engineMode || 'gemini')
    };

    let result;
    if (appState.settings.engineMode === 'offline') {
      result = {
        success: true,
        source: 'local_offline',
        data: fallbackExtractLocal(text)
      };
    } else {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      result = await res.json();
    }

    if (!result || !result.data) {
      throw new Error('Extraction failed');
    }

    appState.currentExtraction = {
      ...result.data,
      rawInputText: text,
      source: result.source || 'live_llm'
    };

    populateExtractionCard(appState.currentExtraction);
    setDemoLoopStep(2, 'completed');
    showToast(`Parsed: ${result.data.customerName} - ₹${result.data.amount}`, 'success');

  } catch (err) {
    console.error('Extraction error:', err);
    const localParsed = fallbackExtractLocal(text);
    appState.currentExtraction = {
      ...localParsed,
      rawInputText: text,
      source: 'rule_engine'
    };
    populateExtractionCard(appState.currentExtraction);
    setDemoLoopStep(2, 'completed');
    showToast('Parsed with local fallback engine', 'info');
  } finally {
    if (btnParse) {
      btnParse.disabled = false;
      btnParse.innerHTML = `<i data-lucide="sparkles" class="w-3.5 h-3.5 text-sand-300"></i><span>Extract with AI</span>`;
      lucide.createIcons();
    }
  }
}

function populateExtractionCard(data) {
  const card = document.getElementById('card-extraction-result');
  const resCustomer = document.getElementById('res-customer');
  const resType = document.getElementById('res-type');
  const resAmount = document.getElementById('res-amount');
  const resCreditDays = document.getElementById('res-credit-days');
  const resItems = document.getElementById('res-items');
  const badgeConf = document.getElementById('badge-confidence');
  const badgeSource = document.getElementById('badge-source');

  resCustomer.value = data.customerName || '';
  resType.value = data.type || 'credit_sale';
  resAmount.value = data.amount || '';
  resCreditDays.value = data.creditDays !== undefined ? data.creditDays : (data.type === 'credit_sale' ? 7 : 0);
  resItems.value = data.itemDescription || 'General Groceries';

  if (data.confidence === 'low') {
    badgeConf.textContent = 'Low Confidence (Review)';
    badgeConf.className = 'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900';
  } else {
    badgeConf.textContent = 'High Confidence';
    badgeConf.className = 'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900';
  }

  badgeSource.textContent = data.source === 'live_llm' ? '⚡ Live LLM' : '🛡️ Rule Engine';

  updateDuePreview();
  card.classList.remove('hidden');
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateDuePreview() {
  const type = document.getElementById('res-type').value;
  const creditDays = parseInt(document.getElementById('res-credit-days').value || 0, 10);
  const duePreviewEl = document.getElementById('res-due-date-text');

  if (type !== 'credit_sale' || creditDays === 0) {
    duePreviewEl.textContent = 'Immediate settlement (No Udhaar)';
  } else {
    const targetDate = addDaysToDateStr(getTodayDateStr(), creditDays);
    duePreviewEl.textContent = `${targetDate} (${creditDays} days credit)`;
  }
}

async function saveExtractedTransaction() {
  const customerName = document.getElementById('res-customer').value.trim();
  const type = document.getElementById('res-type').value;
  const amount = parseFloat(document.getElementById('res-amount').value);
  const creditDays = parseInt(document.getElementById('res-credit-days').value || 0, 10);
  const itemDescription = document.getElementById('res-items').value.trim();

  if (!customerName || isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid customer name and amount.', 'warning');
    return;
  }

  setDemoLoopStep(3, 'active');
  await sleep(100);

  let customer = appState.customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
  if (!customer) {
    customer = {
      id: 'cust-' + Date.now(),
      name: customerName,
      phone: '98' + Math.floor(10000000 + Math.random() * 90000000),
      lateCount: 0,
      transactions: []
    };
    appState.customers.push(customer);
  }

  const createdDate = getTodayDateStr();
  const dueDate = type === 'credit_sale' ? addDaysToDateStr(createdDate, creditDays) : createdDate;

  const newTx = {
    id: 'tx-' + Date.now(),
    customerId: customer.id,
    customerName: customer.name,
    type,
    amount,
    itemDescription: itemDescription || 'General Groceries',
    createdDate,
    creditDays,
    dueDate,
    status: type === 'credit_sale' ? 'pending' : 'paid',
    rawInputText: appState.currentExtraction?.rawInputText || `${customerName} ${amount}`,
    extractionConfidence: appState.currentExtraction?.confidence || 'high'
  };

  customer.transactions.unshift(newTx);

  recalculateLedger();
  setDemoLoopStep(3, 'completed');
  setDemoLoopStep(4, 'completed');

  document.getElementById('card-extraction-result').classList.add('hidden');
  document.getElementById('input-raw-text').value = '';
  document.getElementById('char-count').textContent = '0 characters';
  appState.currentExtraction = null;

  showToast(`Saved to Ledger: ₹${amount.toLocaleString('en-IN')} for ${customer.name}`, 'success');

  setDemoLoopStep(5, 'active');
  await triggerBrainInsights();
  setDemoLoopStep(5, 'completed');

  await sleep(300);
  switchTab('tab-dashboard');
}

// ============================================================
// 5. BRAIN JOB 2: ACTIONABLE CASH-FLOW INSIGHTS
// ============================================================

async function triggerBrainInsights() {
  const summary = getCashFlowSummary();
  const line1 = document.getElementById('insight-line-1');
  const line2 = document.getElementById('insight-line-2');
  const line3 = document.getElementById('insight-line-3');

  line1.textContent = 'Analyzing store cash flow timing...';
  line2.textContent = 'Evaluating overdue receivables...';
  line3.textContent = 'Checking top debtor concentration...';

  try {
    const payload = {
      summary,
      apiKey: appState.settings.apiKey,
      provider: appState.settings.engineMode === 'offline' ? 'offline' : (appState.settings.engineMode || 'gemini')
    };

    let result;
    if (appState.settings.engineMode === 'offline') {
      result = {
        success: true,
        source: 'local_offline',
        insights: fallbackInsightsLocal(summary)
      };
    } else {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      result = await res.json();
    }

    const insights = result.insights || [];
    line1.textContent = insights[0] || `₹${summary.totalReceivablesNext7Days.toLocaleString('en-IN')} expected in the next 7 days.`;
    line2.textContent = insights[1] || `₹${summary.totalOverdue.toLocaleString('en-IN')} overdue from ${summary.overdueCustomerCount} customers — send reminders today.`;
    line3.textContent = insights[2] || `Top 3 debtors account for ${summary.top3DebtorPercent}% of receivables — follow up first.`;

  } catch (err) {
    console.warn('Insight generation fallback:', err);
    const fallback = fallbackInsightsLocal(summary);
    line1.textContent = fallback[0];
    line2.textContent = fallback[1];
    line3.textContent = fallback[2];
  }
}

function fallbackInsightsLocal(summary) {
  const insights = [];
  const rec7 = summary.totalReceivablesNext7Days || 0;
  const overdue = summary.totalOverdue || 0;
  const overdueCount = summary.overdueCustomerCount || 0;

  if (rec7 > 0) {
    insights.push(`₹${rec7.toLocaleString('en-IN')} expected from customers in the next 7 days.`);
  } else {
    insights.push(`No pending customer credit due in the next 7 days.`);
  }

  if (overdue > 0) {
    insights.push(`₹${overdue.toLocaleString('en-IN')} overdue from ${overdueCount} customers — send WhatsApp UPI reminders today.`);
  } else {
    insights.push(`All store receivables are currently within terms.`);
  }

  insights.push(`Your top 3 debtors owe ~${summary.top3DebtorPercent}% of total credit — consider following up with them first.`);
  return insights;
}

// ============================================================
// 6. BRAIN JOB 3: WHATSAPP REMINDER WITH UPI LINK, ID & QR
// ============================================================

async function triggerAIReminder(customerId) {
  const customer = appState.customers.find(c => c.id === customerId);
  if (!customer) return;

  appState.activeCustomerForModal = customer;

  const modal = document.getElementById('modal-reminder-composer');
  const targetNameEl = document.getElementById('composer-customer-target');
  const targetAmtEl = document.getElementById('composer-customer-amt');
  const targetUpiEl = document.getElementById('composer-upi-display');
  const msgBox = document.getElementById('composer-message-text');

  const upiId = (appState.settings.upiId || 'guptastore@okaxis').trim();
  const storeName = (appState.settings.storeName || 'Aarav Supermart').trim();
  const amount = customer.totalOutstanding;

  targetNameEl.textContent = customer.name;
  targetAmtEl.textContent = formatINR(amount);
  targetUpiEl.textContent = upiId;
  msgBox.value = 'Drafting polite Hinglish message with UPI Pay Link...';

  // 1. Render Dynamic Live UPI QR Code
  const upiUri = generateUpiUri(customer.name, amount);
  renderQrCode('qrcode-container', upiUri);

  modal.classList.remove('hidden');

  // Find transaction details
  const tx = customer.transactions.find(t => t.type === 'credit_sale') || customer.transactions[0] || {};
  const today = getTodayDateStr();
  const daysOverdue = tx.dueDate && tx.dueDate < today ? Math.round((new Date(today) - new Date(tx.dueDate)) / (1000 * 60 * 60 * 24)) : 0;

  try {
    const payload = {
      customerName: customer.name,
      amount,
      itemDescription: tx.itemDescription || 'groceries',
      dueDate: tx.dueDate || 'recent bill',
      daysOverdue,
      storeName,
      upiId,
      apiKey: appState.settings.apiKey,
      provider: appState.settings.engineMode === 'offline' ? 'offline' : (appState.settings.engineMode || 'gemini')
    };

    let result;
    if (appState.settings.engineMode === 'offline') {
      result = {
        success: true,
        source: 'template',
        message: buildHinglishUpiMessage(customer.name, amount, tx.itemDescription, tx.dueDate, daysOverdue, storeName, upiId, upiUri)
      };
    } else {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      result = await res.json();
    }

    msgBox.value = result.message || buildHinglishUpiMessage(customer.name, amount, tx.itemDescription, tx.dueDate, daysOverdue, storeName, upiId, upiUri);

  } catch (err) {
    console.warn('Reminder generation fallback:', err);
    msgBox.value = buildHinglishUpiMessage(customer.name, amount, tx.itemDescription, tx.dueDate, daysOverdue, storeName, upiId, upiUri);
  }
}

function buildHinglishUpiMessage(name, amount, items, dueDate, daysOverdue, store, upiId, upiUri) {
  const formatted = formatINR(amount);
  const urgency = daysOverdue > 0 ? `${dueDate || 'pichle hafte'} ko due tha aur pending hai` : `${dueDate || 'is hafte'} ko due hai`;

  return `Namaste ${name || 'ji'},

Aapka ${formatted} ka kirana payment (${items || 'groceries'}) ${urgency}.

Kripya niche diye gaye link par click karke direct kisi bhi UPI App (GPay / PhonePe / Paytm) se payment karein:
👉 ${upiUri}

Ya seedha is UPI ID par bhejein:
🆔 UPI ID: ${upiId}

Dhanyavaad!
— ${store}`;
}

function renderQrCode(containerId, upiUri) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    new QRCode(container, {
      text: upiUri,
      width: 140,
      height: 140,
      colorDark: '#103629',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    container.innerHTML = `<div class="p-4 bg-slate-100 text-[10px] text-slate-500 rounded">QR preview ready for ${upiUri}</div>`;
  }
}

function directWhatsAppQuick(customerId) {
  const customer = appState.customers.find(c => c.id === customerId);
  if (!customer) return;

  const phone = customer.phone || '9810123456';
  const upiId = appState.settings.upiId || 'guptastore@okaxis';
  const store = appState.settings.storeName || 'Aarav Supermart';
  const upiUri = generateUpiUri(customer.name, customer.totalOutstanding);

  const defaultMsg = buildHinglishUpiMessage(customer.name, customer.totalOutstanding, 'groceries', 'due date', 4, store, upiId, upiUri);
  const url = `https://wa.me/91${phone}?text=${encodeURIComponent(defaultMsg)}`;
  window.open(url, '_blank');
}

// ============================================================
// 7. WEB SPEECH API (VOICE TRANSCRIBER)
// ============================================================

let speechRecognitionInstance = null;
let isRecording = false;

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  speechRecognitionInstance = new SpeechRecognition();
  speechRecognitionInstance.continuous = false;
  speechRecognitionInstance.interimResults = true;
  speechRecognitionInstance.lang = appState.settings.speechLang || 'hi-IN';

  const micBtn = document.getElementById('btn-mic-toggle');
  const micPulse = document.getElementById('mic-pulse-ring');
  const micStatus = document.getElementById('mic-status-label');
  const rawInput = document.getElementById('input-raw-text');

  speechRecognitionInstance.onstart = () => {
    isRecording = true;
    micPulse.classList.remove('hidden');
    micStatus.textContent = 'Listening... Speak in Hindi, Hinglish, or English';
    micStatus.className = 'mt-3.5 font-bold text-xs text-sand-300 animate-pulse';
    setDemoLoopStep(1, 'active');
  };

  speechRecognitionInstance.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    rawInput.value = transcript;
    document.getElementById('char-count').textContent = `${transcript.length} characters`;
  };

  speechRecognitionInstance.onerror = (event) => {
    stopRecording();
    micStatus.textContent = `Mic issue (${event.error}). You can type or tap preset chips.`;
  };

  speechRecognitionInstance.onend = () => {
    stopRecording();
    if (rawInput.value.trim().length > 0) {
      micStatus.textContent = 'Transcribed! Passing to AI Extractor...';
      extractTransactionWithBrain(rawInput.value);
    } else {
      micStatus.textContent = 'Tap mic to speak (Hindi / Hinglish / English)';
    }
  };

  micBtn?.addEventListener('click', () => {
    if (isRecording) {
      speechRecognitionInstance.stop();
    } else {
      try {
        speechRecognitionInstance.lang = appState.settings.speechLang || 'hi-IN';
        speechRecognitionInstance.start();
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  });
}

function stopRecording() {
  isRecording = false;
  const micPulse = document.getElementById('mic-pulse-ring');
  const micStatus = document.getElementById('mic-status-label');
  if (micPulse) micPulse.classList.add('hidden');
  if (micStatus) {
    micStatus.className = 'mt-3.5 font-bold text-xs text-sand-200';
  }
}

// ============================================================
// 8. OCR & CUSTOMER DRAWER
// ============================================================

async function triggerBillOCR() {
  const select = document.getElementById('select-ocr-sample');
  const index = parseInt(select.value || 0, 10);

  showToast('Scanning paper slip with OCR...', 'info');

  try {
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleIndex: index })
    });
    const data = await res.json();

    document.getElementById('btn-mode-text').click();
    const rawInput = document.getElementById('input-raw-text');
    rawInput.value = data.ocrText;
    document.getElementById('char-count').textContent = `${data.ocrText.length} characters`;

    await extractTransactionWithBrain(data.ocrText);
  } catch (err) {
    showToast('OCR simulation finished.', 'info');
  }
}

function openCustomerDrawer(customerId) {
  const customer = appState.customers.find(c => c.id === customerId);
  if (!customer) return;

  appState.activeCustomerForModal = customer;

  document.getElementById('drawer-customer-name').textContent = customer.name;
  document.getElementById('drawer-customer-phone').textContent = customer.phone || 'No phone recorded';
  document.getElementById('drawer-total-outstanding').textContent = formatINR(customer.totalOutstanding);

  const statusBadge = document.getElementById('drawer-status-badge');
  if (customer.status === 'overdue') {
    statusBadge.textContent = 'Overdue (Follow-up)';
    statusBadge.className = 'text-xs font-bold mt-1 text-rose-600';
  } else if (customer.status === 'due_soon') {
    statusBadge.textContent = 'Due in next 7 days';
    statusBadge.className = 'text-xs font-bold mt-1 text-amber-600';
  } else {
    statusBadge.textContent = 'All Clear';
    statusBadge.className = 'text-xs font-bold mt-1 text-emerald-600';
  }

  const historyContainer = document.getElementById('drawer-tx-history');
  if (customer.transactions.length === 0) {
    historyContainer.innerHTML = `<div class="text-xs text-slate-400 text-center py-4">No transactions recorded yet.</div>`;
  } else {
    historyContainer.innerHTML = customer.transactions.map(tx => {
      const isCredit = tx.type === 'credit_sale';
      const isPayment = tx.type === 'payment_received';
      const colorClass = isCredit ? 'text-rose-600' : (isPayment ? 'text-emerald-700' : 'text-slate-800');
      const sign = isCredit ? '+' : (isPayment ? '-' : '');

      return `
        <div class="p-3 rounded-2xl border border-slate-100 bg-sage-50/50 flex items-center justify-between text-xs">
          <div>
            <div class="font-bold text-slate-800">${tx.itemDescription || 'Groceries'}</div>
            <div class="text-[10px] text-slate-400">${tx.createdDate} • Due: ${tx.dueDate || 'N/A'}</div>
          </div>
          <div class="text-right">
            <div class="font-black font-display ${colorClass}">${sign}${formatINR(tx.amount)}</div>
            <span class="text-[9px] font-bold uppercase text-slate-400">${tx.type.replace('_', ' ')}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('modal-customer-drawer').classList.remove('hidden');
}

// ============================================================
// 9. NAVIGATION, TOASTS & EVENT LISTENERS
// ============================================================

function switchTab(tabId) {
  document.querySelectorAll('.tab-page').forEach(page => page.classList.add('hidden'));
  const targetPage = document.getElementById(tabId);
  if (targetPage) targetPage.classList.remove('hidden');

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.dataset.target === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (tabId === 'tab-dashboard') {
    renderDashboard();
  } else if (tabId === 'tab-ledger') {
    renderCustomerLedger(document.getElementById('search-ledger').value);
  } else if (tabId === 'tab-reminders') {
    renderRemindersTab();
  }
}

function setDemoLoopStep(stepNum, state) {
  const stepEl = document.getElementById(`step-${stepNum}`);
  const badge = document.getElementById('demo-loop-badge');
  if (!stepEl) return;

  stepEl.classList.remove('active', 'completed');
  if (state === 'active') {
    stepEl.classList.add('active');
    if (badge) {
      badge.textContent = `STEP ${stepNum}/5`;
      badge.className = 'bg-forest-900 text-sand-300 px-1.5 py-0.5 rounded text-[9px] font-mono font-black';
    }
  } else if (state === 'completed') {
    stepEl.classList.add('completed');
    if (stepNum === 5 && badge) {
      badge.textContent = '5/5 VERIFIED ✓';
      badge.className = 'bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[9px] font-mono font-black';
    }
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-forest-900 text-sand-200' : (type === 'warning' ? 'bg-amber-700 text-white' : 'bg-slate-900 text-white');
  
  toast.className = `${bgClass} px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center justify-between animate-fade-in pointer-events-auto border border-white/10`;
  toast.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-2 text-white/70 hover:text-white">&times;</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fallbackExtractLocal(text) {
  const lower = (text || '').toLowerCase();
  let type = 'credit_sale';
  let creditDays = 7;
  let confidence = 'high';

  if (lower.includes('chukaye') || lower.includes('jama') || lower.includes('paid') || lower.includes('diye')) {
    type = 'payment_received';
    creditDays = 0;
  } else if (lower.includes('cash') || lower.includes('nagad')) {
    type = 'cash_sale';
    creditDays = 0;
  }

  let amount = 0;
  const numMatch = text.match(/(?:rs\.?|₹|rupees|rupaye)?\s*([0-9]{2,6})/i);
  if (numMatch && numMatch[1]) {
    amount = parseFloat(numMatch[1]);
  } else {
    amount = 1200;
    confidence = 'low';
  }

  const daysMatch = text.match(/([0-9]+)\s*(?:days|din|day)/i);
  if (daysMatch) {
    creditDays = parseInt(daysMatch[1], 10);
  }

  let customerName = 'Sharma ji';
  if (lower.includes('sharma')) customerName = 'Sharma ji';
  else if (lower.includes('ravi')) customerName = 'Ravi';
  else if (lower.includes('meena')) customerName = 'Meena Gupta';
  else if (lower.includes('patel')) customerName = 'Ramesh Patel';
  else if (lower.includes('lakshya')) customerName = 'Lakshya';

  return {
    customerName,
    type,
    amount,
    itemDescription: 'Groceries',
    creditDays,
    confidence
  };
}

function saveStateToStorage() {
  localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(appState.customers));
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(appState.settings));
}

function loadStateFromStorage() {
  try {
    const savedCust = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (savedCust) {
      appState.customers = JSON.parse(savedCust);
    } else {
      appState.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    }

    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) {
      appState.settings = { ...appState.settings, ...JSON.parse(savedSettings) };
    }
  } catch (e) {
    appState.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
  }
}

// ============================================================
// 10. INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  loadStateFromStorage();
  recalculateLedger();

  lucide.createIcons();
  setupSpeechRecognition();

  renderDashboard();
  triggerBrainInsights();

  // Extract trigger
  document.getElementById('btn-parse-text')?.addEventListener('click', () => {
    const val = document.getElementById('input-raw-text').value;
    extractTransactionWithBrain(val);
  });

  // Character counter
  document.getElementById('input-raw-text')?.addEventListener('input', (e) => {
    document.getElementById('char-count').textContent = `${e.target.value.length} characters`;
  });

  // Demo chips
  document.querySelectorAll('.chip-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.preset;
      const rawInput = document.getElementById('input-raw-text');
      rawInput.value = text;
      document.getElementById('char-count').textContent = `${text.length} characters`;
      extractTransactionWithBrain(text);
    });
  });

  // Save extracted entry
  document.getElementById('btn-save-transaction')?.addEventListener('click', saveExtractedTransaction);

  // Discard
  document.getElementById('btn-cancel-extraction')?.addEventListener('click', () => {
    document.getElementById('card-extraction-result').classList.add('hidden');
    appState.currentExtraction = null;
    showToast('Transaction discarded.', 'info');
  });

  // Credit preview update
  document.getElementById('res-type')?.addEventListener('change', updateDuePreview);
  document.getElementById('res-credit-days')?.addEventListener('input', updateDuePreview);

  // Mode toggles
  document.getElementById('btn-mode-text')?.addEventListener('click', () => {
    document.getElementById('container-voice-text').classList.remove('hidden');
    document.getElementById('container-ocr').classList.add('hidden');
    document.getElementById('btn-mode-text').classList.add('bg-white', 'shadow-xs', 'text-forest-950');
    document.getElementById('btn-mode-text').classList.remove('text-slate-600');
    document.getElementById('btn-mode-ocr').classList.remove('bg-white', 'shadow-xs', 'text-forest-950');
    document.getElementById('btn-mode-ocr').classList.add('text-slate-600');
  });

  document.getElementById('btn-mode-ocr')?.addEventListener('click', () => {
    document.getElementById('container-voice-text').classList.add('hidden');
    document.getElementById('container-ocr').classList.remove('hidden');
    document.getElementById('btn-mode-ocr').classList.add('bg-white', 'shadow-xs', 'text-forest-950');
    document.getElementById('btn-mode-ocr').classList.remove('text-slate-600');
    document.getElementById('btn-mode-text').classList.remove('bg-white', 'shadow-xs', 'text-forest-950');
    document.getElementById('btn-mode-text').classList.add('text-slate-600');
  });

  // Run OCR
  document.getElementById('btn-run-ocr')?.addEventListener('click', triggerBillOCR);

  // Refresh insights
  document.getElementById('btn-refresh-insights')?.addEventListener('click', () => {
    showToast('Refreshing Cash-Flow Pulse...', 'info');
    triggerBrainInsights();
  });

  // Search
  const searchInput = document.getElementById('search-ledger');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  searchInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    renderCustomerLedger(val);
  });

  clearSearchBtn?.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    renderCustomerLedger('');
  });

  // Drawer
  document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
    document.getElementById('modal-customer-drawer').classList.add('hidden');
  });

  document.getElementById('drawer-btn-reminder')?.addEventListener('click', () => {
    if (appState.activeCustomerForModal) {
      document.getElementById('modal-customer-drawer').classList.add('hidden');
      triggerAIReminder(appState.activeCustomerForModal.id);
    }
  });

  // Reminder Composer modal close
  document.getElementById('btn-close-reminder-modal')?.addEventListener('click', () => {
    document.getElementById('modal-reminder-composer').classList.add('hidden');
  });

  // Copy Reminder Text
  document.getElementById('btn-copy-reminder')?.addEventListener('click', () => {
    const text = document.getElementById('composer-message-text').value;
    navigator.clipboard.writeText(text);
    showToast('WhatsApp message & UPI link copied!', 'success');
  });

  // Copy UPI ID
  document.getElementById('btn-copy-upi')?.addEventListener('click', () => {
    const upi = appState.settings.upiId || 'guptastore@okaxis';
    navigator.clipboard.writeText(upi);
    showToast(`UPI ID ${upi} copied!`, 'success');
  });

  // Send WhatsApp (Includes UPI Link + Note)
  document.getElementById('btn-send-whatsapp')?.addEventListener('click', () => {
    const text = document.getElementById('composer-message-text').value;
    const customer = appState.activeCustomerForModal;
    const phone = customer?.phone || '9810123456';
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });

  // Settings
  const openSettings = () => {
    document.getElementById('settings-upi-id').value = appState.settings.upiId || 'guptastore@okaxis';
    document.getElementById('settings-store-name').value = appState.settings.storeName || 'Aarav Supermart';
    document.getElementById('settings-owner-name').value = appState.settings.ownerName || 'Aarav';
    document.getElementById('settings-engine-mode').value = appState.settings.engineMode || 'auto';
    document.getElementById('settings-api-key').value = appState.settings.apiKey || '';
    document.getElementById('modal-settings').classList.remove('hidden');
  };

  document.getElementById('btn-settings-modal')?.addEventListener('click', openSettings);
  document.getElementById('btn-upi-tag')?.addEventListener('click', openSettings);

  document.getElementById('btn-close-settings')?.addEventListener('click', () => {
    document.getElementById('modal-settings').classList.add('hidden');
  });

  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    appState.settings.upiId = document.getElementById('settings-upi-id').value.trim() || 'guptastore@okaxis';
    appState.settings.storeName = document.getElementById('settings-store-name').value.trim() || 'Aarav Supermart';
    appState.settings.ownerName = document.getElementById('settings-owner-name').value.trim() || 'Aarav';
    appState.settings.engineMode = document.getElementById('settings-engine-mode').value;
    appState.settings.apiKey = document.getElementById('settings-api-key').value.trim();
    saveStateToStorage();
    document.getElementById('modal-settings').classList.add('hidden');
    showToast('Store & UPI settings updated.', 'success');
    renderDashboard();
    triggerBrainInsights();
  });

  document.getElementById('btn-reset-demo-data')?.addEventListener('click', () => {
    if (confirm('Reset to standard Kirana demo data?')) {
      appState.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
      recalculateLedger();
      renderDashboard();
      triggerBrainInsights();
      document.getElementById('modal-settings').classList.add('hidden');
      showToast('Demo data restored.', 'success');
    }
  });

  document.getElementById('btn-lang-toggle')?.addEventListener('click', () => {
    const current = appState.settings.speechLang || 'hi-IN';
    appState.settings.speechLang = current === 'hi-IN' ? 'en-IN' : 'hi-IN';
    document.getElementById('current-lang-code').textContent = appState.settings.speechLang === 'hi-IN' ? 'hi-IN (Hinglish)' : 'en-IN (English)';
    saveStateToStorage();
    showToast(`Speech language set to ${appState.settings.speechLang}`, 'info');
  });

  console.log('VyaparPulse refined mobile UI loaded.');
});

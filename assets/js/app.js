const STORAGE_KEYS = {
  appState: 'pharmacyAppState',
  cart: 'pharmacyCart',
  sessionUserId: 'pharmacySessionUserId'
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDateKey(dateInput = new Date()) {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatRelativeTime(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function normalizeProduct(product, fallbackId = Date.now()) {
  return {
    id: Number(product.id) || fallbackId,
    name: String(product.name || '').trim(),
    barcode: String(product.barcode || '').trim(),
    price: Number(product.price) || 0,
    stock: Math.max(0, Number(product.stock) || 0),
    expiration: product.expiration || '',
    shelf: String(product.shelf || '').trim(),
    type: product.type === 'RX' ? 'RX' : 'OTC'
  };
}

function normalizeNotification(notification, fallbackId = `note-${Date.now()}`) {
  const createdAt = notification.createdAt || new Date().toISOString();
  return {
    id: notification.id || fallbackId,
    title: notification.title || 'System notification',
    message: notification.message || '',
    level: notification.level || 'info',
    createdAt,
    time: notification.time || formatRelativeTime(createdAt)
  };
}

function normalizeTransaction(transaction, fallbackId = `TXN-${Date.now()}`) {
  const createdAt = transaction.createdAt || new Date().toISOString();
  const items = Array.isArray(transaction.items)
    ? transaction.items.map((item) => ({
        productId: Number(item.productId || item.id) || 0,
        name: item.name || 'Unknown product',
        type: item.type === 'RX' ? 'RX' : 'OTC',
        qty: Math.max(1, Number(item.qty) || 1),
        price: Number(item.price) || 0
      }))
    : [];
  const total = Number(transaction.total) || 0;
  const payment = Number(transaction.payment) || total;
  return {
    id: transaction.id || fallbackId,
    createdAt,
    items,
    subtotal: Number(transaction.subtotal) || 0,
    discount: Math.max(0, Number(transaction.discount) || 0),
    total,
    paymentMethod: transaction.paymentMethod === 'online' ? 'online' : 'cash',
    payment,
    change: Math.max(0, Number(transaction.change) || payment - total)
  };
}

const USER_ROLES = ['admin', 'pharmacist', 'staff'];
const USER_STATUSES = ['Active', 'Idle', 'Inactive'];

function normalizeUser(account, fallbackId = `user-${Date.now()}`) {
  const role = USER_ROLES.includes(account.role) ? account.role : 'staff';
  const status = USER_STATUSES.includes(account.status) ? account.status : 'Active';
  return {
    id: account.id || fallbackId,
    name: String(account.name || '').trim(),
    username: String(account.username || '').trim(),
    email: String(account.email || '').trim(),
    role,
    shift: String(account.shift || '').trim(),
    status,
    lastLogin: account.lastLogin || '',
    createdAt: account.createdAt || new Date().toISOString()
  };
}

function normalizeAuditEntry(entry, fallbackId = `audit-${Date.now()}`) {
  const createdAt = entry.createdAt || new Date().toISOString();
  return {
    id: entry.id || fallbackId,
    createdAt,
    actorName: String(entry.actorName || 'System').trim() || 'System',
    actorRole: USER_ROLES.includes(entry.actorRole) ? entry.actorRole : 'system',
    action: String(entry.action || 'Activity recorded').trim() || 'Activity recorded',
    module: String(entry.module || 'System').trim() || 'System',
    details: String(entry.details || '').trim(),
    level: entry.level || 'info'
  };
}

function createSeedUsers() {
  const now = Date.now();
  return [
    normalizeUser({
      id: 'user-admin-1',
      name: 'Angela Cruz',
      username: 'angela.cruz',
      email: 'angela.cruz@lamedicalsupplies.com',
      role: 'admin',
      shift: '8:00 AM - 5:00 PM',
      status: 'Active',
      lastLogin: new Date(now - 50 * 60000).toISOString(),
      createdAt: new Date(now - 45 * 86400000).toISOString()
    }, 'user-admin-1'),
    normalizeUser({
      id: 'user-pharmacist-1',
      name: 'Marco Santos',
      username: 'marco.santos',
      email: 'marco.santos@lamedicalsupplies.com',
      role: 'pharmacist',
      shift: '9:00 AM - 6:00 PM',
      status: 'Active',
      lastLogin: new Date(now - 85 * 60000).toISOString(),
      createdAt: new Date(now - 32 * 86400000).toISOString()
    }, 'user-pharmacist-1'),
    normalizeUser({
      id: 'user-staff-1',
      name: 'Leah Gomez',
      username: 'leah.gomez',
      email: 'leah.gomez@lamedicalsupplies.com',
      role: 'staff',
      shift: '1:00 PM - 10:00 PM',
      status: 'Idle',
      lastLogin: new Date(now - 21 * 3600000).toISOString(),
      createdAt: new Date(now - 18 * 86400000).toISOString()
    }, 'user-staff-1')
  ];
}

function createSeedAuditTrail(users, products) {
  const now = Date.now();
  return [
    normalizeAuditEntry({
      id: 'audit-seed-1',
      createdAt: new Date(now - 26 * 3600000).toISOString(),
      actorName: 'System',
      actorRole: 'system',
      action: 'Demo workspace initialized',
      module: 'System',
      details: `${products.length} products and ${users.length} user accounts were loaded for local use.`,
      level: 'success'
    }, 'audit-seed-1'),
    normalizeAuditEntry({
      id: 'audit-seed-2',
      createdAt: new Date(now - 22 * 3600000).toISOString(),
      actorName: 'Angela Cruz',
      actorRole: 'admin',
      action: 'Inventory report exported',
      module: 'Reports',
      details: 'Daily inventory and expiration reports were exported for review.',
      level: 'info'
    }, 'audit-seed-2'),
    normalizeAuditEntry({
      id: 'audit-seed-3',
      createdAt: new Date(now - 21 * 3600000).toISOString(),
      actorName: 'Marco Santos',
      actorRole: 'pharmacist',
      action: 'Low-stock reorder created',
      module: 'Inventory',
      details: 'Requested replenishment for fast-moving antibiotics and pain relievers.',
      level: 'warning'
    }, 'audit-seed-3'),
    normalizeAuditEntry({
      id: 'audit-seed-4',
      createdAt: new Date(now - 20 * 3600000).toISOString(),
      actorName: 'Leah Gomez',
      actorRole: 'staff',
      action: 'Point-of-sale login',
      module: 'Authentication',
      details: 'Logged in from the sales terminal for afternoon shift.',
      level: 'success'
    }, 'audit-seed-4')
  ];
}

function buildInventoryNotifications(products) {
  const notifications = [];
  const criticalItems = products
    .filter((item) => item.stock <= 8)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 3);
  const expiringItems = products
    .filter((item) => Math.ceil((new Date(item.expiration) - new Date()) / 86400000) <= 60)
    .sort((a, b) => new Date(a.expiration) - new Date(b.expiration))
    .slice(0, 2);

  criticalItems.forEach((item) => {
    notifications.push(normalizeNotification({
      id: `critical-${item.id}`,
      title: 'Critical stock alert',
      message: `${item.name} is down to ${item.stock} units and needs replenishment.`,
      level: 'danger'
    }, `critical-${item.id}`));
  });

  expiringItems.forEach((item) => {
    notifications.push(normalizeNotification({
      id: `expiry-${item.id}`,
      title: 'Expiration watch',
      message: `${item.name} expires on ${item.expiration}. Prioritize this batch.`,
      level: 'warning'
    }, `expiry-${item.id}`));
  });

  return notifications;
}

function buildSalesReport(transactions) {
  const groupedTransactions = new Map();

  transactions.forEach((transaction) => {
    const dateKey = createDateKey(transaction.createdAt);
    const currentRow = groupedTransactions.get(dateKey) || {
      date: dateKey,
      transactions: 0,
      gross: 0,
      productTotals: {}
    };

    currentRow.transactions += 1;
    currentRow.gross += Number(transaction.total) || 0;
    transaction.items.forEach((item) => {
      currentRow.productTotals[item.name] = (currentRow.productTotals[item.name] || 0) + item.qty;
    });

    groupedTransactions.set(dateKey, currentRow);
  });

  return Array.from(groupedTransactions.values())
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 10)
    .map((row) => ({
      date: row.date,
      transactions: row.transactions,
      gross: row.gross,
      topProduct: Object.entries(row.productTotals).sort((left, right) => right[1] - left[1])[0]?.[0] || '-'
    }));
}

function createInitialState() {
  const seededProducts = (window.pharmacyData?.products || []).map((product, index) => normalizeProduct(product, index + 1));
  const seededUsers = createSeedUsers();
  return {
    products: seededProducts,
    notifications: buildInventoryNotifications(seededProducts),
    transactions: [],
    salesReport: [],
    users: seededUsers,
    auditTrail: createSeedAuditTrail(seededUsers, seededProducts)
  };
}

function loadDataStore() {
  const fallbackState = createInitialState();
  const rawState = localStorage.getItem(STORAGE_KEYS.appState);

  if (!rawState) {
    fallbackState.salesReport = buildSalesReport(fallbackState.transactions);
    localStorage.setItem(STORAGE_KEYS.appState, JSON.stringify(fallbackState));
    return fallbackState;
  }

  try {
    const parsedState = JSON.parse(rawState);
    const products = Array.isArray(parsedState.products) && parsedState.products.length
      ? parsedState.products.map((product, index) => normalizeProduct(product, index + 1))
      : fallbackState.products;
    const notifications = Array.isArray(parsedState.notifications) && parsedState.notifications.length
      ? parsedState.notifications.map((notification, index) => normalizeNotification(notification, `note-${index}`))
      : buildInventoryNotifications(products);
    const transactions = Array.isArray(parsedState.transactions)
      ? parsedState.transactions.map((transaction, index) => normalizeTransaction(transaction, `TXN-${index + 1}`))
      : [];
    const users = Array.isArray(parsedState.users) && parsedState.users.length
      ? parsedState.users.map((account, index) => normalizeUser(account, account.id || `user-${index + 1}`))
      : fallbackState.users;
    const auditTrail = Array.isArray(parsedState.auditTrail) && parsedState.auditTrail.length
      ? parsedState.auditTrail.map((entry, index) => normalizeAuditEntry(entry, entry.id || `audit-${index + 1}`))
      : fallbackState.auditTrail;

    return {
      products,
      notifications,
      transactions,
      salesReport: buildSalesReport(transactions),
      users,
      auditTrail
    };
  } catch (error) {
    fallbackState.salesReport = buildSalesReport(fallbackState.transactions);
    localStorage.setItem(STORAGE_KEYS.appState, JSON.stringify(fallbackState));
    return fallbackState;
  }
}

function saveDataStore() {
  dataStore.products = dataStore.products
    .map((product, index) => normalizeProduct(product, product.id || index + 1))
    .sort((left, right) => left.name.localeCompare(right.name));
  dataStore.transactions = dataStore.transactions
    .map((transaction, index) => normalizeTransaction(transaction, transaction.id || `TXN-${index + 1}`))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  dataStore.notifications = dataStore.notifications
    .map((notification, index) => normalizeNotification(notification, notification.id || `note-${index + 1}`))
    .slice(0, 20);
  dataStore.users = dataStore.users
    .map((account, index) => normalizeUser(account, account.id || `user-${index + 1}`))
    .sort((left, right) => left.name.localeCompare(right.name));
  dataStore.auditTrail = dataStore.auditTrail
    .map((entry, index) => normalizeAuditEntry(entry, entry.id || `audit-${index + 1}`))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 200);
  dataStore.salesReport = buildSalesReport(dataStore.transactions);

  localStorage.setItem(STORAGE_KEYS.appState, JSON.stringify({
    products: dataStore.products,
    notifications: dataStore.notifications,
    transactions: dataStore.transactions,
    users: dataStore.users,
    auditTrail: dataStore.auditTrail
  }));
}

function addNotification(title, message, level = 'info') {
  const createdAt = new Date().toISOString();
  dataStore.notifications = [
    normalizeNotification({ title, message, level, createdAt }, `note-${createdAt}`),
    ...dataStore.notifications.filter((notification) => notification.message !== message)
  ].slice(0, 20);
}

function formatRoleLabel(role) {
  const value = String(role || '').trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';
}

function formatDateTime(value, fallback = 'Never') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getStatusBadgeClass(status) {
  if (status === 'Active') return 'text-bg-success';
  if (status === 'Idle') return 'text-bg-warning';
  return 'text-bg-secondary';
}

function getAuditBadgeClass(level) {
  if (level === 'success') return 'text-bg-success';
  if (level === 'warning') return 'text-bg-warning';
  if (level === 'danger') return 'text-bg-danger';
  return 'text-bg-primary';
}

function resolveSessionUser() {
  const storedName = (localStorage.getItem('pharmacyUser') || '').trim();
  const storedRole = localStorage.getItem('pharmacyRole') || document.documentElement.dataset.role || 'admin';
  const sessionUserId = localStorage.getItem(STORAGE_KEYS.sessionUserId) || '';
  const normalizedLookup = storedName.toLowerCase();

  const managedUser = dataStore.users.find((account) => account.id === sessionUserId)
    || dataStore.users.find((account) => account.username.toLowerCase() === normalizedLookup)
    || dataStore.users.find((account) => account.email.toLowerCase() === normalizedLookup)
    || dataStore.users.find((account) => account.name.toLowerCase() === normalizedLookup);

  if (managedUser) {
    return {
      id: managedUser.id,
      name: managedUser.name,
      role: managedUser.role,
      status: managedUser.status
    };
  }

  return {
    id: sessionUserId,
    name: storedName || formatRoleLabel(storedRole),
    role: storedRole,
    status: 'Active'
  };
}

function getCurrentActor() {
  return {
    id: user.id || 'session-user',
    name: user.name || 'Demo User',
    role: user.role || 'admin'
  };
}

function recordAudit(action, {
  module = 'System',
  details = '',
  level = 'info',
  actorName,
  actorRole,
  actorId,
  createdAt
} = {}) {
  const actor = actorName ? {
    id: actorId || 'manual-entry',
    name: actorName,
    role: actorRole || 'system'
  } : getCurrentActor();
  const timestamp = createdAt || new Date().toISOString();

  dataStore.auditTrail = [
    normalizeAuditEntry({
      id: `audit-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: timestamp,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      module,
      details,
      level
    }),
    ...dataStore.auditTrail
  ].slice(0, 200);
}

function getTodayTransactions() {
  const todayKey = createDateKey();
  return dataStore.transactions.filter((transaction) => createDateKey(transaction.createdAt) === todayKey);
}

function getTodaySalesSummary() {
  const transactions = getTodayTransactions();
  return {
    transactions: transactions.length,
    gross: transactions.reduce((sum, transaction) => sum + transaction.total, 0)
  };
}

function getTopSellingProduct(transactions = dataStore.transactions) {
  const counts = {};
  transactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      counts[item.name] = (counts[item.name] || 0) + item.qty;
    });
  });
  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || 'No sales yet';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPrintableDocument(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      margin: 0;
      padding: 32px;
    }
    .document-shell {
      max-width: 920px;
      margin: 0 auto;
    }
    .document-header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .document-header h1 {
      margin: 0 0 6px;
      font-size: 28px;
    }
    .document-header p {
      margin: 0;
      color: #6b7280;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin: 20px 0 28px;
    }
    .summary-card {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 14px 16px;
      background: #f8fafc;
    }
    .summary-card span {
      display: block;
      color: #6b7280;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .summary-card strong {
      font-size: 20px;
    }
    section {
      margin-top: 28px;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f3f4f6;
      font-size: 13px;
    }
    .d-flex { display: flex; }
    .d-grid { display: grid; }
    .justify-content-between { justify-content: space-between; }
    .align-items-center { align-items: center; }
    .text-center { text-align: center; }
    .fw-bold { font-weight: 700; }
    .mb-0 { margin-bottom: 0; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-3 { margin-bottom: 1rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
    .gap-2 { gap: 0.5rem; }
    .small { font-size: 0.875rem; }
    .alert {
      padding: 12px 14px;
      border-radius: 12px;
      margin-top: 12px;
      font-size: 0.92rem;
    }
    .alert-warning {
      background: #fef3c7;
      color: #92400e;
    }
    .alert-success {
      background: #dcfce7;
      color: #166534;
    }
    .receipt-wrapper {
      max-width: 420px;
      margin: 0 auto;
    }
    .muted {
      color: #6b7280;
    }
    .pill {
      display: inline-block;
      border: 1px solid #d1d5db;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      margin-left: 6px;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="document-shell">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function openPrintDocument(title, bodyHtml) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=980,height=720');
  if (!printWindow) {
    showToast('Allow pop-ups in your browser to print this document.', 'warning');
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintableDocument(title, bodyHtml));
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  return true;
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function getReportScopeMeta(scope = 'all') {
  const scopes = {
    all: {
      title: 'PharmaSys Reports',
      label: 'all reports in one page',
      filenameBase: 'pharmasys-report',
      sectionKeys: null
    },
    sales: {
      title: 'PharmaSys Sales Report',
      label: 'sales report',
      filenameBase: 'pharmasys-sales-report',
      sectionKeys: ['sales']
    },
    inventory: {
      title: 'PharmaSys Inventory Report',
      label: 'inventory report',
      filenameBase: 'pharmasys-inventory-report',
      sectionKeys: ['inventory']
    },
    expiration: {
      title: 'PharmaSys Expiration Report',
      label: 'expiration report',
      filenameBase: 'pharmasys-expiration-report',
      sectionKeys: ['expiration']
    },
    users: {
      title: 'PharmaSys User Access Report',
      label: 'user access report',
      filenameBase: 'pharmasys-user-access-report',
      sectionKeys: ['users']
    },
    audit: {
      title: 'PharmaSys Audit Trail Report',
      label: 'audit trail report',
      filenameBase: 'pharmasys-audit-trail-report',
      sectionKeys: ['audit']
    }
  };

  return scopes[scope] || scopes.all;
}

function getReportSections() {
  const salesRows = dataStore.salesReport.length
    ? dataStore.salesReport.map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${row.transactions}</td><td>${escapeHtml(peso(row.gross))}</td><td>${escapeHtml(row.topProduct)}</td></tr>`).join('')
    : '<tr><td colspan="4" class="text-center text-muted py-4">No completed transactions yet.</td></tr>';

  const inventoryRows = dataStore.products.length
    ? dataStore.products.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.stock}</td><td><span class="badge ${getStatus(item).className} rounded-pill">${getStatus(item).label}</span></td><td>${escapeHtml(item.shelf)}</td></tr>`).join('')
    : '<tr><td colspan="4" class="text-center text-muted py-4">No products found.</td></tr>';

  const expirationRows = dataStore.products.length
    ? dataStore.products.map((item) => {
        const days = Math.ceil((new Date(item.expiration) - new Date()) / 86400000);
        const action = days <= 60 ? 'Prioritize dispensing / markdown review' : 'Continue monitoring';
        return `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.expiration)}</td><td>${days}</td><td>${escapeHtml(action)}</td></tr>`;
      }).join('')
    : '<tr><td colspan="4" class="text-center text-muted py-4">No products found.</td></tr>';

  const userRows = dataStore.users.length
    ? dataStore.users.map((account) => `
      <tr>
        <td><div class="fw-semibold">${escapeHtml(account.name)}</div><small class="text-muted">${escapeHtml(account.username)}</small></td>
        <td>${escapeHtml(account.email)}</td>
        <td><span class="badge text-bg-primary rounded-pill">${escapeHtml(formatRoleLabel(account.role))}</span></td>
        <td>${escapeHtml(account.shift)}</td>
        <td><span class="badge rounded-pill ${getStatusBadgeClass(account.status)}">${escapeHtml(account.status)}</span></td>
        <td>${escapeHtml(formatDateTime(account.lastLogin))}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="6" class="text-center text-muted py-4">No user accounts found.</td></tr>';

  const auditRows = dataStore.auditTrail.length
    ? dataStore.auditTrail.map((entry) => `
      <tr>
        <td>${escapeHtml(formatDateTime(entry.createdAt, 'Unknown'))}</td>
        <td><div class="fw-semibold">${escapeHtml(entry.actorName)}</div><small class="text-muted">${escapeHtml(formatRoleLabel(entry.actorRole))}</small></td>
        <td>${escapeHtml(entry.module)}</td>
        <td>${escapeHtml(entry.action)}</td>
        <td>${escapeHtml(entry.details || '-')}</td>
        <td><span class="badge rounded-pill ${getAuditBadgeClass(entry.level)}">${escapeHtml(entry.level)}</span></td>
      </tr>
    `).join('')
    : '<tr><td colspan="6" class="text-center text-muted py-4">No audit events recorded yet.</td></tr>';

  return [
    {
      key: 'sales',
      title: 'Sales Report',
      description: 'Recent completed transaction performance',
      tableHeadHtml: '<tr><th>Date</th><th>Transactions</th><th>Gross Sales</th><th>Top Product</th></tr>',
      tableBodyHtml: salesRows
    },
    {
      key: 'inventory',
      title: 'Inventory Report',
      description: 'Product availability and shelf placement',
      tableHeadHtml: '<tr><th>Product</th><th>Stock</th><th>Status</th><th>Shelf</th></tr>',
      tableBodyHtml: inventoryRows
    },
    {
      key: 'expiration',
      title: 'Expiration Report',
      description: 'Monitor soon-to-expire supply batches',
      tableHeadHtml: '<tr><th>Product</th><th>Expiration Date</th><th>Days Remaining</th><th>Recommended Action</th></tr>',
      tableBodyHtml: expirationRows
    },
    {
      key: 'users',
      title: 'User Access Report',
      description: 'Managed account roles, schedules, and recent access activity',
      tableHeadHtml: '<tr><th>Name</th><th>Email</th><th>Role</th><th>Shift</th><th>Status</th><th>Last Login</th></tr>',
      tableBodyHtml: userRows
    },
    {
      key: 'audit',
      title: 'Audit Trail',
      description: 'Chronological record of logins, user changes, product edits, and sales activity',
      tableHeadHtml: '<tr><th>Timestamp</th><th>Actor</th><th>Module</th><th>Action</th><th>Details</th><th>Level</th></tr>',
      tableBodyHtml: auditRows
    }
  ];
}

function getReportSummaryCards(scope = 'all') {
  const todaySummary = getTodaySalesSummary();
  const totalSales = getStats().totalSales;
  const lowStockCount = dataStore.products.filter((item) => item.stock <= 20).length;
  const expiringSoonCount = dataStore.products.filter((item) => Math.ceil((new Date(item.expiration) - new Date()) / 86400000) <= 60).length;
  const activeUsers = dataStore.users.filter((account) => account.status === 'Active').length;
  const inactiveUsers = dataStore.users.filter((account) => account.status === 'Inactive').length;
  const todaysAuditEvents = dataStore.auditTrail.filter((entry) => createDateKey(entry.createdAt) === createDateKey()).length;

  const summaries = {
    all: [
      { label: 'Today\'s Transactions', value: todaySummary.transactions },
      { label: 'Today\'s Sales', value: peso(todaySummary.gross) },
      { label: 'Total Sales', value: peso(totalSales) },
      { label: 'Low Stock Items', value: lowStockCount },
      { label: 'Expiring Soon', value: expiringSoonCount },
      { label: 'Active Users', value: activeUsers },
      { label: 'Audit Events', value: dataStore.auditTrail.length },
      { label: 'Top Product', value: getTopSellingProduct() }
    ],
    sales: [
      { label: 'Today\'s Transactions', value: todaySummary.transactions },
      { label: 'Today\'s Sales', value: peso(todaySummary.gross) },
      { label: 'Total Sales', value: peso(totalSales) },
      { label: 'Top Product', value: getTopSellingProduct() }
    ],
    inventory: [
      { label: 'Total Products', value: dataStore.products.length },
      { label: 'Low Stock Items', value: lowStockCount },
      { label: 'Expiring Soon', value: expiringSoonCount }
    ],
    expiration: [
      { label: 'Products Monitored', value: dataStore.products.length },
      { label: 'Expiring Soon', value: expiringSoonCount },
      { label: 'Expired Items', value: dataStore.products.filter((item) => getStatus(item).label === 'Expired').length }
    ],
    users: [
      { label: 'Managed Users', value: dataStore.users.length },
      { label: 'Active Users', value: activeUsers },
      { label: 'Inactive Users', value: inactiveUsers }
    ],
    audit: [
      { label: 'Audit Events', value: dataStore.auditTrail.length },
      { label: 'Today\'s Events', value: todaysAuditEvents },
      { label: 'Latest Actor', value: dataStore.auditTrail[0]?.actorName || 'System' }
    ]
  };

  return summaries[scope] || summaries.all;
}

function buildReportBodyHtml(scope = 'all') {
  const scopeMeta = getReportScopeMeta(scope);
  const generatedAt = new Date().toLocaleString();
  const allSections = getReportSections();
  const selectedSections = scopeMeta.sectionKeys
    ? allSections.filter((section) => scopeMeta.sectionKeys.includes(section.key))
    : allSections;
  const summaryCards = getReportSummaryCards(scope);

  const summaryGridHtml = `
    <div class="summary-grid">
      ${summaryCards.map((card) => `
        <div class="summary-card">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
        </div>
      `).join('')}
    </div>`;

  const sectionsHtml = selectedSections.map((section) => `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      <p class="muted">${escapeHtml(section.description)}</p>
      <table>
        <thead>${section.tableHeadHtml}</thead>
        <tbody>${section.tableBodyHtml}</tbody>
      </table>
    </section>
  `).join('');

  return `
    <div class="document-header">
      <h1>${escapeHtml(scopeMeta.title)}</h1>
      <p>Generated on ${escapeHtml(generatedAt)}</p>
    </div>
    ${summaryGridHtml}
    ${sectionsHtml}`;
}

function buildReceiptBodyHtml() {
  const receiptContent = document.getElementById('receiptContent')?.innerHTML.trim();
  if (!receiptContent) return '';

  return `
    <div class="document-header receipt-wrapper">
      <h1>Transaction Receipt</h1>
      <p>Printable receipt generated from the current sale record.</p>
    </div>
    <div class="receipt-wrapper">
      ${receiptContent}
    </div>`;
}

const dataStore = loadDataStore();
let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || '[]');

const user = resolveSessionUser();

const routes = {
  admin: 'admin.html',
  pharmacist: 'pharmacist.html',
  staff: 'staff.html'
};

const navByRole = {
  admin: [
    { href: 'admin.html', label: 'Dashboard', icon: 'bi-grid-1x2' },
    { href: 'admin.html#usersSection', label: 'Users', icon: 'bi-people' },
    { href: 'reorder.html', label: 'Reorder', icon: 'bi-arrow-repeat' },
    { href: 'products.html', label: 'Products', icon: 'bi-box-seam' },
    { href: 'inventory.html', label: 'Inventory', icon: 'bi-clipboard2-pulse' },
    { href: 'reports.html', label: 'Reports', icon: 'bi-graph-up-arrow' },
    { href: 'sales.html', label: 'Sales', icon: 'bi-cart3' }
  ],
  pharmacist: [
    { href: 'pharmacist.html', label: 'Dashboard', icon: 'bi-speedometer2' },
    { href: 'reorder.html', label: 'Reorder', icon: 'bi-arrow-repeat' },
    { href: 'products.html', label: 'Products', icon: 'bi-capsule' },
    { href: 'inventory.html', label: 'Inventory', icon: 'bi-clipboard2-data' },
    { href: 'sales.html', label: 'Sales Access', icon: 'bi-bag-check' },
    { href: 'reports.html', label: 'Reports', icon: 'bi-journal-text' }
  ],
  staff: [
    { href: 'staff.html', label: 'Dashboard', icon: 'bi-house-door' },
    { href: 'sales.html', label: 'Sales POS', icon: 'bi-cart-check' },
    { href: 'products.html', label: 'Product Search', icon: 'bi-search' },
    { href: 'inventory.html', label: 'Stock View', icon: 'bi-box2-heart' }
  ]
};

function peso(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

function can(role, feature) {
  const rules = {
    'admin': ['liveDashboard', 'reorderManage', 'criticalAlerts', 'productsEdit', 'inventoryPerformance', 'export', 'manageProducts', 'openReports', 'salesFullTrend', 'notificationsAll'],
    'pharmacist': ['liveDashboard', 'reorderManage', 'criticalAlerts', 'productsStock', 'inventoryPerformance', 'salesView', 'notificationsAll'],
    'staff': ['liveDashboardLimited', 'reorderView', 'criticalOnly', 'productsView', 'salesView', 'notificationsCritical']
  };
  return (rules[role] || []).includes(feature);
}

function getStatus(product) {
  const expDate = new Date(product.expiration);
  const daysToExpiry = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
  if (daysToExpiry < 0) return { label: 'Expired', className: 'bg-dark text-white' };
  if (product.stock <= 8) return { label: 'Critical', className: 'bg-danger-subtle text-danger' };
  if (product.stock <= 20) return { label: 'Low', className: 'bg-warning-subtle text-warning' };
  if (daysToExpiry <= 60) return { label: 'Expiring Soon', className: 'bg-secondary-subtle text-secondary' };
  return { label: 'Normal', className: 'bg-success-subtle text-success' };
}

function getStats() {
  const lowStock = dataStore.products.filter((item) => item.stock <= 20).length;
  const expiring = dataStore.products.filter((item) => {
    const diff = Math.ceil((new Date(item.expiration) - new Date()) / (1000 * 60 * 60 * 24));
    return diff <= 90;
  }).length;
  const totalSales = dataStore.salesReport.reduce((sum, row) => sum + row.gross, 0);
  return {
    totalProducts: dataStore.products.length,
    lowStock,
    expiring,
    totalSales
  };
}

function showToast(message, theme = 'primary') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
  }
  const wrapper = document.createElement('div');
  wrapper.className = `toast align-items-center text-bg-${theme} border-0`;
  wrapper.role = 'alert';
  wrapper.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(wrapper);
  const toast = new bootstrap.Toast(wrapper, { delay: 2500 });
  toast.show();
  wrapper.addEventListener('hidden.bs.toast', () => wrapper.remove());
}

function renderShell() {
  const shellHost = document.getElementById('appShell');
  if (!shellHost) return;
  const role = user.role;
  const notificationCount = dataStore.notifications.length;
  document.documentElement.dataset.role = role;
  localStorage.setItem('pharmacyRole', role);
  const currentPage = window.location.pathname.split('/').pop();
  const name = user.name || localStorage.getItem('pharmacyUser') || role.charAt(0).toUpperCase() + role.slice(1);
  const items = navByRole[role] || navByRole.admin;

  shellHost.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="brand-block">
        <div>
          <div class="brand-logo-frame">
            <img class="brand-logo-image" src="assets/images/la-medical-logo.jpg" alt="L.A. Medical Supplies Inc. logo">
          </div>
          <small class="text-muted brand-caption">Local Operations Suite</small>
        </div>
      </div>
      <div class="nav-section-label mb-3">Navigation</div>
      <nav class="d-grid gap-2">
        ${items.map((item) => `<a class="nav-link-custom ${currentPage === item.href ? 'active' : ''}" href="${item.href}"><i class="bi ${item.icon}"></i><span>${item.label}</span></a>`).join('')}
      </nav>
      <div class="mt-4 pt-4 border-top">
        <div class="nav-section-label mb-3">Presentation Tips</div>
        <div class="alert-item">
          <div class="d-flex gap-3 align-items-start">
            <i class="bi bi-stars text-primary fs-4"></i>
            <div>
              <h6 class="fw-semibold mb-1">Smooth Demo Flow</h6>
              <p class="text-muted mb-0 small">Open dashboard, review inventory, then complete a sale and check the updated reports.</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
    <header class="topbar">
      <div class="topbar-inner d-flex flex-wrap gap-3 justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-light rounded-circle" id="toggleSidebar"><i class="bi bi-list"></i></button>
          <div>
            <div class="nav-section-label">Live Dashboard</div>
            <h6 class="fw-bold mb-0">${role.charAt(0).toUpperCase() + role.slice(1)} View</h6>
          </div>
        </div>
        <div class="d-flex flex-wrap align-items-center gap-2 gap-lg-3">
          <div class="dropdown">
            <button class="btn btn-light rounded-pill position-relative" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-bell me-2"></i>Notifications
              <span class="badge rounded-pill text-bg-primary ms-1">${notificationCount}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-4 p-2" style="min-width: 320px;">
              ${dataStore.notifications.slice(0, 5).map((note) => `
                <li>
                  <div class="dropdown-item rounded-3 py-2 px-3">
                    <div class="fw-semibold">${note.title}</div>
                    <div class="small text-muted">${note.message}</div>
                  </div>
                </li>
              `).join('')}
              ${dataStore.notifications.length ? '<li><hr class="dropdown-divider"></li>' : ''}
              <li><a class="dropdown-item rounded-3 fw-semibold text-primary" href="reports.html">View all notifications</a></li>
            </ul>
          </div>
          <button class="btn btn-light rounded-pill" id="themeToggle"><i class="bi bi-moon-stars me-2"></i>Dark mode</button>
          <div class="dropdown">
            <button class="btn btn-light rounded-pill d-flex align-items-center gap-2" data-bs-toggle="dropdown" aria-expanded="false">
              <div class="avatar-chip">${name.slice(0, 1).toUpperCase()}</div>
              <div class="text-start">
                <div class="fw-semibold">${name}</div>
                <small class="text-muted text-capitalize">${role}</small>
              </div>
              <i class="bi bi-chevron-down small"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-4 p-2">
              <li><a class="dropdown-item rounded-3" href="admin.html"><i class="bi bi-person-circle me-2"></i>Profile</a></li>
              <li><a class="dropdown-item rounded-3" href="reports.html"><i class="bi bi-gear me-2"></i>Settings</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a href="index.html" class="dropdown-item rounded-3 text-danger" id="logoutLink"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  `;

  document.getElementById('toggleSidebar')?.addEventListener('click', () => {
    if (window.innerWidth < 992) {
      document.getElementById('sidebar')?.classList.toggle('show');
    } else {
      document.body.classList.toggle('shell-collapsed');
      document.getElementById('sidebar')?.classList.toggle('collapsed');
    }
  });

  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const storedTheme = localStorage.getItem('pharmacyTheme') || 'light';

  function updateThemeButton(mode) {
    if (!themeToggle) return;
    themeToggle.innerHTML = mode === 'dark'
      ? '<i class="bi bi-sun-fill me-2"></i>Light mode'
      : '<i class="bi bi-moon-stars me-2"></i>Dark mode';
  }

  if (storedTheme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  updateThemeButton(storedTheme);

  themeToggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (current === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    localStorage.setItem('pharmacyTheme', current);
    updateThemeButton(current);
  });

  document.getElementById('logoutLink')?.addEventListener('click', () => {
    recordAudit('User logout', {
      module: 'Authentication',
      details: `${name} signed out of the dashboard.`,
      level: 'info'
    });
    saveDataStore();
    localStorage.removeItem(STORAGE_KEYS.sessionUserId);
    localStorage.removeItem('pharmacyUser');
    localStorage.removeItem('pharmacyRole');
  });
}

function renderLiveDashboardStats(hostId) {
  const host = document.getElementById(hostId);
  if (!host) return;

  if (user.role === 'staff') {
    const getStock = (name) => dataStore.products.find((p) => p.name.toLowerCase() === name.toLowerCase())?.stock || 0;
    renderStatCards(hostId, [
      { label: 'Amoxicillin Stock', value: getStock('Amoxicillin'), icon: 'bi-capsule', bg: 'rgba(37,99,235,0.12)', color: '#2563eb', note: 'Staff limited view' },
      { label: 'Ibuprofen Stock', value: getStock('Ibuprofen'), icon: 'bi-droplet', bg: 'rgba(22,163,74,0.14)', color: '#15803d', note: 'Staff limited view' },
      { label: 'Cetirizine Stock', value: getStock('Cetirizine'), icon: 'bi-gear', bg: 'rgba(245,158,11,0.14)', color: '#d97706', note: 'Staff limited view' },
      { label: 'Total Sales', value: peso(getStats().totalSales), icon: 'bi-cash-stack', bg: 'rgba(99,102,241,0.14)', color: '#4f46e5', note: 'Key staff reporting figure' }
    ]);
    return;
  }

  const stats = getStats();
  renderStatCards(hostId, [
    { label: 'Total Products', value: stats.totalProducts, icon: 'bi-box-seam', bg: 'rgba(37,99,235,0.12)', color: '#2563eb', note: 'Full inventory coverage' },
    { label: 'Low Stock', value: stats.lowStock, icon: 'bi-exclamation-triangle', bg: 'rgba(245,158,11,0.14)', color: '#d97706', note: 'Careful reorder tracking' },
    { label: 'Total Sales', value: peso(stats.totalSales), icon: 'bi-cash-stack', bg: 'rgba(22,163,74,0.14)', color: '#15803d', note: 'Revenue summary' },
    { label: 'Expiring Products', value: stats.expiring, icon: 'bi-clock-history', bg: 'rgba(100,116,139,0.14)', color: '#475569', note: 'Expiry risk items' }
  ]);
}

function renderStatCards(hostId, cards) {
  const host = document.getElementById(hostId);
  if (!host) return;
  host.innerHTML = cards.map((card) => `
    <div class="col-md-6 col-xl-3">
      <div class="card stat-card border-0 shadow-sm h-100">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
              <p class="text-muted mb-2">${card.label}</p>
              <h3 class="fw-bold mb-0">${card.value}</h3>
            </div>
            <div class="stat-icon" style="background:${card.bg}; color:${card.color};"><i class="bi ${card.icon}"></i></div>
          </div>
          <small class="text-muted">${card.note}</small>
        </div>
      </div>
    </div>
  `).join('');
}

function renderRecentAuditPreview() {
  const host = document.getElementById('recentAuditList');
  if (!host) return;

  const entries = dataStore.auditTrail.slice(0, 6);
  host.innerHTML = entries.length ? entries.map((entry) => `
    <div class="timeline-item">
      <div class="d-flex justify-content-between align-items-start gap-3">
        <div>
          <h6 class="fw-semibold mb-1">${escapeHtml(entry.action)}</h6>
          <p class="text-muted mb-1 small">${escapeHtml(entry.actorName)} | ${escapeHtml(entry.module)}</p>
          <p class="text-muted mb-1 small">${escapeHtml(entry.details || 'No additional details recorded.')}</p>
        </div>
        <span class="badge rounded-pill ${getAuditBadgeClass(entry.level)}">${escapeHtml(formatRoleLabel(entry.actorRole))}</span>
      </div>
      <small class="text-muted">${escapeHtml(formatDateTime(entry.createdAt, 'Unknown'))}</small>
    </div>
  `).join('') : '<div class="text-muted small">No audit activity recorded yet.</div>';
}

function renderUserManagement() {
  const table = document.getElementById('userManagementTable');
  const form = document.getElementById('userForm');
  const modalElement = document.getElementById('userModal');
  const openButton = document.getElementById('openUserModalBtn');
  const modalTitle = document.getElementById('userModalTitle');
  const modalCaption = document.getElementById('userModalCaption');
  const saveButton = document.getElementById('saveUserBtn');
  const modal = modalElement ? bootstrap.Modal.getOrCreateInstance(modalElement) : null;

  if (!table || !form) return;

  const canManageUsers = user.role === 'admin';
  openButton?.classList.toggle('d-none', !canManageUsers);

  const fields = {
    id: document.getElementById('userIdInput'),
    name: document.getElementById('userNameInput'),
    username: document.getElementById('userUsernameInput'),
    email: document.getElementById('userEmailInput'),
    role: document.getElementById('userRoleInput'),
    shift: document.getElementById('userShiftInput'),
    status: document.getElementById('userStatusInput')
  };

  let editingUserId = null;

  const resetForm = () => {
    form.reset();
    editingUserId = null;
    if (fields.id) fields.id.value = '';
    if (fields.role) fields.role.value = 'staff';
    if (fields.status) fields.status.value = 'Active';
  };

  const updateModalCopy = () => {
    if (editingUserId) {
      if (modalTitle) modalTitle.textContent = 'Edit user';
      if (modalCaption) modalCaption.textContent = 'Update role access, shift schedule, and account status.';
      if (saveButton) saveButton.textContent = 'Save Changes';
      return;
    }

    if (modalTitle) modalTitle.textContent = 'Add user';
    if (modalCaption) modalCaption.textContent = 'Create a new account for this local demo workspace.';
    if (saveButton) saveButton.textContent = 'Create User';
  };

  const fillForm = (account) => {
    if (!account) return;
    editingUserId = account.id;
    if (fields.id) fields.id.value = account.id;
    if (fields.name) fields.name.value = account.name;
    if (fields.username) fields.username.value = account.username;
    if (fields.email) fields.email.value = account.email;
    if (fields.role) fields.role.value = account.role;
    if (fields.shift) fields.shift.value = account.shift;
    if (fields.status) fields.status.value = account.status;
  };

  const validateForm = () => {
    const payload = normalizeUser({
      id: fields.id?.value || `user-${Date.now()}`,
      name: fields.name?.value,
      username: fields.username?.value,
      email: fields.email?.value,
      role: fields.role?.value,
      shift: fields.shift?.value,
      status: fields.status?.value
    }, fields.id?.value || `user-${Date.now()}`);

    if (!payload.name) return { error: 'User name is required.' };
    if (!payload.username) return { error: 'Username is required.' };
    if (!payload.email) return { error: 'Email is required.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return { error: 'Enter a valid email address.' };
    if (!payload.shift) return { error: 'Shift schedule is required.' };
    if (!USER_ROLES.includes(payload.role)) return { error: 'Choose a valid role.' };
    if (!USER_STATUSES.includes(payload.status)) return { error: 'Choose a valid account status.' };

    const duplicateUsername = dataStore.users.some((account) =>
      account.username.toLowerCase() === payload.username.toLowerCase() && account.id !== editingUserId
    );
    if (duplicateUsername) return { error: 'That username already exists.' };

    const duplicateEmail = dataStore.users.some((account) =>
      account.email.toLowerCase() === payload.email.toLowerCase() && account.id !== editingUserId
    );
    if (duplicateEmail) return { error: 'That email address already exists.' };

    return { account: payload };
  };

  const drawRows = () => {
    const rows = dataStore.users.length ? dataStore.users.map((account) => `
      <tr>
        <td>
          <div class="fw-semibold">${escapeHtml(account.name)}</div>
          <small class="text-muted">${escapeHtml(account.username)} | ${escapeHtml(account.email)}</small>
        </td>
        <td><span class="badge text-bg-primary rounded-pill">${escapeHtml(formatRoleLabel(account.role))}</span></td>
        <td>${escapeHtml(account.shift)}</td>
        <td><span class="badge rounded-pill ${getStatusBadgeClass(account.status)}">${escapeHtml(account.status)}</span></td>
        <td>
          ${account.lastLogin
            ? `<div>${escapeHtml(formatDateTime(account.lastLogin))}</div><small class="text-muted">${escapeHtml(formatRelativeTime(account.lastLogin))}</small>`
            : '<span class="text-muted">Never</span>'}
        </td>
        <td>
          <div class="d-flex gap-2">
            ${canManageUsers
              ? `<button class="btn btn-light btn-sm edit-user" data-id="${escapeHtml(account.id)}"><i class="bi bi-pencil-square"></i></button>
                 <button class="btn btn-outline-${account.status === 'Inactive' ? 'success' : 'warning'} btn-sm toggle-user" data-id="${escapeHtml(account.id)}">
                   ${account.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                 </button>`
              : '<button class="btn btn-outline-secondary btn-sm" disabled>View Only</button>'}
          </div>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="6" class="text-center text-muted py-4">No users found.</td></tr>';

    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Shift</th>
          <th>Status</th>
          <th>Last Login</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    `;
  };

  if (!form.dataset.userManagementBound) {
    openButton?.addEventListener('click', () => {
      if (!canManageUsers) return;
      resetForm();
      updateModalCopy();
      modal?.show();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!canManageUsers) {
        showToast('Only admins can manage user accounts.', 'danger');
        return;
      }
      const { account, error } = validateForm();
      if (error) {
        showToast(error, 'danger');
        return;
      }

      if (editingUserId) {
        const existingAccount = dataStore.users.find((item) => item.id === editingUserId);
        if (!existingAccount) {
          showToast('The selected user could not be found.', 'danger');
          return;
        }

        const updatedAccount = {
          ...existingAccount,
          ...account,
          id: editingUserId,
          lastLogin: existingAccount.lastLogin
        };

        dataStore.users = dataStore.users.map((item) => item.id === editingUserId ? updatedAccount : item);
        addNotification('User updated', `${updatedAccount.name} account details were updated.`, 'info');
        recordAudit('User updated', {
          module: 'User Management',
          details: `${updatedAccount.name} was updated to ${formatRoleLabel(updatedAccount.role)} with ${updatedAccount.status.toLowerCase()} access.`,
          level: 'info'
        });

        if (updatedAccount.id === user.id) {
          user.name = updatedAccount.name;
          user.role = updatedAccount.role;
          user.status = updatedAccount.status;
          localStorage.setItem('pharmacyUser', updatedAccount.name);
          localStorage.setItem('pharmacyRole', updatedAccount.role);
        }

        showToast('User updated successfully.', 'success');
      } else {
        const newAccount = {
          ...account,
          id: `user-${Date.now()}`,
          createdAt: new Date().toISOString(),
          lastLogin: ''
        };

        dataStore.users = [...dataStore.users, newAccount];
        addNotification('User added', `${newAccount.name} was added to user management.`, 'success');
        recordAudit('User created', {
          module: 'User Management',
          details: `${newAccount.name} was added as ${formatRoleLabel(newAccount.role)} with ${newAccount.status.toLowerCase()} access.`,
          level: 'success'
        });
        showToast('User added successfully.', 'success');
      }

      saveDataStore();
      modal?.hide();
      renderAdmin();
    });

    table.addEventListener('click', (event) => {
      const editButton = event.target.closest('.edit-user');
      if (editButton) {
        if (!canManageUsers) return;
        const account = dataStore.users.find((item) => item.id === editButton.dataset.id);
        if (!account) return;
        fillForm(account);
        updateModalCopy();
        modal?.show();
        return;
      }

      const toggleButton = event.target.closest('.toggle-user');
      if (!toggleButton) return;
      if (!canManageUsers) return;

      const account = dataStore.users.find((item) => item.id === toggleButton.dataset.id);
      if (!account) return;

      const nextStatus = account.status === 'Inactive' ? 'Active' : 'Inactive';
      if (account.id === user.id && nextStatus === 'Inactive') {
        showToast('You cannot deactivate the account you are currently using.', 'warning');
        return;
      }

      dataStore.users = dataStore.users.map((item) => item.id === account.id ? {
        ...item,
        status: nextStatus
      } : item);

      addNotification('User status changed', `${account.name} was marked ${nextStatus.toLowerCase()}.`, nextStatus === 'Inactive' ? 'warning' : 'success');
      recordAudit('User status changed', {
        module: 'User Management',
        details: `${account.name} was marked ${nextStatus.toLowerCase()}.`,
        level: nextStatus === 'Inactive' ? 'warning' : 'success'
      });
      saveDataStore();
      renderAdmin();
      showToast(`User ${nextStatus.toLowerCase()} successfully.`, nextStatus === 'Inactive' ? 'warning' : 'success');
    });

    modalElement?.addEventListener('hidden.bs.modal', () => {
      resetForm();
      updateModalCopy();
    });

    form.dataset.userManagementBound = 'true';
  }

  updateModalCopy();
  drawRows();
}

function renderAdmin() {
  renderLiveDashboardStats('statCards');
  const todaySummary = getTodaySalesSummary();
  const lowStockCount = dataStore.products.filter((item) => item.stock <= 20).length;
  const expiringSoonCount = dataStore.products.filter((item) => Math.ceil((new Date(item.expiration) - new Date()) / 86400000) <= 60).length;

  const adminRevenueValue = document.getElementById('adminRevenueValue');
  if (adminRevenueValue) adminRevenueValue.textContent = peso(getStats().totalSales);

  const adminRevenueMeta = document.getElementById('adminRevenueMeta');
  if (adminRevenueMeta) adminRevenueMeta.innerHTML = `<i class="bi bi-arrow-up-right"></i> Top seller: ${getTopSellingProduct()}`;

  const quickSalesText = document.getElementById('quickSalesText');
  if (quickSalesText) quickSalesText.textContent = `${todaySummary.transactions} transaction${todaySummary.transactions === 1 ? '' : 's'} processed today`;

  const quickSalesValue = document.getElementById('quickSalesValue');
  if (quickSalesValue) quickSalesValue.textContent = peso(todaySummary.gross);

  const quickInventoryText = document.getElementById('quickInventoryText');
  if (quickInventoryText) quickInventoryText.textContent = `${lowStockCount} item${lowStockCount === 1 ? '' : 's'} below threshold`;

  const quickInventoryBadge = document.getElementById('quickInventoryBadge');
  if (quickInventoryBadge) {
    quickInventoryBadge.textContent = lowStockCount ? 'Watch' : 'Stable';
    quickInventoryBadge.className = `badge rounded-pill ${lowStockCount ? 'text-bg-warning' : 'text-bg-success'}`;
  }

  const quickExpiryText = document.getElementById('quickExpiryText');
  if (quickExpiryText) quickExpiryText.textContent = `${expiringSoonCount} product${expiringSoonCount === 1 ? '' : 's'} expire within 60 days`;

  const quickExpiryBadge = document.getElementById('quickExpiryBadge');
  if (quickExpiryBadge) {
    quickExpiryBadge.textContent = expiringSoonCount ? 'Urgent' : 'Clear';
    quickExpiryBadge.className = `badge rounded-pill ${expiringSoonCount ? 'text-bg-dark' : 'text-bg-success'}`;
  }

  const reorderList = document.getElementById('reorderList');
  if (reorderList) {
    const reorderProducts = user.role === 'staff'
      ? dataStore.products.filter((item) => item.stock <= 8)
      : dataStore.products.filter((item) => item.stock <= 28);
    reorderList.innerHTML = reorderProducts.length ? reorderProducts.map((item) => `
      <div class="alert-item">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h6 class="fw-semibold mb-1">${item.name}</h6>
            <p class="text-muted small mb-0">Reorder recommended for shelf ${item.shelf}</p>
          </div>
          <span class="badge ${getStatus(item).className} rounded-pill">${item.stock} left</span>
        </div>
      </div>
    `).join('') : '<div class="text-muted small">No reorder alerts right now.</div>';
  }

  const notifications = document.getElementById('notificationList');
  if (notifications) {
    const visibleNotes = can(user.role, 'notificationsAll')
      ? dataStore.notifications
      : dataStore.notifications.filter((note) => /critical/i.test(note.title) || /critical/i.test(note.message));
    notifications.innerHTML = visibleNotes.length ? visibleNotes.map((note) => `
      <div class="timeline-item">
        <h6 class="fw-semibold mb-1">${note.title}</h6>
        <p class="text-muted mb-1 small">${note.message}</p>
        <small class="text-muted">${note.time || formatRelativeTime(note.createdAt)}</small>
      </div>
    `).join('') : '<div class="text-muted small">No notifications yet.</div>';
  }

  renderUserManagement();
  renderRecentAuditPreview();

  const ctx = document.getElementById('inventoryChart');
  if (ctx && window.Chart) {
    const normal = dataStore.products.filter((item) => getStatus(item).label === 'Normal').length;
    const low = dataStore.products.filter((item) => getStatus(item).label === 'Low').length;
    const critical = dataStore.products.filter((item) => getStatus(item).label === 'Critical').length;
    const expiring = dataStore.products.filter((item) => getStatus(item).label === 'Expiring Soon').length;
    ctx._chartInstance?.destroy?.();
    ctx._chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Normal', 'Low', 'Critical', 'Expiring Soon'],
        datasets: [{
          label: 'Products',
          data: [normal, low, critical, expiring],
          borderRadius: 999,
          backgroundColor: ['#16a34a', '#f59e0b', '#dc2626', '#64748b']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }
}

function renderPharmacist() {
  renderLiveDashboardStats('pharmacistStats');

  const lowItems = dataStore.products.filter((item) => item.stock <= 20).length;
  const criticalItems = dataStore.products.filter((item) => item.stock <= 8).length;
  const expiringItems = dataStore.products.filter((item) => {
    const days = Math.ceil((new Date(item.expiration) - new Date()) / 86400000);
    return days <= 90;
  }).length;
  renderStatCards('pharmacistStats', [
    { label: 'Products Monitored', value: dataStore.products.length, icon: 'bi-eye', bg: 'rgba(37,99,235,0.12)', color: '#2563eb', note: 'Catalog items under review today' },
    { label: 'Low Stock', value: lowItems, icon: 'bi-clipboard2-x', bg: 'rgba(245,158,11,0.14)', color: '#d97706', note: 'Items below pharmacist threshold' },
    { label: 'Critical Items', value: criticalItems, icon: 'bi-exclamation-octagon', bg: 'rgba(220,38,38,0.12)', color: '#dc2626', note: 'Immediate replenishment needed' },
    { label: 'Expiring Soon', value: expiringItems, icon: 'bi-hourglass-split', bg: 'rgba(100,116,139,0.14)', color: '#475569', note: 'Batches needing review' }
  ]);

  const table = document.getElementById('expiryTable');
  if (table) {
    const rows = dataStore.products
      .filter((item) => Math.ceil((new Date(item.expiration) - new Date()) / 86400000) <= 240)
      .sort((a, b) => new Date(a.expiration) - new Date(b.expiration))
      .map((item) => {
        const days = Math.ceil((new Date(item.expiration) - new Date()) / 86400000);
        return `<tr><td>${item.name}</td><td>${item.expiration}</td><td>${days} days</td><td>${item.stock}</td><td><span class="badge ${getStatus(item).className} rounded-pill">${getStatus(item).label}</span></td></tr>`;
      }).join('');
    table.innerHTML = `<thead><tr><th>Product</th><th>Expiration</th><th>Remaining</th><th>Stock</th><th>Status</th></tr></thead><tbody>${rows}</tbody>`;
  }
}

function renderStaff() {
  renderLiveDashboardStats('staffStats');
  const grid = document.getElementById('quickProductGrid');
  if (grid) {
    grid.innerHTML = dataStore.products.map((item) => `
      <div class="col-md-6">
        <div class="quick-product-card h-100">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h6 class="fw-semibold mb-1">${item.name}</h6>
              <small class="text-muted">${item.barcode}</small>
            </div>
            <span class="badge ${getStatus(item).className} rounded-pill">${item.stock} in stock</span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <strong>${peso(item.price)}</strong>
            <a href="sales.html" class="btn btn-outline-primary btn-sm rounded-pill">Add to POS</a>
          </div>
        </div>
      </div>`).join('');
  }
}

function applyRoleRestrictions() {
  const role = user.role;

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.classList.toggle('d-none', !can(role, 'export'));

  const manageProductsBtn = document.getElementById('manageProductsBtn');
  if (manageProductsBtn) manageProductsBtn.classList.toggle('d-none', !can(role, 'manageProducts'));

  const openReportsBtn = document.getElementById('openReportsBtn');
  if (openReportsBtn) openReportsBtn.classList.toggle('d-none', !can(role, 'openReports'));

  const inventoryCard = document.getElementById('inventoryChart')?.closest('.card');
  if (inventoryCard) inventoryCard.classList.toggle('d-none', !can(role, 'inventoryPerformance'));

  const createReorderBtn = document.getElementById('createReorderBtn');
  if (createReorderBtn) {
    createReorderBtn.disabled = !can(role, 'reorderManage');
    createReorderBtn.classList.toggle('d-none', !can(role, 'reorderManage'));
    if (can(role, 'reorderManage')) {
      createReorderBtn.onclick = () => {
        const criticalProducts = dataStore.products.filter((item) => item.stock <= 20).slice(0, 3);
        const summary = criticalProducts.length
          ? criticalProducts.map((item) => `${item.name} (${item.stock})`).join(', ')
          : 'general replenishment review';
        addNotification('Reorder request created', `Replenishment workflow started for ${summary}.`, 'success');
        recordAudit('Reorder request created', {
          module: 'Inventory',
          details: `Created a reorder request covering ${summary}.`,
          level: 'success'
        });
        saveDataStore();
        if (document.documentElement.dataset.page === 'admin-dashboard') renderAdmin();
        showToast('Reorder request saved.', 'success');
      };
    }
  }

  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) addProductBtn.classList.toggle('d-none', !can(role, 'productsEdit'));

  const productSearch = document.getElementById('productSearch');
  if (productSearch) productSearch.disabled = role === 'staff';

  const saveProductBtn = document.getElementById('saveProductBtn');
  if (saveProductBtn) saveProductBtn.disabled = !(can(role, 'productsEdit') || can(role, 'productsStock'));

  const productForm = document.getElementById('productForm');
  if (productForm) {
    Array.from(productForm.querySelectorAll('input, select')).forEach((field) => {
      const label = field.parentElement.querySelector('.form-label')?.textContent || '';
      if (role === 'staff') {
        if ('readOnly' in field) field.readOnly = true;
        field.disabled = true;
      } else if (role === 'pharmacist') {
        const canEditStockOnly = /stock/i.test(label);
        if ('readOnly' in field) field.readOnly = !canEditStockOnly;
        field.disabled = !canEditStockOnly;
      } else {
        if ('readOnly' in field) field.readOnly = false;
        field.disabled = false;
      }
    });
  }
}

function renderProducts() {
  const table = document.getElementById('productsTable');
  const form = document.getElementById('productForm');
  const modalElement = document.getElementById('productModal');
  const modalTitle = document.getElementById('productModalTitle');
  const modalCaption = document.getElementById('productFormCaption');
  const saveButton = document.getElementById('saveProductBtn');
  const searchInput = document.getElementById('productSearch');
  const addProductBtn = document.getElementById('addProductBtn');
  const modal = modalElement ? bootstrap.Modal.getOrCreateInstance(modalElement) : null;

  if (!table || !form) return;

  const fields = {
    id: document.getElementById('productIdInput'),
    name: document.getElementById('productNameInput'),
    barcode: document.getElementById('barcodeInput'),
    price: document.getElementById('priceInput'),
    stock: document.getElementById('stockInput'),
    expiration: document.getElementById('expirationInput'),
    shelf: document.getElementById('shelfInput'),
    type: document.getElementById('typeInput')
  };

  let editingProductId = null;
  let stockOnlyMode = false;

  const resetForm = () => {
    form.reset();
    if (fields.id) fields.id.value = '';
    if (fields.type) fields.type.value = 'OTC';
    stockOnlyMode = false;
  };

  const updateModalCopy = () => {
    if (stockOnlyMode) {
      if (modalTitle) modalTitle.textContent = 'Update Stock';
      if (modalCaption) modalCaption.textContent = 'Adjust the live stock count for this product.';
      if (saveButton) saveButton.textContent = 'Save Stock';
      return;
    }

    if (editingProductId) {
      if (modalTitle) modalTitle.textContent = 'Edit Product';
      if (modalCaption) modalCaption.textContent = 'Update pricing, stock, and product details.';
      if (saveButton) saveButton.textContent = 'Save Changes';
      return;
    }

    if (modalTitle) modalTitle.textContent = 'Add Product';
    if (modalCaption) modalCaption.textContent = 'Create a new supply record in the catalog.';
    if (saveButton) saveButton.textContent = 'Save Product';
  };

  const fillForm = (product) => {
    if (!product) return;
    if (fields.id) fields.id.value = product.id;
    if (fields.name) fields.name.value = product.name;
    if (fields.barcode) fields.barcode.value = product.barcode;
    if (fields.price) fields.price.value = product.price;
    if (fields.stock) fields.stock.value = product.stock;
    if (fields.expiration) fields.expiration.value = product.expiration;
    if (fields.shelf) fields.shelf.value = product.shelf;
    if (fields.type) fields.type.value = product.type;
  };

  const getFormProduct = () => {
    const rawName = fields.name?.value.trim() || '';
    const rawBarcode = fields.barcode?.value.trim() || '';
    const rawPrice = Number(fields.price?.value || 0);
    const rawStock = Number(fields.stock?.value || 0);
    const rawExpiration = fields.expiration?.value || '';
    const rawShelf = fields.shelf?.value.trim() || '';
    const rawType = fields.type?.value || 'OTC';

    if (stockOnlyMode) {
      if (!editingProductId) return { error: 'No product selected for stock update.' };
      if (!Number.isFinite(rawStock) || rawStock < 0) return { error: 'Enter a valid stock quantity.' };
      const existingProduct = dataStore.products.find((item) => item.id === editingProductId);
      if (!existingProduct) return { error: 'The selected product no longer exists.' };
      return {
        product: {
          ...existingProduct,
          stock: rawStock
        }
      };
    }

    if (!rawName) return { error: 'Product name is required.' };
    if (!rawBarcode) return { error: 'Barcode is required.' };
    if (!Number.isFinite(rawPrice) || rawPrice <= 0) return { error: 'Enter a valid price greater than zero.' };
    if (!Number.isFinite(rawStock) || rawStock < 0) return { error: 'Enter a valid stock quantity.' };
    if (!rawExpiration) return { error: 'Expiration date is required.' };
    if (!rawShelf) return { error: 'Shelf location is required.' };

    return {
      product: normalizeProduct({
        id: Number(fields.id?.value) || Date.now(),
        name: rawName,
        barcode: rawBarcode,
        price: rawPrice,
        stock: rawStock,
        expiration: rawExpiration,
        shelf: rawShelf,
        type: rawType
      }, Number(fields.id?.value) || Date.now())
    };
  };

  const renderRows = (query = '') => {
    const filteredProducts = dataStore.products
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .filter((item) => {
        const text = `${item.name} ${item.barcode}`.toLowerCase();
        return text.includes(query.toLowerCase());
      });

    const rows = filteredProducts.length
      ? filteredProducts.map((item) => {
          const canEdit = can(user.role, 'productsEdit');
          const canStock = can(user.role, 'productsStock');
          const actions = [];

          if (canEdit) {
            actions.push(`<button class="btn btn-light btn-sm edit-product" data-id="${item.id}"><i class="bi bi-pencil-square"></i></button>`);
            actions.push(`<button class="btn btn-outline-danger btn-sm delete-product" data-id="${item.id}"><i class="bi bi-trash3"></i></button>`);
          } else if (canStock) {
            actions.push(`<button class="btn btn-warning btn-sm edit-stock" data-id="${item.id}"><i class="bi bi-pencil-square"></i> Stock</button>`);
          } else {
            actions.push('<button class="btn btn-outline-secondary btn-sm" disabled>View</button>');
          }

          return `
      <tr>
        <td><div class="fw-semibold">${item.name}</div><small class="text-muted">${item.barcode}</small></td>
        <td>${item.barcode}</td>
        <td><span class="badge ${item.type === 'RX' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} rounded-pill">${item.type}</span></td>
        <td>${peso(item.price)}</td>
        <td>${item.stock}</td>
        <td>${item.expiration}</td>
        <td>${item.shelf}</td>
        <td><span class="badge ${getStatus(item).className} rounded-pill">${getStatus(item).label}</span></td>
        <td>
          <div class="d-flex gap-2">
            ${actions.join('')}
          </div>
        </td>
      </tr>
    `;
        }).join('')
      : '<tr><td colspan="9" class="text-center text-muted py-4">No products matched your search.</td></tr>';

    table.innerHTML = `<thead><tr><th>Product Name</th><th>Barcode</th><th>Type</th><th>Price</th><th>Stock</th><th>Expiration</th><th>Shelf Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody>`;
  };

  addProductBtn?.addEventListener('click', () => {
    editingProductId = null;
    stockOnlyMode = false;
    resetForm();
    updateModalCopy();
  });

  searchInput?.addEventListener('input', (event) => renderRows(event.target.value));

  saveButton?.addEventListener('click', () => {
    if (!(can(user.role, 'productsEdit') || can(user.role, 'productsStock'))) {
      showToast('You do not have permission to save product changes.', 'danger');
      return;
    }

    const { product, error } = getFormProduct();
    if (error) {
      showToast(error, 'danger');
      return;
    }

    const duplicateBarcode = dataStore.products.some((item) => item.barcode.toLowerCase() === product.barcode.toLowerCase() && item.id !== product.id);
    if (!stockOnlyMode && duplicateBarcode) {
      showToast('That barcode already exists in the catalog.', 'danger');
      return;
    }

    if (editingProductId) {
      const existingProduct = dataStore.products.find((item) => item.id === editingProductId);
      if (!existingProduct) {
        showToast('The product you were editing could not be found.', 'danger');
        return;
      }

      dataStore.products = dataStore.products.map((item) => item.id === editingProductId ? { ...existingProduct, ...product, id: editingProductId } : item);
      addNotification('Product updated', `${existingProduct.name} was updated successfully.`, 'info');
      recordAudit(stockOnlyMode ? 'Product stock updated' : 'Product updated', {
        module: 'Products',
        details: stockOnlyMode
          ? `${existingProduct.name} stock changed from ${existingProduct.stock} to ${product.stock}.`
          : `${existingProduct.name} details were updated.`,
        level: 'info'
      });
      showToast(stockOnlyMode ? 'Stock updated successfully.' : 'Product updated successfully.', 'success');
    } else {
      const nextId = dataStore.products.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
      const newProduct = { ...product, id: nextId };
      dataStore.products = [...dataStore.products, newProduct];
      addNotification('Product added', `${newProduct.name} was added to the product catalog.`, 'success');
      recordAudit('Product created', {
        module: 'Products',
        details: `${newProduct.name} was added to the catalog at ${peso(newProduct.price)}.`,
        level: 'success'
      });
      showToast('Product added successfully.', 'success');
    }

    saveDataStore();
    renderRows(searchInput?.value || '');
    modal?.hide();
  });

  table.addEventListener('click', (event) => {
    const editButton = event.target.closest('.edit-product');
    if (editButton) {
      editingProductId = Number(editButton.dataset.id);
      stockOnlyMode = false;
      fillForm(dataStore.products.find((item) => item.id === editingProductId));
      updateModalCopy();
      modal?.show();
      return;
    }

    const editStockButton = event.target.closest('.edit-stock');
    if (editStockButton) {
      editingProductId = Number(editStockButton.dataset.id);
      stockOnlyMode = true;
      fillForm(dataStore.products.find((item) => item.id === editingProductId));
      updateModalCopy();
      modal?.show();
      return;
    }

    const deleteButton = event.target.closest('.delete-product');
    if (!deleteButton) return;

    const productId = Number(deleteButton.dataset.id);
    const product = dataStore.products.find((item) => item.id === productId);
    if (!product) return;

    if (!window.confirm(`Remove ${product.name} from the product catalog?`)) return;

    dataStore.products = dataStore.products.filter((item) => item.id !== productId);
    cart = cart.filter((item) => item.id !== productId);
    persistCart();
    addNotification('Product removed', `${product.name} was removed from the product catalog.`, 'warning');
    recordAudit('Product removed', {
      module: 'Products',
      details: `${product.name} was removed from the catalog.`,
      level: 'warning'
    });
    saveDataStore();
    renderRows(searchInput?.value || '');
    showToast('Product removed successfully.', 'warning');
  });

  modalElement?.addEventListener('hidden.bs.modal', () => {
    editingProductId = null;
    stockOnlyMode = false;
    resetForm();
    updateModalCopy();
  });

  resetForm();
  updateModalCopy();
  renderRows();
}

function renderInventory() {
  const table = document.getElementById('inventoryTable');
  if (table) {
    const rows = dataStore.products.map((item) => `
      <tr>
        <td><div class="fw-semibold">${item.name}</div><small class="text-muted">${item.barcode}</small></td>
        <td>${item.stock}</td>
        <td>${item.expiration}</td>
        <td>${item.shelf}</td>
        <td><span class="badge ${getStatus(item).className} rounded-pill">${getStatus(item).label}</span></td>
      </tr>`).join('');
    table.innerHTML = `<thead><tr><th>Product</th><th>Stock</th><th>Expiration</th><th>Shelf</th><th>Status</th></tr></thead><tbody>${rows}</tbody>`;
  }
  const alerts = document.getElementById('inventoryAlerts');
  if (alerts) {
    alerts.innerHTML = dataStore.products.filter((item) => getStatus(item).label !== 'Normal').map((item) => `
      <div class="alert-item">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h6 class="fw-semibold mb-1">${item.name}</h6>
            <p class="text-muted small mb-0">${item.stock} units available | expires ${item.expiration}</p>
          </div>
          <span class="badge ${getStatus(item).className} rounded-pill">${getStatus(item).label}</span>
        </div>
      </div>`).join('');
  }
  const reorder = document.getElementById('reorderRecommendations');
  if (reorder) {
    reorder.innerHTML = dataStore.products.filter((item) => item.stock <= 28).map((item) => `
      <div class="queue-card">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h6 class="fw-semibold mb-1">${item.name}</h6>
            <p class="text-muted small mb-0">Recommended reorder quantity: ${Math.max(40 - item.stock, 12)} units</p>
          </div>
          <span class="badge ${getStatus(item).className} rounded-pill">${item.stock}</span>
        </div>
      </div>`).join('');
  }
}

function renderReorder() {
  const reorderTable = document.getElementById('reorderTable');
  if (!reorderTable) return;

  const lowStockItems = dataStore.products
    .filter((item) => item.stock <= 20)
    .sort((a, b) => a.stock - b.stock);

  reorderTable.innerHTML = `
    <thead>
      <tr>
        <th>Product</th>
        <th>Current Stock</th>
        <th>Level</th>
        <th>Suggested Reorder Qty</th>
        <th>Shelf</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${lowStockItems.length ? lowStockItems.map((item) => `
        <tr class="${item.stock <= 8 ? 'table-danger' : 'table-warning'}">
          <td>${item.name}</td>
          <td>${item.stock}</td>
          <td><span class="badge ${item.stock <= 8 ? 'bg-danger' : 'bg-warning text-dark'} rounded-pill">${item.stock <= 8 ? 'Critical' : 'Low'}</span></td>
          <td>${Math.max(40 - item.stock, 12)} units</td>
          <td>${item.shelf}</td>
          <td><button class="btn btn-sm btn-success rounded-pill reorder-btn" data-id="${item.id}"><i class="bi bi-bag-plus me-1"></i>Create Reorder</button></td>
        </tr>
      `).join('') : '<tr><td colspan="6" class="text-center text-muted py-4">No low stock items at the moment.</td></tr>'}
    </tbody>
  `;

  reorderTable.querySelectorAll('.reorder-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const item = getProductById(button.dataset.id);
      if (!item) return;
      recordAudit('Reorder request created', {
        module: 'Inventory',
        details: `Requested reorder for ${item.name} (${Math.max(40 - item.stock, 12)} units).`,
        level: item.stock <= 8 ? 'warning' : 'info'
      });
      addNotification('Reorder request sent', `${item.name} reorder created successfully.`, 'info');
      saveDataStore();
      showToast(`Reorder request created for ${item.name}.`, 'success');
    });
  });
}

function persistCart() {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}

function renderSales() {
  const productGrid = document.getElementById('salesProductGrid');
  const cartTable = document.getElementById('cartTable');
  const salesSummaryChip = document.querySelector('.sales-summary-chip');
  const searchInput = document.getElementById('salesSearch');
  const paymentInput = document.getElementById('paymentInput');
  const discountInput = document.getElementById('discountInput');

  const getProductById = (productId) => dataStore.products.find((item) => item.id === Number(productId));

  cart = cart.map((item) => {
    const product = getProductById(item.id);
    if (!product) return null;
    const nextQty = Math.min(Number(item.qty) || 1, product.stock);
    if (nextQty <= 0) return null;
    return {
      ...product,
      qty: Math.max(1, nextQty)
    };
  }).filter(Boolean);

  const drawProducts = (query = '') => {
    if (!productGrid) return;
    const filteredProducts = dataStore.products.filter((item) => (`${item.name} ${item.barcode}`.toLowerCase()).includes(query.toLowerCase()));

    if (!filteredProducts.length) {
      productGrid.innerHTML = `
        <div class="col-12">
          <div class="text-center text-muted py-4 border rounded-4 bg-light-subtle">
            No products matched your search.
          </div>
        </div>`;
      return;
    }

    productGrid.innerHTML = filteredProducts.map((item) => {
      const cartItem = cart.find((entry) => entry.id === item.id);
      const isOutOfStock = item.stock <= 0;
      const hasReachedStockLimit = cartItem && cartItem.qty >= item.stock;
      const typeBadge = item.type === 'RX' 
        ? '<span class="badge bg-danger-subtle text-danger rounded-pill ms-2">RX</span>'
        : '<span class="badge bg-success-subtle text-success rounded-pill ms-2">OTC</span>';
      return `
      <div class="col-md-6">
        <div class="quick-product-card h-100">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h6 class="fw-semibold mb-1">${item.name}${typeBadge}</h6>
              <small class="text-muted">Shelf ${item.shelf}</small>
            </div>
            <span class="badge ${getStatus(item).className} rounded-pill">${item.stock}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <strong>${peso(item.price)}</strong>
            <button class="btn btn-primary btn-sm add-cart-btn" data-id="${item.id}" ${isOutOfStock || hasReachedStockLimit ? 'disabled' : ''}>
              <i class="bi bi-plus-lg me-1"></i>${isOutOfStock ? 'Out of Stock' : hasReachedStockLimit ? 'Max in Cart' : 'Add'}
            </button>
          </div>
        </div>
      </div>`;
    }).join('');
  };

  const getSalesTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = Math.max(0, Number(discountInput?.value || 0));
    const total = Math.max(subtotal - discount, 0);
    return { subtotal, discount, total };
  };

  const updateSalesHeader = () => {
    if (!salesSummaryChip) return;
    const todaySummary = getTodaySalesSummary();
    salesSummaryChip.innerHTML = `<i class="bi bi-receipt-cutoff me-2"></i>Today: ${todaySummary.transactions} transaction${todaySummary.transactions === 1 ? '' : 's'} | ${peso(todaySummary.gross)}`;
  };

  const updateSummary = () => {
    const { subtotal, discount, total } = getSalesTotals();
    document.getElementById('subtotalValue').textContent = peso(subtotal);
    document.getElementById('discountValue').textContent = peso(discount);
    document.getElementById('totalValue').textContent = peso(total);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (paymentMethod === 'cash') {
      const payment = Number(paymentInput?.value || 0);
      document.getElementById('changeValue').textContent = peso(Math.max(payment - total, 0));
    }
  };

  const drawCart = () => {
    if (!cartTable) return;
    if (!cart.length) {
      cartTable.innerHTML = '<thead><tr><th>Item</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr></thead><tbody><tr><td colspan="6" class="text-center text-muted py-4">Cart is empty. Add products to start a transaction.</td></tr></tbody>';
    } else {
      const rows = cart.map((item) => {
        const typeBadge = item.type === 'RX' 
          ? '<span class="badge bg-danger-subtle text-danger rounded-pill ms-1">RX</span>'
          : '<span class="badge bg-success-subtle text-success rounded-pill ms-1">OTC</span>';
        return `
        <tr>
          <td>${item.name}</td>
          <td>${typeBadge}</td>
          <td>
            <div class="d-flex align-items-center gap-2 quantity-stepper">
              <button class="btn btn-light btn-sm qty-btn" data-id="${item.id}" data-action="decrease">-</button>
              <input
                type="number"
                class="form-control form-control-sm cart-qty-input"
                data-id="${item.id}"
                value="${item.qty}"
                min="1"
                max="${item.stock}"
                inputmode="numeric"
                aria-label="Quantity for ${item.name}"
              >
              <button class="btn btn-light btn-sm qty-btn" data-id="${item.id}" data-action="increase">+</button>
            </div>
          </td>
          <td>${peso(item.price)}</td>
          <td>${peso(item.price * item.qty)}</td>
          <td><button class="btn btn-outline-danger btn-sm remove-item" data-id="${item.id}"><i class="bi bi-x-lg"></i></button></td>
        </tr>`;
      }).join('');
      cartTable.innerHTML = `<thead><tr><th>Item</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr></thead><tbody>${rows}</tbody>`;
    }
    updateSummary();
    persistCart();
  };

  const refreshSalesView = () => {
    drawProducts(searchInput?.value || '');
    drawCart();
    updateSalesHeader();
  };

  // Discount input listener
  discountInput?.addEventListener('input', updateSummary);

  searchInput?.addEventListener('input', (event) => drawProducts(event.target.value));

  productGrid?.addEventListener('click', (event) => {
    const addButton = event.target.closest('.add-cart-btn');
    if (!addButton) return;

    const product = getProductById(addButton.dataset.id);
    if (!product) return;

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      if (existingItem.qty >= product.stock) {
        showToast(`Only ${product.stock} units of ${product.name} are currently in stock.`, 'warning');
        return;
      }
      existingItem.qty += 1;
    } else {
      cart = [...cart, { ...product, qty: 1 }];
    }

    refreshSalesView();
    showToast(`${product.name} added to cart.`, 'success');
  });

  cartTable?.addEventListener('click', (event) => {
    const qtyButton = event.target.closest('.qty-btn');
    if (qtyButton) {
      const productId = Number(qtyButton.dataset.id);
      const action = qtyButton.dataset.action;
      const cartItem = cart.find((item) => item.id === productId);
      const product = getProductById(productId);
      if (!cartItem || !product) return;

      if (action === 'increase') {
        if (cartItem.qty >= product.stock) {
          showToast(`You already reached the available stock for ${product.name}.`, 'warning');
          return;
        }
        cartItem.qty += 1;
      }

      if (action === 'decrease') {
        if (cartItem.qty === 1) {
          cart = cart.filter((item) => item.id !== productId);
        } else {
          cartItem.qty -= 1;
        }
      }

      refreshSalesView();
      return;
    }

    const removeButton = event.target.closest('.remove-item');
    if (!removeButton) return;

    const productId = Number(removeButton.dataset.id);
    const removedItem = cart.find((item) => item.id === productId);
    cart = cart.filter((item) => item.id !== productId);
    refreshSalesView();

    if (removedItem) {
      showToast(`${removedItem.name} removed from cart.`, 'warning');
    }
  });

  cartTable?.addEventListener('change', (event) => {
    const qtyInput = event.target.closest('.cart-qty-input');
    if (!qtyInput) return;

    const productId = Number(qtyInput.dataset.id);
    const cartItem = cart.find((item) => item.id === productId);
    const product = getProductById(productId);
    if (!cartItem || !product) return;

    const requestedQty = Number(qtyInput.value);
    if (!Number.isFinite(requestedQty) || requestedQty < 1) {
      qtyInput.value = cartItem.qty;
      showToast('Quantity must be at least 1.', 'warning');
      return;
    }

    if (requestedQty > product.stock) {
      cartItem.qty = product.stock;
      refreshSalesView();
      showToast(`Only ${product.stock} units of ${product.name} are available.`, 'warning');
      return;
    }

    cartItem.qty = requestedQty;
    refreshSalesView();
  });

  // Payment method toggle
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const method = e.target.value;
      document.getElementById('cashSection').style.display = method === 'cash' ? 'block' : 'none';
      document.getElementById('onlineSection').style.display = method === 'online' ? 'block' : 'none';
      updateSummary();
    });
  });

  // Online confirm
  document.getElementById('confirmOnlineBtn')?.addEventListener('click', generateReceipt);

  // Cash payment input
  paymentInput?.addEventListener('input', updateSummary);

  document.getElementById('clearCartBtn')?.addEventListener('click', () => {
    cart = [];
    refreshSalesView();
    showToast('Cart cleared.', 'warning');
  });

  document.getElementById('generateReceiptBtn')?.addEventListener('click', generateReceipt);
  document.getElementById('printReceiptBtn')?.addEventListener('click', () => {
    const receiptBody = buildReceiptBodyHtml();
    if (!receiptBody) {
      showToast('Generate a receipt first before printing.', 'warning');
      return;
    }
    openPrintDocument('PharmaSys Receipt', receiptBody);
  });

  function legacyGenerateReceipt() {
    const { subtotal, discount, total } = getSalesTotals();
    if (!cart.length) return showToast('Add at least one product before generating a receipt.', 'danger');
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (paymentMethod === 'cash') {
      const payment = Number(paymentInput?.value || 0);
      if (payment < total) return showToast('Payment amount is not enough for this sale.', 'danger');
    }

    const unavailableItem = cart.find((item) => {
      const currentProduct = getProductById(item.id);
      return !currentProduct || currentProduct.stock < item.qty;
    });
    if (unavailableItem) {
      const currentProduct = getProductById(unavailableItem.id);
      if (!currentProduct) {
        return showToast(`${unavailableItem.name} is no longer available in inventory.`, 'danger');
      }
      return showToast(`${unavailableItem.name} only has ${currentProduct.stock} unit${currentProduct.stock === 1 ? '' : 's'} left.`, 'danger');
    }

    const rxItems = cart.some((item) => item.type === 'RX');
    const payment = paymentMethod === 'cash' ? Number(paymentInput?.value || 0) : total;
    const change = paymentMethod === 'cash' ? Math.max(payment - total, 0) : 0;
    const createdAt = new Date().toISOString();
    const receiptId = `TXN-${createDateKey(createdAt).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`;

    dataStore.products = dataStore.products.map((product) => {
      const soldItem = cart.find((item) => item.id === product.id);
      if (!soldItem) return product;
      return {
        ...product,
        stock: Math.max(0, product.stock - soldItem.qty)
      };
    });

    const completedTransaction = normalizeTransaction({
      id: receiptId,
      createdAt,
      items: cart.map((item) => ({
        productId: item.id,
        name: item.name,
        type: item.type,
        qty: item.qty,
        price: item.price
      })),
      subtotal,
      discount,
      total,
      paymentMethod,
      payment,
      change
    }, receiptId);

    dataStore.transactions = [completedTransaction, ...dataStore.transactions];
    addNotification('Sale completed', `${receiptId} was processed for ${peso(total)}.`, 'success');
    recordAudit('Sale completed', {
      module: 'Sales',
      details: `${receiptId} processed ${completedTransaction.items.length} item(s) for ${peso(total)} via ${paymentMethod.toUpperCase()}.`,
      level: 'success'
    });

    completedTransaction.items.forEach((item) => {
      const updatedProduct = getProductById(item.productId);
      if (!updatedProduct) return;
      if (updatedProduct.stock <= 8) {
        addNotification('Critical stock alert', `${updatedProduct.name} is down to ${updatedProduct.stock} units.`, 'danger');
      } else if (updatedProduct.stock <= 20) {
        addNotification('Low stock warning', `${updatedProduct.name} now has ${updatedProduct.stock} units remaining.`, 'warning');
      }
    });

    saveDataStore();
    document.getElementById('receiptContent').innerHTML = `
      <div class="text-center mb-3">
        <h5 class="fw-bold mb-1">PharmaSys Supplies</h5>
        <p class="text-muted mb-0">Receipt | ${new Date().toLocaleString()}</p>
      </div>
      <div class="d-grid gap-2 mb-3">
        ${cart.map((item) => `<div class="d-flex justify-content-between"><span>${item.name} (${item.type}) x${item.qty}</span><span>${peso(item.price * item.qty)}</span></div>`).join('')}
      </div>
      <hr>
      <div class="d-flex justify-content-between"><span>Subtotal</span><span>${peso(subtotal)}</span></div>
      <div class="d-flex justify-content-between"><span>Discount</span><span>${peso(discount)}</span></div>
      <div class="d-flex justify-content-between fw-bold"><span>Total</span><span>${peso(total)}</span></div>
      <div class="d-flex justify-content-between"><span>Payment Method</span><span>${paymentMethod.toUpperCase()}</span></div>
      ${paymentMethod === 'cash' ? `<div class="d-flex justify-content-between"><span>Paid</span><span>${peso(payment)}</span></div>
      <div class="d-flex justify-content-between"><span>Change</span><span>${peso(payment - total)}</span></div>` : ''}
      ${rxItems ? '<div class="alert alert-warning border-0 rounded-3 mt-2 mb-0 small"><i class="bi bi-exclamation-triangle me-1"></i>Regulated items released - compliance check verified.</div>' : ''}
      <div class="alert alert-success border-0 rounded-4 mt-3 mb-0 text-center">Transaction completed successfully.</div>
    `;
    new bootstrap.Modal(document.getElementById('receiptModal')).show();
    cart = [];
    if (discountInput) discountInput.value = '';
    if (paymentInput) paymentInput.value = '';
    refreshSalesView();
  }

  function generateReceipt() {
    const { subtotal, discount, total } = getSalesTotals();
    if (!cart.length) return showToast('Add at least one product before generating a receipt.', 'danger');

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (paymentMethod === 'cash') {
      const paymentAmount = Number(paymentInput?.value || 0);
      if (paymentAmount < total) return showToast('Payment amount is not enough for this sale.', 'danger');
    }

    const unavailableItem = cart.find((item) => {
      const currentProduct = getProductById(item.id);
      return !currentProduct || currentProduct.stock < item.qty;
    });
    if (unavailableItem) {
      const currentProduct = getProductById(unavailableItem.id);
      if (!currentProduct) {
        return showToast(`${unavailableItem.name} is no longer available in inventory.`, 'danger');
      }
      return showToast(`${unavailableItem.name} only has ${currentProduct.stock} unit${currentProduct.stock === 1 ? '' : 's'} left.`, 'danger');
    }

    const rxItems = cart.some((item) => item.type === 'RX');
    const payment = paymentMethod === 'cash' ? Number(paymentInput?.value || 0) : total;
    const change = paymentMethod === 'cash' ? Math.max(payment - total, 0) : 0;
    const createdAt = new Date().toISOString();
    const receiptId = `TXN-${createDateKey(createdAt).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`;
    const receiptItems = cart.map((item) => ({ ...item }));

    dataStore.products = dataStore.products.map((product) => {
      const soldItem = receiptItems.find((item) => item.id === product.id);
      if (!soldItem) return product;
      return {
        ...product,
        stock: Math.max(0, product.stock - soldItem.qty)
      };
    });

    const completedTransaction = normalizeTransaction({
      id: receiptId,
      createdAt,
      items: receiptItems.map((item) => ({
        productId: item.id,
        name: item.name,
        type: item.type,
        qty: item.qty,
        price: item.price
      })),
      subtotal,
      discount,
      total,
      paymentMethod,
      payment,
      change
    }, receiptId);

    dataStore.transactions = [completedTransaction, ...dataStore.transactions];
    addNotification('Sale completed', `${receiptId} was processed for ${peso(total)}.`, 'success');
    recordAudit('Sale completed', {
      module: 'Sales',
      details: `${receiptId} processed ${completedTransaction.items.length} item(s) for ${peso(total)} via ${paymentMethod.toUpperCase()}.`,
      level: 'success'
    });

    completedTransaction.items.forEach((item) => {
      const updatedProduct = getProductById(item.productId);
      if (!updatedProduct) return;
      if (updatedProduct.stock <= 8) {
        addNotification('Critical stock alert', `${updatedProduct.name} is down to ${updatedProduct.stock} units.`, 'danger');
      } else if (updatedProduct.stock <= 20) {
        addNotification('Low stock warning', `${updatedProduct.name} now has ${updatedProduct.stock} units remaining.`, 'warning');
      }
    });

    saveDataStore();
    document.getElementById('receiptContent').innerHTML = `
      <div class="text-center mb-3">
        <h5 class="fw-bold mb-1">PharmaSys Supplies</h5>
        <p class="text-muted mb-0">Receipt ${receiptId} | ${new Date(createdAt).toLocaleString()}</p>
      </div>
      <div class="d-grid gap-2 mb-3">
        ${receiptItems.map((item) => `<div class="d-flex justify-content-between"><span>${item.name} (${item.type}) x${item.qty}</span><span>${peso(item.price * item.qty)}</span></div>`).join('')}
      </div>
      <hr>
      <div class="d-flex justify-content-between"><span>Subtotal</span><span>${peso(subtotal)}</span></div>
      <div class="d-flex justify-content-between"><span>Discount</span><span>${peso(discount)}</span></div>
      <div class="d-flex justify-content-between fw-bold"><span>Total</span><span>${peso(total)}</span></div>
      <div class="d-flex justify-content-between"><span>Payment Method</span><span>${paymentMethod.toUpperCase()}</span></div>
      ${paymentMethod === 'cash' ? `<div class="d-flex justify-content-between"><span>Paid</span><span>${peso(payment)}</span></div>
      <div class="d-flex justify-content-between"><span>Change</span><span>${peso(change)}</span></div>` : ''}
      ${rxItems ? '<div class="alert alert-warning border-0 rounded-3 mt-2 mb-0 small"><i class="bi bi-exclamation-triangle me-1"></i>Regulated items released - compliance check verified.</div>' : ''}
      <div class="alert alert-success border-0 rounded-4 mt-3 mb-0 text-center">Transaction completed successfully.</div>
    `;
    new bootstrap.Modal(document.getElementById('receiptModal')).show();
    cart = [];
    if (discountInput) discountInput.value = '';
    if (paymentInput) paymentInput.value = '';
    refreshSalesView();
  }

  refreshSalesView();
}


function renderReports() {
  const printReportsBtn = document.getElementById('printReportsBtn');
  const exportReportsBtn = document.getElementById('exportReportsBtn');
  const reportScopeSelect = document.getElementById('reportScopeSelect');
  const reportSections = Object.fromEntries(getReportSections().map((section) => [section.key, section]));

  const renderReportTable = (tableId, sectionKey) => {
    const table = document.getElementById(tableId);
    const section = reportSections[sectionKey];
    if (!table || !section) return;
    table.innerHTML = `<thead>${section.tableHeadHtml}</thead><tbody>${section.tableBodyHtml}</tbody>`;
  };

  renderReportTable('salesReportTable', 'sales');
  renderReportTable('inventoryReportTable', 'inventory');
  renderReportTable('expirationReportTable', 'expiration');
  renderReportTable('userAccessTable', 'users');
  renderReportTable('auditTrailTable', 'audit');

  const getSelectedScope = () => reportScopeSelect?.value || 'all';

  if (printReportsBtn) {
    printReportsBtn.onclick = () => {
      const scope = getSelectedScope();
      const scopeMeta = getReportScopeMeta(scope);
      recordAudit('Reports printed', {
        module: 'Reports',
        details: `Printed the ${scopeMeta.label}.`,
        level: 'info'
      });
      saveDataStore();
      openPrintDocument(scopeMeta.title, buildReportBodyHtml(scope));
    };
  }

  if (exportReportsBtn) {
    exportReportsBtn.onclick = () => {
      const scope = getSelectedScope();
      const scopeMeta = getReportScopeMeta(scope);
      const filename = `${scopeMeta.filenameBase}-${createDateKey()}.html`;
      recordAudit('Reports exported', {
        module: 'Reports',
        details: `Exported the ${scopeMeta.label} as ${filename}.`,
        level: 'success'
      });
      saveDataStore();
      downloadTextFile(filename, buildPrintableDocument(scopeMeta.title, buildReportBodyHtml(scope)), 'text/html;charset=utf-8');
      showToast(`Exported ${scopeMeta.label} as ${filename}.`, 'success');
    };
  }
}

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const usernameInput = document.getElementById('username');
  const resetForm = document.getElementById('forgotPasswordForm');
  const resetIdentityInput = document.getElementById('resetIdentity');
  const resetModalElement = document.getElementById('forgotPasswordModal');
  const resetModal = resetModalElement ? bootstrap.Modal.getOrCreateInstance(resetModalElement) : null;

  resetModalElement?.addEventListener('show.bs.modal', () => {
    if (!resetIdentityInput) return;
    const username = usernameInput?.value.trim();
    resetIdentityInput.value = username || '';
  });

  resetForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const identity = resetIdentityInput?.value.trim();
    if (!identity) {
      showToast('Enter your username or email to continue.', 'warning');
      return;
    }

    const managedAccount = dataStore.users.find((account) => {
      const lookup = identity.toLowerCase();
      return account.username.toLowerCase() === lookup
        || account.email.toLowerCase() === lookup
        || account.name.toLowerCase() === lookup;
    });

    recordAudit('Password reset requested', {
      module: 'Authentication',
      details: `Password reset instructions were requested for ${managedAccount?.name || identity}.`,
      level: 'warning',
      actorName: managedAccount?.name || identity,
      actorRole: managedAccount?.role || 'system'
    });
    saveDataStore();
    resetModal?.hide();
    resetForm.reset();
    showToast(`Demo reset instructions sent for ${identity}. Use any password to sign in.`, 'success');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const overlay = document.getElementById('loadingOverlay');
    const selectedRole = document.getElementById('role').value;
    const identity = usernameInput?.value.trim() || 'Demo User';
    const lookup = identity.toLowerCase();
    const managedAccount = dataStore.users.find((account) =>
      account.username.toLowerCase() === lookup
      || account.email.toLowerCase() === lookup
      || account.name.toLowerCase() === lookup
    );

    if (managedAccount?.status === 'Inactive') {
      recordAudit('Login blocked', {
        module: 'Authentication',
        details: `Login attempt blocked for inactive account ${managedAccount.name}.`,
        level: 'danger',
        actorName: managedAccount.name,
        actorRole: managedAccount.role,
        actorId: managedAccount.id
      });
      saveDataStore();
      showToast('This account is inactive. Contact an admin to restore access.', 'danger');
      return;
    }

    const role = managedAccount?.role || selectedRole;
    const displayName = managedAccount?.name || identity;

    if (managedAccount) {
      const lastLogin = new Date().toISOString();
      dataStore.users = dataStore.users.map((account) => account.id === managedAccount.id ? {
        ...account,
        status: 'Active',
        lastLogin
      } : account);
      localStorage.setItem(STORAGE_KEYS.sessionUserId, managedAccount.id);
      localStorage.setItem('pharmacyUser', managedAccount.name);
      localStorage.setItem('pharmacyRole', managedAccount.role);
      recordAudit('Managed account login', {
        module: 'Authentication',
        details: `${managedAccount.name} signed in to the ${formatRoleLabel(managedAccount.role)} dashboard.`,
        level: 'success',
        actorName: managedAccount.name,
        actorRole: managedAccount.role,
        actorId: managedAccount.id
      });
    } else {
      localStorage.removeItem(STORAGE_KEYS.sessionUserId);
      localStorage.setItem('pharmacyUser', identity);
      localStorage.setItem('pharmacyRole', role);
      recordAudit('Demo login', {
        module: 'Authentication',
        details: `${displayName} signed in using the ${formatRoleLabel(role)} demo access path.`,
        level: 'success',
        actorName: displayName,
        actorRole: role
      });
    }

    saveDataStore();
    overlay?.classList.add('active');
    setTimeout(() => {
      window.location.href = routes[role];
    }, 1200);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  renderShell();
  const page = document.documentElement.dataset.page;
  if (page === 'admin-dashboard') renderAdmin();
  if (page === 'pharmacist-dashboard') renderPharmacist();
  if (page === 'staff-dashboard') renderStaff();
  if (page === 'products') renderProducts();
  if (page === 'inventory') renderInventory();
  if (page === 'reorder') renderReorder();
  if (page === 'sales') renderSales();
  if (page === 'reports') renderReports();
  applyRoleRestrictions();
});

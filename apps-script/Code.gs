/**
 * ECOMMERCE PRODUCT MANAGEMENT SYSTEM (Google Sheets + Drive + Apps Script)  -- v3
 * Paste this whole file into Code.gs of your spreadsheet's Apps Script project.
 *
 * v3 changes: the WEBSITE never reads stock (it follows only the Status column). Stock/Sold Qty stay in the sheet for you and Order Manager. Website API with secret + duplicate-order protection,
 * delivery charge comes from the website code, colours/sizes read from the product Description.
 *
 * ONE-TIME SETUP (Project Settings > Script properties):
 *   API_SECRET   = long random string (same value in the website's .env.local). Run generateToken() to make one.
 * If you removed the Stock / Sold Qty formulas earlier, run restoreStockFormulas() once. Then Deploy > Manage deployments > pencil > New version.
 */

/* ================== 1. CONFIG ================== */
const FOLDER_ID = '15r5qAkNT8C5My9NVHnliF-bV_jEeTOBn';          // Drive folder "Ecommerce Product Images"

const CURRENCY_FORMAT = '"৳"#,##0.00';

/* ================== 2. CONSTANTS ================== */
const S = { DASH: 'Dashboard', PROD: 'Products', CAT: 'Categories', ORD: 'Orders', EXP: 'Expenses', WD: 'Withdrawals', SET: 'Settings' };
const PROD_HEADERS = ['Product ID','Product Name','Gender','Category','Price','Old Price','Description','Stock (Remaining, auto)','Status','Image 1','Image 2','Image 3','Created Date','Updated Date','Purchase Price (per unit)','Purchased Qty','Sold Qty (auto)','Total Buy Cost (auto)'];
const CAT_HEADERS  = ['Gender','Category','Status'];
const ORD_HEADERS  = ['Order ID','Order Date','Customer Name','Phone','Email','Address','City/Area','Product ID','Product Name','Product Image','Quantity','Product Price','Subtotal','Delivery Charge','Total','Payment Method','Order Status','Delivery Note','Source','Courier Action','Courier Status','Consignment ID','Item Description','Track Link'];
const EXP_HEADERS  = ['Date','Type','Description','Amount'];
const WD_HEADERS   = ['Date','Amount','Note'];
const GENDERS  = ['Male','Female'];
const STATUSES = ['Active','Inactive','Out of Stock'];
const ORDER_STATUSES = ['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'];
const PAYMENTS = ['Cash on Delivery','Cash (Local Sale)'];
const EXPENSE_TYPES = ['Delivery Charge','Transport Cost','Other'];
const ORDER_COLORS = {
  'Pending':['#fef3c7','#92400e'], 'Confirmed':['#dbeafe','#1e40af'], 'Processing':['#ede9fe','#5b21b6'],
  'Shipped':['#cffafe','#155e75'], 'Delivered':['#dcfce7','#166534'], 'Cancelled':['#fee2e2','#991b1b']
};
const PCOLS = 18;   // Products columns
const OCOLS = 24;   // Orders columns

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(n) { const s = ss_().getSheetByName(n); if (!s) throw new Error('Missing sheet "' + n + '". Run Store Manager → Setup / Repair Spreadsheet.'); return s; }

/* ================== 3. MENU + UI ================== */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('🛍 Store Manager')
    .addItem('Product Manager (large window)', 'showDialog')
    .addItem('Order Manager (large window)', 'showOrderDialog')
    .addItem('Product Manager (sidebar)', 'showSidebar')
    .addItem('Order Manager (sidebar)', 'showOrderSidebar')
    .addSeparator()
    .addItem('Setup / Repair Spreadsheet (Dashboard is not touched)', 'setupSpreadsheet')
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Repair one part (if setup times out)')
      .addItem('0. Lighten sheet (run this first)', 'lightenSheet')
      .addItem('1. Settings + Categories', 'repairBasics')
      .addItem('2. Products', 'repairProducts')
      .addItem('3. Orders', 'repairOrders')
      .addItem('4. Expenses + Withdrawals', 'repairMoney'))
    .addItem('Test Drive folder (authorize)', 'testDriveFolder')
    .addSubMenu(SpreadsheetApp.getUi().createMenu('🚚 Steadfast Courier')
      .addItem('1. Set API keys', 'setSteadfastKeys')
      .addItem('2. Enable automation (one-time)', 'installCourierTriggers')
      .addItem('Check balance (test keys)', 'checkSteadfastBalance')
      .addItem('Refresh courier status now', 'refreshCourierNow'))
    .addToUi();
}
function showSidebar() { SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile('ProductManager').setTitle('Product Manager')); }
function showDialog() { SpreadsheetApp.getUi().showModelessDialog(HtmlService.createHtmlOutputFromFile('ProductManager').setWidth(1000).setHeight(720), 'Product Manager'); }
function showOrderSidebar() { SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile('OrderManager').setTitle('Order Manager')); }
function showOrderDialog() { SpreadsheetApp.getUi().showModelessDialog(HtmlService.createHtmlOutputFromFile('OrderManager').setWidth(1100).setHeight(740), 'Order Manager'); }
function testDriveFolder() {
  const f = DriveApp.getFolderById(FOLDER_ID);
  SpreadsheetApp.getUi().alert('✓ Drive folder found: "' + f.getName() + '"');
}

/** Run ONCE from the editor: puts the Stock (H) and Sold Qty (Q) formulas back on the Products sheet.
 *  They are for YOU and the Order Manager only. The website never reads them. Empty rows cost nothing (formula starts with IF($A="","",...)). */
function restoreStockFormulas() {
  const sh = sheet_(S.PROD); ensureRows_(sh, 1000);
  const H = [], Q = [];
  for (let r = 2; r <= 1000; r++) { const f = prodFormulas_(r); H.push([f[0]]); Q.push([f[1]]); }
  sh.getRange(2, 8, 999, 1).setFormulas(H); sh.getRange(2, 17, 999, 1).setFormulas(Q);
  sh.getRange('H2:H1000').setNumberFormat('0'); sh.getRange('Q2:Q1000').setNumberFormat('0');
  sh.getRange('H2:H1000').setBackground('#f1f5f9'); sh.getRange('Q2:Q1000').setBackground('#f1f5f9');
  sh.getRange(1, 8).setValue(PROD_HEADERS[7]); sh.getRange(1, 17).setValue(PROD_HEADERS[16]);
  clearCache_();
  ss_().toast('Stock and Sold Qty formulas restored.', 'Setup', 6);
}

/** RUN THIS FIRST if setup is slow/times out. It removes the heavy leftovers of the old stock system:
 *  - old conditional-format rules on Products / Orders (the alternating-colour rule was extremely slow)
 *  Your products, orders, prices, images, expenses and withdrawals are NOT touched. */
function lightenSheet() {
  const t0 = Date.now(), lap = (m) => Logger.log(Math.round((Date.now() - t0) / 1000) + 's  ' + m);
  const prod = sheet_(S.PROD);
  prod.clearConditionalFormatRules();        lap('Products: old colour rules removed');
  sheet_(S.ORD).clearConditionalFormatRules(); lap('Orders: old colour rules removed');
  clearCache_();
  ss_().toast('Sheet lightened in ' + Math.round((Date.now() - t0) / 1000) + 's. Now run Repair one part: 2 (Products) and 3 (Orders).', 'Setup', 10);
}

/* ================== 4. SPREADSHEET SETUP (safe to re-run any time) ================== */
/** Run from the editor if setup is slow. The Execution log shows how many seconds each sheet takes. */
function timeSetup() {
  ensureSheets_();
  [['Settings', setupSettings_], ['Categories', setupCategories_], ['Orders', setupOrders_], ['Expenses', setupExpenses_], ['Withdrawals', setupWithdrawals_], ['Products', setupProducts_]].forEach(p => {
    const t = Date.now();
    try { p[1](); Logger.log(p[0] + ': ' + ((Date.now() - t) / 1000) + 's'); }
    catch (e) { Logger.log(p[0] + ' FAILED after ' + ((Date.now() - t) / 1000) + 's: ' + e.message); }
  });
}

/** Each part runs on its own, so a slow connection or a big sheet cannot time out the whole setup. */
function repairPart_(label, fn) {
  const t = Date.now(); Logger.log('START ' + label); fn(); SpreadsheetApp.flush();
  const sec = Math.round((Date.now() - t) / 1000); Logger.log('DONE  ' + label + ' in ' + sec + 's');
  ss_().toast(label + ' done in ' + sec + 's', 'Setup', 6);
}
function repairBasics() { ensureSheets_(); repairPart_('Settings + Categories', () => { setupSettings_(); setupCategories_(); }); }
function repairProducts() { ensureSheets_(); repairPart_('Products', setupProducts_); }
function repairOrders() { ensureSheets_(); repairPart_('Orders', setupOrders_); }
function repairMoney() { ensureSheets_(); repairPart_('Expenses + Withdrawals', () => { setupExpenses_(); setupWithdrawals_(); }); }
function ensureSheets_() {
  const ss = ss_();
  [S.DASH, S.PROD, S.CAT, S.ORD, S.EXP, S.WD, S.SET].forEach(n => { if (!ss.getSheetByName(n)) ss.insertSheet(n); });
}

function setupSpreadsheet() {
  const ss = ss_();
  const order = [S.DASH, S.PROD, S.CAT, S.ORD, S.EXP, S.WD, S.SET];
  ensureSheets_();
  const def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) ss.deleteSheet(def);
  order.forEach((n, i) => { ss.setActiveSheet(ss.getSheetByName(n)); ss.moveActiveSheet(i + 1); });

  repairPart_('Settings', setupSettings_); repairPart_('Categories', setupCategories_); repairPart_('Orders', setupOrders_);
  repairPart_('Expenses', setupExpenses_); repairPart_('Withdrawals', setupWithdrawals_); repairPart_('Products', setupProducts_);
  SpreadsheetApp.getUi().alert('✓ Spreadsheet is ready (v3). Open Store Manager → Product Manager / Order Manager.');
}

function header_(sh, headers, autoCols) {
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  (autoCols || []).forEach(c => sh.getRange(1, c).setBackground('#475569'));   // grey header = automatic column
  sh.setFrozenRows(1); sh.setRowHeight(1, 40);
  if (!sh.getFilter()) sh.getRange(1, 1, Math.max(sh.getMaxRows(), 2), headers.length).createFilter();
}
function widths_(sh, arr) { arr.forEach((w, i) => sh.setColumnWidth(i + 1, w)); }
function dv_(values) { return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build(); }
function cf_(range, text, bg, fg) {
  return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text).setBackground(bg).setFontColor(fg).setRanges([range]).build();
}
function ensureRows_(sh, n) { const m = sh.getMaxRows(); if (m < n) sh.insertRowsAfter(m, n - m); }

function setupSettings_() {
  const sh = sheet_(S.SET);
  sh.getRange('A1:B1').setValues([['Setting', 'Value']]).setFontWeight('bold').setBackground('#1f2937').setFontColor('#fff');
  const defaults = [['Opening Capital', 0], ['Count Delivery Charge as Income (Yes/No)', 'Yes'],
    ['Steadfast: Auto-update Order Status (Yes/No)', 'No'], ['Steadfast: Return Request on Remove (Yes/No)', 'No']];
  const have = {}; const n = sh.getLastRow() - 1;
  if (n > 0) sh.getRange(2, 1, n, 1).getValues().forEach(r => { have[r[0]] = true; });
  defaults.forEach(d => { if (!have[d[0]]) sh.getRange(Math.max(sh.getLastRow(), 1) + 1, 1, 1, 2).setValues([d]); });
  for (let r = 2; r <= sh.getLastRow(); r++) {
    if (String(sh.getRange(r, 1).getValue()).indexOf('(Yes/No)') > 0) sh.getRange(r, 2).setDataValidation(dv_(['Yes', 'No']));
  }
  sh.getRange('E1').setValue('Active Categories (auto)').setFontWeight('bold').setBackground('#1f2937').setFontColor('#fff');
  sh.getRange('E2').setFormula('=IFERROR(UNIQUE(FILTER(Categories!B2:B,Categories!C2:C="Active")),"")');
  widths_(sh, [300, 160, 30, 30, 220]);
}

function setupCategories_() {
  const sh = sheet_(S.CAT);
  header_(sh, CAT_HEADERS);
  if (sh.getLastRow() < 2) {
    const rows = [];
    GENDERS.forEach(g => ['Shirt', 'T-Shirt', 'Pant', 'Watch'].forEach(c => rows.push([g, c, 'Active'])));
    sh.getRange(2, 1, rows.length, 3).setValues(rows);
  }
  sh.getRange(2, 1, 999, 1).setDataValidation(dv_(GENDERS));
  sh.getRange(2, 3, 999, 1).setDataValidation(dv_(['Active', 'Inactive']));
  widths_(sh, [120, 200, 120]);
  const st = sh.getRange('C2:C1000');
  sh.setConditionalFormatRules([cf_(st, 'Active', '#dcfce7', '#166534'), cf_(st, 'Inactive', '#e5e7eb', '#374151')]);
}

/** Products formulas. H = Stock remaining, Q = Sold qty (FIFO by product name, sheet order), R = Total buy cost. For you + Order Manager only. */
function prodFormulas_(r) {
  const prior = '$P$1:$P' + (r - 1), priorN = '$B$1:$B' + (r - 1);
  return [
    '=IF($A' + r + '="","",N($P' + r + ')-N($Q' + r + '))',
    '=IF($A' + r + '="","",MAX(0,MIN(N($P' + r + '),SUMIFS(Orders!$K$2:$K$5000,Orders!$I$2:$I$5000,$B' + r + ',Orders!$Q$2:$Q$5000,"<>Cancelled")-SUMIFS(' + prior + ',' + priorN + ',$B' + r + '))))',
    '=IF($A' + r + '="","",N($O' + r + ')*N($P' + r + '))'
  ];
}
function setRowFormulas_(sh, r) {
  const f = prodFormulas_(r);
  sh.getRange(r, 8).setFormula(f[0]); sh.getRange(r, 17).setFormula(f[1]); sh.getRange(r, 18).setFormula(f[2]);
}

function setupProducts_() {
  const sh = sheet_(S.PROD);
  ensureRows_(sh, 1000);
  header_(sh, PROD_HEADERS, [8, 17, 18]);
  widths_(sh, [90, 200, 80, 110, 90, 90, 300, 90, 110, 220, 220, 220, 150, 150, 110, 100, 90, 120]);
  const H = [], Q = [], R = [];
  for (let r = 2; r <= 1000; r++) { const f = prodFormulas_(r); H.push([f[0]]); Q.push([f[1]]); R.push([f[2]]); }
  sh.getRange(2, 8, 999, 1).setFormulas(H); sh.getRange(2, 17, 999, 1).setFormulas(Q); sh.getRange(2, 18, 999, 1).setFormulas(R);

  sh.getRange('E2:F1000').setNumberFormat(CURRENCY_FORMAT);
  sh.getRange('O2:O1000').setNumberFormat(CURRENCY_FORMAT);
  sh.getRange('R2:R1000').setNumberFormat(CURRENCY_FORMAT);
  sh.getRange('H2:H1000').setNumberFormat('0'); sh.getRange('P2:Q1000').setNumberFormat('0');
  sh.getRange('M2:N1000').setNumberFormat('yyyy-mm-dd hh:mm');
  sh.getRange('G2:G1000').setWrap(true);
  sh.getRange('H2:H1000').setBackground('#f1f5f9'); sh.getRange('Q2:R1000').setBackground('#f1f5f9');
  sh.getRange('C2:C1000').setDataValidation(dv_(GENDERS));
  sh.getRange('I2:I1000').setDataValidation(dv_(STATUSES));
  sh.getRange('D2:D1000').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(sheet_(S.SET).getRange('E2:E200'), true).setAllowInvalid(false).build());
  const status = sh.getRange('I2:I1000');
  sh.setConditionalFormatRules([
    cf_(status, 'Active', '#dcfce7', '#166534'), cf_(status, 'Inactive', '#e5e7eb', '#374151'), cf_(status, 'Out of Stock', '#fee2e2', '#991b1b')
  ]);
}

function setupOrders_() {
  const sh = sheet_(S.ORD);
  ensureRows_(sh, 5001);
  header_(sh, ORD_HEADERS);
  widths_(sh, [150, 140, 150, 120, 180, 260, 120, 90, 180, 200, 70, 100, 100, 100, 110, 140, 120, 220, 90, 170, 230, 110, 280, 240]);
  sh.getRange('B2:B5000').setNumberFormat('yyyy-mm-dd hh:mm');
  sh.getRange('D2:D5000').setNumberFormat('@');
  sh.getRange('L2:O5000').setNumberFormat(CURRENCY_FORMAT);
  sh.getRange('P2:P5000').setDataValidation(dv_(PAYMENTS));
  sh.getRange('Q2:Q5000').setDataValidation(dv_(ORDER_STATUSES));
  sh.getRange('S2:S5000').setDataValidation(dv_(['Website', 'Manual']));
  sh.getRange('T2:T5000').setDataValidation(dv_(COURIER_ACTIONS));
  const q = sh.getRange('Q2:Q5000'), cs = sh.getRange('U2:U5000');
  // cheap marker: the first row of every order is bold (the old alternating colours used a slow formula on 5000 rows)
  const first = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A2<>"",$A2<>$A1)').setBold(true).setRanges([sh.getRange('A2:X5000')]).build();
  const ctxt = (t, bg, fg) => SpreadsheetApp.newConditionalFormatRule().whenTextContains(t).setBackground(bg).setFontColor(fg).setRanges([cs]).build();
  sh.setConditionalFormatRules(ORDER_STATUSES.map(s => cf_(q, s, ORDER_COLORS[s][0], ORDER_COLORS[s][1])).concat([
    ctxt('Error', '#fee2e2', '#991b1b'), ctxt('Cancel', '#fee2e2', '#991b1b'), ctxt('Removed', '#e5e7eb', '#374151'),
    ctxt('Delivered', '#dcfce7', '#166534'), ctxt('Hold', '#ffedd5', '#9a3412'), ctxt('Review', '#dbeafe', '#1e40af'), ctxt('Pending', '#fef3c7', '#92400e'),
    first]));
}

function setupExpenses_() {
  const sh = sheet_(S.EXP);
  ensureRows_(sh, 5001);
  header_(sh, EXP_HEADERS); widths_(sh, [120, 150, 320, 120]);
  sh.getRange('A2:A5000').setNumberFormat('yyyy-mm-dd');
  sh.getRange('D2:D5000').setNumberFormat(CURRENCY_FORMAT);
  sh.getRange('B2:B5000').setDataValidation(dv_(EXPENSE_TYPES));
}
function setupWithdrawals_() {
  const sh = sheet_(S.WD);
  ensureRows_(sh, 5001);
  header_(sh, WD_HEADERS); widths_(sh, [120, 120, 320]);
  sh.getRange('A2:A5000').setNumberFormat('yyyy-mm-dd');
  sh.getRange('B2:B5000').setNumberFormat(CURRENCY_FORMAT);
}

/* ================== 5. PRODUCT DATA HELPERS ================== */
/** last row that really has a Product ID (formulas in other columns are ignored) */
function lastDataRow_(sh) {
  const v = sh.getRange(1, 1, sh.getMaxRows(), 1).getValues();
  for (let i = v.length - 1; i >= 0; i--) if (String(v[i][0]).trim() !== '') return i + 1;
  return 1;
}
function findRow_(sh, id) {
  const last = lastDataRow_(sh); if (last < 2) return 0;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === id) return i + 2;
  return 0;
}
function rowToProduct_(r, row) {
  return {
    id: String(r[0]).trim(), productName: String(r[1]).trim(), gender: r[2], category: r[3],
    price: Number(r[4]) || 0, oldPrice: Number(r[5]) || 0, description: r[6],
    stock: Number(r[7]) || 0, status: r[8],
    images: [r[9], r[10], r[11]].map(x => String(x || '')),
    purchasePrice: Number(r[14]) || 0, purchasedQty: Number(r[15]) || 0, soldQty: Number(r[16]) || 0, totalBuyCost: Number(r[17]) || 0,
    row: row
  };
}
function readProducts_() {
  const sh = sheet_(S.PROD), last = lastDataRow_(sh); if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, PCOLS).getValues().map((r, i) => rowToProduct_(r, i + 2)).filter(p => p.id);
}
function readCategories_(activeOnly) {
  const sh = sheet_(S.CAT), n = sh.getLastRow() - 1; if (n < 1) return [];
  return sh.getRange(2, 1, n, 3).getValues()
    .filter(r => r[0] && r[1] && (!activeOnly || r[2] === 'Active'))
    .map(r => ({ gender: r[0], category: String(r[1]).trim(), status: r[2] }));
}
function nameKey_(n) { return String(n).trim().toLowerCase(); }

function nextProductId_() {
  const props = PropertiesService.getScriptProperties();
  let max = Number(props.getProperty('LAST_PRODUCT_NO')) || 0;
  readProducts_().forEach(p => { const m = /^P(\d+)$/.exec(p.id); if (m) max = Math.max(max, Number(m[1])); });
  max++; props.setProperty('LAST_PRODUCT_NO', String(max));
  return 'P' + String(max).padStart(3, '0');
}
function clearCache_() { try { CacheService.getScriptCache().remove('pub_products'); } catch (e) {} }
function safe_(v) { v = String(v == null ? '' : v).trim(); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function parseDate_(s) {
  const p = String(s || '').split('-');
  if (p.length === 3 && Number(p[0]) > 2000) { const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12, 0, 0); if (!isNaN(d)) return d; }
  return new Date();
}

/* ================== 6. PRODUCT MANAGER FUNCTIONS ================== */
function getInitData() {
  return JSON.stringify({ products: readProducts_(), categories: readCategories_(true), genders: GENDERS, statuses: STATUSES });
}

function saveProduct(p) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(S.PROD);
    const name = String(p.productName || '').trim();
    const price = Number(p.price), oldPrice = Number(p.oldPrice) || 0;
    const buyPrice = Number(p.purchasePrice), qty = Math.floor(Number(p.purchasedQty));
    if (!name) throw new Error('Product name is required.');
    if (GENDERS.indexOf(p.gender) < 0) throw new Error('Choose Male or Female.');
    if (!String(p.category || '').trim()) throw new Error('Choose a category.');
    if (!(price >= 0)) throw new Error('Selling price must be a number.');
    if (!(buyPrice >= 0)) throw new Error('Purchase price must be a number (0 if unknown).');
    if (!(qty >= 0)) throw new Error('Purchased quantity must be 0 or more.');
    if (STATUSES.indexOf(p.status) < 0) throw new Error('Invalid status.');

    let id = String(p.id || '').trim(), isNew = !id, row;
    const now = new Date();
    if (isNew) { id = nextProductId_(); row = lastDataRow_(sh) + 1; }
    else { row = findRow_(sh, id); if (!row) throw new Error('Product not found: ' + id); }

    sh.getRange(row, 1, 1, 7).setValues([[id, name, p.gender, String(p.category).trim(), price, oldPrice || '', String(p.description || '')]]);
    sh.getRange(row, 9).setValue(p.status);
    sh.getRange(row, 15, 1, 2).setValues([[buyPrice, qty]]);
    if (isNew) sh.getRange(row, 13).setValue(now);
    sh.getRange(row, 14).setValue(now);
    setRowFormulas_(sh, row);
    SpreadsheetApp.flush();
    clearCache_();
    return { isNew: isNew, row: row, product: rowToProduct_(sh.getRange(row, 1, 1, PCOLS).getValues()[0], row) };
  } finally { lock.releaseLock(); }
}

function deleteProduct(id) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(S.PROD), row = findRow_(sh, String(id).trim());
    if (!row) throw new Error('Product not found: ' + id);
    sh.deleteRow(row);          // images stay in Drive on purpose (old orders still reference them)
    clearCache_();
    return { deleted: id };
  } finally { lock.releaseLock(); }
}

function uploadImage(productId, slot, fileName, mimeType, base64, replace) {
  slot = Number(slot);
  if ([1, 2, 3].indexOf(slot) < 0) throw new Error('Image slot must be 1, 2 or 3.');
  if (String(mimeType).indexOf('image/') !== 0) throw new Error('Only image files are allowed.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(S.PROD), row = findRow_(sh, String(productId).trim());
    if (!row) throw new Error('Product not found: ' + productId + '. Save the product first.');
    const cell = sh.getRange(row, 9 + slot), old = String(cell.getValue() || '');
    if (old && !replace) return { needsConfirm: true, message: 'Image ' + slot + ' already exists.' };

    const ext = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, productId + '_img' + slot + '_' + Date.now() + ext);
    const file = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    const url = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';

    cell.setValue(url);
    sh.getRange(row, 14).setValue(new Date());
    const m = /[?&]id=([\w-]+)/.exec(old);
    if (m) { try { DriveApp.getFileById(m[1]).setTrashed(true); } catch (e) {} }
    clearCache_();
    return { url: url, cell: 'Products!' + cell.getA1Notation(), fileId: file.getId() };
  } finally { lock.releaseLock(); }
}

/* ================== 7. ORDERS (website + manual) ================== */
function getSetting_(key) {
  const sh = sheet_(S.SET), n = sh.getLastRow() - 1; if (n < 1) return '';
  const r = sh.getRange(2, 1, n, 2).getValues().filter(x => x[0] === key)[0];
  return r ? r[1] : '';
}

/** Creates an order. manual=false -> website checkout (strict). manual=true -> Order Manager (price/date/status/delivery editable).
 *  NO stock check: you manage stock by hand. Website delivery charge comes from the website server (deliveryCharge / freeAbove). */
function createOrder_(d, manual) {
  let name = String(d.customerName || '').trim(), phone = String(d.phone || '').trim().replace(/[\s-]/g, '');
  const address = String(d.address || '').trim(), city = String(d.city || '').trim();
  if (manual) { if (!name) name = 'Walk-in Customer'; }
  else if (name.length < 2) throw new Error('Customer name is required.');
  if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) throw new Error('Phone is required: enter a valid 11-digit mobile number.');
  if (address.length < 5) throw new Error('Address is required.');
  if (!city) throw new Error('City/Area is required.');
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 30) throw new Error('Cart is empty.');

  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    const osh = sheet_(S.ORD), products = readProducts_();
    const want = {}, order = [];
    d.items.forEach(it => {
      const q = Math.floor(Number(it.quantity));
      if (!(q >= 1 && q <= 9999)) throw new Error('Invalid quantity.');
      const id = String(it.productId || '').trim();
      if (!want[id]) { want[id] = { qty: 0, price: null }; order.push(id); }
      want[id].qty += q;
      if (manual && it.price !== '' && it.price != null && Number(it.price) >= 0) want[id].price = Number(it.price);
    });
    const now = manual ? parseDate_(d.date) : new Date(), lines = []; let subtotal = 0;
    order.forEach(id => {
      const p = products.filter(x => x.id === id)[0]; if (!p) throw new Error('Product not found: ' + id);
      if (p.status !== 'Active') throw new Error('"' + p.productName + '" is not available.');
      const k = nameKey_(p.productName);
      const price = want[id].price != null ? want[id].price : p.price;
      const img = products.filter(x => nameKey_(x.productName) === k).map(x => x.images.filter(String)[0]).filter(Boolean)[0] || '';
      lines.push({ p: p, qty: want[id].qty, price: price, sub: price * want[id].qty, img: img });
      subtotal += price * want[id].qty;
    });

    let deliveryCharge;
    if (manual) deliveryCharge = Math.max(0, Number(d.deliveryCharge) || 0);
    else {
      const dc = Number(d.deliveryCharge), fa = Number(d.freeAbove) || 0;
      if (!(dc >= 0 && dc <= 1000)) throw new Error('Invalid delivery charge.');
      deliveryCharge = (fa > 0 && subtotal >= fa) ? 0 : dc;
    }
    const total = subtotal + deliveryCharge;

    const ymd = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd'), prefix = 'ORD-' + ymd + '-';
    let maxNo = 0;
    if (osh.getLastRow() > 1) osh.getRange(2, 1, osh.getLastRow() - 1, 1).getValues().forEach(r => {
      const s = String(r[0]); if (s.indexOf(prefix) === 0) maxNo = Math.max(maxNo, Number(s.slice(prefix.length)) || 0);
    });
    const orderId = prefix + String(maxNo + 1).padStart(3, '0');
    const status = manual && ORDER_STATUSES.indexOf(d.status) >= 0 ? d.status : 'Pending';
    const payment = manual && PAYMENTS.indexOf(d.payment) >= 0 ? d.payment : 'Cash on Delivery';

    const desc = itemDescFromLines_(lines);
    const rows = lines.map((l, i) => [
      orderId, now, safe_(name), phone, safe_(d.email), safe_(address), safe_(city),
      l.p.id, l.p.productName, l.img, l.qty, l.price, l.sub,
      i === 0 ? deliveryCharge : '', i === 0 ? total : '',
      payment, status, safe_(d.note), manual ? 'Manual' : 'Website',
      '', '', '', i === 0 ? desc : '', ''          // Courier Action, Courier Status, Consignment ID, Item Description, Track Link
    ]);
    osh.getRange(osh.getLastRow() + 1, 1, rows.length, OCOLS).setValues(rows);
    SpreadsheetApp.flush();
    return { orderId: orderId, subtotal: subtotal, deliveryCharge: deliveryCharge, total: total, paymentMethod: payment };
  } finally { lock.releaseLock(); }
}
function placeOrder_(d) { return createOrder_(d, false); }

function getOrders_() {
  const sh = sheet_(S.ORD), n = sh.getLastRow() - 1; if (n < 1) return [];
  const tz = Session.getScriptTimeZone(), map = {}, list = [];
  sh.getRange(2, 1, n, OCOLS).getValues().forEach(r => {
    const id = r[0]; if (!id) return;
    if (!map[id]) {
      map[id] = {
        orderId: id, date: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, "yyyy-MM-dd'T'HH:mm:ss") : String(r[1]),
        customer: { name: r[2], phone: String(r[3]), email: r[4], address: r[5], cityArea: r[6] },
        items: [], subtotal: 0, deliveryCharge: 0, total: 0, paymentMethod: r[15], status: r[16], note: r[17], source: r[18] || 'Website',
        courier: { action: r[19], status: r[20], consignmentId: r[21], itemDescription: r[22], trackLink: r[23] }
      };
      list.push(map[id]);
    }
    const o = map[id];
    o.items.push({ productId: r[7], productName: r[8], image: r[9], quantity: Number(r[10]), price: Number(r[11]), subtotal: Number(r[12]) });
    o.subtotal += Number(r[12]) || 0;
    if (r[13] !== '') o.deliveryCharge = Number(r[13]) || 0;
    if (r[14] !== '') o.total = Number(r[14]) || 0;
  });
  return list.reverse();
}

/* ---- called by Order Manager ---- */
function getOrderMgrData() {
  const rows = readProducts_(), left = {};
  rows.forEach(p => { if (p.status === 'Active') { const k = nameKey_(p.productName); left[k] = (left[k] || 0) + Math.max(0, p.stock); } });
  const picker = publicGroups_(rows).map(p => ({ id: p.id, name: p.productName, price: p.price, gender: p.gender, category: p.category, stock: left[nameKey_(p.productName)] || 0 }));   // stock is shown to YOU only
  return JSON.stringify({
    orders: getOrders_(), products: picker, statuses: ORDER_STATUSES, payments: PAYMENTS, expenseTypes: EXPENSE_TYPES
  });
}
function createManualOrder(d) { return createOrder_(d, true); }

/** Edit an order (only while it is NOT sent to Steadfast). Same Order ID, lines are replaced in place. */
function updateOrder_(orderId, d) {
  let name = String(d.customerName || '').trim() || 'Walk-in Customer', phone = String(d.phone || '').trim().replace(/[\s-]/g, '');
  const address = String(d.address || '').trim(), city = String(d.city || '').trim();
  if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) throw new Error('Phone is required: enter a valid 11-digit mobile number.');
  if (address.length < 5) throw new Error('Address is required.');
  if (!city) throw new Error('City/Area is required.');
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 30) throw new Error('Cart is empty.');

  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    const sh = sheet_(S.ORD), b = orderBlock_(sh, orderId);
    if (!b) throw new Error('Order not found: ' + orderId);
    const old = b.data[0];
    if (String(old[OC.CID - 1]).trim()) throw new Error('This order is already sent to Steadfast, so it cannot be edited. Remove it from Steadfast first.');
    const k = b.rows.length;
    if (b.rows[k - 1] - b.first !== k - 1) throw new Error('The rows of this order are not together in the Orders sheet. Put them next to each other first.');

    const oldStatus = String(old[OC.STATUS - 1]), newStatus = ORDER_STATUSES.indexOf(d.status) >= 0 ? d.status : oldStatus;

    const products = readProducts_(), want = {}, order = [];
    d.items.forEach(it => {
      const q = Math.floor(Number(it.quantity));
      if (!(q >= 1 && q <= 9999)) throw new Error('Invalid quantity.');
      const id = String(it.productId || '').trim();
      if (!want[id]) { want[id] = { qty: 0, price: null }; order.push(id); }
      want[id].qty += q;
      if (it.price !== '' && it.price != null && Number(it.price) >= 0) want[id].price = Number(it.price);
    });
    const lines = []; let subtotal = 0;
    order.forEach(id => {
      const p = products.filter(x => x.id === id)[0]; if (!p) throw new Error('Product not found: ' + id);
      const key = nameKey_(p.productName);
      const price = want[id].price != null ? want[id].price : p.price;
      const img = products.filter(x => nameKey_(x.productName) === key).map(x => x.images.filter(String)[0]).filter(Boolean)[0] || '';
      lines.push({ p: p, qty: want[id].qty, price: price, sub: price * want[id].qty, img: img });
      subtotal += price * want[id].qty;
    });

    const deliveryCharge = Math.max(0, Number(d.deliveryCharge) || 0), total = subtotal + deliveryCharge;
    const tz = Session.getScriptTimeZone(), oldDate = old[1];
    const sameDay = oldDate instanceof Date && d.date && Utilities.formatDate(oldDate, tz, 'yyyy-MM-dd') === String(d.date);
    const when = !d.date || sameDay ? oldDate : parseDate_(d.date);
    const payment = PAYMENTS.indexOf(d.payment) >= 0 ? d.payment : old[OC.PAY - 1];
    const desc = itemDescFromLines_(lines);

    const rows = lines.map((l, i) => [
      orderId, when, safe_(name), phone, safe_(d.email), safe_(address), safe_(city),
      l.p.id, l.p.productName, l.img, l.qty, l.price, l.sub,
      i === 0 ? deliveryCharge : '', i === 0 ? total : '',
      payment, newStatus, safe_(d.note), old[18] || 'Website',
      i === 0 ? old[19] : '', i === 0 ? old[20] : '', i === 0 ? old[21] : '', i === 0 ? desc : '', i === 0 ? old[23] : ''
    ]);
    const m = rows.length;
    if (m > k) sh.insertRowsAfter(b.rows[k - 1], m - k);
    else if (m < k) sh.deleteRows(b.first + m, k - m);
    sh.getRange(b.first, 1, m, OCOLS).setValues(rows);
    SpreadsheetApp.flush(); clearCache_();
    return { orderId: orderId, subtotal: subtotal, deliveryCharge: deliveryCharge, total: total };
  } finally { lock.releaseLock(); }
}
function updateOrder(orderId, d) { return updateOrder_(orderId, d); }

function updateOrderStatus(orderId, status) {
  if (ORDER_STATUSES.indexOf(status) < 0) throw new Error('Invalid status.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(S.ORD), n = sh.getLastRow() - 1; let c = 0;
    sh.getRange(2, 1, n, 1).getValues().forEach((r, i) => { if (r[0] === orderId) { sh.getRange(i + 2, 17).setValue(status); c++; } });
    if (!c) throw new Error('Order not found.');
    SpreadsheetApp.flush(); clearCache_();
    return { orderId: orderId, status: status };
  } finally { lock.releaseLock(); }
}
function deleteOrder(orderId) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(S.ORD), n = sh.getLastRow() - 1, del = [];
    sh.getRange(2, 1, n, 1).getValues().forEach((r, i) => { if (r[0] === orderId) del.push(i + 2); });
    if (!del.length) throw new Error('Order not found.');
    del.reverse().forEach(r => sh.deleteRow(r));
    SpreadsheetApp.flush(); clearCache_();
    return { deleted: orderId };
  } finally { lock.releaseLock(); }
}

/* ---- expenses & withdrawals (Order Manager -> Money tab) ---- */
function addExpense(type, amount, note, date) {
  amount = Number(amount);
  if (EXPENSE_TYPES.indexOf(type) < 0) throw new Error('Choose an expense type.');
  if (!(amount > 0)) throw new Error('Amount must be more than 0.');
  const sh = sheet_(S.EXP);
  sh.getRange(sh.getLastRow() + 1, 1, 1, 4).setValues([[parseDate_(date), type, safe_(note), amount]]);
  return { ok: true };
}
function addWithdrawal(amount, note, date) {
  amount = Number(amount);
  if (!(amount > 0)) throw new Error('Amount must be more than 0.');
  const sh = sheet_(S.WD);
  sh.getRange(sh.getLastRow() + 1, 1, 1, 3).setValues([[parseDate_(date), amount, safe_(note)]]);
  return { ok: true };
}
function getMoneyData() {
  const tz = Session.getScriptTimeZone();
  const read = (name, cols) => {
    const sh = sheet_(name), n = sh.getLastRow() - 1; if (n < 1) return [];
    return sh.getRange(2, 1, n, cols).getValues().filter(r => r[0] !== '').map(r => r.map((v, i) => i === 0 && v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : v));
  };
  const ex = read(S.EXP, 4), wd = read(S.WD, 3);
  return JSON.stringify({
    expenses: ex.slice(-15).reverse(), withdrawals: wd.slice(-15).reverse(),
    totalExpenses: ex.reduce((s, r) => s + (Number(r[3]) || 0), 0), totalWithdraw: wd.reduce((s, r) => s + (Number(r[1]) || 0), 0)
  });
}

/* Keep every row of one order on the same status when you change the dropdown in Orders!Q */
function onEdit(e) {
  try {
    const r = e.range, sh = r.getSheet();
    if (sh.getName() !== S.ORD || r.getColumn() !== 17 || r.getRow() < 2 || r.getNumRows() > 1) return;
    const id = sh.getRange(r.getRow(), 1).getValue(); if (!id) return;
    const v = r.getValue();
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach((x, i) => { if (x[0] === id) sh.getRange(i + 2, 17).setValue(v); });
  } catch (err) {}
}

/* ================== 8. WEB APP API FOR THE WEBSITE (secret, duplicate-order protection, no stock) ================== */
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---- auth: fail closed. If API_SECRET is not set, nothing works. ---- */
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function authOk_(s) { const k = prop_('API_SECRET'); return k.length >= 20 && String(s || '') === k; }

/* ---- colours / sizes parsed from Description ---- */
function parseVariants_(desc) {
  const out = { colors: [], sizes: [], text: [] };
  String(desc || '').split(/\r?\n/).forEach(line => {
    const m = /^\s*(colou?rs?|sizes?)\s*:\s*(.+)$/i.exec(line);
    if (!m) { out.text.push(line); return; }
    const list = m[2].split(',').map(x => x.trim()).filter(Boolean).slice(0, 20);
    const target = /^colou?r/i.test(m[1]) ? out.colors : out.sizes;
    list.forEach(x => { if (target.indexOf(x) < 0) target.push(x); });
  });
  out.text = out.text.join('\n').trim();
  return out;
}
function publicProduct_(p) {
  const v = parseVariants_(p.description);
  return Object.assign({}, p, { description: v.text, colors: v.colors, sizes: v.sizes });
}

/** Public catalogue. Decided ONLY by the Status column. Quantity is never read or counted.
 *    Active       -> shown, can be ordered
 *    Out of Stock -> shown with an "Out of stock" badge, cannot be ordered (you set this by hand)
 *    Inactive     -> hidden
 *  Same Product Name = one product. Price/ID come from the NEWEST (bottom-most) Active row. */
function publicGroups_(rows) {
  const g = {}, keys = [];
  rows.forEach(p => { const k = nameKey_(p.productName); if (!g[k]) { g[k] = []; keys.push(k); } g[k].push(p); });
  const out = [];
  keys.forEach(k => {
    const visible = g[k].filter(p => p.status !== 'Inactive'); if (!visible.length) return;
    const active = visible.filter(p => p.status === 'Active');
    const cur = active.length ? active[active.length - 1] : visible[visible.length - 1];
    const imgs = [cur].concat(visible.slice().reverse()).map(p => p.images.filter(String)).filter(a => a.length)[0] || [];
    out.push({ id: cur.id, productName: cur.productName, gender: cur.gender, category: cur.category, price: cur.price, oldPrice: cur.oldPrice,
      description: cur.description, status: active.length ? 'Active' : 'Out of Stock', images: imgs });
  });
  return out;
}

function getPublicProducts_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('pub_products');   // key cleared by clearCache_()
  if (hit) return JSON.parse(hit);
  const data = publicGroups_(readProducts_()).map(publicProduct_);
  try { cache.put('pub_products', JSON.stringify(data), 120); } catch (e) {}
  return data;
}

/* ---- server-side cart validation + pricing. The browser's prices are never read. ---- */
function quote_(d) {
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 30) throw new Error('Your cart is empty.');
  const rows = readProducts_(), groups = publicGroups_(rows);
  let subtotal = 0;
  const lines = d.items.map(it => {
    const id = String(it.productId || '').trim(), q = Math.floor(Number(it.quantity));
    const color = String(it.color || '').trim(), size = String(it.size || '').trim();
    const out = { productId: id, ok: false, error: '', color: color, size: size, quantity: q };
    const row = rows.filter(x => x.id === id)[0];
    const g = row && groups.filter(x => nameKey_(x.productName) === nameKey_(row.productName))[0];
    if (!g) { out.error = 'This product is no longer available.'; return out; }
    out.productId = g.id; out.name = g.productName; out.price = g.price; out.image = g.images[0] || '';
    if (!(q >= 1 && q <= 50)) { out.error = 'Invalid quantity.'; return out; }
    const v = parseVariants_(g.description);
    if (v.colors.length ? v.colors.indexOf(color) < 0 : color) { out.error = 'Please choose an available colour.'; return out; }
    if (v.sizes.length ? v.sizes.indexOf(size) < 0 : size) { out.error = 'Please choose an available size.'; return out; }
    if (g.status !== 'Active') { out.error = 'Out of stock.'; return out; }       // Status column only (set by you). No quantity is checked.
    out.ok = true; out.sub = g.price * q; subtotal += out.sub;
    return out;
  });
  return { lines: lines, subtotal: subtotal, deliveryCharge: 0, total: subtotal, allOk: lines.every(l => l.ok) };
}

/* ---- duplicate-order + abuse protection helpers (CacheService, guarded by a short lock) ---- */
function claim_(key, ttl) {                       // returns the existing record, or null after claiming the key
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const c = CacheService.getScriptCache(), hit = c.get(key);
    if (hit) return JSON.parse(hit);
    c.put(key, JSON.stringify({ state: 'pending' }), ttl);
    return null;
  } finally { lock.releaseLock(); }
}
function rateLimit_(key, max, ttl) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const c = CacheService.getScriptCache(), n = Number(c.get(key)) || 0;
    if (n >= max) throw new Error('Too many orders in a short time. Please try again later.');
    c.put(key, String(n + 1), ttl);
  } finally { lock.releaseLock(); }
}
function md5_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s).map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join(''); }
const BUSY_MSG_ = 'Your order is still being processed. Please wait a few seconds, then press Place order again.';

/** Website checkout. Idempotent: the same requestId (or the same phone + items within 2 minutes) never creates a second order. */
function placeWebsiteOrder_(b) {
  const rid = String(b.requestId || '');
  if (!/^[A-Za-z0-9-]{16,64}$/.test(rid)) throw new Error('Invalid request.');
  if (b.website) throw new Error('Request rejected.');                                  // honeypot
  const phone = String(b.phone || '').trim().replace(/[\s-]/g, '');
  if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) throw new Error('Phone is required: enter a valid 11-digit mobile number.');
  const phone10 = phone.slice(-10);
  if (b.zone !== 'inside' && b.zone !== 'outside') throw new Error('Please choose your delivery area (Inside Dhaka or Outside Dhaka).');
  const dc = Number(b.deliveryCharge), fa = Number(b.freeAbove) || 0;
  if (!(dc >= 0 && dc <= 1000) || !(fa >= 0)) throw new Error('Invalid delivery charge.');

  const cache = CacheService.getScriptCache(), idemKey = 'idem_' + rid;
  const prev = claim_(idemKey, 300);
  if (prev) {
    if (prev.state === 'done') return Object.assign({}, prev.result, { duplicate: true });
    throw new Error(BUSY_MSG_);
  }
  try {
    rateLimit_('rl_ph_' + phone10, 5, 3600);                                            // 5 orders / phone / hour
    rateLimit_('rl_all_' + Math.floor(Date.now() / 60000), 60, 120);                    // 60 orders / minute overall

    const q = quote_(b);                                                                // product, status, variant, price, stock: all from the sheet
    const bad = q.lines.filter(l => !l.ok)[0];
    if (bad) throw new Error((bad.name ? bad.name + ': ' : '') + bad.error);

    const fpKey = 'fp_' + md5_(phone10 + '|' + q.lines.map(l => [l.productId, l.quantity, l.color, l.size].join(':')).sort().join(',')), fpPrev = claim_(fpKey, 120);
    if (fpPrev) {
      if (fpPrev.state !== 'done') throw new Error(BUSY_MSG_);
      cache.put(idemKey, JSON.stringify({ state: 'done', result: fpPrev.result }), 21600);
      return Object.assign({}, fpPrev.result, { duplicate: true });
    }

    const vtxt = q.lines.filter(l => l.color || l.size).map(l => l.name + ' x' + l.quantity + ' (' + [l.color, l.size].filter(Boolean).join(', ') + ')').join('; ');
    const note = [String(b.note || '').slice(0, 300), 'Delivery area: ' + (b.zone === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'), vtxt ? 'Variants: ' + vtxt : ''].filter(Boolean).join(' | ');
    let result;
    try {
      result = placeOrder_({
        customerName: String(b.customerName || '').slice(0, 100), phone: phone, email: String(b.email || '').slice(0, 100),
        address: String(b.address || '').slice(0, 250), city: String(b.city || '').slice(0, 100), note: note, zone: b.zone, deliveryCharge: dc, freeAbove: fa,
        items: q.lines.map(l => ({ productId: l.productId, quantity: l.quantity }))     // NO prices passed: createOrder_ re-reads them from the sheet
      });
    } catch (e) { cache.remove(fpKey); throw e; }
    cache.put(fpKey, JSON.stringify({ state: 'done', result: result }), 120);
    cache.put(idemKey, JSON.stringify({ state: 'done', result: result }), 21600);
    return result;
  } catch (e) { cache.remove(idemKey); throw e; }
}

/* ---- endpoints (only the Next.js server calls these; the secret never reaches a browser) ---- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (!authOk_(p.secret)) throw new Error('Unauthorized.');
    if ((p.action || 'products') === 'products') return json_({ success: true, data: getPublicProducts_() });
    throw new Error('Unknown action.');
  } catch (err) { return json_({ success: false, error: err.message }); }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!authOk_(body.secret)) throw new Error('Unauthorized.');
    if (body.action === 'quote') return json_({ success: true, data: quote_(body) });
    if (body.action === 'placeOrder') return json_({ success: true, data: placeWebsiteOrder_(body) });
    throw new Error('Unknown action.');
  } catch (err) { return json_({ success: false, error: err.message }); }
}

/* ================== 9. HELPERS FOR YOU (run from the editor) ================== */
function checkSetup() {
  Logger.log('Sheets found: ' + ss_().getSheets().map(s => '"' + s.getName() + '"').join(', '));
  Logger.log('Product rows: ' + readProducts_().length + ' | Categories: ' + readCategories_(true).length);
  Logger.log('Drive folder: ' + DriveApp.getFolderById(FOLDER_ID).getName());
  Logger.log('getInitData length = ' + getInitData().length + ' | getOrderMgrData length = ' + getOrderMgrData().length);
  Logger.log('API_SECRET set: ' + (prop_('API_SECRET').length >= 20));
}
function generateToken() {
  Logger.log(Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
}


/* ================== 10. STEADFAST COURIER ================== */
const SF_BASE = 'https://portal.packzy.com/api/v1';
const TRACK_URL = 'https://steadfast.com.bd/t/';     // + tracking code. Change here if Steadfast changes its tracking page.
const COURIER_ACTIONS = ['Sent to Steadfast', 'Remove From Steadfast'];
// Orders column numbers
const OC = { ID: 1, NAME: 3, PHONE: 4, EMAIL: 5, ADDR: 6, CITY: 7, PNAME: 9, QTY: 11, SUB: 13, DEL: 14, PAY: 16, STATUS: 17, NOTE: 18, ACTION: 20, CSTATUS: 21, CID: 22, DESC: 23, LINK: 24 };

function itemDescFromLines_(lines) {
  const m = {}, ord = [];
  lines.forEach(l => { const n = l.p.productName; if (!m[n]) { m[n] = 0; ord.push(n); } m[n] += l.qty; });
  return ord.map(n => n + ' x' + m[n]).join(', ').slice(0, 400);
}
function itemDesc_(data) {
  const m = {}, ord = [];
  data.forEach(r => { const n = String(r[OC.PNAME - 1]).trim(); if (!m[n]) { m[n] = 0; ord.push(n); } m[n] += Number(r[OC.QTY - 1]) || 0; });
  return ord.map(n => n + ' x' + m[n]).join(', ').slice(0, 400);
}
function soft_(msg) { const e = new Error(msg); e.soft = true; return e; }

function sfKeys_() {
  const p = PropertiesService.getScriptProperties(), k = p.getProperty('SF_API_KEY'), s = p.getProperty('SF_SECRET_KEY');
  if (!k || !s) throw soft_('Steadfast API keys are not set. Use Store Manager → Steadfast Courier → 1. Set API keys.');
  return { k: k, s: s };
}
function sfCall_(method, path, body) {
  const keys = sfKeys_();
  const opt = { method: method, headers: { 'Api-Key': keys.k, 'Secret-Key': keys.s, 'Content-Type': 'application/json', 'Accept': 'application/json' }, muteHttpExceptions: true };
  if (body) opt.payload = JSON.stringify(body);
  const res = UrlFetchApp.fetch(SF_BASE + path, opt);
  let data = {};
  try { data = JSON.parse(res.getContentText()); } catch (e) { data = { raw: String(res.getContentText()).slice(0, 200) }; }
  return { code: res.getResponseCode(), data: data };
}
function sfError_(r) {
  const d = r.data || {}; let m = d.message || d.error || '';
  if (d.errors) { try { m += ' ' + Object.keys(d.errors).map(k => k + ': ' + [].concat(d.errors[k]).join(', ')).join(' | '); } catch (e) {} }
  return ('HTTP ' + r.code + ' ' + (m || d.raw || '')).trim();
}
function sfLabel_(raw) {
  const map = { pending: 'Pending', in_review: 'In Review', hold: 'Hold', delivered: 'Delivered', partial_delivered: 'Partial Delivered', cancelled: 'Cancelled',
    delivered_approval_pending: 'Delivered (Approval Pending)', partial_delivered_approval_pending: 'Partial Delivered (Approval Pending)',
    cancelled_approval_pending: 'Cancelled (Approval Pending)', unknown_approval_pending: 'Unknown (Approval Pending)', unknown: 'Unknown' };
  const k = String(raw || '').toLowerCase();
  return map[k] || (k ? k.replace(/_/g, ' ') : 'Unknown');
}
function isFinalLabel_(l) { l = String(l); return l === 'Delivered' || l === 'Partial Delivered' || l === 'Cancelled' || l.indexOf('Removed') === 0; }

/** All rows of one order. Courier fields live on the FIRST row of the order (like Total). */
function orderBlock_(sh, orderId) {
  const n = sh.getLastRow() - 1; if (n < 1) return null;
  const vals = sh.getRange(2, 1, n, OCOLS).getValues(), rows = [], data = [];
  vals.forEach((r, i) => { if (r[0] === orderId) { rows.push(i + 2); data.push(r); } });
  return rows.length ? { rows: rows, first: rows[0], data: data } : null;
}
function setOrderStatusById_(sh, orderId, status) {
  const n = sh.getLastRow() - 1; if (n < 1) return;
  sh.getRange(2, 1, n, 1).getValues().forEach((r, i) => { if (r[0] === orderId) sh.getRange(i + 2, OC.STATUS).setValue(status); });
}

/** Create ONE parcel for the whole order (all product rows). */
function courierSend_(orderId) {
  const sh = sheet_(S.ORD), b = orderBlock_(sh, orderId);
  if (!b) throw soft_('Order not found: ' + orderId);
  const f = b.data[0], row = b.first;
  if (String(f[OC.STATUS - 1]) === 'Cancelled') throw soft_('This order is Cancelled, so no parcel was created.');
  if (String(f[OC.CID - 1]).trim()) throw soft_('Already sent to Steadfast (Consignment ' + f[OC.CID - 1] + '). Choose "Remove From Steadfast" first, then send again.');

  let phone = String(f[OC.PHONE - 1]).replace(/\D/g, '');
  if (phone.length === 13 && phone.indexOf('88') === 0) phone = phone.slice(2);
  if (phone.length === 10 && phone.charAt(0) === '1') phone = '0' + phone;
  if (!/^01[3-9]\d{8}$/.test(phone)) throw new Error('Phone must be a valid 11-digit mobile number (now: "' + f[OC.PHONE - 1] + '").');
  const name = String(f[OC.NAME - 1]).trim().slice(0, 100);
  const address = (String(f[OC.ADDR - 1]).trim() + (String(f[OC.CITY - 1]).trim() ? ', ' + String(f[OC.CITY - 1]).trim() : '')).slice(0, 250);
  if (!name) throw new Error('Customer name is empty.');
  if (address.length < 5) throw new Error('Address is too short.');

  const sub = b.data.reduce((s, r) => s + (Number(r[OC.SUB - 1]) || 0), 0), total = sub + (Number(f[OC.DEL - 1]) || 0);
  const cod = String(f[OC.PAY - 1]) === 'Cash on Delivery' ? total : 0;      // local cash sales are already paid -> COD 0
  const desc = itemDesc_(b.data);

  const props = PropertiesService.getScriptProperties(), key = 'SF_ATT_' + orderId, att = Number(props.getProperty(key)) || 0;
  const invoice = att === 0 ? String(orderId) : orderId + '-R' + (att + 1);   // Steadfast needs a NEW unique invoice for every parcel
  const payload = { invoice: invoice, recipient_name: name, recipient_phone: phone, recipient_address: address, cod_amount: cod,
    note: String(f[OC.NOTE - 1] || '').slice(0, 400), item_description: desc, delivery_type: 0 };
  if (String(f[OC.EMAIL - 1]).trim()) payload.recipient_email = String(f[OC.EMAIL - 1]).trim();

  const r = sfCall_('post', '/create_order', payload), c = r.data && r.data.consignment;
  if (r.code !== 200 || !c || !c.consignment_id) throw new Error('Steadfast: ' + sfError_(r));
  props.setProperty(key, String(att + 1));

  const track = c.tracking_code ? TRACK_URL + c.tracking_code : '';
  sh.getRange(row, OC.ACTION).setValue('Sent to Steadfast');
  sh.getRange(row, OC.CSTATUS, 1, 4).setValues([[sfLabel_(c.status || 'in_review'), c.consignment_id, desc, track]]);
  if (String(getSetting_('Steadfast: Auto-update Order Status (Yes/No)')) === 'Yes' && ['Pending', 'Confirmed', 'Processing'].indexOf(String(f[OC.STATUS - 1])) >= 0) {
    setOrderStatusById_(sh, orderId, 'Shipped');
  }
  return { consignmentId: c.consignment_id, trackLink: track, status: sfLabel_(c.status || 'in_review'), invoice: invoice };
}

/** Steadfast has no "delete parcel" API. This unlinks the parcel in the sheet (so a new one can be created) and optionally files a return request. */
function courierRemove_(orderId) {
  const sh = sheet_(S.ORD), b = orderBlock_(sh, orderId);
  if (!b) throw soft_('Order not found: ' + orderId);
  const f = b.data[0], row = b.first, cid = String(f[OC.CID - 1]).trim();
  if (!cid) throw soft_('Nothing to remove: this order has no Steadfast parcel.');
  const cur = String(f[OC.CSTATUS - 1]);
  if (cur.indexOf('Delivered') >= 0) throw soft_('This parcel is already delivered. It cannot be removed.');
  let extra = '';
  if (String(getSetting_('Steadfast: Return Request on Remove (Yes/No)')) === 'Yes') {
    const r = sfCall_('post', '/create_return_request', { consignment_id: Number(cid), reason: 'Removed by merchant' });
    extra = r.code === 200 ? ' · return request sent' : ' · return request FAILED (' + sfError_(r) + ')';
  }
  sh.getRange(row, OC.ACTION).setValue('Remove From Steadfast');
  sh.getRange(row, OC.CSTATUS, 1, 4).setValues([['Removed from Steadfast (was #' + cid + ')' + extra, '', f[OC.DESC - 1], '']]);
  return { removed: cid, note: 'Cancel the parcel in the Steadfast panel too if it was not picked up yet.' + extra };
}

/** Installable edit trigger: runs when you pick a value in Orders > Courier Action */
function onCourierEdit(e) {
  let sh, r;
  try {
    r = e.range; sh = r.getSheet();
    if (sh.getName() !== S.ORD || r.getColumn() !== OC.ACTION || r.getRow() < 2 || r.getNumRows() > 1 || r.getNumColumns() > 1) return;
    const action = String(e.value || ''); if (COURIER_ACTIONS.indexOf(action) < 0) return;
    const orderId = sh.getRange(r.getRow(), 1).getValue(); if (!orderId) { r.clearContent(); return; }
    const lock = LockService.getScriptLock(); lock.waitLock(25000);
    let first, res;
    try {
      const b = orderBlock_(sh, orderId); first = b ? b.first : r.getRow();
      res = action === COURIER_ACTIONS[0] ? courierSend_(orderId) : courierRemove_(orderId);
    } finally { lock.releaseLock(); }
    if (first !== r.getRow()) r.clearContent();                 // dropdown value is kept on the order's first row only
    ss_().toast(action === COURIER_ACTIONS[0] ? 'Parcel created. Consignment ' + res.consignmentId : 'Removed. ' + res.note, 'Steadfast', 8);
  } catch (err) {
    try {
      if (err.soft) {
        if (r) r.setValue(e && e.oldValue ? e.oldValue : '');   // put the old value back, nothing changed
      } else if (r && sh) {
        const b = orderBlock_(sh, sh.getRange(r.getRow(), 1).getValue());
        r.clearContent(); if (b) { sh.getRange(b.first, OC.ACTION).clearContent(); sh.getRange(b.first, OC.CSTATUS).setValue('Error: ' + err.message); }
      }
      ss_().toast(err.message, 'Steadfast', 10);
    } catch (e2) {}
  }
}

/** Fetch latest status for every parcel that is not finished (runs hourly + from menu / Order Manager) */
function refreshCourierStatuses() {
  const sh = sheet_(S.ORD), n = sh.getLastRow() - 1; if (n < 1) return { updated: 0, errors: 0 };
  const vals = sh.getRange(2, 1, n, OCOLS).getValues(), t0 = Date.now(), auto = String(getSetting_('Steadfast: Auto-update Order Status (Yes/No)')) === 'Yes';
  let upd = 0, err = 0;
  for (let i = 0; i < vals.length; i++) {
    if (Date.now() - t0 > 270000) break;                          // stay inside the 6 minute limit
    const cid = String(vals[i][OC.CID - 1]).trim(); if (!cid) continue;
    const cur = String(vals[i][OC.CSTATUS - 1]); if (isFinalLabel_(cur)) continue;
    const res = sfCall_('get', '/status_by_cid/' + encodeURIComponent(cid));
    if (res.code === 200 && res.data && res.data.delivery_status) {
      const lab = sfLabel_(res.data.delivery_status);
      if (lab !== cur) { sh.getRange(i + 2, OC.CSTATUS).setValue(lab); upd++; }
      if (auto && res.data.delivery_status === 'delivered') setOrderStatusById_(sh, vals[i][0], 'Delivered');
    } else err++;
  }
  return { updated: upd, errors: err };
}

/* ---- called from Order Manager buttons ---- */
function courierSend(orderId) { const l = LockService.getScriptLock(); l.waitLock(25000); try { return courierSend_(orderId); } finally { l.releaseLock(); } }
function courierRemove(orderId) { const l = LockService.getScriptLock(); l.waitLock(25000); try { return courierRemove_(orderId); } finally { l.releaseLock(); } }
function courierRefresh() { return refreshCourierStatuses(); }

/* ---- menu helpers ---- */
function setSteadfastKeys() {
  const ui = SpreadsheetApp.getUi();
  const a = ui.prompt('Steadfast API Key', 'Paste your Api-Key (from Steadfast merchant panel → API):', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK || !a.getResponseText().trim()) return;
  const b = ui.prompt('Steadfast Secret Key', 'Paste your Secret-Key:', ui.ButtonSet.OK_CANCEL);
  if (b.getSelectedButton() !== ui.Button.OK || !b.getResponseText().trim()) return;
  const p = PropertiesService.getScriptProperties();
  p.setProperty('SF_API_KEY', a.getResponseText().trim()); p.setProperty('SF_SECRET_KEY', b.getResponseText().trim());
  ui.alert('✓ Keys saved (stored privately in the script, not in the sheet). Now run "Check balance" to test them.');
}
function checkSteadfastBalance() {
  const ui = SpreadsheetApp.getUi();
  try {
    const r = sfCall_('get', '/get_balance');
    ui.alert(r.code === 200 ? '✓ Steadfast connected. Current balance: ' + r.data.current_balance : '✗ ' + sfError_(r));
  } catch (e) { ui.alert('✗ ' + e.message); }
}
function installCourierTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => { const h = t.getHandlerFunction(); if (h === 'onCourierEdit' || h === 'refreshCourierStatuses') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('onCourierEdit').forSpreadsheet(ss_()).onEdit().create();
  ScriptApp.newTrigger('refreshCourierStatuses').timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert('✓ Automation enabled.\n• Choosing "Sent to Steadfast" / "Remove From Steadfast" in Orders → Courier Action now works.\n• Courier status refreshes every hour.');
}
function refreshCourierNow() {
  try { const r = refreshCourierStatuses(); ss_().toast(r.updated + ' updated, ' + r.errors + ' errors', 'Steadfast', 6); }
  catch (e) { SpreadsheetApp.getUi().alert('✗ ' + e.message); }
}

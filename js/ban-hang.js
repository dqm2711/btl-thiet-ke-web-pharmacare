(function () {
  'use strict';
  const medicines = [
    { id: 'TH001', name: 'Paracetamol 500mg', unit: 'viên', price: 1500 },
    { id: 'TH002', name: 'Vitamin C 500mg', unit: 'viên', price: 2000 },
    { id: 'TH003', name: 'Nước muối sinh lý 0,9%', unit: 'chai', price: 8000 },
    { id: 'TH004', name: 'Khẩu trang y tế', unit: 'hộp', price: 25000 },
    { id: 'TH005', name: 'Băng gạc y tế', unit: 'gói', price: 12000 }
  ];
  let invoiceItems = [];
  const $ = (id) => document.getElementById(id);
  const select = $('medicine-select');
  const qtyInput = $('medicine-quantity');
  const money = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  const today = new Date();
  $('sale-date').value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  medicines.forEach((medicine) => {
    const option = document.createElement('option'); option.value = medicine.id;
    option.textContent = `${medicine.name} — ${money(medicine.price)}/${medicine.unit}`; select.appendChild(option);
  });
  function selectedMedicine() { return medicines.find((medicine) => medicine.id === select.value); }
  function updatePricePreview() { const medicine = selectedMedicine(); $('unit-price-preview').textContent = medicine ? money(medicine.price) : '—'; }
  function showError(id, message, inputId) { $(id).textContent = message; if (inputId) $(inputId).classList.toggle('invalid', Boolean(message)); }
  function validateCustomer() {
    const name = $('customer-name').value.trim(); const phone = $('customer-phone').value.trim(); let valid = true;
    showError('name-error', name ? '' : 'Vui lòng nhập họ tên khách hàng.', 'customer-name');
    showError('phone-error', /^\d{10}$/.test(phone) ? '' : 'Số điện thoại phải gồm đúng 10 chữ số.', 'customer-phone');
    if (!name || !/^\d{10}$/.test(phone)) valid = false;
    return valid;
  }
  function renderInvoice() {
    const tbody = $('invoice-items'); tbody.replaceChildren();
    if (!invoiceItems.length) {
      const row = tbody.insertRow(); row.className = 'bh-empty-row'; const cell = row.insertCell(); cell.colSpan = 5; cell.textContent = 'Chưa có thuốc. Hãy chọn thuốc ở khung bên trái.';
    }
    invoiceItems.forEach((item) => {
      const row = tbody.insertRow();
      const name = row.insertCell(); name.textContent = item.name;
      const quantity = row.insertCell(); quantity.textContent = `${item.quantity} ${item.unit}`;
      const price = row.insertCell(); price.textContent = money(item.price);
      const total = row.insertCell(); total.textContent = money(item.price * item.quantity);
      const action = row.insertCell(); const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'bh-remove'; remove.textContent = 'Xóa'; remove.setAttribute('aria-label', `Xóa ${item.name}`);
      remove.addEventListener('click', () => { invoiceItems = invoiceItems.filter((entry) => entry.id !== item.id); renderInvoice(); }); action.appendChild(remove);
    });
    const total = invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    $('subtotal').textContent = money(total); $('grand-total').textContent = money(total);
    $('invoice-customer-label').textContent = $('customer-name').value.trim() || 'Chưa nhập';
    $('invoice-phone-label').textContent = $('customer-phone').value.trim() || '—';
    $('invoice-date-label').textContent = $('sale-date').value || '—';
  }
  $('add-medicine').addEventListener('click', () => {
    const medicine = selectedMedicine(); const quantity = Number(qtyInput.value);
    $('sale-message').className = 'bh-message'; $('sale-message').textContent = '';
    if (!medicine) { $('sale-message').classList.add('error'); $('sale-message').textContent = 'Vui lòng chọn thuốc trước khi thêm.'; select.focus(); return; }
    if (!Number.isInteger(quantity) || quantity < 1) { $('sale-message').classList.add('error'); $('sale-message').textContent = 'Số lượng phải là số nguyên lớn hơn hoặc bằng 1.'; qtyInput.focus(); return; }
    const existing = invoiceItems.find((item) => item.id === medicine.id);
    if (existing) existing.quantity += quantity;
    else invoiceItems.push({ ...medicine, quantity });
    renderInvoice(); $('sale-message').textContent = 'Đã thêm thuốc vào hóa đơn.';
  });
  select.addEventListener('change', updatePricePreview);
  ['customer-name','customer-phone','sale-date'].forEach((id) => $(id).addEventListener('input', renderInvoice));
  $('clear-invoice').addEventListener('click', () => {
    if (!confirm('Bạn muốn làm mới hóa đơn hiện tại?')) return;
    invoiceItems = []; $('customer-name').value = ''; $('customer-phone').value = ''; select.value = ''; qtyInput.value = '1';
    showError('name-error', '', 'customer-name'); showError('phone-error', '', 'customer-phone'); updatePricePreview(); renderInvoice();
    $('sale-message').className = 'bh-message'; $('sale-message').textContent = 'Đã làm mới hóa đơn.';
  });
  $('print-invoice').addEventListener('click', () => { if (!invoiceItems.length) { $('sale-message').className = 'bh-message error'; $('sale-message').textContent = 'Hãy thêm ít nhất một loại thuốc trước khi in.'; return; } window.print(); });
  $('sale-form').addEventListener('submit', (event) => {
    event.preventDefault(); $('sale-message').className = 'bh-message';
    if (!validateCustomer()) { $('sale-message').classList.add('error'); $('sale-message').textContent = 'Vui lòng kiểm tra lại thông tin khách hàng.'; return; }
    if (!invoiceItems.length) { $('sale-message').classList.add('error'); $('sale-message').textContent = 'Hóa đơn cần có ít nhất một loại thuốc.'; return; }
    $('sale-message').textContent = 'Đã kiểm tra hợp lệ. Đây là bản demo giao diện; dữ liệu chưa được lưu vào hệ thống hoặc cơ sở dữ liệu.';
    $('invoice-code').textContent = `PC-${String(Date.now()).slice(-6)}`;
  });
  renderInvoice(); updatePricePreview();
})();

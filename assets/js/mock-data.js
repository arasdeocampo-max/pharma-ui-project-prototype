window.pharmacyData = {
  products: [
    { id: 1, name: 'Paracetamol', barcode: 'PHS-1001', price: 16, stock: 120, expiration: '2026-11-20', shelf: 'A1-02', type: 'OTC' },
    { id: 2, name: 'Amoxicillin', barcode: 'PHS-1002', price: 42, stock: 28, expiration: '2026-07-15', shelf: 'B2-01', type: 'RX' },
    { id: 3, name: 'Vitamin C', barcode: 'PHS-1003', price: 18, stock: 94, expiration: '2027-01-10', shelf: 'A3-04', type: 'OTC' },
    { id: 4, name: 'Ibuprofen', barcode: 'PHS-1004', price: 24, stock: 14, expiration: '2026-06-02', shelf: 'B1-03', type: 'RX' },
    { id: 5, name: 'Cetirizine', barcode: 'PHS-1005', price: 21, stock: 6, expiration: '2026-05-12', shelf: 'C1-06', type: 'RX' }
  ],
  salesReport: [
    { date: '2026-03-21', transactions: 78, gross: 24650, topProduct: 'Paracetamol' },
    { date: '2026-03-20', transactions: 74, gross: 23100, topProduct: 'Vitamin C' },
    { date: '2026-03-19', transactions: 69, gross: 21840, topProduct: 'Ibuprofen' }
  ],
  notifications: [
    { title: 'Critical reorder alert', message: 'Cetirizine reached critical stock with only 6 packs left.', time: '5 mins ago' },
    { title: 'Expiry watch triggered', message: 'Ibuprofen expires within the next 75 days.', time: '18 mins ago' },
    { title: 'Sales milestone', message: 'Daily mock sales crossed ₱24,000 before noon.', time: '42 mins ago' }
  ]
};
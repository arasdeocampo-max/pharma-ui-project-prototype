window.pharmacyData = {
  products: [
    { id: 1, name: 'Paracetamol 500mg', barcode: 'PHS-1001', price: 16, stock: 120, expiration: '2026-11-20', shelf: 'A1-02', type: 'OTC' },
    { id: 2, name: 'Amoxicillin 500mg', barcode: 'PHS-1002', price: 42, stock: 28, expiration: '2026-07-15', shelf: 'B2-01', type: 'RX' },
    { id: 3, name: 'Vitamin C 500mg', barcode: 'PHS-1003', price: 18, stock: 94, expiration: '2027-01-10', shelf: 'A3-04', type: 'OTC' },
    { id: 4, name: 'Digital BP Monitor', barcode: 'PHS-2001', price: 1850, stock: 12, expiration: '2029-12-31', shelf: 'D1-01', type: 'OTC' },
    { id: 5, name: 'Glucometer Test Strips (50s)', barcode: 'PHS-2002', price: 560, stock: 18, expiration: '2027-05-12', shelf: 'D2-03', type: 'OTC' },
    { id: 6, name: 'Wheelchair (Standard)', barcode: 'PHS-3001', price: 4200, stock: 4, expiration: '2030-12-31', shelf: 'E1-01', type: 'OTC' },
    { id: 7, name: 'Hospital Bed Mattress', barcode: 'PHS-3002', price: 3200, stock: 7, expiration: '2030-12-31', shelf: 'E2-02', type: 'OTC' },
    { id: 8, name: 'Nitrile Gloves (Box)', barcode: 'PHS-2003', price: 280, stock: 56, expiration: '2028-08-30', shelf: 'C1-04', type: 'OTC' }
  ],
  salesReport: [
    { date: '2026-03-21', transactions: 78, gross: 74650, topProduct: 'Glucometer Test Strips (50s)' },
    { date: '2026-03-20', transactions: 74, gross: 63100, topProduct: 'Paracetamol 500mg' },
    { date: '2026-03-19', transactions: 69, gross: 51840, topProduct: 'Nitrile Gloves (Box)' }
  ],
  notifications: [
    { title: 'Critical reorder alert', message: 'Wheelchair (Standard) reached critical stock with only 4 units left.', time: '5 mins ago' },
    { title: 'Supply expiry watch', message: 'Amoxicillin 500mg expires within the next 110 days.', time: '18 mins ago' },
    { title: 'Service milestone', message: 'BP and sugar monitoring supplies were the top-selling category this morning.', time: '42 mins ago' }
  ]
};

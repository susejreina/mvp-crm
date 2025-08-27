import { db } from '../firebase';
import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { Sale, saleIdFrom, SaleUser, slugifyEmail } from '../types';
import { upsertClientFromSaleInput } from './clients';

interface DemoSaleInput {
  type: 'individual' | 'group';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productId: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  currency: 'USD' | 'MXN' | 'COP';
  dateISO: string; // YYYY-MM-DD
  paymentMethod: 'transfer_mx' | 'transfer_co' | 'card' | 'paypal' | 'other';
  source: string;
  week: number;
  iteration: number;
  status: 'pending' | 'approved' | 'denied';
  evidenceUrl?: string;
  users?: SaleUser[];
}

const demoSales: DemoSaleInput[] = [
  {
    type: 'individual',
    customerName: 'Juan Sebastian Arango Giraldo',
    customerEmail: 'juanc2587@hotmail.com',
    customerPhone: '+57 301 5678823',
    productId: 'chatgpt-live-workshop',
    productName: 'Taller en vivo Domina ChatGPT',
    vendorId: 'angelica-academiadeia-com',
    vendorName: 'Angelica Bou',
    amount: 3660.22,
    currency: 'MXN',
    dateISO: '2025-01-06',
    paymentMethod: 'transfer_mx',
    source: 'ASPE',
    week: 18,
    iteration: 38,
    status: 'pending',
    evidenceUrl: 'https://drive.google.com/example1',
  },
  {
    type: 'group',
    customerName: 'Maria Elena Gonzalez',
    customerEmail: 'maria.gonzalez@empresa.com',
    customerPhone: '+52 55 1234 5678',
    productId: 'ai-business-basics',
    productName: 'AI para Negocios - Fundamentos',
    vendorId: 'angela-academiadeia-com',
    vendorName: 'Angela Ojeda',
    amount: 590,
    currency: 'USD',
    dateISO: '2025-01-05',
    paymentMethod: 'card',
    source: 'LinkedIn',
    week: 17,
    iteration: 37,
    status: 'approved',
    users: [
      {
        name: 'Maria Elena Gonzalez',
        email: 'maria.gonzalez@empresa.com',
        phone: '+52 55 1234 5678',
      },
      {
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@empresa.com',
        phone: '+52 55 9876 5432',
      },
      {
        name: 'Ana Rodriguez',
        email: 'ana.rodriguez@empresa.com',
      },
    ],
  },
  {
    type: 'individual',
    customerName: 'Diego Torres',
    customerEmail: 'diego.torres@gmail.com',
    customerPhone: '+57 300 456 7890',
    productId: 'automation-workshop',
    productName: 'Automatización con IA',
    vendorId: 'carlos-academiadeia-com',
    vendorName: 'Carlos Rodriguez',
    amount: 450000,
    currency: 'COP',
    dateISO: '2025-01-04',
    paymentMethod: 'transfer_co',
    source: 'Facebook',
    week: 17,
    iteration: 37,
    status: 'approved',
  },
  {
    type: 'individual',
    customerName: 'Laura Martinez',
    customerEmail: 'laura.martinez@outlook.com',
    customerPhone: '+1 555 123 4567',
    productId: 'prompt-engineering-pro',
    productName: 'Prompt Engineering Profesional',
    vendorId: 'angelica-academiadeia-com',
    vendorName: 'Angelica Bou',
    amount: 299,
    currency: 'USD',
    dateISO: '2025-01-03',
    paymentMethod: 'paypal',
    source: 'YouTube',
    week: 17,
    iteration: 37,
    status: 'denied',
    evidenceUrl: 'https://drive.google.com/example2',
  },
  {
    type: 'group',
    customerName: 'Roberto Silva',
    customerEmail: 'roberto.silva@startup.co',
    customerPhone: '+55 11 98765 4321',
    productId: 'ai-productivity-bootcamp',
    productName: 'Bootcamp de Productividad con IA',
    vendorId: 'angela-academiadeia-com',
    vendorName: 'Angela Ojeda',
    amount: 798,
    currency: 'USD',
    dateISO: '2025-01-02',
    paymentMethod: 'card',
    source: 'Referral',
    week: 16,
    iteration: 36,
    status: 'approved',
    users: [
      {
        name: 'Roberto Silva',
        email: 'roberto.silva@startup.co',
        phone: '+55 11 98765 4321',
      },
      {
        name: 'Patricia Lima',
        email: 'patricia.lima@startup.co',
      },
    ],
  },
  {
    type: 'individual',
    customerName: 'Sofia Herrera',
    customerEmail: 'sofia.herrera@yahoo.com',
    productId: 'ai-writing-mastery',
    productName: 'Escritura con IA - Nivel Experto',
    vendorId: 'carlos-academiadeia-com',
    vendorName: 'Carlos Rodriguez',
    amount: 149,
    currency: 'USD',
    dateISO: '2025-01-01',
    paymentMethod: 'card',
    source: 'Instagram',
    week: 16,
    iteration: 36,
    status: 'pending',
  },
  {
    type: 'individual',
    customerName: 'Alejandro Morales',
    customerEmail: 'alex.morales@proton.me',
    customerPhone: '+34 666 777 888',
    productId: 'claude-advanced-course',
    productName: 'Claude AI Avanzado',
    vendorId: 'angelica-academiadeia-com',
    vendorName: 'Angelica Bou',
    amount: 2499,
    currency: 'MXN',
    dateISO: '2024-12-30',
    paymentMethod: 'transfer_mx',
    source: 'Email Campaign',
    week: 16,
    iteration: 36,
    status: 'approved',
    evidenceUrl: 'https://drive.google.com/example3',
  },
  {
    type: 'individual',
    customerName: 'Natalia Vega',
    customerEmail: 'natalia.vega@gmail.com',
    customerPhone: '+57 315 987 6543',
    productId: 'midjourney-masterclass',
    productName: 'Midjourney Masterclass',
    vendorId: 'carlos-academiadeia-com',
    vendorName: 'Carlos Rodriguez',
    amount: 280000,
    currency: 'COP',
    dateISO: '2024-12-29',
    paymentMethod: 'transfer_co',
    source: 'WhatsApp',
    week: 15,
    iteration: 35,
    status: 'denied',
  },
];

export async function seedSales({ adminUid }: { adminUid: string }): Promise<void> {
  console.log('Seeding sales...');
  
  // First, upsert all clients
  console.log('Upserting clients from sales...');
  for (const sale of demoSales) {
    await upsertClientFromSaleInput({
      type: sale.type,
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      customerPhone: sale.customerPhone,
      date: Timestamp.fromDate(new Date(sale.dateISO)),
      users: sale.users,
    });
  }
  
  // Then create sales in batch
  const batch = writeBatch(db);
  const salesRef = collection(db, 'sales');
  
  const now = Timestamp.now();
  
  demoSales.forEach(saleInput => {
    const saleId = saleIdFrom({
      customerEmail: saleInput.customerEmail,
      dateISO: saleInput.dateISO,
      productId: saleInput.productId,
    });
    
    const docRef = doc(salesRef, saleId);
    
    const saleData: Sale = {
      id: saleId,
      type: saleInput.type,
      
      // Client relationship
      clientId: slugifyEmail(saleInput.customerEmail),
      customerName: saleInput.customerName,
      customerEmail: saleInput.customerEmail,
      customerPhone: saleInput.customerPhone,
      
      // Product
      productId: saleInput.productId,
      productName: saleInput.productName,
      
      // Vendor
      vendorId: saleInput.vendorId,
      vendorName: saleInput.vendorName,
      
      amount: saleInput.amount,
      currency: saleInput.currency,
      date: Timestamp.fromDate(new Date(saleInput.dateISO)),
      
      paymentMethod: saleInput.paymentMethod,
      source: saleInput.source,
      week: saleInput.week,
      iteration: saleInput.iteration,
      evidenceUrl: saleInput.evidenceUrl,
      
      status: saleInput.status,
      
      // Group sales
      users: saleInput.users,
      
      createdBy: adminUid,
      createdAt: now,
    };
    
    batch.set(docRef, saleData);
  });
  
  await batch.commit();
  console.log(`Seeded ${demoSales.length} sales`);
}
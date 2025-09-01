import { db } from '../firebase';
import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { Product } from '../types';

const demoProducts: Omit<Product, 'createdAt'>[] = [
  { id: 'chatgpt-live-workshop', name: 'Taller en vivo Domina ChatGPT', sku: 'chatgpt-live-workshop', baseCurrency: 'MXN', basePrice: 3660.22, active: true },
  { id: 'ai-business-basics', name: 'AI para Negocios - Fundamentos', sku: 'ai-business-basics', baseCurrency: 'USD', basePrice: 197, active: true },
  { id: 'prompt-engineering-pro', name: 'Prompt Engineering Profesional', sku: 'prompt-engineering-pro', baseCurrency: 'USD', basePrice: 299, active: true },
  { id: 'automation-workshop', name: 'Automatización con IA', sku: 'automation-workshop', baseCurrency: 'COP', basePrice: 450000, active: true },
  { id: 'ai-writing-mastery', name: 'Escritura con IA - Nivel Experto', sku: 'ai-writing-mastery', baseCurrency: 'USD', basePrice: 149, active: true },
  { id: 'claude-advanced-course', name: 'Claude AI Avanzado', sku: 'claude-advanced-course', baseCurrency: 'MXN', basePrice: 2499, active: true },
  { id: 'ai-productivity-bootcamp', name: 'Bootcamp de Productividad con IA', sku: 'ai-productivity-bootcamp', baseCurrency: 'USD', basePrice: 399, active: true },
  { id: 'midjourney-masterclass', name: 'Midjourney Masterclass', sku: 'midjourney-masterclass', baseCurrency: 'COP', basePrice: 280000, active: false },
];

export async function seedProducts() {
  console.log('Seeding products...');
  const batch = writeBatch(db);
  const productsRef = collection(db, 'products');
  const now = Timestamp.now();

  demoProducts.forEach(product => {
    const docRef = doc(productsRef, product.id);
    batch.set(docRef, { ...product, createdAt: now });
  });

  await batch.commit();
  console.log(`Seeded ${demoProducts.length} products`);
}

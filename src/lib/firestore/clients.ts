import { collection, doc, getDoc, getDocs, query, where, updateDoc, setDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Client, slugifyEmail } from '../types';

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  lastPurchaseAt?: Timestamp;
}

/**
 * Get all active clients for autocomplete
 */
export async function getActiveClients(): Promise<Client[]> {
  const clientsRef = collection(db, 'clients');
  const q = query(clientsRef, where('active', '==', true));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Client));
}

/**
 * Get all clients (active and inactive) for management
 */
export async function getAllClients(): Promise<Client[]> {
  const clientsRef = collection(db, 'clients');
  const q = query(clientsRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Client));
}

/**
 * Get client by email (returns most recent if multiple exist)
 */
export async function getClientByEmail(email: string): Promise<Client | null> {
  const clientsRef = collection(db, 'clients');
  const q = query(clientsRef, where('email', '==', email));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  // If multiple clients with same email, return the most recent active one
  const clients = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Client));
  
  const activeClient = clients.find(c => c.active);
  if (activeClient) return activeClient;
  
  // If no active client, return the most recently created
  return clients.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0];
}

/**
 * Create a new client
 */
export async function createClient(data: CreateClientData): Promise<Client> {
  const clientId = slugifyEmail(data.email);
  const clientRef = doc(db, 'clients', clientId);
  
  const clientData: Omit<Client, 'id'> = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    active: true,
    createdAt: Timestamp.now(),
  };
  
  await setDoc(clientRef, clientData);
  
  return {
    id: clientId,
    ...clientData,
  };
}

/**
 * Update an existing client
 */
export async function updateClient(clientId: string, data: UpdateClientData): Promise<void> {
  const clientRef = doc(db, 'clients', clientId);
  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.lastPurchaseAt !== undefined) updateData.lastPurchaseAt = data.lastPurchaseAt;
  
  await updateDoc(clientRef, updateData);
}

/**
 * Deactivate a client (set active = false)
 */
export async function deactivateClient(clientId: string): Promise<void> {
  await updateClient(clientId, { active: false });
}

/**
 * Handle client resolution for sales:
 * - If client exists with same email -> use existing
 * - If client exists but email changed -> deactivate old, create new
 * - If client doesn't exist -> create new
 */
export async function resolveClientForSale(
  selectedClientId: string | null,
  name: string,
  email: string,
  phone?: string
): Promise<{ client: Client; deactivatedClientId?: string }> {
  let deactivatedClientId: string | undefined = undefined;
  
  // Case 1: New client (no selected client ID)
  if (!selectedClientId) {
    const existingClient = await getClientByEmail(email);
    if (existingClient && existingClient.active) {
      // Client already exists with this email, use it
      return { client: existingClient };
    } else {
      // Create new client
      const client = await createClient({ name, email, phone });
      return { client };
    }
  }
  
  // Case 2: Existing client selected
  const clientRef = doc(db, 'clients', selectedClientId);
  const clientSnap = await getDoc(clientRef);
  
  if (!clientSnap.exists()) {
    // Selected client doesn't exist, create new
    const client = await createClient({ name, email, phone });
    return { client };
  }
  
  const existingClient = { id: clientSnap.id, ...clientSnap.data() } as Client;
  
  // Case 2a: Email unchanged, update other fields if needed
  if (existingClient.email === email) {
    if (existingClient.name !== name || existingClient.phone !== phone) {
      await updateClient(selectedClientId, { name, phone });
      return {
        client: {
          ...existingClient,
          name,
          phone,
        }
      };
    }
    return { client: existingClient };
  }
  
  // Case 2b: Email changed, deactivate old and create new
  await deactivateClient(selectedClientId);
  deactivatedClientId = selectedClientId;
  
  const newClient = await createClient({ name, email, phone });
  return { client: newClient, deactivatedClientId };
}
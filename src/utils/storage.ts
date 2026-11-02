import {
  BusinessProfile,
  UnitDefinition,
  Category,
  Product,
  Customer,
  CustomerTransaction,
  Supplier,
  PurchaseInvoice,
  SupplierTransaction,
  Invoice,
  Expense,
  StockAdjustment,
  Language,
  UserRole,
} from '../types';

export const SYSTEM_UNITS: UnitDefinition[] = [
  { id: 'u_pcs', code: 'pcs', name: 'Piece', nameHi: 'नग / पीस', nameMr: 'नग (Piece)', allowDecimals: false, isSystem: true },
  { id: 'u_kg', code: 'kg', name: 'Kilogram', nameHi: 'किलोग्राम', nameMr: 'किलोग्रॅम', allowDecimals: true, isSystem: true },
  { id: 'u_g', code: 'g', name: 'Gram', nameHi: 'ग्राम', nameMr: 'ग्रॅम', allowDecimals: true, isSystem: true },
  { id: 'u_l', code: 'L', name: 'Litre', nameHi: 'लीटर', nameMr: 'लिटर', allowDecimals: true, isSystem: true },
  { id: 'u_ml', code: 'ml', name: 'Millilitre', nameHi: 'मिलीलीटर', nameMr: 'मिलीलिटर', allowDecimals: true, isSystem: true },
  { id: 'u_box', code: 'box', name: 'Box', nameHi: 'बॉक्स / खोका', nameMr: 'खोका (Box)', allowDecimals: false, isSystem: true },
  { id: 'u_pkt', code: 'pkt', name: 'Packet', nameHi: 'पैकेट', nameMr: 'पुडा / पाकीट', allowDecimals: false, isSystem: true },
  { id: 'u_bag', code: 'bag', name: 'Bag / Bori', nameHi: 'बोरी / कट्टा', nameMr: 'पोते / कट्टा (Bag)', allowDecimals: true, isSystem: true },
  { id: 'u_m', code: 'm', name: 'Metre', nameHi: 'मीटर', nameMr: 'मीटर (Metre)', allowDecimals: true, isSystem: true },
  { id: 'u_ft', code: 'ft', name: 'Feet', nameHi: 'फीट', nameMr: 'फूट (Feet)', allowDecimals: true, isSystem: true },
  { id: 'u_set', code: 'set', name: 'Set', nameHi: 'सेट', nameMr: 'संच (Set)', allowDecimals: false, isSystem: true },
  { id: 'u_dz', code: 'dz', name: 'Dozen', nameHi: 'दर्जन', nameMr: 'डझन (Dozen)', allowDecimals: false, isSystem: true },
  { id: 'u_qtl', code: 'qtl', name: 'Quintal', nameHi: 'क्विंटल', nameMr: 'क्विंटल', allowDecimals: true, isSystem: true },
  { id: 'u_ctn', code: 'ctn', name: 'Carton', nameHi: 'कार्टन', nameMr: 'कार्टन', allowDecimals: false, isSystem: true },
  { id: 'u_roll', code: 'roll', name: 'Roll', nameHi: 'रोल', nameMr: 'रोल', allowDecimals: false, isSystem: true },
];

export interface AppStoreData {
  business: BusinessProfile;
  units: UnitDefinition[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  customerTransactions: CustomerTransaction[];
  suppliers: Supplier[];
  purchaseInvoices: PurchaseInvoice[];
  supplierTransactions: SupplierTransaction[];
  invoices: Invoice[];
  expenses: Expense[];
  stockAdjustments: StockAdjustment[];
}

const STORAGE_KEY_PREFIX = 'vyapar_bandhu_store_';
const ACTIVE_BUSINESS_ID_KEY = 'vyapar_bandhu_active_business_id';
const ALL_BUSINESSES_KEY = 'vyapar_bandhu_business_list';

export function getActiveBusinessId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_BUSINESS_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveBusinessId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_BUSINESS_ID_KEY, id);
  } catch (err) {
    console.error('Failed to set active business id:', err);
  }
}

export function getAllBusinessesList(): { id: string; name: string; businessType: string }[] {
  try {
    const raw = localStorage.getItem(ALL_BUSINESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBusinessesList(list: { id: string; name: string; businessType: string }[]): void {
  try {
    localStorage.setItem(ALL_BUSINESSES_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save businesses list:', err);
  }
}

export function createDefaultBusiness(
  name: string,
  businessType: BusinessProfile['businessType'],
  ownerName: string,
  phone: string,
  city: string,
  state: string,
  stateCode: string,
  gstStatus: BusinessProfile['gstStatus'],
  gstin?: string,
  upiId?: string,
  lang: Language = 'en',
  securityEnabled?: boolean,
  ownerPin?: string,
  cashierPin?: string
): BusinessProfile {
  return {
    id: 'biz_' + Date.now(),
    name,
    businessType,
    ownerName,
    phone,
    address: 'Main Market Road',
    city,
    state,
    stateCode: stateCode || '27',
    pincode: '400001',
    gstStatus,
    gstin: gstin || (gstStatus === 'registered' ? '27ABCDE1234F1Z5' : undefined),
    upiId: upiId || `${phone.replace(/\D/g, '') || 'shop'}@upi`,
    invoicePrefix: 'INV-',
    nextInvoiceNumber: 1001,
    currency: 'INR',
    currencySymbol: '₹',
    defaultLanguage: lang,
    invoiceTerms: '1. Goods once sold will be exchanged within 7 days with valid bill.\n2. Interest @ 18% p.a. will be charged on delayed payments.\n3. Subject to local jurisdiction.',
    securityEnabled: !!securityEnabled,
    ownerPin: ownerPin?.trim() || undefined,
    cashierPin: cashierPin?.trim() || undefined,
  };
}

export function loadStore(businessId: string): AppStoreData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + businessId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load store for business:', businessId, err);
    return null;
  }
}

export function saveStore(data: AppStoreData): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + data.business.id, JSON.stringify(data));
    
    // Update businesses list
    const list = getAllBusinessesList();
    const existingIndex = list.findIndex(b => b.id === data.business.id);
    if (existingIndex >= 0) {
      list[existingIndex] = {
        id: data.business.id,
        name: data.business.name,
        businessType: data.business.businessType,
      };
    } else {
      list.push({
        id: data.business.id,
        name: data.business.name,
        businessType: data.business.businessType,
      });
    }
    saveBusinessesList(list);
  } catch (err) {
    console.error('Failed to save store:', err);
  }
}

/**
 * Permanently deletes a store and its data from localStorage.
 * Updates the business registry and returns remaining count and next business ID.
 */
export function deleteStore(businessId: string): { remainingCount: number; nextBusinessId: string | null } {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + businessId);
    
    // Update businesses list
    const list = getAllBusinessesList().filter(b => b.id !== businessId);
    saveBusinessesList(list);

    const currentActive = getActiveBusinessId();
    let nextBusinessId: string | null = null;
    if (currentActive === businessId) {
      if (list.length > 0) {
        nextBusinessId = list[0].id;
        setActiveBusinessId(list[0].id);
      } else {
        localStorage.removeItem(ACTIVE_BUSINESS_ID_KEY);
      }
    } else {
      nextBusinessId = currentActive;
    }
    return { remainingCount: list.length, nextBusinessId };
  } catch (err) {
    console.error('Failed to delete store:', businessId, err);
    return { remainingCount: 0, nextBusinessId: null };
  }
}

/**
 * Creates suggested starter categories for business type.
 * Note: Never hardcodes specific fixed products! Only gives flexible categories.
 */
export function getStarterCategoriesForType(businessType: BusinessProfile['businessType']): Category[] {
  switch (businessType) {
    case 'grocery_kirana':
      return [
        { id: 'cat_1', name: 'Grains & Pulses', nameHi: 'अनाज आणि डाळी', nameMr: 'धान्य व डाळी', color: 'emerald' },
        { id: 'cat_2', name: 'Edible Oils & Ghee', nameHi: 'खाद्य तेल आणि तूप', nameMr: 'खाद्यतेल व तूप', color: 'amber' },
        { id: 'cat_3', name: 'Spices & Masala', nameHi: 'मसाले', nameMr: 'मसाले व गरम मसाले', color: 'red' },
        { id: 'cat_4', name: 'Packaged Foods & Snacks', nameHi: 'नाश्ता आणि स्नॅक्स', nameMr: 'पॅकबंद खाद्यपदार्थ', color: 'blue' },
        { id: 'cat_5', name: 'Cleaning & Toiletries', nameHi: 'स्वच्छता आणि साबण', nameMr: 'स्वच्छता साहित्य', color: 'purple' },
      ];
    case 'electronics_mobile':
      return [
        { id: 'cat_1', name: 'Smartphones & Tablets', nameHi: 'स्मार्टफोन', nameMr: 'मोबाईल फोन', color: 'blue' },
        { id: 'cat_2', name: 'Mobile Accessories', nameHi: 'मोबाईल ऍक्सेसरीज', nameMr: 'मोबाईल उपकरणे', color: 'amber' },
        { id: 'cat_3', name: 'Audio & Earphones', nameHi: 'इयरफोन आणि स्पीकर्स', nameMr: 'ऑडिओ व स्पीकर्स', color: 'purple' },
        { id: 'cat_4', name: 'Home Appliances', nameHi: 'घरगुती उपकरणे', nameMr: 'घरगुती उपकरणे', color: 'emerald' },
        { id: 'cat_5', name: 'Repair & Service', nameHi: 'दुरुस्ती सेवा', nameMr: 'रिपेअरिंग व सर्व्हिसिंग', color: 'orange' },
      ];
    case 'hardware_sanitary':
      return [
        { id: 'cat_1', name: 'Pipes & Fittings', nameHi: 'पाईप आणि फिटिंग', nameMr: 'पाईप व फिटिंग्ज', color: 'blue' },
        { id: 'cat_2', name: 'Electrical & Wires', nameHi: 'वायरिंग आणि स्विचेस', nameMr: 'इलेक्ट्रिकल व वायर', color: 'amber' },
        { id: 'cat_3', name: 'Paints & Primer', nameHi: 'पेंट आणि रंगकाम', nameMr: 'रंग व प्राइमर', color: 'purple' },
        { id: 'cat_4', name: 'Hand & Power Tools', nameHi: 'टूल्स आणि अवजारे', nameMr: 'अवजारे व साधने', color: 'slate' },
        { id: 'cat_5', name: 'Screws, Nails & Fasteners', nameHi: 'नट-बोल्ट आणि खिळे', nameMr: 'खिळे व फास्टनर्स', color: 'red' },
      ];
    case 'clothing_textile':
      return [
        { id: 'cat_1', name: 'Menswear & Shirts', nameHi: 'पुरुषांचे कपडे', nameMr: 'पुरुषांचे पोशाख', color: 'blue' },
        { id: 'cat_2', name: 'Womens Ethnic & Sarees', nameHi: 'साड्या आणि कुर्ती', nameMr: 'साड्या व महिला कपडे', color: 'purple' },
        { id: 'cat_3', name: 'Kids Wear', nameHi: 'लहान मुलांचे कपडे', nameMr: 'लहान मुलांचे कपडे', color: 'amber' },
        { id: 'cat_4', name: 'Fabrics & Suiting', nameHi: 'कापड आणि तागे', nameMr: 'कापड व तागे', color: 'emerald' },
        { id: 'cat_5', name: 'Bed linen & Towels', nameHi: 'चादर आणि टॉवेल', nameMr: 'चादर व टॉवेल', color: 'rose' },
      ];
    case 'furniture_timber':
      return [
        { id: 'cat_1', name: 'Wooden Furniture', nameHi: 'लाकडी फर्निचर', nameMr: 'लाकडी फर्निचर', color: 'amber' },
        { id: 'cat_2', name: 'Steel & Metal Almirahs', nameHi: 'स्टील कपाटे', nameMr: 'स्टील कपाटे व रॅक', color: 'slate' },
        { id: 'cat_3', name: 'Plywood & Laminates', nameHi: 'प्लायवूड आणि सन्माईका', nameMr: 'प्लायवूड व सनमायका', color: 'orange' },
        { id: 'cat_4', name: 'Office Chairs & Tables', nameHi: 'खुर्च्या आणि टेबल', nameMr: 'खुर्च्या व टेबल्स', color: 'blue' },
        { id: 'cat_5', name: 'Custom Carpentry Services', nameHi: 'सुतारकाम सेवा', nameMr: 'फर्निचर काम सेवा', color: 'emerald' },
      ];
    default:
      return [
        { id: 'cat_1', name: 'General Products', nameHi: 'सामान्य उत्पादने', nameMr: 'सामान्य वस्तू', color: 'blue' },
        { id: 'cat_2', name: 'Premium Range', nameHi: 'प्रीमियम वस्तू', nameMr: 'प्रीमियम माल', color: 'purple' },
        { id: 'cat_3', name: 'Spare Parts', nameHi: 'सुटे भाग', nameMr: 'स्पेअर पार्टस', color: 'amber' },
        { id: 'cat_4', name: 'Services & Labor', nameHi: 'सेवा व मजुरी', nameMr: 'सेवा व लेबर', color: 'emerald' },
      ];
  }
}

/**
 * Initializes a new store for a business
 */
export function initializeStore(business: BusinessProfile): AppStoreData {
  const categories = getStarterCategoriesForType(business.businessType);
  const units = [...SYSTEM_UNITS];

  const storeData: AppStoreData = {
    business,
    units,
    categories,
    products: [],
    customers: [],
    customerTransactions: [],
    suppliers: [],
    purchaseInvoices: [],
    supplierTransactions: [],
    invoices: [],
    expenses: [],
    stockAdjustments: [],
  };

  saveStore(storeData);
  setActiveBusinessId(business.id);
  return storeData;
}

/**
 * Exports complete store to JSON string for backup
 */
export function exportStoreToJson(store: AppStoreData): string {
  return JSON.stringify(store, null, 2);
}

/**
 * Imports store from JSON string with validation
 */
export function importStoreFromJson(jsonStr: string): AppStoreData {
  const parsed = JSON.parse(jsonStr);
  if (!parsed.business || !parsed.business.id || !parsed.business.name) {
    throw new Error('Invalid backup file: Missing business profile');
  }
  if (!Array.isArray(parsed.products) || !Array.isArray(parsed.invoices)) {
    throw new Error('Invalid backup file: Missing inventory or sales data');
  }
  saveStore(parsed);
  setActiveBusinessId(parsed.business.id);
  return parsed;
}

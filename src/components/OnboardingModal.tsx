import React, { useState } from 'react';
import {
  Store,
  Building2,
  Phone,
  User,
  MapPin,
  QrCode,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { BusinessProfile, BusinessType, GstStatus, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { createDefaultBusiness, initializeStore, AppStoreData, SYSTEM_UNITS } from '../utils/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (storeData: AppStoreData) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const BUSINESS_TYPE_OPTIONS: { id: BusinessType; icon: string }[] = [
  { id: 'grocery_kirana', icon: '🛒' },
  { id: 'wholesale_trader', icon: '📦' },
  { id: 'electronics_mobile', icon: '📱' },
  { id: 'hardware_sanitary', icon: '🔧' },
  { id: 'clothing_textile', icon: '👕' },
  { id: 'furniture_timber', icon: '🪑' },
  { id: 'spices_grain', icon: '🌾' },
  { id: 'general_store', icon: '🏪' },
  { id: 'auto_parts', icon: '🚗' },
  { id: 'pharmacy', icon: '💊' },
  { id: 'food_restaurant', icon: '🍲' },
  { id: 'services', icon: '💼' },
  { id: 'other', icon: '🏬' },
];

const INDIAN_STATES = [
  { code: '27', name: 'Maharashtra' },
  { code: '24', name: 'Gujarat' },
  { code: '07', name: 'Delhi' },
  { code: '29', name: 'Karnataka' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '08', name: 'Rajasthan' },
  { code: '19', name: 'West Bengal' },
  { code: '03', name: 'Punjab' },
  { code: '06', name: 'Haryana' },
  { code: '10', name: 'Bihar' },
  { code: '32', name: 'Kerala' },
  { code: '30', name: 'Goa' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  language,
  onLanguageChange,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('grocery_kirana');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Pune');
  const [selectedState, setSelectedState] = useState(INDIAN_STATES[0]);
  const [gstStatus, setGstStatus] = useState<GstStatus>('unregistered');
  const [gstin, setGstin] = useState('');
  const [upiId, setUpiId] = useState('');
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [ownerPin, setOwnerPin] = useState('');
  const [cashierPin, setCashierPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your business or shop name.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your business name.');
      return;
    }

    const business = createDefaultBusiness(
      name.trim(),
      businessType,
      ownerName.trim() || 'Proprietor',
      phone.trim() || '9876543210',
      city.trim() || 'Mumbai',
      selectedState.name,
      selectedState.code,
      gstStatus,
      gstin.trim() || undefined,
      upiId.trim() || undefined,
      language,
      securityEnabled && (ownerPin.trim() !== '' || cashierPin.trim() !== ''),
      ownerPin.trim() || undefined,
      cashierPin.trim() || undefined
    );

    const store = initializeStore(business);
    onComplete(store);
  };

  const handleQuickDemoPreset = (presetType: 'grocery' | 'hardware' | 'electronics') => {
    let biz: BusinessProfile;
    if (presetType === 'hardware') {
      biz = createDefaultBusiness(
        'Mahalaxmi Hardware & Electricals',
        'hardware_sanitary',
        'Ramesh Patil',
        '9822012345',
        'Kolhapur',
        'Maharashtra',
        '27',
        'registered',
        '27AABCM8899K1Z4',
        'mahalaxmihardware@okhdfcbank',
        language
      );
    } else if (presetType === 'electronics') {
      biz = createDefaultBusiness(
        'Star Mobile & Electronics',
        'electronics_mobile',
        'Vikas Sharma',
        '9811098765',
        'Nashik',
        'Maharashtra',
        '27',
        'registered',
        '27AAECS4433D1Z9',
        'starmobile@paytm',
        language
      );
    } else {
      biz = createDefaultBusiness(
        'Shree Ganesh Kirana & Traders',
        'grocery_kirana',
        'Ganesh Kulkarni',
        '9890123456',
        'Pune',
        'Maharashtra',
        '27',
        'composition',
        undefined,
        'ganeshkirana@upi',
        language
      );
    }

    const store = initializeStore(biz);
    onComplete(store);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/30">
                <Store className="w-7 h-7 text-slate-950" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{t('businessSetup')}</h2>
                <p className="text-xs text-slate-300">Universal Indian Business ERP &amp; Fast Billing</p>
              </div>
            </div>

            {/* Language switcher */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  language === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  language === 'hi' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                }`}
              >
                हि
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('mr')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  language === 'mr' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                }`}
              >
                म
              </button>
            </div>
          </div>
        </div>

        {/* Quick Demo Launchers */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Quick Start with Ready Template:</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleQuickDemoPreset('grocery')}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition shadow-xs"
            >
              🛒 Kirana / Grocery
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoPreset('hardware')}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition shadow-xs"
            >
              🔧 Hardware
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoPreset('electronics')}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition shadow-xs"
            >
              📱 Electronics
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('businessName')} *
                </label>
                <div className="relative">
                  <Store className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shree Ganesh General Stores, Royal Traders..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t('businessType')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBusinessType(opt.id)}
                      className={`flex items-center space-x-2 p-2 rounded-lg text-left text-xs font-semibold transition ${
                        businessType === opt.id
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span className="truncate">{t(`type_${opt.id}` as any)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 transition"
                >
                  <span>Continue to Contact &amp; GST Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('ownerName')}</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Ramesh Patil"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9822012345"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('city')}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Nagpur, Surat"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('state')}</label>
                  <select
                    value={selectedState.code}
                    onChange={(e) => {
                      const s = INDIAN_STATES.find((st) => st.code === e.target.value);
                      if (s) setSelectedState(s);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GST Status Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('gstStatus')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGstStatus('unregistered')}
                    className={`p-2 rounded-xl text-center text-xs font-bold border transition ${
                      gstStatus === 'unregistered'
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {t('gstUnregistered')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstStatus('registered')}
                    className={`p-2 rounded-xl text-center text-xs font-bold border transition ${
                      gstStatus === 'registered'
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {t('gstRegistered')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstStatus('composition')}
                    className={`p-2 rounded-xl text-center text-xs font-bold border transition ${
                      gstStatus === 'composition'
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {t('gstComposition')}
                  </button>
                </div>
              </div>

              {gstStatus === 'registered' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('gstin')}</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('upiId')}</label>
                <div className="relative">
                  <QrCode className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. 9822012345@paytm or shop@okaxis"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Used to generate live scannable UPI QR codes on POS screen and print receipts.
                </p>
              </div>

              {/* Optional Role Security & PINs Section */}
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-600">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t('roleSecurity')}</h4>
                      <p className="text-[11px] text-slate-500">{t('roleSecurityDesc')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={securityEnabled}
                    onClick={() => setSecurityEnabled(!securityEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      securityEnabled ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        securityEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {securityEnabled && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowPins(!showPins)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                      >
                        {showPins ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{showPins ? 'Hide passwords' : 'Show passwords'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t('ownerPinLabel')}</span>
                        </label>
                        <input
                          type={showPins ? 'text' : 'password'}
                          value={ownerPin}
                          onChange={(e) => setOwnerPin(e.target.value)}
                          placeholder={t('ownerPinPlaceholder')}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1">
                          <Key className="w-3.5 h-3.5 text-slate-600" />
                          <span>{t('cashierPinLabel')}</span>
                        </label>
                        <input
                          type={showPins ? 'text' : 'password'}
                          value={cashierPin}
                          onChange={(e) => setCashierPin(e.target.value)}
                          placeholder={t('cashierPinPlaceholder')}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-amber-800/80 bg-amber-500/10 p-2 rounded-lg">
                      💡 {t('securityOptionalHint')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Launch Business ERP</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

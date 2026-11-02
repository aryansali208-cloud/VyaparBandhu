import React, { useState, useRef } from 'react';
import {
  Settings,
  Store,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  QrCode,
  Download,
  Upload,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Shield,
  FileText,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Trash2,
  Palette,
  AlertTriangle,
  ShieldAlert,
  X,
  Lock,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BusinessProfile, BusinessType, GstStatus, Language, UserRole } from '../types';
import { getTranslation } from '../i18n/translations';
import { AppStoreData, exportStoreToJson, importStoreFromJson, getAllBusinessesList } from '../utils/storage';

interface SettingsViewProps {
  business: BusinessProfile;
  storeData: AppStoreData;
  language: Language;
  userRole?: UserRole;
  onSaveBusiness: (updated: BusinessProfile) => void;
  onRestoreStore: (importedStore: AppStoreData) => void;
  onSwitchBusiness: (businessId: string) => void;
  onCreateNewBusiness: () => void;
  onDeleteStore?: (businessId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  business,
  storeData,
  language,
  userRole = 'owner',
  onSaveBusiness,
  onRestoreStore,
  onSwitchBusiness,
  onCreateNewBusiness,
  onDeleteStore,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-step Store Deletion States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [understoodChecked, setUnderstoodChecked] = useState(false);
  const [typedConfirmationName, setTypedConfirmationName] = useState('');

  // Form states
  const [name, setName] = useState(business.name);
  const [tagline, setTagline] = useState(business.tagline || '');
  const [businessType, setBusinessType] = useState<BusinessType>(business.businessType);
  const [ownerName, setOwnerName] = useState(business.ownerName);
  const [phone, setPhone] = useState(business.phone);
  const [email, setEmail] = useState(business.email || '');
  const [address, setAddress] = useState(business.address);
  const [city, setCity] = useState(business.city);
  const [state, setState] = useState(business.state);
  const [stateCode, setStateCode] = useState(business.stateCode);
  const [pincode, setPincode] = useState(business.pincode);
  const [gstStatus, setGstStatus] = useState<GstStatus>(business.gstStatus);
  const [gstin, setGstin] = useState(business.gstin || '');
  const [upiId, setUpiId] = useState(business.upiId || '');

  // Branding states
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(business.bannerUrl || '');
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Bank details
  const [bankName, setBankName] = useState(business.bankDetails?.bankName || '');
  const [accountNo, setAccountNo] = useState(business.bankDetails?.accountNo || '');
  const [ifsc, setIfsc] = useState(business.bankDetails?.ifsc || '');
  const [branch, setBranch] = useState(business.bankDetails?.branch || '');

  // Invoice terms & sequence
  const [invoicePrefix, setInvoicePrefix] = useState(business.invoicePrefix);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(business.nextInvoiceNumber);
  const [invoiceTerms, setInvoiceTerms] = useState(business.invoiceTerms || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  // Security & Passcodes state
  const [securityEnabled, setSecurityEnabled] = useState(!!business.securityEnabled);
  const [ownerPin, setOwnerPin] = useState(business.ownerPin || '');
  const [cashierPin, setCashierPin] = useState(business.cashierPin || '');
  const [showSettingsPins, setShowSettingsPins] = useState(false);

  const businessesList = getAllBusinessesList();

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size exceeds 2MB. Please select a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Banner size exceeds 3MB. Please select a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setBannerUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BusinessProfile = {
      ...business,
      name: name.trim(),
      tagline: tagline.trim() || undefined,
      businessType,
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      stateCode: stateCode.trim(),
      pincode: pincode.trim(),
      gstStatus,
      gstin: gstin.trim() || undefined,
      upiId: upiId.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      bannerUrl: bannerUrl.trim() || undefined,
      bankDetails: accountNo.trim()
        ? {
            bankName: bankName.trim(),
            accountNo: accountNo.trim(),
            ifsc: ifsc.trim(),
            branch: branch.trim() || undefined,
          }
        : undefined,
      invoicePrefix: invoicePrefix.trim() || 'INV-',
      nextInvoiceNumber: Number(nextInvoiceNumber) || 1001,
      invoiceTerms: invoiceTerms.trim() || undefined,
      securityEnabled: securityEnabled && (ownerPin.trim() !== '' || cashierPin.trim() !== ''),
      ownerPin: ownerPin.trim() || undefined,
      cashierPin: cashierPin.trim() || undefined,
    };

    onSaveBusiness(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Download JSON Backup
  const handleDownloadBackup = () => {
    const jsonStr = exportStoreToJson(storeData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${business.name.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Restore JSON Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = importStoreFromJson(content);
        onRestoreStore(imported);
        alert('Data backup successfully restored!');
      } catch (err: any) {
        setRestoreError(err.message || 'Failed to restore backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-3 sm:p-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('settings')}
          </h1>
          <p className="text-xs text-slate-500">
            Configure business identity, GST registration, bank details, and full data backups.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('settingsSaved')}</span>
          </div>
        )}
      </div>

      {/* Multi-business Switcher Card */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            Current Active Business
          </span>
          <span className="text-lg font-black">{business.name}</span>
          <span className="text-xs text-slate-400 block mt-0.5">
            Type: {t(`type_${business.businessType}` as any)} • ID: {business.id}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {businessesList.length > 1 && (
            <select
              value={business.id}
              onChange={(e) => onSwitchBusiness(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white"
            >
              {businessesList.map((b) => (
                <option key={b.id} value={b.id}>
                  Switch to: {b.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={onCreateNewBusiness}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Business</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSubmit} className="space-y-6">
        {/* Store Branding: Logo & Banner */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>{t('storeBranding')}</span>
            </h2>
            <p className="text-slate-500 text-[11px] mt-0.5">{t('brandingDescription')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Logo Block */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <label className="block font-bold text-slate-800 text-xs">
                {t('storeLogo')}
              </label>

              {/* Logo Preview */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-1 flex items-center justify-center overflow-hidden shadow-xs relative group">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Store Logo"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-center text-slate-400 p-2">
                      <ImageIcon className="w-7 h-7 mx-auto mb-1 text-slate-300" />
                      <span className="text-[10px] font-semibold block">No Logo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t('uploadLogo')}</span>
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs flex items-center space-x-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('removeLogo')}</span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />

                  <div>
                    <input
                      type="text"
                      placeholder="Or paste Logo Image URL..."
                      value={logoUrl.startsWith('data:') ? '' : logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Store Banner Block */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <label className="block font-bold text-slate-800 text-xs">
                {t('storeBanner')}
              </label>

              {/* Banner Preview */}
              <div className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-900 overflow-hidden relative shadow-xs flex items-center justify-center">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Store Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <Camera className="w-6 h-6 mx-auto mb-0.5 text-slate-500" />
                    <span className="text-[10px] font-semibold text-slate-400">Default Dark Slate Header</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('uploadBanner')}</span>
                </button>

                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs flex items-center space-x-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('removeBanner')}</span>
                  </button>
                )}

                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileUpload}
                  className="hidden"
                />

                <input
                  type="text"
                  placeholder="Or paste Banner Image URL..."
                  value={bannerUrl.startsWith('data:') ? '' : bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Identity */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            2. Business Identity &amp; Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('businessName')} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Tagline / Subtitle</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Wholesalers & Retailers"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('ownerName')} *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('phone')} *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('address')} *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('city')}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('state')}</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">State Code</label>
              <input
                type="text"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                placeholder="27"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('pincode')}</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>
        </div>

        {/* GST & Payment Settings */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            2. GST &amp; Digital Payments
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('gstStatus')}</label>
              <select
                value={gstStatus}
                onChange={(e) => setGstStatus(e.target.value as GstStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              >
                <option value="registered">{t('gstRegistered')}</option>
                <option value="composition">{t('gstComposition')}</option>
                <option value="unregistered">{t('gstUnregistered')}</option>
              </select>
            </div>

            {gstStatus === 'registered' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('gstin')}</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="27ABCDE1234F1Z5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('upiId')}</label>
            <div className="relative">
              <QrCode className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. 9822012345@paytm or shop@okhdfcbank"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Live QR code will be generated on POS checkout and on printed receipts.
            </p>
          </div>

          {/* Bank Details */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block">Bank Account Details (Printed on Invoices)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder={t('bankName')}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
              />
              <input
                type="text"
                placeholder={t('accountNo')}
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
              <input
                type="text"
                placeholder={t('ifsc')}
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono uppercase font-bold"
              />
            </div>
          </div>
        </div>

        {/* Invoice Terms & Prefixes */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            3. Invoicing Numbering &amp; Terms
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Next Bill Number</label>
              <input
                type="number"
                value={nextInvoiceNumber}
                onChange={(e) => setNextInvoiceNumber(parseInt(e.target.value) || 1001)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('invoiceTerms')}</label>
            <textarea
              rows={3}
              value={invoiceTerms}
              onChange={(e) => setInvoiceTerms(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
        </div>

        {/* 4. Role Security & Passcodes (Optional) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>4. {t('roleSecurity')}</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('roleSecurityDesc')}</p>
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

          {securityEnabled ? (
            <div className="space-y-3 pt-1">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettingsPins(!showSettingsPins)}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                >
                  {showSettingsPins ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{showSettingsPins ? 'Hide passwords' : 'Show passwords'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="block font-bold text-slate-800 flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('ownerPinLabel')}</span>
                  </label>
                  <input
                    type={showSettingsPins ? 'text' : 'password'}
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value)}
                    placeholder={t('ownerPinPlaceholder')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Required when switching to Owner (Admin) role. Leave blank for no password.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="block font-bold text-slate-800 flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t('cashierPinLabel')}</span>
                  </label>
                  <input
                    type={showSettingsPins ? 'text' : 'password'}
                    value={cashierPin}
                    onChange={(e) => setCashierPin(e.target.value)}
                    placeholder={t('cashierPinPlaceholder')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Required when staff/cashier logs in. Leave blank for no password.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px]">
                💡 {t('securityOptionalHint')}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 flex items-center justify-between">
              <span>{t('securityDisabled')} — Anyone can switch between Owner and Cashier freely.</span>
              <button
                type="button"
                onClick={() => setSecurityEnabled(true)}
                className="text-amber-600 font-bold hover:underline"
              >
                Enable
              </button>
            </div>
          )}
        </div>

        {/* Save button */}
        <div>
          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-md shadow-amber-500/20 transition flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('saveSettings')}</span>
          </button>
        </div>
      </form>

      {/* Backup and Data Export / Restore Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <h2 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
          5. Complete Store Backup &amp; Offline Restore
        </h2>
        <p className="text-slate-500">
          Save an offline JSON copy of all your inventory, customers, bills, and ledgers. You can restore this file anytime or transfer to another computer.
        </p>

        {restoreError && (
          <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold">
            {restoreError}
          </div>
        )}

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center space-x-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{t('backupData')}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl flex items-center space-x-2 shadow-xs transition"
          >
            <Upload className="w-4 h-4" />
            <span>{t('restoreData')}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 5. Danger Zone: Store Deletion (Only for Owner) */}
      {userRole === 'owner' && (
        <div className="bg-rose-50/70 p-4 sm:p-6 rounded-2xl border-2 border-rose-200/80 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-rose-200 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-rose-950">
                  {t('dangerZone')}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {t('ownerOnlyAction')}
                </span>
              </div>
            </div>
          </div>

          <p className="text-rose-800 leading-relaxed">
            {t('deleteStoreDesc')}
          </p>

          <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-rose-200">
            <div>
              <div className="font-bold text-slate-900 text-sm">{business.name}</div>
              <div className="text-[11px] text-slate-500">
                {storeData.products.length} products • {storeData.invoices.length} invoices • {storeData.customers.length} customers
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteStep(1);
                setUnderstoodChecked(false);
                setTypedConfirmationName('');
                setIsDeleteModalOpen(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center space-x-2 shadow-xs shadow-rose-600/20 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('deleteStore')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Multi-Step Store Deletion Confirmation Modal (Owner Only) */}
      {isDeleteModalOpen && userRole === 'owner' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600/80 rounded-3xl text-white max-w-lg w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Step Tracker */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-950/80 border border-rose-700 text-rose-400 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {t('deleteStoreModalTitle')}
                  </h3>
                  <div className="text-xs text-rose-400 font-semibold">
                    {deleteStep === 1 && t('confirmDeleteStep1Title')}
                    {deleteStep === 2 && t('confirmDeleteStep2Title')}
                    {deleteStep === 3 && t('confirmDeleteStep3Title')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="w-full bg-slate-800 h-1.5 my-4 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: deleteStep === 1 ? '33%' : deleteStep === 2 ? '66%' : '100%' }}
              />
            </div>

            {/* STEP 1: Initial Warning & Item Counts */}
            {deleteStep === 1 && (
              <div className="space-y-4">
                <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-rose-200 text-xs leading-relaxed flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{t('confirmDeleteStep1Desc')}</span>
                    <span className="text-white font-mono font-bold bg-rose-950 px-1.5 py-0.5 rounded ml-1">
                      {business.name}
                    </span>
                    <p className="mt-1 text-rose-300">
                      {t('deleteStoreWarning')}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-300 mb-2">
                    {t('confirmDeleteStep1Items')}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                      <div className="text-slate-400 text-[11px]">Products & Stock</div>
                      <div className="text-base font-bold text-white">{storeData.products.length} items</div>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                      <div className="text-slate-400 text-[11px]">Sales & Invoices</div>
                      <div className="text-base font-bold text-white">{storeData.invoices.length} bills</div>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                      <div className="text-slate-400 text-[11px]">Customers & Khata</div>
                      <div className="text-base font-bold text-white">{storeData.customers.length} ledgers</div>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                      <div className="text-slate-400 text-[11px]">Suppliers & Purchases</div>
                      <div className="text-base font-bold text-white">{storeData.suppliers.length} vendors</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-rose-600/30"
                  >
                    <span>{t('proceedToStep2')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Name Typing & Checkbox Verification */}
            {deleteStep === 2 && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-2xl text-amber-200 text-xs leading-relaxed">
                  <div className="font-bold text-amber-300 mb-1">Confirmation Required</div>
                  <div>To prevent accidental deletion, acknowledge the warning and type the exact name of the store below.</div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-3 bg-slate-800/80 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition">
                    <input
                      type="checkbox"
                      checked={understoodChecked}
                      onChange={(e) => setUnderstoodChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-600 focus:ring-rose-500"
                    />
                    <span className="text-xs text-slate-300 leading-snug">
                      {t('confirmDeleteStep2Check')}
                    </span>
                  </label>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {t('typeToConfirm')} <span className="text-rose-400 font-mono select-all">"{business.name}"</span>
                    </label>
                    <input
                      type="text"
                      value={typedConfirmationName}
                      onChange={(e) => setTypedConfirmationName(e.target.value)}
                      placeholder={`Type ${business.name}`}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl text-white text-xs font-mono placeholder:text-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(1)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ← Back to Step 1
                  </button>
                  <button
                    type="button"
                    disabled={!understoodChecked || typedConfirmationName.trim().toLowerCase() !== business.name.trim().toLowerCase()}
                    onClick={() => setDeleteStep(3)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                      understoodChecked && typedConfirmationName.trim().toLowerCase() === business.name.trim().toLowerCase()
                        ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-600/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                    }`}
                  >
                    <span>{t('proceedToStep3')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Final Decisive Confirmation */}
            {deleteStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-rose-950/60 border-2 border-rose-600 rounded-2xl text-rose-100 text-center space-y-2">
                  <div className="w-12 h-12 bg-rose-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-600/50">
                    <Trash2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-base font-black text-white">
                    Final Confirmation: Delete "{business.name}"?
                  </h4>
                  <p className="text-xs text-rose-300 max-w-sm mx-auto">
                    {t('finalDeleteWarningText')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {t('keepStoreSafe')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteStore) {
                        onDeleteStore(business.id);
                        setIsDeleteModalOpen(false);
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer shadow-xl shadow-rose-600/40"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('confirmFinalDelete')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

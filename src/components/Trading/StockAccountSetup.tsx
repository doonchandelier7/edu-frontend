import React, { useState } from 'react';
import {
  UserIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface ContactInfo {
  emailAddress: string;
  phoneNumber: string;
  streetAddress: string[];
  unit?: string;
  city: string;
  state: string;
  postalCode: string;
}

interface IdentityInfo {
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  taxId: string;
  taxIdType: 'USA_SSN' | 'USA_EIN' | 'USA_ITIN';
  countryOfCitizenship: string;
  countryOfBirth: string;
  countryOfTaxResidence: string;
  fundingSource: string[];
  visaType?: string;
  visaExpirationDate?: string;
  dateOfDepartureFromUsa?: string;
  permanentResident?: boolean;
  investmentExperienceWithStocks?: string;
  investmentExperienceWithOptions?: string;
  investmentTimeHorizon?: string;
}

interface DisclosuresInfo {
  isControlPerson: boolean;
  isAffiliatedExchangeOrFinra: boolean;
  isAffiliatedExchangeOrIiroc?: boolean;
  isPoliticallyExposed: boolean;
  immediateFamilyExposed: boolean;
  isDiscretionary?: boolean;
}

interface AgreementInfo {
  agreement: string;
  signedAt: string;
  ipAddress: string;
  revision?: string;
}

interface DocumentInfo {
  documentType: string;
  documentSubType: string;
  content: string;
  mimeType: string;
}

interface TrustedContactInfo {
  givenName: string;
  familyName: string;
  emailAddress: string;
}

interface AccountSetupData {
  contact: ContactInfo;
  identity: IdentityInfo;
  disclosures: DisclosuresInfo;
  agreements: AgreementInfo[];
  documents: DocumentInfo[];
  trustedContact: TrustedContactInfo;
  enabledAssets?: string[];
}

interface StockAccountSetupProps {
  onComplete: (accountData: any) => void;
  onCancel: () => void;
}

const StockAccountSetup: React.FC<StockAccountSetupProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccountSetupData>({
    contact: {
      emailAddress: '',
      phoneNumber: '',
      streetAddress: [''],
      city: '',
      state: '',
      postalCode: ''
    },
    identity: {
      givenName: '',
      familyName: '',
      dateOfBirth: '',
      taxId: '',
      taxIdType: 'USA_SSN',
      countryOfCitizenship: 'USA',
      countryOfBirth: 'USA',
      countryOfTaxResidence: 'USA',
      fundingSource: ['employment_income']
    },
    disclosures: {
      isControlPerson: false,
      isAffiliatedExchangeOrFinra: false,
      isPoliticallyExposed: false,
      immediateFamilyExposed: false
    },
    agreements: [],
    documents: [],
    trustedContact: {
      givenName: '',
      familyName: '',
      emailAddress: ''
    },
    enabledAssets: ['us_equity']
  });

  const steps = [
    { id: 1, name: 'Contact Information', icon: UserIcon },
    { id: 2, name: 'Identity Information', icon: IdentificationIcon },
    { id: 3, name: 'Disclosures', icon: ShieldCheckIcon },
    { id: 4, name: 'Documents & Agreements', icon: DocumentTextIcon },
    { id: 5, name: 'Review & Submit', icon: CheckCircleIcon }
  ];

  const handleInputChange = (section: keyof AccountSetupData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayInputChange = (section: keyof AccountSetupData, field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].map((item: string, i: number) => i === index ? value : item)
      }
    }));
  };

  const addArrayItem = (section: keyof AccountSetupData, field: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section] as any)[field], '']
      }
    }));
  };

  const removeArrayItem = (section: keyof AccountSetupData, field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add current timestamp and IP for agreements
      const now = new Date().toISOString();
      const agreements = [
        {
          agreement: 'customer_agreement',
          signedAt: now,
          ipAddress: '127.0.0.1', // In production, get real IP
          revision: '21.2023.06'
        }
      ];

      const accountData = {
        ...formData,
        agreements
      };

      // Call API to create account
      const response = await fetch('/api/trading/alpaca-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(accountData)
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      const result = await response.json();
      onComplete(result);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.contact.emailAddress}
                  onChange={(e) => handleInputChange('contact', 'emailAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.contact.phoneNumber}
                  onChange={(e) => handleInputChange('contact', 'phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                {formData.contact.streetAddress.map((address, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => handleArrayInputChange('contact', 'streetAddress', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formData.contact.streetAddress.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('contact', 'streetAddress', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('contact', 'streetAddress')}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add another address line
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.contact.city}
                    onChange={(e) => handleInputChange('contact', 'city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.contact.state}
                    onChange={(e) => handleInputChange('contact', 'state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.contact.postalCode}
                  onChange={(e) => handleInputChange('contact', 'postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Identity Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Given Name</label>
                <input
                  type="text"
                  value={formData.identity.givenName}
                  onChange={(e) => handleInputChange('identity', 'givenName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
                <input
                  type="text"
                  value={formData.identity.familyName}
                  onChange={(e) => handleInputChange('identity', 'familyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.identity.dateOfBirth}
                onChange={(e) => handleInputChange('identity', 'dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                <input
                  type="text"
                  value={formData.identity.taxId}
                  onChange={(e) => handleInputChange('identity', 'taxId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID Type</label>
                <select
                  value={formData.identity.taxIdType}
                  onChange={(e) => handleInputChange('identity', 'taxIdType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USA_SSN">SSN</option>
                  <option value="USA_EIN">EIN</option>
                  <option value="USA_ITIN">ITIN</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Citizenship</label>
                <select
                  value={formData.identity.countryOfCitizenship}
                  onChange={(e) => handleInputChange('identity', 'countryOfCitizenship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USA">USA</option>
                  <option value="CAN">Canada</option>
                  <option value="GBR">United Kingdom</option>
                  <option value="AUS">Australia</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Birth</label>
                <select
                  value={formData.identity.countryOfBirth}
                  onChange={(e) => handleInputChange('identity', 'countryOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USA">USA</option>
                  <option value="CAN">Canada</option>
                  <option value="GBR">United Kingdom</option>
                  <option value="AUS">Australia</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Tax Residence</label>
                <select
                  value={formData.identity.countryOfTaxResidence}
                  onChange={(e) => handleInputChange('identity', 'countryOfTaxResidence', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USA">USA</option>
                  <option value="CAN">Canada</option>
                  <option value="GBR">United Kingdom</option>
                  <option value="AUS">Australia</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding Source</label>
              {formData.identity.fundingSource.map((source, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={source}
                    onChange={(e) => handleArrayInputChange('identity', 'fundingSource', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="employment_income">Employment Income</option>
                    <option value="investment_income">Investment Income</option>
                    <option value="business_income">Business Income</option>
                    <option value="retirement_income">Retirement Income</option>
                    <option value="other">Other</option>
                  </select>
                  {formData.identity.fundingSource.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('identity', 'fundingSource', index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('identity', 'fundingSource')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add another funding source
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Disclosures</h3>
            <p className="text-sm text-gray-600">Please answer the following questions truthfully:</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Are you a control person?</h4>
                  <p className="text-sm text-gray-600">A control person is someone who has the power to direct the management and policies of a company</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.disclosures.isControlPerson}
                  onChange={(e) => handleInputChange('disclosures', 'isControlPerson', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Are you affiliated with an exchange or FINRA?</h4>
                  <p className="text-sm text-gray-600">Are you currently or have you been affiliated with any securities exchange or FINRA member firm?</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.disclosures.isAffiliatedExchangeOrFinra}
                  onChange={(e) => handleInputChange('disclosures', 'isAffiliatedExchangeOrFinra', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Are you a politically exposed person?</h4>
                  <p className="text-sm text-gray-600">Are you or have you been a senior government official, their family member, or close associate?</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.disclosures.isPoliticallyExposed}
                  onChange={(e) => handleInputChange('disclosures', 'isPoliticallyExposed', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Is your immediate family politically exposed?</h4>
                  <p className="text-sm text-gray-600">Are any of your immediate family members politically exposed persons?</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.disclosures.immediateFamilyExposed}
                  onChange={(e) => handleInputChange('disclosures', 'immediateFamilyExposed', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Trusted Contact</h3>
            <p className="text-sm text-gray-600">Please provide a trusted contact person who can be reached in case of emergency:</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Given Name</label>
                <input
                  type="text"
                  value={formData.trustedContact.givenName}
                  onChange={(e) => handleInputChange('trustedContact', 'givenName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
                <input
                  type="text"
                  value={formData.trustedContact.familyName}
                  onChange={(e) => handleInputChange('trustedContact', 'familyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.trustedContact.emailAddress}
                onChange={(e) => handleInputChange('trustedContact', 'emailAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Document Upload</h4>
              <p className="text-sm text-blue-800 mb-4">
                You will need to upload a government-issued ID (passport, driver's license, or state ID) for identity verification.
              </p>
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
                <DocumentTextIcon className="w-12 h-12 mx-auto text-blue-400 mb-2" />
                <p className="text-sm text-blue-600">Document upload will be available after account creation</p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
            <p className="text-sm text-gray-600">Please review your information before submitting your account application:</p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                <p className="text-sm text-gray-600">{formData.contact.emailAddress}</p>
                <p className="text-sm text-gray-600">{formData.contact.phoneNumber}</p>
                <p className="text-sm text-gray-600">
                  {formData.contact.streetAddress.join(', ')}<br />
                  {formData.contact.city}, {formData.contact.state} {formData.contact.postalCode}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Identity Information</h4>
                <p className="text-sm text-gray-600">{formData.identity.givenName} {formData.identity.familyName}</p>
                <p className="text-sm text-gray-600">DOB: {formData.identity.dateOfBirth}</p>
                <p className="text-sm text-gray-600">Tax ID: {formData.identity.taxId} ({formData.identity.taxIdType})</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Trusted Contact</h4>
                <p className="text-sm text-gray-600">{formData.trustedContact.givenName} {formData.trustedContact.familyName}</p>
                <p className="text-sm text-gray-600">{formData.trustedContact.emailAddress}</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Important Notice</h4>
              </div>
              <p className="text-sm text-yellow-800">
                By submitting this application, you agree to the terms and conditions. 
                Your account will be reviewed and may take 1-3 business days to be approved. 
                You will receive an email notification once your account is ready for trading.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stock Trading Account Setup</h2>
        <p className="text-gray-600">Set up your Alpaca trading account to start trading stocks</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : isCompleted 
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          
          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <span>Next</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAccountSetup;

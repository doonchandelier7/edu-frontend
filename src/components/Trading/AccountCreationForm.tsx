import React, { useState } from 'react';
import { XMarkIcon, DocumentIcon, UserIcon, HomeIcon } from '@heroicons/react/24/outline';
import { alpacaAccountsApi, AccountCreateRequest } from '../../services/alpacaAccountsApi';

interface AccountCreationFormProps {
  onClose: () => void;
  onSuccess: (account: any) => void;
}

const AccountCreationForm: React.FC<AccountCreationFormProps> = ({ onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<AccountCreateRequest>({
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
      countryOfCitizenship: 'IND',
      countryOfBirth: 'IND',
      countryOfTaxResidence: 'IND',
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
    enabledAssets: ['IN_EQUITY']
  });

  const steps = [
    { id: 1, name: 'Contact Info', icon: UserIcon },
    { id: 2, name: 'Identity', icon: DocumentIcon },
    { id: 3, name: 'Disclosures', icon: HomeIcon },
    { id: 4, name: 'Documents', icon: DocumentIcon },
    { id: 5, name: 'Trusted Contact', icon: UserIcon },
    { id: 6, name: 'Review', icon: DocumentIcon }
  ];

  const handleContactChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: field === 'streetAddress' ? [value] : value
      }
    }));
  };

  const handleIdentityChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        [field]: value
      }
    }));
  };

  const handleDisclosureChange = (field: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      disclosures: {
        ...prev.disclosures,
        [field]: value
      }
    }));
  };

  const handleAgreementChange = (field: string, value: boolean) => {
    // For now, we'll just track agreement acceptance in a simple way
    // The backend will handle the actual agreement structure
    setFormData((prev) => ({
      ...prev,
      agreements: prev.agreements // Keep as empty array for now
    }));
  };

  const handleTrustedContactChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      trustedContact: {
        ...prev.trustedContact,
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Testing authentication...');
      const authTest = await alpacaAccountsApi.testAuth();
      if (!authTest) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      const validation = alpacaAccountsApi.validateAccountData(formData, currentStep);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      console.log('Creating account...');
      const account = await alpacaAccountsApi.createAccount(formData);
      console.log('Account created successfully:', account);
      onSuccess(account);
    } catch (err: any) {
      console.error('Account creation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const validation = alpacaAccountsApi.validateAccountData(formData, currentStep);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    setError(null);
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="text"
                  value={formData.contact.emailAddress || ''}
                  onChange={(e) => handleContactChange('emailAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={formData.contact.phoneNumber || ''}
                  onChange={(e) => handleContactChange('phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={formData.contact.streetAddress[0] || ''}
                  onChange={(e) => handleContactChange('streetAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your street address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.contact.city || ''}
                  onChange={(e) => handleContactChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your city"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.contact.state || ''}
                  onChange={(e) => handleContactChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your state"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={formData.contact.postalCode || ''}
                  onChange={(e) => handleContactChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your postal code"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.identity.givenName || ''}
                  onChange={(e) => handleIdentityChange('givenName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.identity.familyName || ''}
                  onChange={(e) => handleIdentityChange('familyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your last name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={formData.identity.dateOfBirth || ''}
                  onChange={(e) => handleIdentityChange('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID (SSN)</label>
                <input
                  type="text"
                  value={formData.identity.taxId || ''}
                  onChange={(e) => handleIdentityChange('taxId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your SSN (123-45-6789)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country of Citizenship</label>
                <select
                  value={formData.identity.countryOfCitizenship || 'IND'}
                  onChange={(e) => handleIdentityChange('countryOfCitizenship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="IND">India</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country of Birth</label>
                <select
                  value={formData.identity.countryOfBirth || 'IND'}
                  onChange={(e) => handleIdentityChange('countryOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="IND">India</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Disclosures</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="control_person"
                  checked={formData.disclosures.isControlPerson}
                  onChange={(e) => handleDisclosureChange('isControlPerson', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="control_person" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Are you a control person of a publicly traded company?
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="affiliated_finra"
                  checked={formData.disclosures.isAffiliatedExchangeOrFinra}
                  onChange={(e) => handleDisclosureChange('isAffiliatedExchangeOrFinra', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="affiliated_finra" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Are you affiliated with an exchange or FINRA?
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="politically_exposed"
                  checked={formData.disclosures.isPoliticallyExposed}
                  onChange={(e) => handleDisclosureChange('isPoliticallyExposed', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="politically_exposed" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Are you a politically exposed person?
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="family_exposed"
                  checked={formData.disclosures.immediateFamilyExposed}
                  onChange={(e) => handleDisclosureChange('immediateFamilyExposed', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="family_exposed" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Is any immediate family member a politically exposed person?
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Documents & Agreements</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <DocumentIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Document upload functionality would be implemented here</p>
                <p className="text-xs text-gray-500 mt-1">Required: Identity verification documents</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Required Agreements</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="customer_agreement"
                      onChange={(e) => handleAgreementChange('customer_agreement', e.target.checked)}
                      className="h-4 w-4 text-blue-600 cursor-pointer" 
                    />
                    <label htmlFor="customer_agreement" className="ml-2 text-sm text-blue-800 cursor-pointer">
                      I agree to the Customer Agreement
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="account_agreement"
                      onChange={(e) => handleAgreementChange('account_agreement', e.target.checked)}
                      className="h-4 w-4 text-blue-600 cursor-pointer" 
                    />
                    <label htmlFor="account_agreement" className="ml-2 text-sm text-blue-800 cursor-pointer">
                      I agree to the Account Agreement
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="margin_agreement"
                      onChange={(e) => handleAgreementChange('margin_agreement', e.target.checked)}
                      className="h-4 w-4 text-blue-600 cursor-pointer" 
                    />
                    <label htmlFor="margin_agreement" className="ml-2 text-sm text-blue-800 cursor-pointer">
                      I agree to the Margin Agreement
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Trusted Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.trustedContact.givenName || ''}
                  onChange={(e) => handleTrustedContactChange('givenName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.trustedContact.familyName || ''}
                  onChange={(e) => handleTrustedContactChange('familyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="text"
                  value={formData.trustedContact.emailAddress || ''}
                  onChange={(e) => handleTrustedContactChange('emailAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> A trusted contact is someone you authorize us to contact if we cannot reach you. 
                This person should be someone you trust and who knows you well.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Account Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{formData.identity.givenName} {formData.identity.familyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{formData.contact.emailAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{formData.contact.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium text-gray-900">{formData.contact.city}, {formData.contact.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Type:</span>
                  <span className="font-medium text-gray-900">Trading Account</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Enabled Assets:</span>
                  <span className="font-medium text-gray-900">US Equity</span>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                By submitting this application, you agree to Alpaca's terms and conditions. 
                Your account will be reviewed and may require additional verification.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Alpaca Account</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              {currentStep === steps.length ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountCreationForm;
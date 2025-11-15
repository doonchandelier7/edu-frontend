import React, { useState } from 'react';
import { XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { alpacaAccountsApi, BankRelationshipCreateRequest } from '../../services/alpacaAccountsApi';

interface BankRelationshipFormProps {
  accountId: string;
  onClose: () => void;
  onSuccess: (bank: any) => void;
}

const BankRelationshipForm: React.FC<BankRelationshipFormProps> = ({ accountId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BankRelationshipCreateRequest>({
    name: '',
    bankCode: '',
    bankCodeType: 'IFSC',
    accountNumber: '',
    country: 'IND',
    stateProvince: '',
    postalCode: '',
    city: '',
    streetAddress: ''
  });

  const handleInputChange = (field: keyof BankRelationshipCreateRequest, value: string) => {
    setFormData((prev: BankRelationshipCreateRequest) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Validate form data
      const validationErrors = alpacaAccountsApi.validateBankData(formData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      // Create bank relationship
      console.log('Creating bank relationship with data:', formData);
      const bank = await alpacaAccountsApi.createBankRelationship(accountId, formData);
      console.log('Bank relationship created successfully:', bank);
      onSuccess(bank);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bank relationship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <BanknotesIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Add Bank Relationship</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="e.g., Chase Bank"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Code Type *
                </label>
                <select
                  value={formData.bankCodeType}
                  onChange={(e) => handleInputChange('bankCodeType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="ABA">ABA (US Banks)</option>
                  <option value="BIC">BIC (International)</option>
                  <option value="SWIFT">SWIFT</option>
                  <option value="IFSC">IFSC (Indian Banks)</option>
                  <option value="MICR">MICR (Indian Banks)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Code *
                </label>
                <input
                  type="text"
                  value={formData.bankCode}
                  onChange={(e) => handleInputChange('bankCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="e.g., 021000021"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Your bank account number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="USA">United States</option>
                <option value="CAN">Canada</option>
                <option value="GBR">United Kingdom</option>
                <option value="AUS">Australia</option>
                <option value="IND">India</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.stateProvince}
                  onChange={(e) => handleInputChange('stateProvince', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="State or Province"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="ZIP/Postal Code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Street Address"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Important Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Bank relationships are required for transfers</li>
                <li>• All information must be accurate and match your bank records</li>
                <li>• Verification may be required before transfers are enabled</li>
                <li>• Keep your banking information secure and confidential</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Bank'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BankRelationshipForm;
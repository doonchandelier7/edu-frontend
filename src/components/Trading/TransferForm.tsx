import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { alpacaAccountsApi, TransferRequest, BankRelationship } from '../../services/alpacaAccountsApi';

interface TransferFormProps {
  accountId: string;
  onClose: () => void;
  onSuccess: (transfer: any) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ accountId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankRelationships, setBankRelationships] = useState<BankRelationship[]>([]);
  const [formData, setFormData] = useState<TransferRequest>({
    transfer_type: 'ach',
    amount: '',
    direction: 'INCOMING',
    timing: 'immediate',
    bank_id: '',
    additional_information: '',
    bank_relationship_id: ''
  });

  // Load bank relationships on component mount
  useEffect(() => {
    loadBankRelationships();
  }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBankRelationships = async () => {
    try {
      const banks = await alpacaAccountsApi.getBankRelationships(accountId);
      setBankRelationships(Array.isArray(banks) ? banks : [banks]);
    } catch (err) {
      console.warn('Failed to load bank relationships:', err);
    }
  };

  const handleInputChange = (field: keyof TransferRequest, value: string) => {
    setFormData((prev: TransferRequest) => ({
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
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (!formData.bank_id) {
        setError('Please select a bank');
        return;
      }

      // Create transfer request
      const transfer = await alpacaAccountsApi.requestTransfer(accountId, formData);
      onSuccess(transfer);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transfer request');
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankRelationships.find(bank => bank.id === formData.bank_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {formData.direction === 'INCOMING' ? (
                <ArrowUpTrayIcon className="w-6 h-6 text-green-600" />
              ) : (
                <ArrowDownTrayIcon className="w-6 h-6 text-red-600" />
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {formData.direction === 'INCOMING' ? 'Deposit Funds' : 'Withdraw Funds'}
              </h2>
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
            {/* Transfer Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('transfer_type', 'ach')}
                  className={`p-3 border rounded-lg text-center ${
                    formData.transfer_type === 'ach'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">ACH</div>
                  <div className="text-xs text-gray-500">1-3 business days</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('transfer_type', 'wire')}
                  className={`p-3 border rounded-lg text-center ${
                    formData.transfer_type === 'wire'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Wire</div>
                  <div className="text-xs text-gray-500">Same day</div>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account *
              </label>
              {bankRelationships.length > 0 ? (
                <select
                  value={formData.bank_id}
                  onChange={(e) => handleInputChange('bank_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a bank account</option>
                  {bankRelationships.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - ****{bank.account_number.slice(-4)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 text-center">
                  <p className="text-gray-600 text-sm">No bank accounts found</p>
                  <p className="text-gray-500 text-xs mt-1">Add a bank relationship first</p>
                </div>
              )}
            </div>

            {/* Selected Bank Details */}
            {selectedBank && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Selected Bank Details</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Bank:</span>
                    <span className="font-medium">{selectedBank.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account:</span>
                    <span className="font-medium">****{selectedBank.account_number.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Code Type:</span>
                    <span className="font-medium">{selectedBank.bank_code_type}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Timing
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('timing', 'immediate')}
                  className={`p-3 border rounded-lg text-center ${
                    formData.timing === 'immediate'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Immediate</div>
                  <div className="text-xs text-gray-500">Process now</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('timing', 'next_day')}
                  className={`p-3 border rounded-lg text-center ${
                    formData.timing === 'next_day'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Next Day</div>
                  <div className="text-xs text-gray-500">Process tomorrow</div>
                </button>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                value={formData.additional_information}
                onChange={(e) => handleInputChange('additional_information', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Any additional notes or instructions..."
              />
            </div>

            {/* Transfer Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Transfer Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction:</span>
                  <span className="font-medium">
                    {formData.direction === 'INCOMING' ? 'Deposit' : 'Withdrawal'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    {formData.amount ? `$${parseFloat(formData.amount).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{formData.transfer_type?.toUpperCase() || 'ACH'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timing:</span>
                  <span className="font-medium capitalize">{formData.timing}</span>
                </div>
              </div>
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
                disabled={loading || bankRelationships.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `${formData.direction === 'INCOMING' ? 'Deposit' : 'Withdraw'} Funds`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferForm;

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string; // 'monthly', 'yearly'
  features: string[];
  isActive: boolean;
  maxCourses: number;
  maxTrades: number;
  prioritySupport: boolean;
}

const SubscriptionManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const queryClient = useQueryClient();

  // Mock subscription plans data - in real app, this would come from API
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: '1',
      name: 'Free Plan',
      price: 0,
      duration: 'monthly',
      features: ['Basic courses', 'Limited trades', 'Community support'],
      isActive: true,
      maxCourses: 3,
      maxTrades: 10,
      prioritySupport: false,
    },
    {
      id: '2',
      name: 'Pro Plan',
      price: 29.99,
      duration: 'monthly',
      features: ['All courses', 'Unlimited trades', 'Priority support', 'Advanced analytics'],
      isActive: true,
      maxCourses: -1, // unlimited
      maxTrades: -1, // unlimited
      prioritySupport: true,
    },
    {
      id: '3',
      name: 'Premium Plan',
      price: 99.99,
      duration: 'monthly',
      features: ['All courses', 'Unlimited trades', '24/7 support', 'Advanced analytics', 'Personal mentor'],
      isActive: true,
      maxCourses: -1,
      maxTrades: -1,
      prioritySupport: true,
    },
  ];


  const createPlanMutation = useMutation({
    mutationFn: (data: any) => {
      // TODO: Implement createPlan API endpoint
      console.log('Create plan:', data);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setShowCreateModal(false);
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: (data: any) => {
      // TODO: Implement updatePlan API endpoint
      console.log('Update plan:', data);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setShowModal(false);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => {
      // TODO: Implement deletePlan API endpoint
      console.log('Delete plan:', id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
  });

  const filteredPlans = subscriptionPlans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || plan.name.toLowerCase() === filterPlan.toLowerCase();
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && plan.isActive) ||
                         (filterStatus === 'inactive' && !plan.isActive);
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleCreatePlan = () => {
    setShowCreateModal(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      deletePlanMutation.mutate(planId);
    }
  };

  const handleCreatePlanSubmit = (formData: any) => {
    createPlanMutation.mutate(formData);
  };

  const handleUpdatePlan = (formData: any) => {
    updatePlanMutation.mutate({
      id: selectedPlan?.id,
      ...formData,
    });
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getPriceBadgeColor = (price: number) => {
    if (price === 0) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    if (price < 50) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
          <p className="text-gray-400">Manage subscription plans and pricing</p>
        </div>
        <button 
          onClick={handleCreatePlan}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Plan Filter */}
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterPlan('all');
              setFilterStatus('all');
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <CreditCardIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Plans Found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredPlans.map((plan) => (
            <div key={plan.id} className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-32 rounded-t-xl flex items-center justify-center">
                <CreditCardIcon className="h-16 w-16 text-white" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-300">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold text-white mb-1">
                    ${plan.price}
                    <span className="text-sm text-gray-400 font-normal">/{plan.duration}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(plan.isActive)}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriceBadgeColor(plan.price)}`}>
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                </div>

                <div className="text-sm text-gray-400 space-y-1">
                  <p>Max Courses: {plan.maxCourses === -1 ? 'Unlimited' : plan.maxCourses}</p>
                  <p>Max Trades: {plan.maxTrades === -1 ? 'Unlimited' : plan.maxTrades}</p>
                  <p>Priority Support: {plan.prioritySupport ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Plan Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Subscription Plan</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleUpdatePlan({
                name: formData.get('name'),
                price: parseFloat(formData.get('price') as string),
                duration: formData.get('duration'),
                maxCourses: parseInt(formData.get('maxCourses') as string) || -1,
                maxTrades: parseInt(formData.get('maxTrades') as string) || -1,
                prioritySupport: formData.get('prioritySupport') === 'on',
                isActive: formData.get('isActive') === 'on',
              });
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedPlan.name}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    defaultValue={selectedPlan.price}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                  <select
                    name="duration"
                    defaultValue={selectedPlan.duration}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Courses (-1 for unlimited)</label>
                  <input
                    type="number"
                    name="maxCourses"
                    defaultValue={selectedPlan.maxCourses}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Trades (-1 for unlimited)</label>
                  <input
                    type="number"
                    name="maxTrades"
                    defaultValue={selectedPlan.maxTrades}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2 flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="prioritySupport"
                      defaultChecked={selectedPlan.prioritySupport}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                    />
                    <label className="ml-2 text-sm text-gray-300">Priority Support</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={selectedPlan.isActive}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                    />
                    <label className="ml-2 text-sm text-gray-300">Active Plan</label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Subscription Plan</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreatePlanSubmit({
                name: formData.get('name'),
                price: parseFloat(formData.get('price') as string),
                duration: formData.get('duration'),
                maxCourses: parseInt(formData.get('maxCourses') as string) || -1,
                maxTrades: parseInt(formData.get('maxTrades') as string) || -1,
                prioritySupport: formData.get('prioritySupport') === 'on',
                isActive: formData.get('isActive') === 'on',
              });
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    required
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                  <select
                    name="duration"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Courses (-1 for unlimited)</label>
                  <input
                    type="number"
                    name="maxCourses"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Trades (-1 for unlimited)</label>
                  <input
                    type="number"
                    name="maxTrades"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2 flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="prioritySupport"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                    />
                    <label className="ml-2 text-sm text-gray-300">Priority Support</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={true}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                    />
                    <label className="ml-2 text-sm text-gray-300">Active Plan</label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;

import React from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, PlayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const LearnPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Learning Center</h1>
        <p className="text-gray-400 text-lg">Master cryptocurrency and stock trading</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/courses"
          className="group bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-colors"
        >
          <div className="text-green-500 mb-4">
            <AcademicCapIcon className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Browse Courses</h2>
          <p className="text-gray-400 mb-4">
            Explore our comprehensive course library covering all aspects of trading.
          </p>
          <div className="flex items-center text-green-400 group-hover:text-green-300">
            <span className="font-medium">View Courses</span>
            <span className="ml-2">→</span>
          </div>
        </Link>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-blue-500 mb-4">
            <PlayIcon className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Video Lessons</h2>
          <p className="text-gray-400 mb-4">
            Video lessons with interactive content and quizzes coming soon.
          </p>
          <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
            Feature in Development
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-purple-500 mb-4">
            <DocumentTextIcon className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Study Materials</h2>
          <p className="text-gray-400 mb-4">
            Downloadable resources, guides, and reference materials.
          </p>
          <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
            Feature in Development
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Learning Path</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
            <div>
              <h3 className="text-white font-medium">Introduction to Cryptocurrency</h3>
              <p className="text-gray-400 text-sm">Learn the basics of digital currencies</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
            <div>
              <h3 className="text-white font-medium">Technical Analysis</h3>
              <p className="text-gray-400 text-sm">Read charts and identify trading patterns</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
            <div>
              <h3 className="text-white font-medium">Risk Management</h3>
              <p className="text-gray-400 text-sm">Protect your investments and minimize losses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;

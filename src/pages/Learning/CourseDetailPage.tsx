import React from 'react';

const CourseDetailPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-64 rounded-lg mb-6 flex items-center justify-center">
          <span className="text-white text-6xl">📚</span>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Course Details</h1>
        <p className="text-gray-400 mb-6">
          This page will show detailed information about a specific course, including
          curriculum, instructor details, enrollment status, and learning progress.
        </p>
        
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-300">Course detail view coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;


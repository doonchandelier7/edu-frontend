import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../../services/api';
import { AcademicCapIcon, ClockIcon } from '@heroicons/react/24/outline';

const CoursesPage: React.FC = () => {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getCourses(),
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Available Courses</h1>
        <p className="text-gray-400 text-lg">Learn cryptocurrency and stock trading</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6">
              <div className="h-32 bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-700 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded mb-4 w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded mb-3 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : courses?.data?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.data?.map((course: any) => (
            <div key={course.id} className="card hover:border-gray-600 transition-colors cursor-pointer">
              <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-32 rounded-lg mb-4 flex items-center justify-center">
                <AcademicCapIcon className="h-16 w-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center text-gray-400 text-sm mb-4">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>{course.duration} minutes</span>
                  <span className="mx-2">•</span>
                  <span>{course.totalLessons} lessons</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-teal-400 text-sm font-medium capitalize">
                    {course.level}
                  </span>
                  <button className="bg-teal-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                    Start Course
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <AcademicCapIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Courses Available</h2>
          <p className="text-gray-400">
            Check back soon for new courses and learning materials.
          </p>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;


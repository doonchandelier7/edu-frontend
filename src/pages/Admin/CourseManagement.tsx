import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../services/api';
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  PlayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const CourseManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => coursesApi.getCourses(),
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: any) => coursesApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setShowCreateModal(false);
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: (data: any) => coursesApi.updateCourse(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setShowModal(false);
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => coursesApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const filteredCourses = courses?.data?.filter((course: any) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && course.isPublished) ||
                         (filterStatus === 'draft' && !course.isPublished);
    
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const handleCreateCourse = () => {
    setShowCreateModal(true);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteCourseMutation.mutate(courseId);
    }
  };

  const handleCreateCourseSubmit = (formData: any) => {
    createCourseMutation.mutate(formData);
  };

  const handleUpdateCourse = (formData: any) => {
    updateCourseMutation.mutate({
      id: selectedCourse.id,
      ...formData,
    });
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadgeColor = (isPublished: boolean) => {
    return isPublished 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Management</h1>
          <p className="text-gray-400">Manage courses, lessons, and content</p>
        </div>
        <button 
          onClick={handleCreateCourse}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Course</span>
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
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterLevel('all');
              setFilterStatus('all');
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
              <div className="h-32 bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))
        ) : filteredCourses?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AcademicCapIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Courses Found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredCourses?.map((course: any) => (
            <div key={course.id} className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-32 rounded-t-xl flex items-center justify-center">
                <AcademicCapIcon className="h-16 w-16 text-white" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white line-clamp-2">{course.title}</h3>
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-300">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center text-gray-400 text-sm mb-4">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>{course.duration} minutes</span>
                  <span className="mx-2">•</span>
                  <PlayIcon className="h-4 w-4 mr-1" />
                  <span>{course.totalLessons} lessons</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getLevelBadgeColor(course.level)}`}>
                    {course.level}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(course.isPublished)}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="text-sm text-gray-400">
                  <p>Instructor: {course.instructor?.firstName} {course.instructor?.lastName}</p>
                  <p>Created: {new Date(course.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Course Modal */}
      {showModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Course</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleUpdateCourse({
                title: formData.get('title'),
                description: formData.get('description'),
                level: formData.get('level'),
                duration: parseInt(formData.get('duration') as string),
                totalLessons: parseInt(formData.get('totalLessons') as string),
                passGrade: parseInt(formData.get('passGrade') as string),
                isPublished: formData.get('isPublished') === 'on',
              });
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={selectedCourse.title}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={selectedCourse.description}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                  <select
                    name="level"
                    defaultValue={selectedCourse.level}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    defaultValue={selectedCourse.duration}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Total Lessons</label>
                  <input
                    type="number"
                    name="totalLessons"
                    defaultValue={selectedCourse.totalLessons}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pass Grade (%)</label>
                  <input
                    type="number"
                    name="passGrade"
                    defaultValue={selectedCourse.passGrade}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    name="isPublished"
                    defaultChecked={selectedCourse.isPublished}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                  />
                  <label className="ml-2 text-sm text-gray-300">Published</label>
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
                  Update Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Course</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreateCourseSubmit({
                title: formData.get('title'),
                description: formData.get('description'),
                level: formData.get('level'),
                duration: parseInt(formData.get('duration') as string),
                totalLessons: parseInt(formData.get('totalLessons') as string),
                passGrade: parseInt(formData.get('passGrade') as string),
                isPublished: formData.get('isPublished') === 'on',
              });
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                  <select
                    name="level"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Total Lessons</label>
                  <input
                    type="number"
                    name="totalLessons"
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pass Grade (%)</label>
                  <input
                    type="number"
                    name="passGrade"
                    required
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    name="isPublished"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                  />
                  <label className="ml-2 text-sm text-gray-300">Published</label>
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
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;

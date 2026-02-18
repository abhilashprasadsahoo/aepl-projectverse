import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';

const BrowseProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    category: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalProjects: 0
  });

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll({
        search: filters.search,
        difficulty: filters.difficulty,
        category: filters.category,
        page: filters.page,
        limit: 12
      });
      setProjects(response.data.projects);
      setPagination({
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
        totalProjects: response.data.totalProjects
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Browse Projects</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search projects..."
                className="input"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <select
                className="input"
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <select
                className="input"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="IoT">IoT</option>
                <option value="Cloud Computing">Cloud Computing</option>
              </select>
            </div>
            <button
              onClick={() => setFilters({ search: '', difficulty: '', category: '', page: 1 })}
              className="btn btn-outline"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-600 mb-4">
          Showing {projects.length} of {pagination.totalProjects} projects
        </p>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <Link to={`/project/${project._id}`} key={project._id} className="card overflow-hidden">
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt={project.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{project.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.short_description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.technology_stack?.split(',').slice(0, 3).map((tech, idx) => (
                        <span key={idx} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 font-bold text-lg">₹{project.price}</span>
                      <span className="text-sm text-gray-500">{project.difficulty_level}</span>
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 text-sm text-gray-600">{project.rating?.toFixed(1) || 0}</span>
                      <span className="ml-2 text-sm text-gray-500">({project.total_ratings || 0})</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg ${
                        page === pagination.currentPage
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No projects found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseProjects;

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    full_description: '',
    technology_stack: '',
    difficulty_level: 'Beginner',
    price: '',
    category: 'Web Development',
    features: '',
    requirements: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await adminAPI.getProjects();
      setProjects(response.data.projects || response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: Number(formData.price),
        features: formData.features.split('\n').filter(f => f.trim()),
        requirements: formData.requirements.split('\n').filter(r => r.trim())
      };

      if (editingProject) {
        await adminAPI.updateProject(editingProject._id, data);
      } else {
        await adminAPI.createProject(data);
      }

      setShowModal(false);
      setEditingProject(null);
      setFormData({
        title: '',
        short_description: '',
        full_description: '',
        technology_stack: '',
        difficulty_level: 'Beginner',
        price: '',
        category: 'Web Development',
        features: '',
        requirements: ''
      });
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving project');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title || '',
      short_description: project.short_description || '',
      full_description: project.full_description || '',
      technology_stack: project.technology_stack || '',
      difficulty_level: project.difficulty_level || 'Beginner',
      price: project.price || '',
      category: project.category || 'Web Development',
      features: project.features?.join('\n') || '',
      requirements: project.requirements?.join('\n') || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await adminAPI.deleteProject(id);
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting project');
    }
  };

  const handleFeature = async (id) => {
    try {
      await adminAPI.featureProject(id);
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating project');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Projects</h1>
          <button onClick={() => { setEditingProject(null); setShowModal(true); }} className="btn btn-primary">
            Add New Project
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Difficulty</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Featured</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id} className="border-t">
                    <td className="py-3 px-4">{project.title}</td>
                    <td className="py-3 px-4">{project.category}</td>
                    <td className="py-3 px-4">{project.difficulty_level}</td>
                    <td className="py-3 px-4">₹{project.price}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleFeature(project._id)}
                        className={`px-2 py-1 text-xs rounded ${project.is_featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {project.is_featured ? '★ Yes' : '☆ No'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleEdit(project)} className="text-primary-600 hover:text-primary-700 mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(project._id)} className="text-red-600 hover:text-red-700">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input name="title" value={formData.title} onChange={handleChange} className="input" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Short Description</label>
                  <textarea name="short_description" value={formData.short_description} onChange={handleChange} className="input" rows={2} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Full Description</label>
                  <textarea name="full_description" value={formData.full_description} onChange={handleChange} className="input" rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Technology Stack</label>
                  <input name="technology_stack" value={formData.technology_stack} onChange={handleChange} className="input" placeholder="React, Node.js, MongoDB" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="input">
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="IoT">IoT</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty Level</label>
                  <select name="difficulty_level" value={formData.difficulty_level} onChange={handleChange} className="input">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input name="price" type="number" value={formData.price} onChange={handleChange} className="input" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Features (one per line)</label>
                  <textarea name="features" value={formData.features} onChange={handleChange} className="input" rows={3} placeholder="Feature 1&#10;Feature 2" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Requirements (one per line)</label>
                  <textarea name="requirements" value={formData.requirements} onChange={handleChange} className="input" rows={3} placeholder="Requirement 1&#10;Requirement 2" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingProject(null); }} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;

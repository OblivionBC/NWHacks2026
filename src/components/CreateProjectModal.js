import { useState } from 'react';
import './CreateProjectModal.css';

function CreateProjectModal({ isOpen, onClose, onCreateProject, isLoading, error }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Project name is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onCreateProject(formData.name, formData.description);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    setValidationErrors({});
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isFormValid = formData.name.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button 
            type="button" 
            className="modal-close" 
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="project-name">
              <span>Project Name <span className="required">*</span></span>
              <input
                id="project-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter project name"
                disabled={isLoading}
                autoFocus
              />
              {validationErrors.name && (
                <span className="form-error">{validationErrors.name}</span>
              )}
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="project-description">
              <span>Description</span>
              <textarea
                id="project-description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter project description (optional)"
                rows={4}
                disabled={isLoading}
              />
            </label>
          </div>

          {error && (
            <div className="form-error-message">{error}</div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="button ghost"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;

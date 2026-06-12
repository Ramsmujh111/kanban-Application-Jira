import { useState } from 'react';
import Modal from '../common/Modal';

const CreateProjectModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
          <label htmlFor="project-name">Project Name</label>
          <input
            id="project-name"
            type="text"
            className="input"
            placeholder="e.g., Website Redesign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="input-group">
          <label htmlFor="project-desc">Description (optional)</label>
          <textarea
            id="project-desc"
            className="input"
            placeholder="What's this project about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;

import './DeleteConfirmationModal.css';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, target, isLoading }) {
  if (!isOpen || !target) return null;

  const { type, name, chatCount, nodeCount } = target;

  const getDeletionDetails = () => {
    if (type === 'project') {
      if (chatCount === 0 && nodeCount === 0) {
        return 'This project has no chats or nodes.';
      }
      const chatText = chatCount === 1 ? 'chat' : 'chats';
      const nodeText = nodeCount === 1 ? 'node' : 'nodes';
      return `This will delete ${chatCount} ${chatText} and ${nodeCount} ${nodeText}.`;
    } else {
      // type === 'chat'
      if (nodeCount === 0) {
        return 'This chat has no nodes.';
      }
      const nodeText = nodeCount === 1 ? 'node' : 'nodes';
      return `This will delete ${nodeCount} ${nodeText}.`;
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete {type === 'project' ? 'Project' : 'Chat'}?</h2>
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
        
        <div className="modal-form">
          <div className="delete-confirmation-content">
            <p className="delete-warning">
              Are you sure you want to delete <strong>"{name}"</strong>?
            </p>
            <p className="delete-details">
              {getDeletionDetails()}
            </p>
            <p className="delete-note">
              This action cannot be undone.
            </p>
          </div>

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
              type="button"
              className="button danger"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;

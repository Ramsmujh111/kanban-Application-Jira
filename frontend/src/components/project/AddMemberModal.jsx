import { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { userApi } from '../../api/user.api';

const AddMemberModal = ({ isOpen, onClose, onAddMember, existingMemberIds = [] }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced search
  const searchUsers = useCallback((searchQuery) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await userApi.search(searchQuery.trim());
        // Filter out already existing members
        const filtered = data.data.users.filter(
          (u) => !existingMemberIds.includes(u._id)
        );
        setSuggestions(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (err) {
        console.error('User search failed:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  }, [existingMemberIds]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedUser(null);
    setError('');
    searchUsers(value);
  };

  // Select a user from suggestions
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setQuery(user.name);
    setShowDropdown(false);
    setSuggestions([]);
  };

  // Submit: add the selected member
  const handleSubmit = async () => {
    if (!selectedUser) {
      setError('Please select a user from the suggestions');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onAddMember({ email: selectedUser.email, role: 'editor' });
      // Reset and close
      resetState();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset on close
  const resetState = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedUser(null);
    setError('');
    setShowDropdown(false);
    setLoading(false);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Team Member"
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!selectedUser || submitting}
          >
            {submitting ? 'Adding...' : 'Add Member'}
          </button>
        </>
      }
    >
      <div className="member-search-container">
        {error && (
          <div className="auth-error" style={{ marginBottom: 'var(--space-md)' }}>
            {error}
          </div>
        )}

        <div className="input-group">
          <label htmlFor="member-search">Search by name or email</label>
          <div className="member-search-input-wrap">
            <input
              ref={inputRef}
              id="member-search"
              type="text"
              className="input"
              placeholder="Type a name or email to search..."
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                if (suggestions.length > 0 && !selectedUser) {
                  setShowDropdown(true);
                }
              }}
              autoFocus
              autoComplete="off"
            />
            {loading && (
              <div className="member-search-spinner">
                <span className="spinner spinner-sm" />
              </div>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && (
          <div className="member-search-dropdown" ref={dropdownRef}>
            {suggestions.map((user) => (
              <div
                key={user._id}
                className="member-search-item"
                onClick={() => handleSelectUser(user)}
              >
                <Avatar name={user.name} size="sm" />
                <div className="member-search-item-info">
                  <div className="member-search-item-name">{user.name}</div>
                  <div className="member-search-item-email">{user.email}</div>
                </div>
                <span className="member-search-item-role">{user.role}</span>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {query.length >= 2 && !loading && suggestions.length === 0 && !selectedUser && (
          <div className="member-search-empty">
            No registered users found for "{query}"
          </div>
        )}

        {/* Selected user preview */}
        {selectedUser && (
          <div className="member-selected-preview">
            <Avatar name={selectedUser.name} />
            <div className="member-selected-info">
              <div className="member-selected-name">{selectedUser.name}</div>
              <div className="member-selected-email">{selectedUser.email}</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSelectedUser(null);
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddMemberModal;

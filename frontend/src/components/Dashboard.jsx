import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookie from 'js-cookie';
import '../Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [phonebookEntries, setPhonebookEntries] = useState([]);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null); // Track which entry is being edited
  const [isEditing, setIsEditing] = useState(false); // Track whether in edit mode

  useEffect(() => {
    // Fetch phonebook data from backend
    const fetchPhonebook = async () => {
      const token = Cookie.get('access_token');
      if (!token) {
        // Handle case where token is not present (e.g., redirect to login)
        return;
      }
      try {
        const response = await fetch('http://localhost:8000/phonebook', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setPhonebookEntries(data);
        } else {
          // Handle error response
          console.error('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchPhonebook();
  }, []);

  const handleDelete = async (entryId) => {
    const token = Cookie.get('access_token');
    if (!token) {
      // Handle case where token is not present (e.g., redirect to login)
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/phonebook/${entryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        // Remove deleted entry from state
        setPhonebookEntries(prevEntries =>
          prevEntries.filter(entry => entry.id !== entryId)
        );
      } else {
        // Handle error response
        console.error(`Failed to delete entry ${entryId}`);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const token = Cookie.get('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/phonebook/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id : '',
          name,
          phonenumber: phoneNumber,
        }),
      });
      if (response.ok) {
        const newEntry = await response.json();
        setPhonebookEntries([...phonebookEntries, newEntry]);
        // Clear form fields after successful creation
        setName('');
        setPhoneNumber('');
      } else {
        // Handle error response
        console.error('Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };

  const handleEdit = (entryId) => {
    // Find the entry being edited and populate the form fields
    const entryToEdit = phonebookEntries.find(entry => entry.id === entryId);
    if (entryToEdit) {
      setEditName(entryToEdit.name);
      setEditPhoneNumber(entryToEdit.phonenumber);
      setEditingEntryId(entryId);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async (event, entryId) => {
    event.preventDefault();
    const token = Cookie.get('access_token');
    if (!token) {
      // Handle case where token is not present (e.g., redirect to login)
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/phonebook/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id : '',
          name: editName,
          phonenumber: editPhoneNumber,
        }),
      });
      if (response.ok) {
        const updatedEntry = await response.json();
        // Update phonebookEntries state with the updated entry
        setPhonebookEntries(prevEntries =>
          prevEntries.map(entry => (entry.id === updatedEntry.id ? updatedEntry : entry))
        );
        // Clear form fields and reset editing mode
        setEditName('');
        setEditPhoneNumber('');
        setEditingEntryId(null);
        setIsEditing(false);
      } else {
        // Handle error response
        console.error(`Failed to update entry ${entryId}`);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const handleCancelEdit = () => {
    // Reset form fields and exit editing mode
    setEditName('');
    setEditPhoneNumber('');
    setEditingEntryId(null);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    const token = Cookie.get('access_token');
    if (!token) {
      // Handle case where token is not present (e.g., redirect to login)
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        // Clear access token cookie
        Cookie.remove('access_token');
        // Redirect or handle logout success (e.g., navigate to login page)
        console.log('Logged out successfully');
        // Example: Redirect to login page
        navigate('/login');
      } else {
        // Handle error response
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Note Taking App</h2>
      <form onSubmit={handleCreate} className="create-form">
        <label>
          Title:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </label>
        <label>
          Content:
          <input type="string" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="input-field" />
        </label>
        <button type="submit" className="btn-create">Add note</button>
      </form>
      <ul className="entry-list">
        {phonebookEntries.map(entry => (
          <li key={entry.id} className="phonebook-entry">
            {editingEntryId === entry.id && isEditing ? (
              <form onSubmit={(event) => handleSaveEdit(event, entry.id)} className="edit-form">
                <label>
                  Title:
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
                </label>
                <label>
                  Content:
                  <input type="string" value={editPhoneNumber} onChange={(e) => setEditPhoneNumber(e.target.value)} className="input-field" />
                </label>
                <button type="submit" className="btn-save">Save</button>
                <button type="button" onClick={handleCancelEdit} className="btn-cancel">Cancel</button>
                
              </form>
            ) : (
              <div className="entry-details">
                <strong>Title :</strong> {entry.name}
                <br />
                <strong>Content :</strong> {entry.phonenumber}
                <br />
                <button onClick={() => handleEdit(entry.id)} className="btn-edit">Update</button>
                <button onClick={() => handleDelete(entry.id)} className="btn-delete">Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <button className='logout-btn' onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;

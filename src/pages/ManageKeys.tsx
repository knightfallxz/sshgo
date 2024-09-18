import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const ManageKeys = () => {
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchKeys() {
      try {
        const fetchedKeys: string[] = await invoke('list_ssh_keys_command');
        setKeys(fetchedKeys);
      } catch (error) {
        console.error('Error fetching keys:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchKeys();
  }, []);

  const deleteKey = async (keyName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${keyName}?`);
    if (confirmDelete) {
      try {
        await invoke('delete_ssh_key_command', { keyName });
        setKeys((prevKeys) => prevKeys.filter((key) => key !== keyName));
      } catch (error) {
        console.error('Error deleting key:', error);
      }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manage SSH Keys</h1>
      {keys.length === 0 ? (
        <p>No SSH keys found.</p>
      ) : (
        <ul className="list-disc pl-5">
          {keys.map((key) => (
            <li key={key} className="flex justify-between items-center mb-2">
              <span>{key}</span>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                onClick={() => deleteKey(key)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageKeys;


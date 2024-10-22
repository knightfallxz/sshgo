import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invoke } from "@tauri-apps/api/tauri";

const ManageKeys: React.FC = () => {
  // Teammate's state variables
  const [filename, setFilename] = useState<string>("");
  const [algorithm, setAlgorithm] = useState<string>("choose");
  const [password, setPassword] = useState<string>("");
  const [overwrite, setOverwrite] = useState<boolean>(false);
  const [newFilename, setNewFilename] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [modalError, setModalError] = useState<string>("");
  const [caKeyFile, setCaKeyFile] = useState<File | null>(null);
  const [caKeyFileName, setCaKeyFileName] = useState<string>("");
  const [showCaKeyModal, setShowCaKeyModal] = useState<boolean>(false);
  const [role, setRole] = useState<string>("user");

  // User's state variables
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [keyToRename, setKeyToRename] = useState<string | null>(null);
  const [renamedKey, setRenamedKey] = useState<string>("");

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

  // Teammate's functions
  const handleGenerateKeys = async () => {
    if (filename === "") {
      setMessage("Please enter a file name for the key.");
      return;
    }

    if (algorithm === "choose") {
      setMessage("Please select an algorithm.");
      return;
    }

    try {
      const result = await invoke("generate_keys_with_filename_command", {
        algorithm,
        password,
        filename,
        overwrite,
      });

      if (result === 1) {
        setMessage(`Key generated successfully! Filename: ${filename}`);
        setShowModal(false);
        resetState();
      } else if (result === -1) {
        setShowModal(true);
        setModalError("");
      } else {
        setMessage("Error generating keys.");
      }
    } catch (err) {
      console.error("Error generating keys: ", err);
      setMessage("An unexpected error occurred.");
    }
  };

  const handleReEnterFileName = async () => {
    if (newFilename.trim() === "") {
      setModalError("Please enter a new file name.");
      return;
    }

    try {
      const result = await invoke("generate_keys_with_filename_command", {
        algorithm,
        password,
        filename: newFilename,
        overwrite: false,
      });

      if (result === 1) {
        setMessage(`Key generated successfully! Filename: ${newFilename}`);
        setShowModal(false);
        resetState();
      } else if (result === -1) {
        setModalError("New file name already exists. Please choose another name.");
      } else {
        setMessage("Error generating keys with the new file name.");
      }
    } catch (err) {
      console.error("Error checking new file name: ", err);
      setModalError("An unexpected error occurred.");
    }
  };

  const handleOverwrite = () => {
    setOverwrite(true);
    handleGenerateKeys();
  };

  const handleAddCAKey = async () => {
    if (!caKeyFile) {
      setMessage("Please select a CA key file.");
      return;
    }

    try {
      const result = await invoke("add_ca_key_command", {
        role,
        fileContent: await caKeyFile.text(),
        filename: caKeyFileName,
      });

      if (result === 1) {
        setMessage("CA key added successfully!");
        setCaKeyFile(null);
        setCaKeyFileName("");
        setShowCaKeyModal(false);
      } else {
        setMessage("Error adding CA key.");
      }
    } catch (err) {
      console.error("Error adding CA key: ", err);
      setMessage("An unexpected error occurred.");
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pub";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        setCaKeyFile(target.files[0]);
        setCaKeyFileName(target.files[0].name);
      }
    };
    input.click();
  };

  const resetState = () => {
    setFilename("");
    setAlgorithm("choose");
    setPassword("");
    setOverwrite(false);
    setNewFilename("");
    setCaKeyFile(null);
    setCaKeyFileName("");
  };

  const confirmDeletion = async () => {
    if (confirmDelete) {
      try {
        await invoke('delete_ssh_key_command', { keyName: confirmDelete });
        setKeys((prevKeys) => prevKeys.filter((key) => key !== confirmDelete));
        setConfirmDelete(null);
        setMessage(`Key ${confirmDelete} deleted successfully.`);
      } catch (error) {
        console.error('Error deleting key:', error);
        setMessage("Error deleting key.");
      }
    }
  };

  const cancelDeletion = () => {
    setConfirmDelete(null);
  };

  const handleRenameKey = (keyName: string) => {
    setKeyToRename(keyName);
    setRenamedKey(keyName);
  };

  const confirmRenameKey = async () => {
    if (!keyToRename || !renamedKey) return;

    try {
      await invoke("rename_ssh_key_command", { oldName: keyToRename, newName: renamedKey });
      setKeys((prevKeys) =>
        prevKeys.map((key) => (key === keyToRename ? renamedKey : key))
      );
      setMessage(`Key renamed successfully from ${keyToRename} to ${renamedKey}`);
      setKeyToRename(null);
      setRenamedKey("");
    } catch (error) {
      console.error("Error renaming key:", error);
      setMessage("Error renaming key.");
    }
  };

  const cancelRename = () => {
    setKeyToRename(null);
    setRenamedKey("");
  };

  // Render loading state or main UI
  if (loading) return <p>Loading...</p>;

  return (
    <div className="relative h-screen">
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
        {/* Teammate's implementation */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="flex flex-col items-center">
            <label className="text-lg font-bold mb-2">File Name</label>
            <Input
              className="p-2 border rounded"
              value={filename}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilename(e.target.value)}
              placeholder="Enter key file name"
              style={{ width: '300px' }}
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="text-lg font-bold mb-2">Algorithm</label>
            <select
              value={algorithm}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAlgorithm(e.target.value)}
              className="p-2 border rounded bg-white text-black"
              style={{ width: '150px', height: '50px' }}
            >
              <option value="choose">Choose</option>
              <option value="rsa">RSA</option>
              <option value="ecdsa">ECDSA</option>
              <option value="ed25519">ED25519</option>
              <option value="dsa">DSA</option>
            </select>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="flex flex-col items-center">
            <label className="text-lg font-bold mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{ width: '200px' }}
            />
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <Button onClick={handleGenerateKeys} className="bg-blue-500 text-white p-2 rounded" style={{ width: '200px', height: '50px' }}>
            Generate Keys
          </Button>
        </div>

        <div className="flex justify-center mb-4">
                  <label className="text-lg font-bold mr-4">Role:</label>
          <Button
            onClick={() => setRole(role === "user" ? "host" : "user")}
            className={`p-2 rounded ${role === "user" ? "bg-blue-500 text-white" : "bg-gray-600 text-white"}`}
            style={{ width: '100px' }}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Button>
        </div>

        <div style={{ position: 'absolute', bottom: '1/4rem', left: '1rem' }}>
          <Button onClick={() => setShowCaKeyModal(true)} className="bg-blue-500 text-white p-2 rounded" style={{ width: '200px', height: '50px' }}>
            Add CA Key File
          </Button>
        </div>

        {message && (
          <div
            className={`mt-4 text-center ${
              message.includes("Please") ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {showCaKeyModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-black text-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add CA Key</h2>
            <div className="flex flex-col mb-4">
              <button
                onClick={handleFileSelect}
                className="bg-blue-500 text-white p-2 rounded mb-2"
                style={{ width: '100%' }}
              >
                Select CA Key File
              </button>
              {caKeyFileName && (
                <span className="text-gray-300">{caKeyFileName}</span>
              )}
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleAddCAKey}
                className="bg-blue-500 text-white p-2 rounded"
                style={{ width: '100%' }}
              >
                Add Key
              </Button>
            </div>
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => setShowCaKeyModal(false)}
                className="bg-red-500 text-white p-2 rounded"
                style={{ width: '100%' }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-black text-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">File Name Exists</h2>
            <p className="mb-4">The file name already exists. Please enter a new one:</p>
            <Input
              className="p-2 border rounded mb-4"
              value={newFilename}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFilename(e.target.value)}
              placeholder="Enter new file name"
              style={{ width: '100%' }}
            />
            {modalError && <p className="text-red-500 mb-2">{modalError}</p>}
            <div className="flex justify-between">
              <Button onClick={handleReEnterFileName} className="bg-blue-500 text-white p-2 rounded" style={{ width: '100px' }}>
                Confirm
              </Button>
              <Button onClick={handleOverwrite} className="bg-green-500 text-white p-2 rounded" style={{ width: '100px' }}>
                Overwrite
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User's Features Section */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Manage Existing Keys</h2>
        
        {keys.length === 0 ? (
          <p>No keys available.</p>
        ) : (
          <ul className="list-disc pl-5 mb-4">
            {keys.map((key) => (
              <li key={key} className="flex justify-between items-center mb-2">
                <span>{key}</span>
                <div>
                  <Button
                    onClick={() => handleRenameKey(key)}
                    className="bg-yellow-500 text-white p-1 rounded mr-2"
                    style={{ height: '30px' }}
                  >
                    Rename
                  </Button>
                  <Button
                    onClick={() => setConfirmDelete(key)}
                    className="bg-red-500 text-white p-1 rounded"
                    style={{ height: '30px' }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-black text-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
              <p className="mb-4">Are you sure you want to delete the key: <strong>{confirmDelete}</strong>?</p>
              <div className="flex justify-between">
                <Button onClick={confirmDeletion} className="bg-red-500 text-white p-2 rounded" style={{ width: '100px' }}>
                  Confirm
                </Button>
                <Button onClick={cancelDeletion} className="bg-gray-500 text-white p-2 rounded" style={{ width: '100px' }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {keyToRename && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-black text-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Rename Key</h2>
              <Input
                className="p-2 border rounded mb-4"
                value={renamedKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenamedKey(e.target.value)}
                placeholder="Enter new key name"
              />
              <div className="flex justify-between">
                <Button onClick={confirmRenameKey} className="bg-blue-500 text-white p-2 rounded" style={{ width: '100px' }}>
                  Confirm
                </Button>
                <Button onClick={cancelRename} className="bg-gray-500 text-white p-2 rounded" style={{ width: '100px' }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageKeys;


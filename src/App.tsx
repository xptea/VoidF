import "./main.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
}

function App() {
  const [selectedItem, setSelectedItem] = useState("home");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [history, setHistory] = useState<string[]>(["/"]); // Navigation history
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const loadDirectory = async (path: string) => {
    try {
      const items: FileItem[] = await invoke('list_directory', { path });
      setFiles(items.sort((a, b) => {
        // Folders first, then files
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        return a.name.localeCompare(b.name);
      }));
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    // Add to history if moving forward
    if (historyIndex === history.length - 1) {
      setHistory([...history.slice(0, historyIndex + 1), path]);
      setHistoryIndex(historyIndex + 1);
    } else {
      // Replace forward history when navigating from a back state
      setHistory([...history.slice(0, historyIndex + 1), path]);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    if (file.is_dir) {
      navigateTo(file.path);
    }
  };

  const handleFileDoubleClick = async (file: FileItem) => {
    if (!file.is_dir) {
      console.log('File selected:', file.path);
      // You could show file info or implement a different action here
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Finder Window Header */}
      <div className="finder-header">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="finder-toolbar">
        <button 
          className={`p-1 rounded ${historyIndex > 0 ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'opacity-50'}`}
          onClick={goBack}
          disabled={historyIndex === 0}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          className={`p-1 rounded ${historyIndex < history.length - 1 ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'opacity-50'}`}
          onClick={goForward}
          disabled={historyIndex === history.length - 1}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Path breadcrumbs */}
        <div className="flex items-center gap-1 ml-4">
          <span className="text-gray-600 dark:text-gray-400">/</span>
          {pathParts.map((part, index) => (
            <div key={index} className="flex items-center">
              <button
                className="hover:underline px-1"
                onClick={() => navigateTo('/' + pathParts.slice(0, index + 1).join('/'))}
              >
                {part}
              </button>
              <span className="text-gray-600 dark:text-gray-400">/</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-48 bg-gray-100 dark:bg-gray-800 p-2 flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-1">
            Favorites
          </div>
          {["home", "documents", "downloads", "pictures", "music"].map((item) => (
            <div
              key={item}
              className={`sidebar-item ${
                selectedItem === item ? "bg-gray-200 dark:bg-gray-700" : ""
              }`}
              onClick={() => setSelectedItem(item)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="capitalize">{item}</span>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 grid grid-cols-6 gap-4">
          {files.map((file, i) => (
            <div 
              key={i} 
              className="flex flex-col items-center gap-2 cursor-pointer"
              onClick={() => handleFileClick(file)}
              onDoubleClick={() => handleFileDoubleClick(file)}
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={file.is_dir ? 
                      "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" :
                      "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    }
                  />
                </svg>
              </div>
              <span className="text-sm text-center">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;

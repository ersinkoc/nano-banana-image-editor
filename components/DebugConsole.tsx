import React, { useContext, useState } from 'react';
import { DebugContext } from '../contexts/DebugContext';

export const DebugConsole: React.FC = () => {
  const { logs } = useContext(DebugContext);
  const [isOpen, setIsOpen] = useState(false);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'REQUEST': return 'text-blue-400';
      case 'RESPONSE': return 'text-green-400';
      case 'ERROR': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-30 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: '40vh' }}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-4 text-gray-400 hover:text-white text-2xl"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold p-4 border-b border-gray-700 text-purple-400">Debug Console</h3>
        <div className="p-4 overflow-y-auto h-[calc(40vh-60px)]">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. AI interactions will appear here.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="font-mono text-sm bg-black/50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                     <span className={`font-bold ${getLogColor(log.type)}`}>{log.type}</span>
                     <span className="text-gray-500">{log.timestamp}</span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all text-gray-300">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full z-40 shadow-lg"
        >
          Debug Console
        </button>
      )}
    </>
  );
};

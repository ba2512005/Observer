import React, { useState } from 'react';
import { RotateCw, PlusCircle } from 'lucide-react';
import { checkOllamaServer } from '@utils/ollamaServer';
import { setOllamaServerAddress } from '@utils/main_loop';
import TextBubble from './TextBubble';
import { Logger } from '@utils/logging';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  loginWithRedirect: () => void;
  logout: (options?: any) => void;
}

interface AppHeaderProps {
  serverStatus: 'unchecked' | 'online' | 'offline';
  setServerStatus: React.Dispatch<React.SetStateAction<'unchecked' | 'online' | 'offline'>>;
  isRefreshing: boolean;
  agentCount: number;
  activeAgentCount: number;
  onRefresh: () => Promise<void>;
  onAddAgent: () => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  authState?: AuthState;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  serverStatus,
  setServerStatus,
  isRefreshing,
  agentCount,
  activeAgentCount,
  onRefresh,
  onAddAgent,
  setError,
  authState
}) => {
  const [serverAddress, setServerAddress] = useState('localhost:3838');
  const [showServerHint] = useState(true);

  const checkServerStatus = async () => {
    try {
      setServerStatus('unchecked');
      const [host, port] = serverAddress.split(':');
      
      Logger.info('SERVER', `Checking connection to Ollama server at ${host}:${port}`);
      
      // Set the server address for agent loops
      setOllamaServerAddress(host, port);
      
      const result = await checkOllamaServer(host, port);
      
      if (result.status === 'online') {
        setServerStatus('online');
        setError(null);
        Logger.info('SERVER', `Connected successfully to Ollama server at ${host}:${port}`);
      } else {
        setServerStatus('offline');
        setError(result.error || 'Failed to connect to Ollama server');
        Logger.error('SERVER', `Failed to connect to Ollama server: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      setServerStatus('offline');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to connect to Ollama server');
      Logger.error('SERVER', `Error checking server status: ${errorMessage}`, err);
    }
  };

  const handleServerAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setServerAddress(newAddress);
    
    // Update server address for agent loops when input changes
    if (newAddress.includes(':')) {
      const [host, port] = newAddress.split(':');
      setOllamaServerAddress(host, port);
      Logger.debug('SERVER', `Server address updated to ${host}:${port}`);
    }
  };

  return (
    <>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img src="/eye-logo-black.svg" alt="Observer Logo" className="h-8 w-8" />
              <h1 className="text-xl font-semibold">Observer</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={serverAddress}
                  onChange={handleServerAddressChange}
                  placeholder="api.observer.local"
                  className="px-3 py-2 border rounded-md"
                />
                <button
                  onClick={checkServerStatus}
                  className={`px-4 py-2 rounded-md ${
                    serverStatus === 'online' 
                      ? 'bg-green-500 text-white' 
                      : serverStatus === 'offline'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {serverStatus === 'online' ? '✓ Connected' : 
                   serverStatus === 'offline' ? '✗ Disconnected' : 
                   'Check Server'}
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <button 
                  onClick={onRefresh}
                  className="p-2 rounded-md hover:bg-gray-100"
                  disabled={isRefreshing}
                >
                  <RotateCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <p className="text-sm">
                  Active: {activeAgentCount} / Total: {agentCount}
                </p>
                <button
                  onClick={onAddAgent}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Add Agent</span>
                </button>

                {/* Authentication UI */}
                {authState ? (
                  authState.isLoading ? (
                    <div className="px-4 py-2 bg-gray-100 rounded">Loading...</div>
                  ) : authState.isAuthenticated ? (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-700">
                        {authState.user?.name || authState.user?.email || 'User'}
                      </span>
                      <button
                        onClick={() => authState.logout({ logoutParams: { returnTo: window.location.origin } })}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => authState.loginWithRedirect()}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Login
                    </button>
                  )
                ) : (
                  <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded text-sm">
                    Auth not initialized
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {showServerHint && (
        <div className="fixed z-60" style={{ top: '70px', right: '35%' }}>
          <TextBubble 
            message="Enter your Ollama server address here (default: localhost:11434)" 
            duration={7000} 
          />
        </div>
      )}
    </>
  );
};

export default AppHeader;

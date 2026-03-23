'use client';

import { useState, type FormEvent } from 'react';
import { isValidAddress } from '@/lib/formatters';
import { CHAINS } from '@/lib/constants';

interface VaultSearchBarProps {
  address: string;
  chainId: number;
  onAddressChange: (address: string) => void;
  onChainChange: (chainId: number) => void;
  onSearch: (address: string, chainId: number) => void;
  isLoading: boolean;
}

export function VaultSearchBar({
  address,
  chainId,
  onAddressChange,
  onChainChange,
  onSearch,
  isLoading,
}: VaultSearchBarProps) {
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Please enter a vault address');
      return;
    }
    if (!isValidAddress(address.trim())) {
      setError('Invalid Ethereum address format');
      return;
    }
    setError('');
    onSearch(address.trim(), chainId);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => {
              onAddressChange(e.target.value);
              if (error) setError('');
            }}
            placeholder="0x... Vault Address"
            className="input-field flex-1 px-4 py-2.5 rounded-xl text-gray-100 font-mono text-sm"
          />
          <select
            value={chainId}
            onChange={(e) => onChainChange(Number(e.target.value))}
            className="input-field px-4 py-2.5 rounded-xl text-gray-100 text-sm"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            {Object.values(CHAINS).map((chain) => (
              <option key={chain.id} value={chain.id} style={{ background: '#0f0f17' }}>
                {chain.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl font-medium text-sm text-white accent-gradient hover:opacity-90 disabled:opacity-40 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-transparent whitespace-nowrap"
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-xs flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

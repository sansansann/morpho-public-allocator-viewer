'use client';

import { useState } from 'react';
import { formatAddress } from '@/lib/formatters';
import { CHAINS } from '@/lib/constants';

interface AddressDisplayProps {
  address: string;
  chainId: number;
  label?: string;
}

export function AddressDisplay({ address, chainId, label }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);
  const chain = CHAINS[chainId];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400">
      {label && <span className="text-slate-500 font-sans text-xs">{label}</span>}
      <span className="text-slate-300">{formatAddress(address)}</span>
      <button
        onClick={handleCopy}
        className="text-slate-600 hover:text-indigo-400 transition-colors"
        title="Copy address"
      >
        {copied ? (
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      {chain && (
        <a
          href={`${chain.explorerUrl}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 hover:text-indigo-400 transition-colors"
          title="View on explorer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </span>
  );
}

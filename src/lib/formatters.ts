import { formatUnits } from 'viem';
import { UINT128_MAX } from './constants';

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function formatTokenAmount(
  rawAmount: string,
  decimals: number,
  maxDecimals: number = 2
): string {
  if (!rawAmount || rawAmount === '0') return '0';

  const formatted = formatUnits(BigInt(rawAmount), decimals);
  const num = parseFloat(formatted);
  if (num === 0) return '0';

  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(maxDecimals)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(maxDecimals)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(maxDecimals)}K`;

  return num.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

export function formatUsd(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatFlowCap(
  rawAmount: string,
  decimals: number
): { display: string; isUnlimited: boolean; isDisabled: boolean } {
  if (rawAmount === UINT128_MAX) {
    return { display: 'Unlimited', isUnlimited: true, isDisabled: false };
  }
  if (rawAmount === '0') {
    return { display: 'Disabled', isUnlimited: false, isDisabled: true };
  }
  return {
    display: formatTokenAmount(rawAmount, decimals),
    isUnlimited: false,
    isDisabled: false,
  };
}

export function formatFeeToEth(feeWei: string): string {
  if (!feeWei || feeWei === '0') return '0 ETH';
  const eth = parseFloat(formatUnits(BigInt(feeWei), 18));
  if (eth < 0.0001) return `${eth.toExponential(2)} ETH`;
  return `${eth.toFixed(6)} ETH`;
}

export function formatLltv(lltv: string): string {
  const pct = parseFloat(formatUnits(BigInt(lltv), 18)) * 100;
  return `${pct.toFixed(1)}%`;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return new Date(timestamp * 1000).toLocaleDateString();
}

export function getMarketLabel(
  collateralAsset: { symbol: string } | null,
  loanAsset: { symbol: string }
): string {
  if (!collateralAsset) return `- / ${loanAsset.symbol}`;
  return `${collateralAsset.symbol} / ${loanAsset.symbol}`;
}

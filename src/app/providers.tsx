'use client';

import * as React from 'react';
import { RainbowKitProvider, getDefaultWallets, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { argentWallet, trustWallet, ledgerWallet } from '@rainbow-me/rainbowkit/wallets';
import { arbitrum, base, hardhat, mainnet, optimism, polygon, sepolia, zora } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

const { wallets } = getDefaultWallets();

const config = getDefaultConfig({
  appName: 'NFT_DEMO',
  projectId: 'f109ceefe9dab9ae333cf70dfc4defbc',
  wallets: [
    ...wallets,
    // {
    //   groupName: 'Other',
    //   wallets: [argentWallet, trustWallet, ledgerWallet]
    // }
  ],
  chains: [hardhat, mainnet,sepolia],
  ssr: true
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

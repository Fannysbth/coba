import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'viem/chains';

export const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    projectId: 'e7f73a06c3b58c3fd30d3fe32bc31bba',
    chains: [sepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });
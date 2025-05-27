"use client";

import {RainbowKitProvider} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";   
import React from "react";
import {WagmiProvider} from "wagmi";
import '@rainbow-me/rainbowkit/styles.css';
import { config } from "config/config";

const queryClient = new QueryClient();

export default function Provider ({children}:{children:React.ReactNode}){
    return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { vaultAbi} from "abi/abi";
import { useState, useEffect } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useConnect, useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi } from 'viem';

const VAULT_ADDRESS = "0x7011dDAFbCdC7Fd83bcA91be958F0EcEAE11a948"; // Ganti dengan alamat Vault

export default function Home() {
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const { address, isConnected } = useAccount();

  const { data: TOKEN_ADDRESS } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "token",
  });

  const { data: DECIMALS } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "decimals",
  });

  const parsedAmount = amount ? parseUnits(amount, DECIMALS) : 0n;
  
  const { data: walletBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    watch: true,
  });

  const { data: vaultBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "balanceOfUnderlying",
    args: [address!],
    watch: true,
  });

  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "totalAssets",
    watch: true,
  });

  const { data: allowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, VAULT_ADDRESS],
    watch: true,
  });

  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeDeposit } = useWriteContract();
  const { isLoading: txPending, isSuccess: txConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // 🔄 Cek allowance
  useEffect(() => {
    if (allowance !== undefined && parsedAmount > 0n) {
      setIsApproved(allowance >= parsedAmount);
    }
  }, [allowance, parsedAmount]);

  // 🔘 Tombol approve
  const handleApprove = async () => {
    try {
      const hash = await writeApprove({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [VAULT_ADDRESS, parseUnits("100000000", DECIMALS)], // approve besar supaya gak sering approve
      });
      setTxHash(hash);
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  // ✅ Deposit
  const handleDeposit = async () => {
    try {
      const hash = await writeDeposit({
        address: VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: "deposit",
        args: [parsedAmount],
      });
      setTxHash(hash);
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  };

  // 🧮 Format balance
  const format = (val?: bigint) => (val ? formatUnits(val, DECIMALS) : "Loading...");

  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Vault Deposit</h2>
      <ConnectButton />
      <div className="mb-2">💼 Wallet Balance: {format(walletBalance)} Tokens</div>
      <div className="mb-2">📥 Vault Balance: {format(vaultBalance)} Tokens</div>
      <div className="mb-4">🏦 Total Vault: {format(totalAssets)} Tokens</div>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          step="any"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={() =>
            walletBalance && setAmount(formatUnits(walletBalance, DECIMALS))
          }
          className="bg-gray-200 px-2 rounded"
        >
          Max
        </button>
      </div>

      {!isApproved ? (
        <button
          onClick={handleApprove}
          disabled={!parsedAmount || txPending}
          className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
        >
          {txPending ? "Approving..." : "Approve Token"}
        </button>
      ) : (
        <button
          onClick={handleDeposit}
          disabled={!parsedAmount || txPending}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {txPending ? "Depositing..." : "Deposit"}
        </button>
      )}

      {txConfirmed && <p className="mt-2 text-green-600">✅ Transaction confirmed!</p>}
    </div>
  );
}
"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { vaultAbi } from "abi/abi";
import { useState, useEffect, useMemo } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi } from "viem";

const VAULT_ADDRESS = "0x7011dDAFbCdC7Fd83bcA91be958F0EcEAE11a948";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isApproved, setIsApproved] = useState(false);
  const { address, isConnected } = useAccount();

  const { data: ethBalance } = useBalance({
    address,
    query: {
      enabled: !!address,       
      refetchInterval: 5000,    
    },
  });

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

  const parsedAmount = useMemo(() => {
    if (amount && DECIMALS !== undefined) {
      return parseUnits(amount, DECIMALS);
    }
    return BigInt(0);
  }, [amount, DECIMALS]);

  const { data: walletBalance } = useReadContract({
    address: TOKEN_ADDRESS ?? undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: vaultBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "balanceOfUnderlying",
    args:  address ? [address] : undefined,
  });

  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "totalAssets",
  });

  const { data: allowance } = useReadContract({
    address: TOKEN_ADDRESS ?? undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
  });

  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeDeposit } = useWriteContract();
  const { isLoading: txPending, isSuccess: txConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  useEffect(() => {
    if (allowance !== undefined && parsedAmount > BigInt(0)) {
      setIsApproved(allowance >= parsedAmount);
    }
  }, [allowance, parsedAmount]);

  const handleApprove = async () => {
    if (!TOKEN_ADDRESS || DECIMALS === undefined) return;
    try {
      const hash = await writeApprove({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [VAULT_ADDRESS, parseUnits(parsedAmount.toString(), DECIMALS)],
      });
      setTxHash(hash);
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const handleDeposit = async () => {
    if (parsedAmount <= BigInt(0)) return;
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

  const format = (val?: bigint) =>
    val !== undefined && DECIMALS !== undefined
      ? formatUnits(val, DECIMALS)
      : "Loading...";

  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Vault Deposit</h2>
      <ConnectButton />

      <div className="mb-2">💼 Wallet Balance: {ethBalance ? `${ethBalance.formatted} ${ethBalance.symbol}` : 'Loading...'} Tokens</div>
      <div className="mb-2">📥 Vault Balance: {format(vaultBalance)} Tokens</div>
      <div className="mb-4">🏦 Total Vault: {format(totalAssets)} Tokens</div>
      <div className="mb-4">🏦 Address Wallet: {address} </div>

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
          onClick={() => {
            if (walletBalance !== undefined && DECIMALS !== undefined) {
              setAmount(formatUnits(walletBalance, DECIMALS));
            }
          }}
          className="bg-gray-200 px-2 rounded"
        >
          Max
        </button>
      </div>

      {!isApproved ? (
        <button
          onClick={handleApprove}
          disabled={parsedAmount <= BigInt(0) || txPending}
          className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
        >
          {txPending ? "Approving..." : "Approve Token"}
        </button>
      ) : (
        <button
          onClick={handleDeposit}
          disabled={parsedAmount <= BigInt(0) || txPending}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {txPending ? "Depositing..." : "Deposit"}
        </button>
      )}

      {txConfirmed && <p className="mt-2 text-green-600">✅ Transaction confirmed!</p>}
    </div>
  );
}

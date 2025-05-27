
"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MOCK_USDC_ABI, MOCK_TOKEN_ADDRESS } from "abi/mock-usdc-abi";
import { VAULT_ABI} from "abi/vault-abi";
import { useState, useEffect } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { erc20Abi } from 'viem';


const VAULT_ADDRESS = "0xc39b0Fb736409C50cCD9Da42248b507762B18cE8"; // Ganti dengan alamat Vault

export default function Home() {
  const { address, isConnected } = useAccount();

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        abi: VAULT_ABI,
        address: VAULT_ADDRESS,
        functionName: "name",
      },
      {
        abi: VAULT_ABI,
        address: VAULT_ADDRESS,
        functionName: "symbol",
      },
      {
        abi: VAULT_ABI,
        address: VAULT_ADDRESS,
        functionName: "decimals",
      },
      {
        abi: VAULT_ABI,
        address: VAULT_ADDRESS,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      },
      {
        abi: VAULT_ABI,
        address: VAULT_ADDRESS,
        functionName: "usdc",
      },
    ],
  });

  const name = data?.[0].result;
  const symbol = data?.[1].result;
  const decimals = data?.[2].result;
  const balanceUser = data?.[3].result;
  const TOKEN_ADDRESS =data?.[4].result;

  const BalanceUser = () => {
    if (!isConnected) {
      return <h1>Please connect your account!</h1>;
    }

    if (isLoading) {
      return <p>Loading....</p>;
    }

    return (
      <p>
        balanceUser : {formatUnits(balanceUser || BigInt(0), decimals || 18)}
      </p>
    );
  };

  const MintComponent = () => {
    const [userAddress, setUserAddress] = useState<string>("0x");
    const [amount, setAmount] = useState<string>("0");

    const { writeContract } = useWriteContract();

    const funcionSubmit = () => {
      writeContract({
        abi: MOCK_USDC_ABI,
        address: MOCK_TOKEN_ADDRESS,
        functionName: "mint",
        args: [
          userAddress as `0x${string}`,
          parseUnits(amount, decimals || 18),
        ],
      });
    };

    return (
      <div className="bg-white text-black">
        <div className="gap-2 justify-between">
          <label>Address user </label>
          <input
            className="border-black border-2"
            onChange={(e) => setUserAddress(e.target.value)}
          />
        </div>
        <div>
          <label>Amount</label>
          <input
            type="number"
            className="border-black border-2"
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button
          className="bg-blue-400 text-black rounded-lg p-4"
          onClick={funcionSubmit}
        >
          Mint~
        </button>
      </div>
    );
  };

  const Deposit = () => {
    const { address, isConnected } = useAccount();
    const [amount, setAmount] = useState<string>("0");
    const [decimals, setDecimals] = useState<number>(18);
    const [approved, setApproved] = useState(false);
  
    const { writeContract, isPending: isApproving } = useWriteContract();
    const { writeContract: writeDeposit, isPending: isDepositing } = useWriteContract();
  
    const { data: allowanceData } = useReadContracts({
      contracts: [
        {
          address: TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: 'decimals',
        },
        {
          address: TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address!, VAULT_ADDRESS],
        },
      ],
      watch: true,
    });
  
    useEffect(() => {
      if (allowanceData?.[0]?.result) {
        setDecimals(Number(allowanceData[0].result));
      }
      if (allowanceData?.[1]?.result && amount) {
        const parsedAmount = parseUnits(amount || "0", decimals);
        const allowance = BigInt( );
        setApproved(allowance >= parsedAmount);
      }
    }, [allowanceData, amount, decimals]);
  
    const handleApprove = () => {
      const parsedAmount = parseUnits(amount, decimals);
      writeContract({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [VAULT_ADDRESS, parsedAmount],
      });
    };
  
    const handleDeposit = () => {
      const parsedAmount = parseUnits(amount, decimals);
      writeDeposit({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [parsedAmount],
      });
    };
  
    return (
      <main style={{ padding: 20 }}>
        <h1>Web3 Vault Deposit</h1>
        <ConnectButton />
  
        {isConnected && (
          <>
            <p>Wallet: {address}</p>
            <input
              type="text"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
  
            {!approved ? (
              <button onClick={handleApprove} disabled={isApproving || !amount}>
                {isApproving ? 'Approving...' : 'Approve'}
              </button>
            ) : (
              <button onClick={handleDeposit} disabled={isDepositing || !amount}>
                {isDepositing ? 'Depositing...' : 'Deposit'}
              </button>
            )}
          </>
        )}
      </main>
    );
  }

  return (
    <div>
      <ConnectButton />
      <p>Wallet Kamu : {address}</p>
      <p>Token Name : {name}</p>
      <p>Symbol: {symbol}</p>
      <p>Decimals: {decimals}</p>
      <BalanceUser />
      <h1>~Mint~</h1>
      <MintComponent />
      <Deposit />
    </div>
  );
}

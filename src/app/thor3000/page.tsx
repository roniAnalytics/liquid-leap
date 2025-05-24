"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { parseUnits, formatUnits } from "ethers";
import { abi as swapTradeAbi } from "@/lib/swapTradeAbi";
import {
  SWAP_TRADE_CONTRACT_ADDRESS,
  USDC_CONTRACT_ADDRESS,
} from "@/lib/constants";
import { Shield, AlertTriangle, CheckCircle, Wallet } from "lucide-react";

export default function AdminPage() {
  const [amount, setAmount] = useState<string>("");
  const [transactionStep, setTransactionStep] = useState<
    "idle" | "withdrawing" | "completed" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Get USDC balance in the swap contract
  const { data: contractUsdcBalance, refetch: refetchBalance } = useBalance({
    address: SWAP_TRADE_CONTRACT_ADDRESS,
    token: USDC_CONTRACT_ADDRESS,
  });

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction state changes
  useEffect(() => {
    if (isConfirmed && transactionStep === "withdrawing") {
      setTransactionStep("completed");
      refetchBalance(); // Refresh balance after successful withdrawal
      const timer = setTimeout(() => {
        setTransactionStep("idle");
        setAmount("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, transactionStep, refetchBalance]);

  // Handle transaction errors
  useEffect(() => {
    if (writeError || receiptError) {
      setTransactionStep("error");
      setErrorMessage(
        writeError?.message || receiptError?.message || "Transaction failed"
      );
      const timer = setTimeout(() => {
        setTransactionStep("idle");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [writeError, receiptError]);

  const handleWithdraw = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid amount");
      setTransactionStep("error");
      return;
    }

    if (!isConnected) {
      setErrorMessage("Please connect your wallet");
      setTransactionStep("error");
      return;
    }

    if (
      contractUsdcBalance &&
      parseFloat(amount) > parseFloat(contractUsdcBalance.formatted)
    ) {
      setErrorMessage("Amount exceeds contract balance");
      setTransactionStep("error");
      return;
    }

    try {
      setTransactionStep("withdrawing");
      setErrorMessage("");

      await writeContract({
        abi: swapTradeAbi,
        address: SWAP_TRADE_CONTRACT_ADDRESS,
        functionName: "withdrawTokens",
        args: [
          USDC_CONTRACT_ADDRESS as `0x${string}`,
          parseUnits(amount, 6), // USDC has 6 decimals
        ],
      });
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setTransactionStep("error");
      setErrorMessage("Failed to initiate withdrawal");
    }
  };

  const handleMaxClick = () => {
    if (contractUsdcBalance) {
      setAmount(contractUsdcBalance.formatted);
    }
  };

  const getButtonText = () => {
    switch (transactionStep) {
      case "withdrawing":
        return "Withdrawing...";
      case "completed":
        return "Withdrawal Completed!";
      case "error":
        return "Try Again";
      default:
        return "Withdraw USDC";
    }
  };

  const getButtonIcon = () => {
    switch (transactionStep) {
      case "completed":
        return <CheckCircle className="h-4 w-4 mr-2" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 mr-2" />;
      default:
        return <Shield className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-black w-full">
      <Navbar />

      {/* Hero Section */}
      <section className="m-auto container px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 text-center">
        <h1 className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-transparent">
          Admin Panel
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-base sm:text-lg text-muted-foreground">
          Emergency USDC withdrawal interface for contract administrators.
        </p>

        {/* Contract Balance Display */}
        <Card className="mx-auto mt-8 max-w-md overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <CardContent className="p-4 bg-background/60 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-3">
              <Wallet className="h-5 w-5 text-blue-500" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Contract USDC Balance
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {contractUsdcBalance
                    ? `${parseFloat(
                        contractUsdcBalance.formatted
                      ).toLocaleString()} USDC`
                    : "Loading..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Interface */}
        <Card className="mx-auto mt-8 max-w-md overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <CardContent className="p-6 bg-background/60 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-blue-500">
                <Shield className="h-6 w-6" />
                <h2 className="text-xl font-bold">USDC Withdrawal</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Amount to Withdraw (USDC)
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-background/80 border-neutral-200 dark:border-neutral-800 focus:border-0 dark:focus:border-blue-400 pr-16"
                      disabled={transactionStep === "withdrawing"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 px-3 text-xs hover:bg-blue-100 dark:hover:bg-blue-900"
                      onClick={handleMaxClick}
                      disabled={
                        transactionStep === "withdrawing" ||
                        !contractUsdcBalance
                      }
                    >
                      MAX
                    </Button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-red-700 dark:text-red-300">
                        {errorMessage}
                      </span>
                    </div>
                  </div>
                )}

                {transactionStep === "completed" && (
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        USDC withdrawn successfully!
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className={`w-full transition-all duration-300 text-white ${
                    transactionStep === "completed"
                      ? "bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900"
                      : transactionStep === "error"
                      ? "bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                      : "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                  }`}
                  size="lg"
                  disabled={
                    transactionStep === "withdrawing" ||
                    isConfirming ||
                    !amount ||
                    !isConnected ||
                    !contractUsdcBalance ||
                    parseFloat(contractUsdcBalance?.formatted || "0") === 0
                  }
                  onClick={handleWithdraw}
                >
                  {getButtonIcon()}
                  {getButtonText()}
                </Button>

                {!isConnected && (
                  <div className="text-sm text-center text-muted-foreground">
                    Please connect your wallet to continue
                  </div>
                )}

                {contractUsdcBalance &&
                  parseFloat(contractUsdcBalance.formatted) === 0 && (
                    <div className="text-sm text-center text-muted-foreground">
                      No USDC available in contract
                    </div>
                  )}

                <div className="text-xs text-center text-muted-foreground">
                  ⚠️ Only contract owner can withdraw tokens
                </div>

                <div className="text-xs text-center text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  Token: USDC ({USDC_CONTRACT_ADDRESS.slice(0, 6)}...
                  {USDC_CONTRACT_ADDRESS.slice(-4)})
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

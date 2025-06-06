"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpDown,
  Clock,
  Flame,
  Lock,
  Users,
  TrendingUp,
  DollarSign,
  PieChart,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { TokenInput } from "@/components/token-input";
import { MarketStat } from "@/components/market-stat";
import { useCallback, useEffect, useState } from "react";
// import { useWriteContract } from "wagmi";
import { abi as swapTradeAbi } from "@/lib/swapTradeAbi";
import { ethers, parseUnits } from "ethers";
import {
  LEAP_CONTRACT_ADDRESS,
  LEAP_PRICE,
  SWAP_TRADE_CONTRACT_ADDRESS,
} from "@/lib/constants";
import { abi as usdtAbi } from "@/lib/usdtAbi";
import { USDC_CONTRACT_ADDRESS } from "@/lib/constants";
import {
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useAccount,
  useBalance,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Footer } from "@/components/footer";

declare global {
  interface Window {
    ethereum?: any;
  }
}
export default function Home() {
  const [isReversed, setIsReversed] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [transactionStep, setTransactionStep] = useState<'idle' | 'approving' | 'approved' | 'swapping' | 'completed'>('idle');
  
  const handleSwap = () => {
    setIsReversed(!isReversed);
  };

  const { address } = useAccount();

  // Fetch USDT balance
  const { data: usdtBalance, refetch: refetchUsdtBalance } = useBalance({
    address,
    token: USDC_CONTRACT_ADDRESS,
    // watch: true,
  });

  // Fetch LEAP balance
  const { data: leapBalance, refetch: refetchLeapBalance } = useBalance({
    address,
    token: LEAP_CONTRACT_ADDRESS,
    // watch: true,
  });

  useEffect(() => {
    setTimeout(() => {
      refetchUsdtBalance();
      refetchLeapBalance();
    }, 5000);
  }, []);

  const FirstToken = () => (
    <TokenInput
      label={"You pay"}
      balance={
        isReversed
          ? leapBalance?.formatted ?? "0"
          : usdtBalance?.formatted ?? "0"
      }
      token={isReversed ? "LEAP" : "USDC"}
      tokenIcon={isReversed ? "🔷" : "💵"}
      amount={amount}
      setAmount={setAmount}
    />
  );

  const SecondToken = () => (
    <TokenInput
      label={"You receive"}
      balance={
        isReversed
          ? usdtBalance?.formatted ?? "0"
          : leapBalance?.formatted ?? "0"
      }
      token={isReversed ? "USDC" : "LEAP"}
      tokenIcon={isReversed ? "💵" : "🔷"}
      amount={isReversed ? amount * LEAP_PRICE : amount / LEAP_PRICE}
      setAmount={setAmount}
    />
  );
  // const { writeContract: swapContract } = useWriteContract();
  const getContracts = useCallback((signer: ethers.Signer) => {
    const leapContract = new ethers.Contract(
      LEAP_CONTRACT_ADDRESS as string,
      usdtAbi,
      signer
    );
    const usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS as string,
      usdtAbi,
      signer
    );

    const swapTradeContract = new ethers.Contract(
      SWAP_TRADE_CONTRACT_ADDRESS as string,
      swapTradeAbi,
      signer
    );
    return { leapContract, usdcContract, swapTradeContract };
  }, []);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { writeContract: swapContract, isSuccess } = useWriteContract();
  const { writeContract: approveContract, data: approveHash, error: approveError } = useWriteContract();
  
  // Wait for approval transaction to be confirmed
  const { 
    isLoading: isApprovalConfirming, 
    isSuccess: isApprovalConfirmed,
    error: approvalReceiptError 
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Auto-execute swap when approval is confirmed
  useEffect(() => {
    if (isApprovalConfirmed && transactionStep === 'approving') {
      setTransactionStep('approved');
      
      const executeSwap = async () => {
        try {
          setTransactionStep('swapping');
          
          await swapContract({
            abi: swapTradeAbi,
            address: SWAP_TRADE_CONTRACT_ADDRESS,
            functionName: isReversed
              ? "swapXTokenForUSDT"
              : "swapUSDTForXToken",
            args: [
              parseUnits(amount.toString(), isReversed ? 18 : 6),
            ],
          });
          
          setTransactionStep('completed');
        } catch (error) {
          console.error('Swap transaction failed:', error);
          setTransactionStep('idle');
        }
      };
      
      executeSwap();
    }
  }, [isApprovalConfirmed, transactionStep, swapContract, isReversed, amount]);

  // Handle approval transaction errors
  useEffect(() => {
    if (approveError || approvalReceiptError) {
      setTransactionStep('idle');
    }
  }, [approveError, approvalReceiptError]);

  // Reset transaction state after completion
  useEffect(() => {
    if (transactionStep === 'completed') {
      const timer = setTimeout(() => {
        setTransactionStep('idle');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [transactionStep]);

  // Reset transaction state when amount or direction changes
  useEffect(() => {
    if (transactionStep !== 'idle') {
      setTransactionStep('idle');
    }
  }, [amount, isReversed]);

  // useEffect(() => {
  //   const setupSigner = async () => {
  //     if (walletClient && publicClient) {
  //       const provider = new ethers.AlchemyProvider(
  //         "https://eth-mainnet.g.alchemy.com/v2/QBSFf9rS6-glQ7EwqXdSGBjncp3gxb16"
  //       );
  //       const signer = await provider.getSigner();
  //       setSigner(signer);
  //     }
  //   };
  //   setupSigner();
  // }, []);

  const approveUsdc = async (signer: any, amount: any) => {
    if (!signer) throw new Error("No signer available");
    try {
      const { usdcContract } = getContracts(signer);
      const amountToApprove = parseUnits(amount.toString(), 18);
      const tx = await usdcContract.approve(
        SWAP_TRADE_CONTRACT_ADDRESS,
        amountToApprove
      );
      await tx.wait();
      // toast({
      //   title: "Success",
      //   description: "USDC approved successfully",
      //   variant: "default",
      // });
      console.log("usdc approve success");
    } catch (error) {
      console.error(error);
      // toast({
      //   title: "Error",
      //   description: "Failed to approve USDC",
      //   variant: "destructive",
      // });
      throw error;
    }
  };
  return (
    <div className="min-h-screen bg-background dark:bg-black w-full">
      <Navbar />

      {/* Hero Section */}
      <section className="m-auto container px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 text-center">
        <h1 className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-transparent sm:text-7xl">
          The Future of DeFi Trading
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-base sm:text-lg text-muted-foreground">
          LEAP is the native token powering the next generation of decentralized
          exchange. Trade, stake, and earn with unparalleled efficiency.
        </p>

        {/* Market Stats */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
          <MarketStat
            title="Current Leap Price"
            value={`${LEAP_PRICE} USD`}
            // change="+12.5%"
            icon={TrendingUp}
          />
          <MarketStat
            title="Market Cap"
            value="$105M"
            icon={DollarSign}
            subtitle="Circulating Supply"
          />
        </div>

        {/* Exchange Interface */}
        <Card className="mx-auto mt-12 max-w-md overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <CardContent className="p-6 bg-background/60 backdrop-blur-sm">
            <div className="space-y-4">
              <FirstToken />
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={handleSwap}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
              <SecondToken />
              <div className="text-sm text-center text-muted-foreground">
                1 {!isReversed ? "USDC" : "LEAP"} ={" "}
                {!isReversed ? 1 / LEAP_PRICE : LEAP_PRICE}{" "}
                {!isReversed ? "LEAP" : "USDC"}
              </div>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:bg-gradient-to-r hover:from-blue-700 hover:to-blue-900 transition-all duration-300 text-white"
                size="lg"
                disabled={transactionStep !== 'idle' && transactionStep !== 'completed'}
                onClick={async () => {
                  try {
                    setTransactionStep('approving');
                    
                    await approveContract({
                      abi: usdtAbi,
                      address: isReversed
                        ? LEAP_CONTRACT_ADDRESS
                        : USDC_CONTRACT_ADDRESS,
                      functionName: "approve",
                      args: [
                        SWAP_TRADE_CONTRACT_ADDRESS,
                        parseUnits(amount.toString(), isReversed ? 18 : 6),
                      ],
                    });
                  } catch (error) {
                    console.error('Approval transaction failed:', error);
                    setTransactionStep('idle');
                  }
                }}
              >
                {transactionStep === 'idle' && `${isReversed ? "Redeem" : "Buy"} LEAP`}
                {transactionStep === 'approving' && 'Approving...'}
                {transactionStep === 'approved' && 'Approval Confirmed'}
                {transactionStep === 'swapping' && 'Swapping...'}
                {transactionStep === 'completed' && 'Completed!'}
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Transaction fee: 0.3%
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="m-auto container px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <CardContent className="p-6 bg-background/60 backdrop-blur-sm space-y-2">
              <Lock className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold">Secure Trading</h3>
              <p className="text-muted-foreground">
                Built on advanced blockchain technology with audited smart
                contracts ensuring your assets stay safe.
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <CardContent className="p-6 bg-background/60 backdrop-blur-sm space-y-2">
              <Flame className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold">Instant Liquidity</h3>
              <p className="text-muted-foreground">
                Deep liquidity pools and efficient market making ensure minimal
                slippage on all trades.
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <CardContent className="p-6 bg-background/60 backdrop-blur-sm space-y-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold">Flexible Redemption</h3>
              <p className="text-muted-foreground">
                Redeem your LEAP tokens anytime at market price with zero lockup
                periods.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tokenomics Section */}
      <section className="m-auto container px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Tokenomics</h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            LEAP token holders directly benefit from the platform&apos;s success
            through our unique profit-sharing model.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <CardContent className="p-6 space-y-2">
              <PieChart className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold">Profit Distribution</h3>
              <p className="text-muted-foreground">
                100% of platform profits are used to increase the token&apos;s
                value, creating a direct correlation between platform success
                and holder returns.
              </p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <CardContent className="p-6 space-y-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold">Value Appreciation</h3>
              <p className="text-muted-foreground">
                As trading volume grows, platform profits automatically drive up
                the token price, ensuring passive income for all holders.
              </p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <CardContent className="p-6 space-y-2">
              <Users className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold">Fair Distribution</h3>
              <p className="text-muted-foreground">
                Profits are distributed equally among all token holders through
                the price mechanism, creating a truly democratic reward system.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="m-auto container px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            "Platform collects fees from trades and services",
            "100% of profits are used to increase token value",
            "Token price automatically adjusts upward",
            "Holders can redeem tokens at any time for profit",
          ].map((step, index) => (
            <Card
              key={index}
              className="transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            >
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {index + 1}
                </div>
                <p>{step}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

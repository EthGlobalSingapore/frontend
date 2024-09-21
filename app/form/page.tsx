"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input"
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { getClient } from "@/config";
import { sepolia } from "viem/chains";
import { decodeEventLog, encodeFunctionData, Hex, parseAbi } from "viem";
import { useStrategyAddress } from "../hooks/useStrategyAddress";
import { useSendUserOperation, useSmartAccountClient } from "@account-kit/react";


const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, formState: { errors }, watch, getValues } = useForm({
    defaultValues: {
      options: [],
      newAmounts: []
    }
  });


  const router = useRouter(); // Initialize the router 

  const factoryAbi = parseAbi([
    'function createStrategy(address owner,uint256 amount) external',
    `function getStrategy(address owner) external view returns (address)`,
    `event StrategyCreated(address strategyAddress)`
  ]);

  const [userOpCompleted, setUserOpCompleted] = useState(false);

  const { client } = useSmartAccountClient({ type: "MultiOwnerModularAccount" });
  const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
    client,
    // optional parameter that will wait for the transaction to be mined before returning
    waitForTxn: true,
    onSuccess: async ({ hash, request }) => {
      console.log(`tx hash:${hash}`);

      const receipt = await client?.getTransactionReceipt({hash});
      console.log(`receipt ${receipt}`);

      if (receipt) {
        const logs = receipt?.logs
        .map((log) => {
          try {
            const decoded = decodeEventLog({
              abi: factoryAbi,
              data: log.data,
              topics: log.topics
            });

            console.log(decoded);

            // return decoded.eventName === "GreeterCreated";

            if (decoded.eventName === "StrategyCreated") {
              return decoded.args.strategyAddress;
            }

          } catch (e) {
            // console.error(e);
            return null
          }
        });

        // console.log(logs);

        localStorage.setItem("strategyAddress", logs.find((log) => log !== undefined) ?? "");
        setUserOpCompleted(true);

        // setStrategyAddress(logs.find((log) => log !== undefined) ?? null);
        // setLoading(false);
      }
    },
    onError: async (e, request) => {
      console.error(e);
      // setError(`Error fetching strategy address: ${e}`);
    },
  });


  useEffect(() => {
    if (userOpCompleted) {
      router.push('/home'); // Navigate to home
    }
  }, [userOpCompleted]);

  const onSubmit = async (data: { options: any; amounts: any; newAmounts: any; }) => {
    if (step === 3) {
      // Collect the selected option and amounts
      const selectedOption = data.options; // This will be a single value
      const newAmount = data.newAmounts; // Assuming this is a single value
  
      // Create an array of the combined data
      const combinedData = [{
        option: selectedOption,
        newAmount: newAmount,
      }];

      
      const factoryAbi = parseAbi([
        'function createMyStrategy(address destinationWallet, uint256 destinartionChain) external',
        `function getStrategy(address user) public view returns (address)`,
        `event StrategyDeployed(address owner, address strategyAddress)`
      ]);

      const sepoliaClient = getClient(sepolia);

      let address: Hex | undefined = '0x0000000000000000000000000000000000000000';
      try {
        address = await client?.readContract({
          address: "0x6353CCB47553067B99Ba57BEE120bf6aaFaa47f9",
          abi: factoryAbi,
          args: ["0x77a75E8854051E2854FE2806AdF794ddF97f2F92"],  // Arguments for the function call
          functionName: 'getStrategy',  // Function name to call
        });
      } catch (error) {
        console.error('Error reading contract:', error);
        // address = '0x0000000000000000000000000000000000000000' as Hex;
      }

      if (address === '0x0000000000000000000000000000000000000000') {

        const cd = encodeFunctionData({
          abi: factoryAbi,
          functionName: "createMyStrategy",
          args: ["0x0000000000000000000000000000000000000000", 1000000000000000000n],
        })

        sendUserOperation({
          uo: [
            {
              target: process.env.NEXT_PUBLIC_FACTORY_ADDRESS! as Hex,
              data: cd,
              value: 0n,
            },
        ],
        overrides: {
          // callGasLimit: 1000000n,
          maxPriorityFeePerGas: 50000000000n,
          maxFeePerGas: 2000000000000n,
        },
        });

      } else {
        localStorage.setItem("strategyAddress", address!);
        console.log("strategyAddress", address);
        router.push('/home');
      }
      // Store data in localStorage (or use state management)
      localStorage.setItem("submittedData", JSON.stringify(combinedData));
      localStorage.setItem("isStrategyCreated", "true");

      console.log('Final Submitted Data:', data);
      // router.push('/home'); // Redirect to the dashboard
    } else {
      setStep(step + 1); // Proceed to next step
    }
  };

  const prevStep = () => setStep(step - 1); // Go to the previous step

 // Function to handle Next button click with validation
const handleNext = (data) => {
  const values = getValues(); // Get current form values

  if (step === 1) {
    if (!values.walletAddress || !values.blockchain) {
      return; // Prevent moving to the next step if either field is empty
    }
  }
  
  if (step === 2) {
    if (values.options.length === 0) {
      return; // Prevent moving to next step if no options are selected
    }
  }

  if (step === 3) {
    // Validate amounts for selected options
    const selectedOptions = watch("options");
    for (const option of selectedOptions) {
      const amount = data.amounts[selectedOptions.indexOf(option)];
      if (!amount) {
        return; // Prevent moving to next step if any selected amount is empty
      }
    }
  }

  setStep(step + 1); // Move to next step if all validations pass
};


  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Step 1 */}
      {step === 1 && (
        <div className="step-container">
          <div>
            <h4>Step 1</h4> 
            <h1>Select wallet and chain</h1>
          </div>
        <div>
        <div>

          <div className="flex flex-col gap-2 mb-2">
                <h4>Your wallet address</h4>
                <Input className="bg-white/50 border-2 py-6 rounded-full px-4 secondary-button"
                  {...register("walletAddress", { required: "Wallet address is required" })}
                  placeholder="Enter your wallet address"
                />
                {/* <Button>Connect wallet</Button> */}
              </div>
              {errors.walletAddress && <p className="text-red-500">{errors.walletAddress.message}</p>}
            </div>

            <div className="flex flex-col gap-2 mb-2">
              <h4>Select blockchain</h4>
              <div className="relative">
                <select 
                  {...register("blockchain", { required: "Blockchain selection is required" })}
                  className="p-2 border border-gray-300 bg-white/50 border-2 py-4 rounded-full px-4 appearance-none w-full pr-10 secondary-button"
                >
                  <option value="">Select a blockchain</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="bitcoin">Bitcoin</option>
                  <option value="polygon">Polygon</option>
                </select>

                {/* Custom Arrow */}
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.blockchain && <p className="text-red-500">{errors.blockchain.message}</p>}
            </div>

        </div>
            
          <Button className="big-button" type="button" onClick={handleSubmit(handleNext)}>Next</Button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="step-container">
          <div>
            <h4>Step 2</h4>
            <h1>Choose favourite assets</h1>
          </div>
          <div className="grid grid-cols-4 gap-2 pixelfont">
            {['Bitcoin', 'Ethereum', 'Solana', 'Nouns'].map((option) => {
              // Define a mapping of option names to image URLs
              const images = {
                Bitcoin: '/assets/Bitcoin-Nouns.jpg', // Correct path
                Ethereum: '/assets/Ethereum-Nouns.jpg', // Correct path
                Solana: '/assets/Solana-Nouns.jpg', // Correct path
                Nouns: '/assets/Nouns-Nouns.jpg', // Correct path
              };

              return (
                <div 
                  key={option} 
                  className=" rounded-lg border-4 asset-card border-gray-300 flex flex-col items-center gap-4 pb-4"
                >
                  <img 
                    src={images[option]} 
                    alt={option} 
                    className="h-auto w-full mb-2 radius-1 rounded-t-lg" // Adjust size as needed
                  />
                  <input
                    type="checkbox"
                    {...register("options", { required: "At least one option must be selected" })}
                    value={option}
                    className="h-12 w-12"
                  />
                  <label className="text-l font-medium">{option}</label>
                </div>
              );
            })}
          </div> 
          {errors.options && <p className="text-red-500">{errors.options.message}</p>}
          <div className="flex gap-2">
            <Button className="big-button w-full" type="button" variant="secondary" onClick={prevStep}>Back</Button>
            <Button className="big-button w-full" type="button" onClick={handleSubmit(handleNext)}>Next</Button>
          </div> 
        </div>
      )}

      
      {/* Step 3 */}
      {step === 3 && (
        <div className="step-container">
          <div>
            <h4>Step 3</h4>
            <h1>Exit targets</h1>
          </div>
          <div>
            {watch("options").map((option, index) => (
              <div key={option} className="mb-4 flex justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    {...register("selectedOption", { required: "You must select one option" })}
                    value={option}
                    className="h-10 w-10"
                  />
                  <label className="ml-2 text-xl font-medium pixelfont mt-1">{option}</label>
                </div>
               

                {/* Show the exit target input field when this option is selected */}
                {watch("selectedOption") === option && (
                  <div className="mt-2">
                    {/* <label htmlFor={`newAmounts.${index}`}>{`Exit target for ${option}`}</label> */}
                    <div className="flex items-center ">
                      <Input
                        type="number"
                        className="pr-10 secondary-button py-6 rounded-full pl-6"
                        {...register(`newAmounts.${index}`, { required: `Exit target for ${option} is required` })}
                        placeholder={`Enter exit target`}
                      />
                      <span className="ml-2 pixelfont text-xl">$</span>
                    </div>
                    {errors.newAmounts && errors.newAmounts[index] && (
                      <p className="text-red-500">{errors.newAmounts[index].message}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {errors.selectedOption && <p className="text-red-500">{errors.selectedOption.message}</p>}
          <div className="flex gap-2">
            <Button className="big-button w-full" type="button" variant="secondary" onClick={prevStep}>Back</Button>
            <Button className="big-button w-full" type="submit">{isSendingUserOperation ? "Submitting..." : "Submit"}</Button>
          </div>
          
        </div>
      )}
    </form>
  );
};

export default MultiStepForm;
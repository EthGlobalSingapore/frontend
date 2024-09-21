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
      amounts: [],
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
    if (step === 4) {
      // Collect the selected options and amounts
      const selectedOptions = data.options;
      const amounts = data.amounts;
      const newAmounts = data.newAmounts;

      const combinedData = selectedOptions.map((option, index) => ({
        option,
        amount: amounts[index],
        newAmount: newAmounts[index],
      }));

      
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
  if (step === 1) {
    if (!data.field1) {
      return; // Prevent moving to next step if field1 is empty
    }
  }
  
  if (step === 2) {
    if (data.options.length === 0) {
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
            <h5>Step 1</h5>
            <h2>Link wallet to strategy</h2>
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              <Input
                {...register("field1", { required: "Field 1 is required" })}
                placeholder="Field 1"
              />
              <Button>Connect wallet</Button>
            </div>
            {errors.field1 && <p>{errors.field1.message}</p>}
          </div>          
          <Button type="button" onClick={handleSubmit(handleNext)}>Next</Button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="step-container">
          <h2>Step 2</h2>
          <div className="grid grid-cols-4 gap-2">
      {['Bitcoin', 'Ethereum', 'Solana', 'Nouns'].map(option => (
        <div 
          key={option} 
          className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center gap-4"
        >
          <input
            type="checkbox"
            {...register("options", { required: "At least one option must be selected" })}
            value={option}
            className="h-5 w-5"
          />
          <label className="text-lg font-medium">{option}</label>
        </div>
        ))}
        </div> 
          {errors.options && <p>{errors.options.message}</p>}
          <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
          <Button type="button" onClick={handleSubmit(handleNext)}>Next</Button>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="step-container">
          <h2>Step 3</h2>
          {watch("options").map((option, index) => (
            <div key={option}>
              <label htmlFor={`amounts.${index}`}>{`Amount for ${option}`}</label>
              <div className="flex items-center">
                <Input
                  type="number"
                  {...register(`amounts.${index}`, { required: `Amount for ${option} is required` })}
                  placeholder={`Enter amount for ${option}`}
                />
                <span className="percentage-symbol">%</span>  
              </div>
              {errors.amounts && errors.amounts[index] && <p>{errors.amounts[index].message}</p>}
            </div>
          ))}
          {errors.field3 && <p>{errors.field3.message}</p>}
          <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
          <Button type="button" onClick={handleSubmit(handleNext)}>Next</Button>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="step-container">
          <h2>Step 4</h2>
          {watch("options").map((option, index) => (
            <div key={option}>
              <label htmlFor={`newAmounts.${index}`}>{`Amount for ${option}`}</label>
              <div className="flex items-center">
                <Input
                  type="number"
                  {...register(`newAmounts.${index}`, { required: `Amount for ${option} is required` })}
                  placeholder={`Enter amount for ${option}`}
                />
                <span className="percentage-symbol">$</span>  
              </div>
              {errors.newAmounts && errors.newAmounts[index] && <p>{errors.newAmounts[index].message}</p>}
            </div>
          ))}
          {errors.field4 && <p>{errors.field4.message}</p>}
          <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
          <Button type="submit"> {isSendingUserOperation ? "Submitting..." : "Submit"}</Button>
        </div>
      )}
    </form>
  );
};

export default MultiStepForm;
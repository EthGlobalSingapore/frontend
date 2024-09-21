"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input"
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';


const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, formState: { errors }, watch, getValues } = useForm({
    defaultValues: {
      options: [],
      newAmounts: []
    }
  });

  const router = useRouter(); // Initialize the router
  

  const onSubmit = (data) => {
    if (step === 3) {
      // Collect the selected option and amounts
      const selectedOption = data.options; // This will be a single value
      const newAmount = data.newAmounts; // Assuming this is a single value
  
      // Create an array of the combined data
      const combinedData = [{
        option: selectedOption,
        newAmount: newAmount,
      }];

      // Store data in localStorage (or use state management)
      localStorage.setItem("submittedData", JSON.stringify(combinedData));
      localStorage.setItem("isStrategyCreated", "true");

      console.log('Final Submitted Data:', data);
      router.push('/home'); // Redirect to the dashboard
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
            <Button className="big-button w-full" type="submit">Submit</Button>
          </div>
          
        </div>
      )}
    </form>
  );
};

export default MultiStepForm;
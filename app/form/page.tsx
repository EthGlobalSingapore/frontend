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
      amounts: [],
      newAmounts: []
    }
  });

  const router = useRouter(); // Initialize the router
  

  const onSubmit = (data) => {
    if (step === 3) {
      // Collect the selected option and amounts
      const selectedOption = data.options; // This will be a single value
      const amount = data.amounts; // This collects the array of amounts
      const newAmount = data.newAmounts; // Assuming this is a single value
  
      // Create an array of the combined data
      const combinedData = [{
        option: selectedOption,
        amount: data.amounts,
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
          <div>
            <h5>Step 2</h5>
            <h2>Assets</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
      {['Bitcoin', 'Ethereum', 'Solana', 'Nouns'].map((option, index) => (
        <div 
          key={option} 
          className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center gap-4"
        >
          <input
            type="radio"
            {...register("options", { required: "At least one option must be selected" })}
            value={option}
            className="h-5 w-5"
          />
          <label className="text-lg font-medium">{option}</label>

          {/* Show percentage input when the option is selected */}
          {watch("options") === option && (
            <div className="mt-2 w-full">
              <div className="flex items-center mt-1">
                <Input
                  type="number"
                  className="w-full"
                  {...register(`amounts.${index}`, { required: `Allocation for ${option} is required` })}
                />
                <span className="ml-2">%</span>
              </div>
              {errors.amounts && errors.amounts[index] && (
                <p className="text-red-500">{errors.amounts[index].message}</p>
              )}
            </div>
          )}

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
        <div>
          <h5>Step 3</h5>
          <h2>Exit targets</h2>
        </div>
        <div>
          <label htmlFor={`newAmounts`}>{`Amount for ${watch("options")}`}</label>
          <div className="flex items-center">
            <Input
              type="number"
              className="pr-10"
              {...register(`newAmounts`, { required: `Amount for ${watch("options")} is required` })}
              placeholder={`Enter amount for ${watch("options")}`}
            />
            <span className="percentage-symbol">$</span>
          </div>
          {errors.newAmounts && <p className="text-red-500">{errors.newAmounts.message}</p>}
        </div>
        <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
        <Button type="submit">Submit</Button>
      </div>
    )}
    </form>
  );
};

export default MultiStepForm;
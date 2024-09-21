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
          <Button type="submit">Submit</Button>
        </div>
      )}
    </form>
  );
};

export default MultiStepForm;
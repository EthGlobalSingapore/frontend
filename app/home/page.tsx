"use client";

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Home = () => {
  const [isStrategyCreated, setIsStrategyCreated] = useState(false);

  useEffect(() => {
    // Check if the strategy is already created (stored in localStorage)
    const strategyStatus = localStorage.getItem("isStrategyCreated");
    if (strategyStatus) {
      setIsStrategyCreated(true);
    }
  }, []);

  const handleReset = () => {
    localStorage.removeItem("isStrategyCreated");
    localStorage.removeItem("submittedData");
    setIsStrategyCreated(false); // Reset the local state
  };

  return (
    <div>
      {isStrategyCreated ? (
        // Show dashboard content if the strategy has been created
        <Dashboard onReset={handleReset} />
      ) : (
        // Show "Create Strategy" button if no strategy is created yet
        <div className="flex justify-center">
          <Link href="/form">
            <Button>Create Strategy</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

// Reuse your existing dashboard component here
const Dashboard = ({ onReset }) => {
  const [submittedData, setSubmittedData] = useState([]);

  useEffect(() => {
    // Get the submitted data from localStorage
    const data = localStorage.getItem("submittedData");
    if (data) {
      setSubmittedData(JSON.parse(data));
    }
  }, []);

  return (
    <div className='max-w-5xl mx-auto w-full'>
      <div className='flex justify-between'>
        <h1>Your portfolio</h1>
        <div className='flex'>
            <div className='flex gap-2'>
              <Link href="/form">
              <Button>Edit Strategy</Button>
              </Link>
              <Button onClick={onReset}>Reset Strategy</Button>
            </div>
        </div>
              </div>

      {submittedData.length > 0 ? (
        <table className="min-w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">Currency</th>
              <th className="border border-gray-300 p-2">Allocation</th>
              <th className="border border-gray-300 p-2">Exit target</th>
            </tr>
          </thead>
          <tbody>
            {submittedData.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{item.option}</td>
                <td className="border border-gray-300 p-2">{item.amount} %</td>
                <td className="border border-gray-300 p-2">{item.newAmount} $</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default Home;

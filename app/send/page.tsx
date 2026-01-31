"use client";

import { useState } from "react";
import EmergencyTransferModal from "./components/EmergencyTransferModal";
import Link from 'next/link'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'
import SendHeader from './components/SendHeader'
import RecipientAddressInput from './components/RecipientAddressInput'
import AmountCurrencySection from './components/AmountCurrencySection'
import AutomaticSplitCard from "./components/AutomaticSplitCard";

export default function SendMoney() {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [previewCurrency, setPreviewCurrency] = useState<string | null>(null);

  const handlePreview = () => {
    // Handle preview transaction
    console.log("Preview transaction clicked");
  };

  const handleSend = (amount: number, currency: string) => {
    setPreviewAmount(amount);
    setPreviewCurrency(currency);
    // Handle send remittance
    console.log(`Send ${amount} ${currency}`);
  };

  return (
    <div className="min-h-screen bg-black overflow-x-">
      {/* Header */}
      <SendHeader />
    
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecipientAddressInput />
        <AmountCurrencySection />
        <AutomaticSplitCard />
      </main>
    </div>
  )
}
        {/* <div className="bg-white rounded-xl shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Send Money to Family
            </h2>
            <p className="text-gray-600">
              Send remittance via Stellar network. Funds will be automatically
              split according to your configuration.
            </p>
          </div> */}

          {/* Form Placeholder */}
          {/* <form className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-white">Send Remittance</h1>
              <p className="text-sm text-gray-400">Transfer money via Stellar network</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition">
            <AlertCircle className="w-5 h-5" />
            <span>Address Book</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}


          
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSaplingMetrics } from '@/lib/metrics';
import { useLanguage } from '@/context/LanguageContext';

export default function BookingFlowPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { isTamil } = useLanguage();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Default expected delivery date: 7 days from today
  const defaultDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Form State
  const [quantity, setQuantity] = useState<number>(10);
  const [isPreOrder, setIsPreOrder] = useState<boolean>(false);
  const [courierOption, setCourierOption] = useState<'MSS Parcel Service' | 'Self Pickup (Farm Direct - Eathamozhi)' | 'Other'>('MSS Parcel Service');
  const [customCourier, setCustomCourier] = useState<string>('');
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    whatsapp: '',
    address: '',
    district: 'Kanyakumari',
    state: 'Tamil Nadu',
    pinCode: '',
    email: '',
    farmLocation: '',
    specialInstructions: '',
    expectedDeliveryDate: defaultDeliveryDate,
    deliveryService: 'MSS Parcel Service',
    nearestHub: '',
    agreeTerms: true
  });

  // Payment Screenshot State
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState<boolean>(false);

  useEffect(() => {
    fetch(`/api/batches/${code}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.error || data.isVisible === false) {
          router.replace('/batches');
          return;
        }
        setBatch(data);
        setLoading(false);
      });
  }, [code]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!batch || batch.error) {
    return (
      <div className="container py-5 text-center">
        <h3>Batch Not Found</h3>
        <Link href="/batches" className="btn btn-success mt-3">Back to Batches</Link>
      </div>
    );
  }

  const price = batch.price;
  const subtotal = price * quantity;
  const isSelfPickup = courierOption === 'Self Pickup (Farm Direct - Eathamozhi)';
  const deliveryCharge = isSelfPickup ? 0 : (quantity >= 50 ? 0 : 250);
  const totalAmount = subtotal + deliveryCharge;

  // Pre-order calculations: half (50%) of total amount
  const advanceAmount = isPreOrder ? Math.round(totalAmount / 2) : totalAmount;
  const balanceAmount = isPreOrder ? (totalAmount - advanceAmount) : 0;
  const amountToPayNow = advanceAmount;

  // UPI Details requested by user (configurable via .env / .env.local)
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'rajeenth1@ybl';
  const displayName = process.env.NEXT_PUBLIC_UPI_DISPLAY_NAME || 'eathamozhi coconut farm';
  const billNotePrefix = process.env.NEXT_PUBLIC_UPI_BILL_NOTE_PREFIX || 'Coconut order';
  const billNote = isPreOrder 
    ? `Coconut Pre-order (50% Advance) - ${quantity} saplings`
    : `${billNotePrefix} - ${quantity} saplings`;
  
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(displayName)}&am=${amountToPayNow}&tn=${encodeURIComponent(billNote)}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      setUploadingScreenshot(true);

      // Local preview immediately for responsive UI
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      try {
        const form = new FormData();
        form.append('file', file);
        form.append('files', file);
        form.append('category', 'receipts');
        form.append('type', 'receipt');
        if (batch?.batchCode) {
          form.append('tag', batch.batchCode);
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: form,
        });

        const data = await res.json();
        if (res.ok && (data.url || (data.urls && data.urls[0]))) {
          const cloudUrl = data.url || data.urls[0];
          setScreenshotUrl(cloudUrl);
        } else {
          alert(data.error || 'Failed to upload screenshot to cloud storage. Please try again.');
          setPreviewUrl('');
          setScreenshotUrl('');
        }
      } catch (err) {
        alert('Network error while uploading payment screenshot. Please try again.');
        setPreviewUrl('');
        setScreenshotUrl('');
      } finally {
        setUploadingScreenshot(false);
      }
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const finalCourier = courierOption === 'Self Pickup (Farm Direct - Eathamozhi)'
      ? 'Self Pickup (Farm Direct - Eathamozhi)'
      : (courierOption === 'Other' ? (customCourier.trim() || 'Other') : 'MSS Parcel Service');
    const finalHub = isSelfPickup ? 'Farm Direct (Eathamozhi Grove)' : (formData.nearestHub.trim() || 'Main Hub');
    const finalLocation = isSelfPickup 
      ? 'Farm Direct Pickup (Eathamozhi Farm Grove, Kanyakumari)' 
      : `${formData.district}, ${formData.state} - ${formData.pinCode}`;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchCode: batch.batchCode,
          quantity,
          subtotal,
          deliveryCharge,
          totalAmount,
          orderType: isPreOrder ? 'PRE_ORDER' : 'COMPLETE',
          isPreOrder,
          paidAmount: amountToPayNow,
          advancePaid: isPreOrder ? amountToPayNow : undefined,
          balanceAmount,
          bookingStatus: isPreOrder ? 'Pre-order' : 'Payment review',
          paymentScreenshotUrl: screenshotUrl,
          ...formData,
          mobile: formData.mobile,
          whatsapp: formData.mobile,
          address: finalLocation,
          deliveryService: finalCourier,
          nearestHub: finalHub
        })
      });

      const data = await res.json();
      if (res.ok) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eathamozhi-coconut-farm.vercel.app';
        const trackingLink = `${siteUrl}/tracking?bookingId=${encodeURIComponent(data.bookingId)}&mobile=${encodeURIComponent(formData.mobile)}`;

        // Compose Pre-filled WhatsApp Message with Order Type, Balance Amount and Live Tracking Link
        const whatsappMsg = 
`🌴 *NEW SAPLING ORDER - EATHAMOZHI COCONUT FARM*

*Booking ID:* ${data.bookingId}
*Customer Name:* ${formData.customerName}
*Phone / WhatsApp:* ${formData.mobile}
*Sapling Count:* ${quantity} Saplings
*Batch Code:* ${batch.batchCode}
*Order Type:* ${isPreOrder ? 'Pre-Order (50% Advance Booking)' : 'Complete Order (100% Payment)'}
*Total Order Value:* ₹${totalAmount.toLocaleString()}
*Amount Paid Now (50% Advance):* ₹${amountToPayNow.toLocaleString()}
${isPreOrder ? `*⚠️ Balance Amount Due (at dispatch):* ₹${balanceAmount.toLocaleString()}\n` : ''}*Expected Delivery Date:* ${formData.expectedDeliveryDate}
*Preferred Courier / Delivery:* ${finalCourier}
*Nearest Delivery Hub:* ${finalHub}
*UPI ID Paid to:* ${upiId} (${displayName})
*Bill Note:* ${billNote}

*Delivery Location:*
${finalLocation}

🔍 *Track Order Status Online:*
${trackingLink}

Please confirm our order and dispatch details. Thank you!`;

        const encodedWa = encodeURIComponent(whatsappMsg);
        const farmWhatsApp = process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641';
        const waUrl = `https://wa.me/${farmWhatsApp}?text=${encodedWa}`;

        // Trigger WhatsApp directly in new window / app
        try {
          window.open(waUrl, '_blank');
        } catch (e) {
          window.location.href = waUrl;
        }

        // Navigate to confirmation screen
        const queryParams = new URLSearchParams({
          name: formData.customerName,
          qty: quantity.toString(),
          batch: batch.batchCode,
          amount: totalAmount.toString(),
          paid: amountToPayNow.toString(),
          bal: balanceAmount.toString(),
          isPreOrder: isPreOrder ? 'true' : 'false',
          mobile: formData.mobile,
          date: formData.expectedDeliveryDate,
          courier: finalCourier,
          hub: finalHub,
          addr: finalLocation
        });

        router.push(`/confirmation/${data.bookingId}?${queryParams.toString()}`);
      } else {
        alert(data.error || 'Failed to place booking');
        setSubmitting(false);
      }
    } catch (err) {
      alert('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="bg-dark text-white py-4">
        <div className="container">
          <span className="badge bg-success mb-1">
            {isTamil ? 'எளிய 3-படி முன்பதிவு' : 'EASY 3-STEP BOOKING'}
          </span>
          <h2 className="fw-bold mb-1 text-light">
            {isTamil ? 'தென்னங்கன்றுகள் முன்பதிவு' : 'Booking'} {batch.name || `Batch ${batch.batchCode}`}
          </h2>
          <div className="text-white-50 extra-small d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-light text-dark font-monospace fw-bold px-2 py-1 shadow-sm border border-white">
              Batch ID: {batch.batchCode}
            </span>
            <span>{isTamil ? 'வயது' : 'Age'}: <strong className="text-light">{batch.age || getSaplingMetrics(batch.seededDate).age}</strong></span>
            &bull;
            <span>{isTamil ? 'உயரம்' : 'Height'}: <strong className="text-light">{batch.height || getSaplingMetrics(batch.seededDate).height}</strong></span>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container" style={{ maxWidth: '850px' }}>
          
          {/* Step Indicator Pills */}
          <div className="row text-center mb-4 g-2">
            <div className="col-4">
              <div className={`p-2 rounded-3 fw-bold small ${step >= 1 ? 'bg-success text-white' : 'bg-secondary-subtle text-muted'}`}>
                {isTamil ? '1. கன்றுகள் & முன்பணம்' : '1. Quantity & Payment Type'}
              </div>
            </div>
            <div className="col-4">
              <div className={`p-2 rounded-3 fw-bold small ${step >= 2 ? 'bg-success text-white' : 'bg-secondary-subtle text-muted'}`}>
                {isTamil ? '2. முகவரி விவரங்கள்' : '2. Customer Details'}
              </div>
            </div>
            <div className="col-4">
              <div className={`p-2 rounded-3 fw-bold small ${step >= 3 ? 'bg-success text-white' : 'bg-secondary-subtle text-muted'}`}>
                {isTamil ? '3. UPI கட்டணம்' : '3. Scan UPI QR & Pay'}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-lg rounded-4 p-4 bg-white">
            
            {/* STEP 1: QUANTITY SELECTOR & ORDER TYPE TOGGLE */}
            {step === 1 && (
              <div>
                <h4 className="fw-bold text-dark mb-3">Step 1: Select Quantity &amp; Payment Mode</h4>

                <div className="bg-light p-4 rounded-4 mb-4 text-center border shadow-sm">
                  <label className="form-label small fw-bold text-dark d-block mb-2">
                    Enter Exact Quantity or Use Buttons Below:
                  </label>
                  
                  {/* Direct Number Input + Step Buttons */}
                  <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 mb-3">
                    <button 
                      type="button"
                      className="btn btn-outline-secondary fw-bold"
                      onClick={() => setQuantity(Math.max(1, quantity - 50))}
                      title="Decrease by 50"
                    >
                      -50
                    </button>
                    <button 
                      type="button"
                      className="btn btn-outline-secondary fw-bold"
                      onClick={() => setQuantity(Math.max(1, quantity - 10))}
                      title="Decrease by 10"
                    >
                      -10
                    </button>
                    <button 
                      type="button"
                      className="btn btn-outline-secondary fw-bold px-3"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -1
                    </button>
                    
                    {/* Direct Editable Input */}
                    <div className="mx-1" style={{ maxWidth: '160px' }}>
                      <input 
                        type="number" 
                        min="1" 
                        max={batch.availableQuantity}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setQuantity(Math.min(batch.availableQuantity, Math.max(1, val)));
                        }}
                        className="form-control form-control-lg text-center fw-bold fs-2 text-success border-2 border-success shadow-sm"
                      />
                    </div>

                    <button 
                      type="button"
                      className="btn btn-outline-secondary fw-bold px-3"
                      onClick={() => setQuantity(Math.min(batch.availableQuantity, quantity + 1))}
                    >
                      +1
                    </button>
                    <button 
                      type="button"
                      className="btn btn-outline-secondary fw-bold"
                      onClick={() => setQuantity(Math.min(batch.availableQuantity, quantity + 10))}
                      title="Increase by 10"
                    >
                      +10
                    </button>
                    <button 
                      type="button"
                      className="btn btn-outline-secondary fw-bold"
                      onClick={() => setQuantity(Math.min(batch.availableQuantity, quantity + 50))}
                      title="Increase by 50"
                    >
                      +50
                    </button>
                  </div>

                  {/* Range Slider for Instant Sliding */}
                  <div className="px-3 mb-3" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <input 
                      type="range" 
                      className="form-range" 
                      min="1" 
                      max={batch.availableQuantity} 
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                    <div className="d-flex justify-content-between text-muted extra-small">
                      <span>1 Sapling</span>
                      <span>Max Stock: {batch.availableQuantity}</span>
                    </div>
                  </div>

                  <p className="text-muted small mb-2 fw-bold">Quick Selection Presets:</p>
                  <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
                    {[10, 25, 50, 100, 150, 200, 250, 500].map(q => {
                      if (q > batch.availableQuantity) return null;
                      return (
                        <button 
                          key={q} 
                          type="button"
                          className={`btn btn-sm ${quantity === q ? 'btn-success fw-bold px-3 shadow-sm' : 'btn-outline-success'}`}
                          onClick={() => setQuantity(q)}
                        >
                          {q} Saplings
                        </button>
                      );
                    })}
                    <button 
                      type="button"
                      className={`btn btn-sm ${quantity === batch.availableQuantity ? 'btn-success fw-bold shadow-sm' : 'btn-outline-dark'}`}
                      onClick={() => setQuantity(batch.availableQuantity)}
                    >
                      All Available ({batch.availableQuantity})
                    </button>
                  </div>

                  {quantity >= 100 && (
                    <div className="alert alert-warning mb-0 small rounded-3">
                      <i className="bi bi-truck me-1 text-dark"></i> <strong>Bulk Farm Order ({quantity} Saplings):</strong> Qualifies for dedicated direct farm transport truck.
                    </div>
                  )}
                </div>

                {/* TOGGLE BUTTON: Complete Order vs Pre-Order */}
                <div className="bg-light p-3 rounded-4 mb-4 border shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="fw-bold text-dark small mb-0">
                      <i className="bi bi-sliders me-1 text-success"></i> Choose Order Payment Mode:
                    </label>
                    {isPreOrder ? (
                      <span className="badge bg-warning text-dark fw-bold px-2 py-1">
                        <i className="bi bi-clock-history me-1"></i> Pre-Order (Pay 50% Advance)
                      </span>
                    ) : (
                      <span className="badge bg-success fw-bold px-2 py-1">
                        <i className="bi bi-check-circle-fill me-1"></i> Complete Order (100% Full Payment)
                      </span>
                    )}
                  </div>

                  <div className="row g-2">
                    {/* Complete Order Option Card */}
                    <div className="col-6">
                      <div 
                        className={`card h-100 p-3 rounded-3 text-center cursor-pointer ${!isPreOrder ? 'border-2 border-success bg-white shadow-sm' : 'border bg-light text-muted opacity-75'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setIsPreOrder(false)}
                      >
                        <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                          <input 
                            type="radio" 
                            name="orderType" 
                            checked={!isPreOrder} 
                            onChange={() => setIsPreOrder(false)} 
                            className="form-check-input"
                          />
                          <strong className="text-dark">Complete Order</strong>
                        </div>
                        <small className="text-muted d-block extra-small">Pay full total amount now</small>
                        <div className="mt-2 text-success fw-bold fs-5">
                          ₹{totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Pre-Order Option Card */}
                    <div className="col-6">
                      <div 
                        className={`card h-100 p-3 rounded-3 text-center cursor-pointer ${isPreOrder ? 'border-2 border-warning bg-warning bg-opacity-10 shadow-sm' : 'border bg-light text-muted opacity-75'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setIsPreOrder(true)}
                      >
                        <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                          <input 
                            type="radio" 
                            name="orderType" 
                            checked={isPreOrder} 
                            onChange={() => setIsPreOrder(true)} 
                            className="form-check-input"
                          />
                          <strong className="text-dark">Pre-Order (50% Advance)</strong>
                        </div>
                        <small className="text-muted d-block extra-small">Pay only half today to reserve saplings</small>
                        <div className="mt-2 text-warning-emphasis fw-bold fs-5">
                          ₹{Math.round(totalAmount / 2).toLocaleString()} <span className="extra-small text-muted fw-normal">today</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isPreOrder && (
                    <div className="alert alert-warning mb-0 mt-3 py-2 px-3 small rounded-3 d-flex align-items-start gap-2">
                      <i className="bi bi-info-circle-fill text-warning fs-5 mt-1"></i>
                      <div>
                        <strong>Pre-Order Activated:</strong> Pay only <strong>₹{advanceAmount.toLocaleString()}</strong> (50% advance) now to lock in your ancestral saplings batch. The remaining balance of <strong>₹{balanceAmount.toLocaleString()}</strong> will be due before dispatch.
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtotal & Delivery Summary */}
                <div className="bg-light p-3 rounded-3 mb-4 border">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Price per Sapling:</span>
                    <strong>₹{price}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Subtotal ({quantity} saplings):</span>
                    <strong className="text-success fs-5">₹{subtotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span>Delivery Charge:</span>
                    {isSelfPickup ? (
                      <span className="text-success fw-bold">FREE (Self Pickup from Farm)</span>
                    ) : deliveryCharge === 0 ? (
                      <span className="text-success fw-bold">FREE (50+ Saplings Offer)</span>
                    ) : (
                      <span>₹{deliveryCharge}</span>
                    )}
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold text-dark">Total Order Value:</span>
                    <strong className="text-dark fs-5">₹{totalAmount.toLocaleString()}</strong>
                  </div>

                  {isPreOrder && (
                    <>
                      <div className="d-flex justify-content-between align-items-center text-success fw-bold">
                        <span><i className="bi bi-check2-circle me-1"></i> 50% Advance Due Today:</span>
                        <span className="fs-5">₹{advanceAmount.toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center text-danger extra-small fw-semibold mt-1">
                        <span>Remaining Balance (Due at dispatch):</span>
                        <span>₹{balanceAmount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>

                <button 
                  className="btn btn-success btn-lg w-100 fw-bold shadow py-3"
                  onClick={() => setStep(2)}
                >
                  Continue to Customer Details <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
            )}

            {/* STEP 2: CUSTOMER DETAILS */}
            {step === 2 && (
              <div>
                <h4 className="fw-bold text-dark mb-3">Step 2: Enter Delivery &amp; Contact Details</h4>

                <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Full Name *</label>
                      <input 
                        type="text" 
                        name="customerName" 
                        className="form-control" 
                        required 
                        placeholder="Name"
                        value={formData.customerName}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Phone / WhatsApp Number *</label>
                      <input 
                        type="tel" 
                        name="mobile" 
                        className="form-control" 
                        required 
                        placeholder="10-digit mobile number"
                        value={formData.mobile}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            mobile: val,
                            whatsapp: val
                          }));
                        }}
                      />
                      <small className="text-muted extra-small">Used for order confirmation &amp; dispatch updates.</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Expected Delivery / Pickup Date *</label>
                      <input 
                        type="date" 
                        name="expectedDeliveryDate" 
                        className="form-control fw-bold border-success" 
                        required 
                        value={formData.expectedDeliveryDate}
                        onChange={handleInputChange}
                      />
                      <small className="text-muted extra-small">Select your preferred farm delivery or collection date.</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">PIN Code *</label>
                      <input 
                        type="text" 
                        name="pinCode" 
                        className="form-control" 
                        required 
                        placeholder="6-digit PIN"
                        value={formData.pinCode}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">District *</label>
                      <input 
                        type="text" 
                        name="district" 
                        className="form-control" 
                        required 
                        value={formData.district}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">State *</label>
                      <input 
                        type="text" 
                        name="state" 
                        className="form-control" 
                        required 
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Preferred Courier / Parcel Service with Self Pickup */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Preferred Courier / Delivery Service *</label>
                      <select 
                        name="courierOption" 
                        className="form-select fw-semibold"
                        required
                        value={courierOption}
                        onChange={(e) => {
                          const selected = e.target.value as any;
                          setCourierOption(selected);
                          if (selected === 'Self Pickup (Farm Direct - Eathamozhi)') {
                            setFormData(prev => ({
                              ...prev,
                              deliveryService: selected,
                              nearestHub: 'Eathamozhi Farm Grove, Kanyakumari'
                            }));
                          } else if (selected === 'Other') {
                            setFormData(prev => ({
                              ...prev,
                              deliveryService: customCourier.trim() || 'Other'
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              deliveryService: 'MSS Parcel Service'
                            }));
                          }
                        }}
                      >
                        <option value="MSS Parcel Service">MSS Parcel Service (Standard Freight)</option>
                        <option value="Self Pickup (Farm Direct - Eathamozhi)">Self Pickup (Farm Direct - Exclude Delivery Charges / Free)</option>
                        <option value="Other">Other Parcel / Courier Service</option>
                      </select>
                      <small className="text-muted extra-small">
                        {isSelfPickup 
                          ? '🎉 Self Pickup Selected: Delivery charge is ₹0 (Free)!' 
                          : 'Select MSS Parcel Service, Self Pickup, or specify Other.'}
                      </small>

                      {courierOption === 'Other' && (
                        <div className="mt-2">
                          <input 
                            type="text" 
                            className="form-control" 
                            required 
                            placeholder="Enter courier / delivery service name"
                            value={customCourier}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomCourier(val);
                              setFormData(prev => ({
                                ...prev,
                                deliveryService: val.trim() || 'Other'
                              }));
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Nearest Delivery Hub / Town Hub *</label>
                      <input 
                        type="text" 
                        name="nearestHub" 
                        className="form-control" 
                        required
                        value={isSelfPickup ? 'Eathamozhi Farm Grove, Kanyakumari' : formData.nearestHub}
                        onChange={handleInputChange}
                        disabled={isSelfPickup}
                      />
                      <small className="text-muted extra-small">
                        {isSelfPickup 
                          ? 'Pickup location: Eathamozhi Farm Grove, Kanyakumari.' 
                          : 'Hub location closest to your farm for parcel collection/dispatch.'}
                      </small>
                    </div>
                  </div>

                  <div className="d-flex gap-2 pt-3">
                    <button type="button" className="btn btn-outline-secondary w-50" onClick={() => setStep(1)}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-success w-50 fw-bold">
                      Proceed to UPI Payment <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: SCAN UPI QR & UPLOAD SCREENSHOT */}
            {step === 3 && (
              <div>
                <h4 className="fw-bold text-dark mb-1">Step 3: Scan UPI QR &amp; Pay</h4>
                <p className="text-muted small mb-4">
                  {isPreOrder 
                    ? 'Pay 50% advance now via GPay, PhonePe, Paytm, or BHIM UPI to confirm your pre-order.'
                    : 'Pay directly via GPay, PhonePe, Paytm, or BHIM UPI.'}
                </p>

                <div className="row g-4 mb-4">
                  {/* Left Column: QR Code */}
                  <div className="col-md-5 text-center border-end">
                    <div className="bg-white p-3 d-inline-block rounded-4 shadow-sm border mb-2">
                      <img 
                        src={qrCodeUrl} 
                        alt="UPI Payment QR Code" 
                        className="img-fluid rounded" 
                        style={{ width: '220px', height: '220px' }}
                      />
                    </div>
                    <small className="d-block fw-bold text-dark">Scan with any UPI App</small>
                    <span className="badge bg-success-subtle text-success border border-success mt-1">
                      <i className="bi bi-shield-check me-1"></i> Verified UPI Merchant
                    </span>
                  </div>

                  {/* Right Column: Bill Details */}
                  <div className="col-md-7">
                    <div className="bg-light p-3 rounded-4 mb-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted text-uppercase fw-bold">PAYMENT DETAILS</small>
                        {isPreOrder ? (
                          <span className="badge bg-warning text-dark fw-bold">Pre-Order (50% Advance)</span>
                        ) : (
                          <span className="badge bg-success fw-bold">Complete Order (100%)</span>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center my-2">
                        <span className="text-muted">Display Name:</span>
                        <strong className="text-dark">{displayName}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center my-2">
                        <span className="text-muted">UPI VPA ID:</span>
                        <strong className="text-success fs-6 font-monospace">{upiId}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center my-2">
                        <span className="text-muted">Expected Delivery:</span>
                        <strong className="text-dark">{formData.expectedDeliveryDate}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center my-2">
                        <span className="text-muted">Preferred Delivery:</span>
                        <strong className="text-dark">{courierOption}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center my-2">
                        <span className="text-muted">Bill Note:</span>
                        <span className="badge bg-dark">{billNote}</span>
                      </div>
                      
                      {isPreOrder && (
                        <div className="p-2 my-2 bg-white rounded-3 border small">
                          <div className="d-flex justify-content-between text-muted mb-1">
                            <span>Total Order Value:</span>
                            <strong>₹{totalAmount.toLocaleString()}</strong>
                          </div>
                          <div className="d-flex justify-content-between text-success fw-bold mb-1">
                            <span>50% Advance Payable Now:</span>
                            <span>₹{advanceAmount.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between text-danger fw-semibold">
                            <span>Remaining Balance at Dispatch:</span>
                            <span>₹{balanceAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark">{isPreOrder ? 'ADVANCE AMOUNT TO PAY:' : 'AMOUNT TO PAY:'}</span>
                        <span className="fw-bold fs-3 text-success">₹{amountToPayNow.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* PAYMENT SCREENSHOT UPLOAD BOX */}
                    <div className="card border-success border-2 bg-success-subtle p-3 rounded-4">
                      <label className="form-label small fw-bold text-dark mb-1">
                        <i className="bi bi-camera-fill me-1 text-success"></i> Upload Payment Screenshot *
                      </label>
                      <input 
                        type="file" 
                        className="form-control form-control-sm mb-2" 
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleScreenshotUpload}
                      />
                      {uploadingScreenshot && (
                        <div className="d-flex align-items-center gap-2 text-primary small py-1">
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Uploading receipt to Cloudinary cloud storage...</span>
                        </div>
                      )}
                      
                      {screenshotUrl && !uploadingScreenshot && (
                        <div className="mt-2">
                          <div className="d-flex align-items-center gap-2 bg-white p-2 rounded-3 border border-success">
                            <img 
                              src={previewUrl || screenshotUrl} 
                              alt="Receipt preview" 
                              className="rounded object-fit-cover" 
                              style={{ width: '48px', height: '48px' }} 
                            />
                            <div>
                              <span className="badge bg-success mb-1">
                                <i className="bi bi-check-circle-fill me-1"></i> Screenshot Attached
                              </span>
                              <small className="text-success d-block extra-small fw-semibold">
                                Payment receipt uploaded successfully
                              </small>
                            </div>
                          </div>

                          {/* Cloudinary Storage and Farm Admin Approval Notice */}
                          <div className="alert alert-success border-success mt-2 mb-0 py-2 px-3 rounded-3 small">
                            <div className="d-flex align-items-start gap-2">
                              <i className="bi bi-cloud-check-fill text-success fs-5 mt-1"></i>
                              <div>
                                <strong className="d-block text-success">Uploaded receipts are saved directly to Cloudinary storage for admin approval.</strong>
                                <span className="text-secondary extra-small">The receipts will be reviewed and approved by farm admin.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!screenshotUrl && !uploadingScreenshot && (
                        <small className="text-secondary extra-small d-block mt-2">
                          <i className="bi bi-shield-check me-1 text-success"></i> <strong>Note:</strong> Uploaded receipts are saved directly to Cloudinary storage for admin approval. The receipts will be reviewed and approved by farm admin.
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary w-50" onClick={() => setStep(2)}>
                    Edit Details
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-success w-50 fw-bold shadow py-3" 
                    onClick={handleSubmitBooking}
                    disabled={submitting || uploadingScreenshot}
                  >
                    {submitting ? (
                      <span><span className="spinner-border spinner-border-sm me-2"></span>Confirming Order...</span>
                    ) : (
                      <span><i className="bi bi-whatsapp me-2"></i> Submit &amp; Trigger WhatsApp</span>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
}

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BookingFlowPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Default expected delivery date: 7 days from today
  const defaultDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Form State
  const [quantity, setQuantity] = useState<number>(10);
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
    deliveryService: 'ST Couriers',
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
  const deliveryCharge = quantity >= 50 ? 0 : 250;
  const totalAmount = subtotal + deliveryCharge;

  // UPI Details requested by user
  const upiId = 'rajeenth1@ybl';
  const displayName = 'eathamozhy coconut farm';
  const billNote = `Coconut order - ${quantity} saplings`;
  
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(displayName)}&am=${totalAmount}&tn=${encodeURIComponent(billNote)}&cu=INR`;
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
          paymentScreenshotUrl: screenshotUrl,
          ...formData
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Compose Pre-filled WhatsApp Message with Delivery Service & Nearest Hub
        const whatsappMsg = 
`🌴 *NEW SAPLING ORDER - EATHAMOZHY COCONUT FARM*

*Booking ID:* ${data.bookingId}
*Customer Name:* ${formData.customerName}
*Phone / WhatsApp:* ${formData.whatsapp}
*Sapling Count:* ${quantity} Saplings
*Batch Code:* ${batch.batchCode}
*Total Paid Amount:* ₹${totalAmount.toLocaleString()}
*Expected Delivery Date:* ${formData.expectedDeliveryDate}
*Preferred Courier / Delivery Service:* ${formData.deliveryService}
*Nearest Delivery Hub / Town Hub:* ${formData.nearestHub || 'District Main Hub'}
*UPI ID Paid to:* ${upiId} (${displayName})
*Bill Note:* ${billNote}

*Delivery Address:*
${formData.address}, ${formData.district}, ${formData.state} - ${formData.pinCode}

Please confirm our order and dispatch details. Thank you!`;

        const encodedWa = encodeURIComponent(whatsappMsg);
        const waUrl = `https://wa.me/919486880641?text=${encodedWa}`;

        // Trigger WhatsApp directly in new window / app
        try {
          window.open(waUrl, '_blank');
        } catch (e) {
          window.location.href = waUrl;
        }

        // Navigate to confirmation screen with fallback order parameters so page never returns 404
        const queryParams = new URLSearchParams({
          name: formData.customerName,
          qty: quantity.toString(),
          batch: batch.batchCode,
          amount: totalAmount.toString(),
          mobile: formData.whatsapp,
          date: formData.expectedDeliveryDate,
          courier: formData.deliveryService,
          hub: formData.nearestHub || 'District Main Hub',
          addr: `${formData.address}, ${formData.district}, ${formData.state} - ${formData.pinCode}`
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
          <span className="badge bg-success mb-1">EASY 3-STEP BOOKING</span>
          <h2 className="fw-bold mb-0 text-light">Booking Batch {batch.batchCode}</h2>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container" style={{ maxWidth: '850px' }}>
          
          {/* Step Indicator Pills */}
          <div className="row text-center mb-4 g-2">
            <div className="col-4">
              <div className={`p-2 rounded-3 fw-bold small ${step >= 1 ? 'bg-success text-white' : 'bg-secondary-subtle text-muted'}`}>
                1. Quantity
              </div>
            </div>
            <div className="col-4">
              <div className={`p-2 rounded-3 fw-bold small ${step >= 2 ? 'bg-success text-white' : 'bg-secondary-subtle text-muted'}`}>
                2. Customer Details
              </div>
            </div>
            <div className="col-4">
              <div className={`p-2 rounded-3 fw-bold small ${step >= 3 ? 'bg-success text-white' : 'bg-secondary-subtle text-muted'}`}>
                3. Scan UPI QR & Pay
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-lg rounded-4 p-4 bg-white">
            
            {/* STEP 1: QUANTITY SELECTOR */}
            {step === 1 && (
              <div>
                <h4 className="fw-bold text-dark mb-3">Step 1: How many saplings would you like?</h4>

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

                <div className="bg-light p-3 rounded-3 mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Price per Sapling:</span>
                    <strong>₹{price}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Subtotal ({quantity} saplings):</span>
                    <strong className="text-success fs-5">₹{subtotal.toLocaleString()}</strong>
                  </div>
                  <small className="text-muted d-block text-end">Delivery: {deliveryCharge === 0 ? <span className="text-success fw-bold">FREE (50+ Offer)</span> : `₹${deliveryCharge}`}</small>
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
                <h4 className="fw-bold text-dark mb-3">Step 2: Enter Delivery & Contact Details</h4>

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
                      <label className="form-label small fw-bold">Mobile Number *</label>
                      <input 
                        type="tel" 
                        name="mobile" 
                        className="form-control" 
                        required 
                        placeholder="10-digit mobile number"
                        value={formData.mobile}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">WhatsApp Number *</label>
                      <input 
                        type="tel" 
                        name="whatsapp" 
                        className="form-control" 
                        required 
                        placeholder="For booking & dispatch updates"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Expected Delivery Date *</label>
                      <input 
                        type="date" 
                        name="expectedDeliveryDate" 
                        className="form-control fw-bold border-success" 
                        required 
                        value={formData.expectedDeliveryDate}
                        onChange={handleInputChange}
                      />
                      <small className="text-muted extra-small">Select your preferred farm delivery date.</small>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold">Delivery Address *</label>
                      <textarea 
                        name="address" 
                        className="form-control" 
                        rows={2} 
                        required 
                        placeholder="House/Farm No., Street Name, Village/Town"
                        value={formData.address}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>

                    <div className="col-md-4">
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

                    <div className="col-md-4">
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

                    <div className="col-md-4">
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
                      <label className="form-label small fw-bold">Preferred Courier / Delivery Service *</label>
                      <select 
                        name="deliveryService" 
                        className="form-select"
                        required
                        value={formData.deliveryService}
                        onChange={handleInputChange}
                      >
                        <option value="ST Couriers">ST Couriers</option>
                        <option value="The Professional Couriers">The Professional Couriers</option>
                        <option value="India Post (Speed Post)">India Post (Speed Post)</option>
                        <option value="VRL Logistics / Parcel Service">VRL Logistics / Parcel Service</option>
                        <option value="Direct Farm Vehicle Transport">Direct Farm Vehicle Transport (Bulk)</option>
                        <option value="Self Pickup at Farm">Self Pickup at Eathamozhy Farm</option>
                      </select>
                      <small className="text-muted extra-small">Choose your preferred logistics partner.</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Nearest Delivery Hub / Town Hub *</label>
                      <input 
                        type="text" 
                        name="nearestHub" 
                        className="form-control" 
                        required
                        placeholder="e.g. Nagercoil Main Branch / Valliyur Hub"
                        value={formData.nearestHub}
                        onChange={handleInputChange}
                      />
                      <small className="text-muted extra-small">Hub location closest to your farm for parcel collection/dispatch.</small>
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
                <h4 className="fw-bold text-dark mb-1">Step 3: Scan UPI QR & Pay</h4>
                <p className="text-muted small mb-4">Pay directly via GPay, PhonePe, Paytm, or BHIM UPI.</p>

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
                      <small className="text-muted d-block text-uppercase fw-bold">PAYMENT DETAILS</small>
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
                        <span className="text-muted">Bill Note:</span>
                        <span className="badge bg-dark">{billNote}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark">AMOUNT TO PAY:</span>
                        <span className="fw-bold fs-3 text-success">₹{totalAmount.toLocaleString()}</span>
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
                          <span>Uploading receipt to secure cloud storage...</span>
                        </div>
                      )}
                      {screenshotUrl && !uploadingScreenshot && (
                        <div className="d-flex align-items-center gap-2 mt-2 bg-white p-2 rounded-3 border border-success">
                          <img 
                            src={previewUrl || screenshotUrl} 
                            alt="Receipt preview" 
                            className="rounded object-fit-cover" 
                            style={{ width: '48px', height: '48px' }} 
                          />
                          <div>
                            <span className="badge bg-success mb-1">
                              <i className="bi bi-cloud-check-fill me-1"></i> Uploaded to Cloud
                            </span>
                            <small className="text-secondary d-block extra-small text-truncate" style={{ maxWidth: '280px' }}>
                              {screenshotUrl}
                            </small>
                          </div>
                        </div>
                      )}
                      <small className="text-secondary extra-small d-block mt-2">
                        <i className="bi bi-shield-check me-1 text-success"></i> <strong>Note:</strong> Uploaded receipts are saved directly to secure Cloudinary storage for Farm Admin verification.
                      </small>
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
                      <span><i className="bi bi-whatsapp me-2"></i> Submit & Trigger WhatsApp</span>
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

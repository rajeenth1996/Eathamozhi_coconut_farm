'use client';

import { useState, useId } from 'react';

export interface BroadcastRecipient {
  id: string;
  name: string;
  phone: string;
  bookingId?: string;
  batchCode?: string;
  quantity?: number;
  totalAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  expectedDelivery?: string;
  courierName?: string;
  trackingLink?: string;
  location?: string;
  status?: string;
}

interface WhatsAppBroadcastModalProps {
  recipients: BroadcastRecipient[];
  onClose: () => void;
  siteUrl?: string;
  upiId?: string;
}

type RecipientStatus = 'pending' | 'sent' | 'skipped';

export default function WhatsAppBroadcastModal({
  recipients,
  onClose,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eathamozhi-coconut-farm.vercel.app',
  upiId = process.env.NEXT_PUBLIC_UPI_ID || 'rajeenth1@ybl',
}: WhatsAppBroadcastModalProps) {
  const [step, setStep] = useState<'template' | 'queue'>('template');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('harvest_readiness');
  const [customMessage, setCustomMessage] = useState<string>(
    `வணக்கம் / Hello {customerName},\n\n` +
    `Greetings from Eathamozhi Coconut Farm! 🌱\n\n` +
    `This is an update regarding your coconut sapling booking #{bookingId} for {quantity} GI-Tagged Eathamozhi Tall saplings (Batch: {batchCode}).\n\n` +
    `Your saplings are thriving with vigorous root collar development and are on schedule.\n` +
    `📅 Expected Delivery Date: {expectedDelivery}\n` +
    `📦 Fulfillment Status: {status}\n\n` +
    `🔍 Live Order Tracking:\n` +
    `{trackingLink}\n\n` +
    `Please feel free to reply directly to this message for any assistance. Thank you!`
  );

  // Status tracker for each recipient
  const [recipientStatus, setRecipientStatus] = useState<Record<string, RecipientStatus>>(() => {
    const initial: Record<string, RecipientStatus> = {};
    recipients.forEach(r => {
      initial[r.id] = 'pending';
    });
    return initial;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Clean phone number helper
  const formatWhatsAppNumber = (phone: string): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) {
      return digits;
    }
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  };

  // Preset Template Definitions
  const templates: Record<string, { title: string; icon: string; badge: string; text: string }> = {
    harvest_readiness: {
      title: 'Batch Harvest & Readiness Update',
      icon: 'bi-flower1',
      badge: 'NURSERY UPDATE',
      text:
        `வணக்கம் / Hello {customerName},\n\n` +
        `Greetings from Eathamozhi Coconut Farm! 🌱\n\n` +
        `This is an update regarding your coconut sapling booking #{bookingId} for {quantity} GI-Tagged Eathamozhi Tall saplings (Batch: {batchCode}).\n\n` +
        `Your saplings are thriving with vigorous root collar development and are on schedule.\n` +
        `📅 Expected Delivery Date: {expectedDelivery}\n` +
        `📦 Fulfillment Status: {status}\n\n` +
        `🔍 Live Order Tracking:\n` +
        `{trackingLink}\n\n` +
        `Please feel free to reply directly to this message for any assistance. Thank you!`,
    },
    payment_reminder: {
      title: 'Pending Balance Payment Reminder',
      icon: 'bi-cash-coin',
      badge: 'PAYMENT REMINDER',
      text:
        `வணக்கம் / Hello {customerName},\n\n` +
        `Greetings from Eathamozhi Coconut Farm!\n\n` +
        `Regarding your coconut saplings booking #{bookingId} ({quantity} saplings • Batch: {batchCode}):\n` +
        `💵 Total Order Amount: ₹{totalAmount}\n` +
        `✅ Advance / Paid: ₹{paidAmount}\n` +
        `⚠️ Balance to be Paid: ₹{balanceAmount}\n\n` +
        `Kindly clear the outstanding balance of ₹{balanceAmount} via UPI ({upiId}) to ensure priority dispatch and delivery scheduling.\n\n` +
        `🔍 View Live Order & Invoice:\n` +
        `{trackingLink}\n\n` +
        `Thank you for choosing authentic Eathamozhi heritage palms!`,
    },
    dispatch_alert: {
      title: 'Packing & Dispatch Alert',
      icon: 'bi-truck',
      badge: 'DISPATCH NOTIFICATION',
      text:
        `வணக்கம் / Hello {customerName},\n\n` +
        `Great news from Eathamozhi Coconut Farm! 🚚\n\n` +
        `Your {quantity} coconut saplings (Booking #{bookingId}) have been prepared with root-ball moisture protection and scheduled for dispatch.\n\n` +
        `🚚 Courier / Transport: {courierName}\n` +
        `📅 Expected Arrival: {expectedDelivery}\n` +
        `📍 Delivery Hub / District: {location}\n\n` +
        `🔍 Live Order Tracking:\n` +
        `{trackingLink}\n\n` +
        `Our delivery partner will coordinate with you. Please reply if you have any questions!`,
    },
    new_batches_announcement: {
      title: 'New Sown Batch & Farm Announcement',
      icon: 'bi-megaphone',
      badge: 'FARM ANNOUNCEMENT',
      text:
        `வணக்கம் / Hello {customerName},\n\n` +
        `Greetings from our ancestral family farm in Eathamozhi, Kanyakumari!\n\n` +
        `We are pleased to inform you that fresh nursery batches of authentic GI-Tagged Eathamozhi Tall coconut saplings are now open for reservation.\n\n` +
        `🌴 100% Mother Tree Certified Pedigree\n` +
        `💧 High-copra kernel & disease resistant\n` +
        `🚚 Safe door/hub delivery across Tamil Nadu, Kerala, Karnataka & Andhra Pradesh\n\n` +
        `Reserve your batch online:\n` +
        `${siteUrl}/batches\n\n` +
        `Feel free to reply directly to this message for personal agronomy advice!`,
    },
  };

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    if (templates[key]) {
      setCustomMessage(templates[key].text);
    }
  };

  // Render message for a specific recipient
  const renderMessageForRecipient = (r: BroadcastRecipient): string => {
    const rawTracking = r.trackingLink || `${siteUrl}/tracking?bookingId=${encodeURIComponent(r.bookingId || '')}&mobile=${encodeURIComponent(r.phone || '')}`;
    const balance = r.balanceAmount !== undefined
      ? r.balanceAmount
      : Math.max(0, (r.totalAmount || 0) - (r.paidAmount || 0));

    return customMessage
      .replace(/{customerName}/g, r.name || 'Valued Farmer')
      .replace(/{name}/g, r.name || 'Valued Farmer')
      .replace(/{bookingId}/g, r.bookingId || 'N/A')
      .replace(/{batchCode}/g, r.batchCode || 'Eathamozhi Tall Batch')
      .replace(/{quantity}/g, String(r.quantity || 1))
      .replace(/{totalAmount}/g, (r.totalAmount || 0).toLocaleString('en-IN'))
      .replace(/{paidAmount}/g, (r.paidAmount || 0).toLocaleString('en-IN'))
      .replace(/{balanceAmount}/g, balance.toLocaleString('en-IN'))
      .replace(/{expectedDelivery}/g, r.expectedDelivery || 'As per schedule')
      .replace(/{courierName}/g, r.courierName || 'MSS Parcel Service')
      .replace(/{location}/g, r.location || 'Your Registered Location')
      .replace(/{status}/g, r.status || 'Active')
      .replace(/{trackingLink}/g, rawTracking)
      .replace(/{upiId}/g, upiId);
  };

  // Helper to insert placeholders into message
  const insertPlaceholder = (tag: string) => {
    setCustomMessage(prev => prev + tag);
  };

  // Actions in Queue Mode
  const activeRecipient = recipients[currentIndex] || recipients[0];
  const activeMessage = activeRecipient ? renderMessageForRecipient(activeRecipient) : '';
  const formattedPhone = activeRecipient ? formatWhatsAppNumber(activeRecipient.phone) : '';
  const waUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(activeMessage)}`
    : '';

  const handleSendViaWhatsApp = () => {
    if (!formattedPhone) {
      alert(`⚠️ Customer ${activeRecipient.name} does not have a valid mobile/WhatsApp number.`);
      return;
    }

    // Open WhatsApp Web/App in new window
    window.open(waUrl, '_blank');

    // Mark as sent
    setRecipientStatus(prev => ({ ...prev, [activeRecipient.id]: 'sent' }));

    // Auto-advance to next pending recipient if available
    const nextPendingIdx = recipients.findIndex((r, idx) => idx > currentIndex && recipientStatus[r.id] === 'pending');
    if (nextPendingIdx !== -1) {
      setCurrentIndex(nextPendingIdx);
    } else if (currentIndex < recipients.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    setRecipientStatus(prev => ({ ...prev, [activeRecipient.id]: 'skipped' }));
    if (currentIndex < recipients.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleMarkSentWithoutOpening = () => {
    setRecipientStatus(prev => ({ ...prev, [activeRecipient.id]: 'sent' }));
    if (currentIndex < recipients.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Statistics
  const sentCount = Object.values(recipientStatus).filter(s => s === 'sent').length;
  const skippedCount = Object.values(recipientStatus).filter(s => s === 'skipped').length;
  const pendingCount = recipients.length - sentCount - skippedCount;
  const percentComplete = recipients.length > 0 ? Math.round(((sentCount + skippedCount) / recipients.length) * 100) : 0;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1060, backdropFilter: 'blur(4px)' }}
    >
      <div
        className="card border-0 shadow-2xl rounded-4 overflow-hidden bg-white d-flex flex-column"
        style={{ width: '95%', maxWidth: '960px', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="bg-dark text-white p-3 px-4 border-bottom border-success border-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-whatsapp fs-5"></i>
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                WhatsApp Broadcast Queue Dispatcher
                <span className="badge bg-success text-white extra-small fw-semibold">Zero API Cost</span>
              </h5>
              <small className="text-secondary extra-small">
                {recipients.length} customer{recipients.length !== 1 ? 's' : ''} selected • Send directly via your WhatsApp Web / App
              </small>
            </div>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={onClose} title="Close"></button>
        </div>

        {/* Modal Body with Two Steps */}
        <div className="p-4 overflow-y-auto flex-grow-1" style={{ backgroundColor: '#f8fafc' }}>
          {step === 'template' ? (
            <div>
              {/* Step 1: Composer & Template Chooser */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold text-dark mb-1">
                    <span className="badge bg-success rounded-circle me-1">1</span> Choose Template &amp; Customize Message
                  </h6>
                  <p className="text-muted extra-small mb-0">
                    Placeholders like <code>{'{customerName}'}</code>, <code>{'{bookingId}'}</code>, <code>{'{balanceAmount}'}</code> will be auto-filled for each customer.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-success fw-bold px-4 py-2 shadow-sm d-flex align-items-center gap-2"
                  onClick={() => setStep('queue')}
                  disabled={!customMessage.trim() || recipients.length === 0}
                >
                  <span>Continue to Dispatch Queue</span>
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>

              {/* Template Selectors */}
              <div className="row g-2 mb-3">
                {Object.entries(templates).map(([key, t]) => (
                  <div key={key} className="col-md-6 col-lg-3">
                    <div
                      role="button"
                      onClick={() => handleSelectTemplate(key)}
                      className={`card p-2 h-100 rounded-3 cursor-pointer transition-all ${
                        selectedTemplateKey === key
                          ? 'border-success bg-success-subtle shadow-sm'
                          : 'border bg-white hover-lift-subtle'
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="badge bg-light text-dark border extra-small">{t.badge}</small>
                        <i className={`bi ${t.icon} text-success`}></i>
                      </div>
                      <strong className="text-dark small d-block mb-1">{t.title}</strong>
                      <small className="text-muted extra-small line-clamp-2" style={{ maxHeight: '2.4em', overflow: 'hidden' }}>
                        {t.text.slice(0, 70)}...
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Tag Pills */}
              <div className="mb-2">
                <small className="text-muted fw-bold extra-small text-uppercase me-2">Click to insert placeholder:</small>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {[
                    { tag: '{customerName}', label: 'Customer Name' },
                    { tag: '{bookingId}', label: 'Booking ID' },
                    { tag: '{batchCode}', label: 'Batch Code' },
                    { tag: '{quantity}', label: 'Sapling Qty' },
                    { tag: '{totalAmount}', label: 'Total Amount' },
                    { tag: '{paidAmount}', label: 'Paid Amount' },
                    { tag: '{balanceAmount}', label: 'Balance to Pay' },
                    { tag: '{expectedDelivery}', label: 'Delivery Date' },
                    { tag: '{courierName}', label: 'Courier Service' },
                    { tag: '{location}', label: 'District / Hub' },
                    { tag: '{status}', label: 'Order Status' },
                    { tag: '{trackingLink}', label: 'Live Tracking Link' },
                  ].map(p => (
                    <button
                      key={p.tag}
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-2 extra-small rounded-pill bg-white"
                      onClick={() => insertPlaceholder(p.tag)}
                      title={`Insert ${p.tag}`}
                    >
                      <i className="bi bi-plus me-1 text-success"></i>{p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Composer Area */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark">Broadcast Message Text</label>
                <textarea
                  className="form-control font-monospace"
                  rows={9}
                  style={{ fontSize: '0.88rem', lineHeight: '1.5' }}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here..."
                ></textarea>
                <small className="text-muted extra-small mt-1 d-block">
                  WhatsApp formatting supported: <code>*bold*</code>, <code>_italic_</code>, <code>~strikethrough~</code>, <code>```monospace```</code>.
                </small>
              </div>

              {/* Live Preview for First Selected Customer */}
              {recipients[0] && (
                <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                  <small className="text-muted fw-bold extra-small text-uppercase mb-2 d-flex align-items-center gap-1">
                    <i className="bi bi-eye-fill text-success"></i> Sample Preview for &ldquo;{recipients[0].name}&rdquo; ({recipients[0].bookingId || 'Sample'})
                  </small>
                  <div className="p-3 rounded-3 border" style={{ backgroundColor: '#e5ddd5', maxHeight: '180px', overflowY: 'auto' }}>
                    <div className="bg-white p-3 rounded-3 shadow-sm" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                      {renderMessageForRecipient(recipients[0])}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Step 2: Queue Mode (Interactive Dispatcher) */}
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div>
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <span className="badge bg-success rounded-circle">2</span> Dispatch Queue: Recipient {currentIndex + 1} of {recipients.length}
                  </h6>
                  <small className="text-muted extra-small">
                    Click &ldquo;Send via WhatsApp&rdquo; to open chat with the pre-filled message, then auto-advance.
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setStep('template')}
                  >
                    <i className="bi bi-pencil me-1"></i> Edit Message
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={onClose}
                  >
                    Close Queue
                  </button>
                </div>
              </div>

              {/* Progress Bar & Counters */}
              <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small fw-bold text-dark">Broadcast Progress</span>
                  <div className="d-flex gap-2">
                    <span className="badge bg-success-subtle text-success border border-success extra-small">
                      Sent: {sentCount}
                    </span>
                    <span className="badge bg-warning-subtle text-dark border border-warning extra-small">
                      Pending: {pendingCount}
                    </span>
                    {skippedCount > 0 && (
                      <span className="badge bg-secondary-subtle text-secondary border extra-small">
                        Skipped: {skippedCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${percentComplete}%` }}
                    aria-valuenow={percentComplete}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>

              {/* Active Recipient Card (Main Focus Area) */}
              {activeRecipient ? (
                <div className="card border-2 border-success shadow-sm rounded-4 p-4 bg-white mb-3">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-dark font-monospace fs-6 px-2 py-1">
                          #{currentIndex + 1}
                        </span>
                        <h4 className="fw-bold text-dark mb-0">{activeRecipient.name}</h4>
                        <span className={`badge ${
                          recipientStatus[activeRecipient.id] === 'sent'
                            ? 'bg-success'
                            : recipientStatus[activeRecipient.id] === 'skipped'
                              ? 'bg-secondary'
                              : 'bg-warning text-dark'
                        }`}>
                          {recipientStatus[activeRecipient.id].toUpperCase()}
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-2 text-muted small mt-1">
                        <span><i className="bi bi-whatsapp text-success me-1"></i><strong>{activeRecipient.phone || 'No phone'}</strong></span>
                        {activeRecipient.bookingId && <span>• Booking: <code>{activeRecipient.bookingId}</code></span>}
                        {activeRecipient.batchCode && <span>• Batch: <code>{activeRecipient.batchCode}</code></span>}
                        {activeRecipient.quantity && <span>• Qty: <strong>{activeRecipient.quantity} saplings</strong></span>}
                        {activeRecipient.location && <span>• {activeRecipient.location}</span>}
                      </div>
                    </div>

                    {/* Outstanding Balance Pill */}
                    {activeRecipient.balanceAmount !== undefined && activeRecipient.balanceAmount > 0 && (
                      <div className="badge bg-danger-subtle text-danger border border-danger px-3 py-2 text-end">
                        <small className="d-block extra-small">Pending Balance</small>
                        <strong className="fs-6">₹{activeRecipient.balanceAmount.toLocaleString('en-IN')}</strong>
                      </div>
                    )}
                  </div>

                  {/* Rendered Preview Bubble */}
                  <div className="mb-3">
                    <small className="text-muted fw-bold extra-small text-uppercase mb-1 d-block">
                      Message to be sent to {activeRecipient.name}:
                    </small>
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#e5ddd5', border: '1px solid #c2b59b' }}>
                      <div className="bg-white p-3 rounded-3 shadow-sm position-relative" style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem' }}>
                        {activeMessage}
                        <button
                          type="button"
                          onClick={() => handleCopyText(activeMessage, currentIndex)}
                          className="btn btn-outline-secondary btn-sm py-0 px-2 extra-small position-absolute top-0 end-0 m-2"
                          title="Copy text to clipboard"
                        >
                          <i className={`bi ${copiedIndex === currentIndex ? 'bi-check2' : 'bi-clipboard'} me-1`}></i>
                          {copiedIndex === currentIndex ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between pt-2 border-top">
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(currentIndex - 1)}
                      >
                        <i className="bi bi-chevron-left me-1"></i> Prev
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={currentIndex === recipients.length - 1}
                        onClick={() => setCurrentIndex(currentIndex + 1)}
                      >
                        Next <i className="bi bi-chevron-right ms-1"></i>
                      </button>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleSkip}
                        title="Skip customer and move to next"
                      >
                        <i className="bi bi-skip-forward me-1"></i> Skip
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={handleMarkSentWithoutOpening}
                        title="Mark as sent manually without opening WhatsApp"
                      >
                        <i className="bi bi-check-all me-1"></i> Mark as Sent
                      </button>
                      <button
                        type="button"
                        className="btn btn-success fw-bold px-4 py-2 shadow-sm d-flex align-items-center gap-2"
                        onClick={handleSendViaWhatsApp}
                      >
                        <i className="bi bi-whatsapp fs-5"></i>
                        <span>Open &amp; Send via WhatsApp</span>
                        <i className="bi bi-box-arrow-up-right extra-small"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Roster Overview Table */}
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                  <small className="fw-bold text-dark text-uppercase extra-small">
                    Recipients Roster ({recipients.length})
                  </small>
                  <small className="text-muted extra-small">Click any recipient to jump directly</small>
                </div>
                <div className="table-responsive" style={{ maxHeight: '200px' }}>
                  <table className="table table-sm table-hover align-middle mb-0 extra-small">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Customer</th>
                        <th>WhatsApp Mobile</th>
                        <th>Booking ID</th>
                        <th>Batch</th>
                        <th className="text-center">Status</th>
                        <th className="text-end">Jump / Send</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((r, idx) => (
                        <tr
                          key={r.id}
                          className={idx === currentIndex ? 'table-success fw-semibold' : ''}
                          role="button"
                          onClick={() => setCurrentIndex(idx)}
                        >
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{r.name}</strong>
                          </td>
                          <td className="font-monospace">{r.phone}</td>
                          <td><span className="badge bg-light text-dark border font-monospace">{r.bookingId || '—'}</span></td>
                          <td><span className="badge bg-secondary-subtle text-secondary font-monospace">{r.batchCode || '—'}</span></td>
                          <td className="text-center">
                            <span className={`badge ${
                              recipientStatus[r.id] === 'sent'
                                ? 'bg-success'
                                : recipientStatus[r.id] === 'skipped'
                                  ? 'bg-secondary'
                                  : 'bg-warning text-dark'
                            }`}>
                              {recipientStatus[r.id]}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-success py-0 px-2 extra-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentIndex(idx);
                              }}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-light p-3 px-4 border-top d-flex justify-content-between align-items-center">
          <small className="text-muted extra-small">
            <i className="bi bi-shield-check text-success me-1"></i>
            WhatsApp Dispatch Queue runs client-side without third-party API or per-message charges.
          </small>
          <div className="d-flex gap-2">
            {step === 'queue' ? (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3"
                onClick={() => setStep('template')}
              >
                Back to Templates
              </button>
            ) : null}
            <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

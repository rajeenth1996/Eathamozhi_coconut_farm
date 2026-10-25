'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    location: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: '', mobile: '', location: '', message: '' });
      } else {
        alert('Failed to submit enquiry. Please try again.');
      }
    } catch (err) {
      alert('Error submitting enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="hero-ambient-mesh text-white py-5 position-relative overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative py-3">
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill mb-2 fw-bold">DIRECT FARM SUPPORT</span>
          <h1 className="display-4 fw-bold">Contact Eathamozhy Farm</h1>
          <p className="lead mb-0">We are here to answer your questions about coconut varieties, soil preparation, and bulk sapling orders.</p>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            
            <div className="col-md-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white d-flex flex-column justify-content-between">
                <div>
                  <h4 className="fw-bold text-dark mb-3"><i className="bi bi-geo-alt-fill me-2 text-success"></i> Farm Location</h4>
                  <p className="text-secondary small mb-4">
                    Eathamozhy Village, Kanyakumari District,<br />
                    Tamil Nadu, India - 629501
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-1">Phone & WhatsApp</h6>
                  <p className="text-secondary small mb-1">
                    <i className="bi bi-telephone me-1 text-success"></i> {process.env.NEXT_PUBLIC_FARM_PHONE || '+91 94868 80641'}
                  </p>
                  <p className="text-secondary small">
                    <i className="bi bi-whatsapp me-1 text-success"></i> {process.env.NEXT_PUBLIC_FARM_PHONE || '+91 94868 80641'}
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-2">Connect With Us</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <a 
                      href={process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/share/1Fg7jUCXNM/"} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="contact-social-link facebook"
                      title="Follow us on Facebook"
                    >
                      <span className="footer-social-icon" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>
                        <i className="bi bi-facebook"></i>
                      </span>
                      <span>Facebook</span>
                    </a>
                    <a 
                      href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/eathamozhi_coconut_farm?xtok=MTFhaHJwdXk5Nzhleg=="} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="contact-social-link instagram"
                      title="Follow us on Instagram"
                    >
                      <span className="footer-social-icon" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>
                        <i className="bi bi-instagram"></i>
                      </span>
                      <span>Instagram</span>
                    </a>
                    <a 
                      href={process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://youtube.com/@eathamozhicoconutfarm?si=DerFz4Uxlf_eW8LD"} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="contact-social-link youtube"
                      title="Watch us on YouTube"
                    >
                      <span className="footer-social-icon" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>
                        <i className="bi bi-youtube"></i>
                      </span>
                      <span>YouTube</span>
                    </a>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 mt-auto">
                  <a 
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641'}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-success fw-bold py-2"
                  >
                    <i className="bi bi-whatsapp me-1"></i> WhatsApp Us Directly
                  </a>
                  <a 
                    href={`tel:${(process.env.NEXT_PUBLIC_FARM_PHONE || '+91 94868 80641').replace(/\s+/g, '')}`} 
                    className="btn btn-outline-dark fw-bold py-2"
                  >
                    <i className="bi bi-telephone-fill me-1"></i> Call Us Now
                  </a>
                </div>
              </div>
            </div>

            <div className="col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <h4 className="fw-bold text-dark mb-3"><i className="bi bi-envelope-paper me-2 text-success"></i> Send Farm Enquiry</h4>
                
                {submitted && (
                  <div className="alert alert-success rounded-4 p-3 mb-4">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <strong>Enquiry Received!</strong> Our farm admin team will call/WhatsApp you shortly.
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Your Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Name" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Mobile Number *</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        required 
                        placeholder="10-digit mobile" 
                        value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">District & Location</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Tirunelveli, Tamil Nadu" 
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Enquiry / Sapling Requirement *</label>
                      <textarea 
                        className="form-control" 
                        rows={4} 
                        required
                        placeholder="How many saplings are you looking for or what questions do you have?"
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-success btn-lg fw-bold w-100" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Enquiry'} <i className="bi bi-send ms-1"></i>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLogoutButton from '@/components/AdminLogoutButton';

interface AnalyticsData {
  kpis: {
    totalViews: number;
    viewsToday: number;
    views7d: number;
    uniqueSessions: number;
    sessionsToday: number;
    convertedSessions: number;
    conversionRate: string;
  };
  topPages: { path: string; count: number }[];
  trafficSources: { [source: string]: number };
  devices: { mobile: number; desktop: number; tablet: number };
  funnel: {
    home: number;
    motherTrees: number;
    batches: number;
    checkout: number;
    converted: number;
  };
  recentJourneys: {
    sessionId: string;
    startedAt: string;
    lastActiveAt: string;
    device: 'mobile' | 'tablet' | 'desktop';
    referrerSource: string;
    pathCount: number;
    steps: string[];
    convertedToOrder: boolean;
    orderId?: string;
  }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalSourceCount = data?.trafficSources
    ? Object.values(data.trafficSources).reduce((a, b) => a + b, 0)
    : 1;

  const totalDeviceCount = data?.devices
    ? (data.devices.mobile || 0) + (data.devices.desktop || 0) + (data.devices.tablet || 0)
    : 1;

  const funnelMax = Math.max(
    data?.funnel.home || 0,
    data?.funnel.motherTrees || 0,
    data?.funnel.batches || 0,
    data?.funnel.checkout || 0,
    1
  );

  return (
    <>
      {/* Header */}
      <section className="bg-dark text-white py-4 border-bottom border-success border-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-danger">ADMIN INTELLIGENCE</span>
                <span className="badge bg-success-subtle text-success border border-success">
                  <i className="bi bi-activity me-1"></i> Live Traffic Tracking
                </span>
              </div>
              <h1 className="fw-bold mb-0 text-light fs-3">Visitor Traffic &amp; Navigation Analytics</h1>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                onClick={fetchAnalytics}
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                disabled={loading}
              >
                <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
                <span>Refresh</span>
              </button>
              <Link href="/admin" className="btn btn-outline-light btn-sm">
                <i className="bi bi-grid me-1"></i> Admin Dashboard
              </Link>
              <Link href="/" className="btn btn-outline-light btn-sm">
                <i className="bi bi-house-door me-1"></i> Public Site
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </section>

      {/* Main Analytics Content */}
      <section className="py-4 bg-light">
        <div className="container">

          {/* Quick Sub-Navigation */}
          <div className="d-flex gap-2 mb-4 overflow-x-auto pb-1">
            <Link href="/admin" className="btn btn-sm btn-outline-secondary">Dashboard Overview</Link>
            <Link href="/admin/analytics" className="btn btn-sm btn-success fw-bold">Visitor Analytics</Link>
            <Link href="/admin/orders" className="btn btn-sm btn-outline-secondary">Customer Orders</Link>
            <Link href="/admin/batches" className="btn btn-sm btn-outline-secondary">Batches</Link>
            <Link href="/admin/mother-trees" className="btn btn-sm btn-outline-secondary">Mother Trees</Link>
          </div>

          {/* 1. KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-6">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-primary border-4 h-100">
                <small className="text-muted d-block text-uppercase fw-bold extra-small">Total Page Views</small>
                <h3 className="fw-bold text-dark mb-0 my-1">{loading ? '...' : data?.kpis.totalViews.toLocaleString()}</h3>
                <small className="text-primary fw-semibold">
                  <i className="bi bi-arrow-up-right me-1"></i>
                  {data?.kpis.viewsToday || 0} today
                </small>
              </div>
            </div>

            <div className="col-md-3 col-6">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-success border-4 h-100">
                <small className="text-muted d-block text-uppercase fw-bold extra-small">Unique Visitor Sessions</small>
                <h3 className="fw-bold text-success mb-0 my-1">{loading ? '...' : data?.kpis.uniqueSessions.toLocaleString()}</h3>
                <small className="text-muted">
                  {data?.kpis.sessionsToday || 0} active today
                </small>
              </div>
            </div>

            <div className="col-md-3 col-6">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-warning border-4 h-100">
                <small className="text-muted d-block text-uppercase fw-bold extra-small">Order Conversions</small>
                <h3 className="fw-bold text-warning mb-0 my-1">{loading ? '...' : data?.kpis.convertedSessions}</h3>
                <small className="text-muted">Completed orders</small>
              </div>
            </div>

            <div className="col-md-3 col-6">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-info border-4 h-100">
                <small className="text-muted d-block text-uppercase fw-bold extra-small">Conversion Rate</small>
                <h3 className="fw-bold text-info mb-0 my-1">{loading ? '...' : `${data?.kpis.conversionRate}%`}</h3>
                <small className="text-muted">Visitors who bought</small>
              </div>
            </div>
          </div>

          {/* 2. Customer Navigation Funnel */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">
                  <i className="bi bi-funnel-fill text-success me-2"></i>
                  Customer Purchase Funnel &amp; Drop-off Analysis
                </h5>
                <small className="text-muted">How visitors navigate from landing on the site to placing a sapling booking.</small>
              </div>
              <span className="badge bg-light text-dark border">All Recorded Journeys</span>
            </div>

            <div className="row g-3 text-center">
              {/* Step 1: Home */}
              <div className="col-md col-6">
                <div className="p-3 bg-light rounded-4 border h-100">
                  <div className="badge bg-primary mb-2">Step 1</div>
                  <h6 className="fw-bold text-dark mb-1">Home Landing</h6>
                  <h4 className="fw-bold text-dark mb-1">{data?.funnel.home || 0}</h4>
                  <small className="text-muted extra-small">Visited Home Page</small>
                  <div className="progress mt-2" style={{ height: '6px' }}>
                    <div className="progress-bar bg-primary" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>

              {/* Step 2: Mother Trees */}
              <div className="col-md col-6">
                <div className="p-3 bg-light rounded-4 border h-100">
                  <div className="badge bg-success mb-2">Step 2</div>
                  <h6 className="fw-bold text-dark mb-1">Mother Trees</h6>
                  <h4 className="fw-bold text-success mb-1">{data?.funnel.motherTrees || 0}</h4>
                  <small className="text-muted extra-small">Inspected Pedigree</small>
                  <div className="progress mt-2" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${Math.round(((data?.funnel.motherTrees || 0) / funnelMax) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Step 3: Batches */}
              <div className="col-md col-6">
                <div className="p-3 bg-light rounded-4 border h-100">
                  <div className="badge bg-info text-dark mb-2">Step 3</div>
                  <h6 className="fw-bold text-dark mb-1">Batches Stock</h6>
                  <h4 className="fw-bold text-info mb-1">{data?.funnel.batches || 0}</h4>
                  <small className="text-muted extra-small">Explored Batches</small>
                  <div className="progress mt-2" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-info"
                      style={{ width: `${Math.round(((data?.funnel.batches || 0) / funnelMax) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Step 4: Checkout */}
              <div className="col-md col-6">
                <div className="p-3 bg-light rounded-4 border h-100">
                  <div className="badge bg-warning text-dark mb-2">Step 4</div>
                  <h6 className="fw-bold text-dark mb-1">Checkout Started</h6>
                  <h4 className="fw-bold text-warning mb-1">{data?.funnel.checkout || 0}</h4>
                  <small className="text-muted extra-small">Entered Book Page</small>
                  <div className="progress mt-2" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-warning"
                      style={{ width: `${Math.round(((data?.funnel.checkout || 0) / funnelMax) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Step 5: Converted */}
              <div className="col-md col-12">
                <div className="p-3 bg-success-subtle rounded-4 border border-success h-100">
                  <div className="badge bg-success mb-2">
                    <i className="bi bi-check-circle-fill me-1"></i> Final Goal
                  </div>
                  <h6 className="fw-bold text-success mb-1">Order Placed</h6>
                  <h4 className="fw-bold text-success mb-1">{data?.funnel.converted || 0}</h4>
                  <small className="text-success extra-small fw-semibold">Confirmed Orders</small>
                  <div className="progress mt-2" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${Math.round(((data?.funnel.converted || 0) / funnelMax) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* 3. Top Visited Pages */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text text-primary"></i>
                  Most Visited Pages
                </h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr className="extra-small text-uppercase">
                        <th>Page Path</th>
                        <th className="text-end">Views</th>
                        <th className="text-end">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.topPages && data.topPages.length > 0 ? (
                        data.topPages.map((page, idx) => {
                          const pct = data.kpis.totalViews > 0
                            ? Math.round((page.count / data.kpis.totalViews) * 100)
                            : 0;
                          return (
                            <tr key={idx}>
                              <td>
                                <span className="badge bg-light text-dark border me-2">{idx + 1}</span>
                                <span className="font-monospace small text-dark">{page.path}</span>
                              </td>
                              <td className="text-end fw-bold">{page.count}</td>
                              <td className="text-end text-muted small">{pct}%</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-muted">
                            No pageview activity recorded yet. Browse the website to generate live stats!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. Traffic Sources & Devices */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-signpost-2-fill text-success"></i>
                  Where Visitors Come From (Acquisition)
                </h5>
                {data?.trafficSources && Object.keys(data.trafficSources).length > 0 ? (
                  Object.entries(data.trafficSources).map(([source, count], idx) => {
                    const pct = Math.round((count / (totalSourceCount || 1)) * 100);
                    const isWhatsApp = source.toLowerCase().includes('whatsapp');
                    const isGoogle = source.toLowerCase().includes('google');
                    return (
                      <div key={idx} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="small fw-semibold text-dark">
                            {isWhatsApp && <i className="bi bi-whatsapp text-success me-1"></i>}
                            {isGoogle && <i className="bi bi-google text-primary me-1"></i>}
                            {!isWhatsApp && !isGoogle && <i className="bi bi-link-45deg text-secondary me-1"></i>}
                            {source}
                          </span>
                          <span className="small text-muted">{count} visits ({pct}%)</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className={`progress-bar ${isWhatsApp ? 'bg-success' : isGoogle ? 'bg-primary' : 'bg-secondary'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted small">No traffic sources tracked yet.</p>
                )}
              </div>

              {/* Devices Card */}
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-phone-fill text-info"></i>
                  Device Distribution
                </h5>
                <div className="row text-center g-2">
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3">
                      <i className="bi bi-phone fs-4 text-success d-block mb-1"></i>
                      <span className="fw-bold text-dark d-block">
                        {data?.devices ? Math.round(((data.devices.mobile || 0) / (totalDeviceCount || 1)) * 100) : 0}%
                      </span>
                      <small className="text-muted extra-small">Mobile ({data?.devices?.mobile || 0})</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3">
                      <i className="bi bi-laptop fs-4 text-primary d-block mb-1"></i>
                      <span className="fw-bold text-dark d-block">
                        {data?.devices ? Math.round(((data.devices.desktop || 0) / (totalDeviceCount || 1)) * 100) : 0}%
                      </span>
                      <small className="text-muted extra-small">Desktop ({data?.devices?.desktop || 0})</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3">
                      <i className="bi bi-tablet fs-4 text-warning d-block mb-1"></i>
                      <span className="fw-bold text-dark d-block">
                        {data?.devices ? Math.round(((data.devices.tablet || 0) / (totalDeviceCount || 1)) * 100) : 0}%
                      </span>
                      <small className="text-muted extra-small">Tablet ({data?.devices?.tablet || 0})</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Live Navigation Trails (Recent Visitor Journeys) */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">
                  <i className="bi bi-diagram-3-fill text-success me-2"></i>
                  Live Visitor Navigation Trails (User Journeys)
                </h5>
                <small className="text-muted">Exact step-by-step path taken by each visitor from landing to exit or checkout.</small>
              </div>
              <span className="badge bg-success-subtle text-success border border-success">
                Showing Last {data?.recentJourneys ? data.recentJourneys.length : 0} Sessions
              </span>
            </div>

            <div className="d-flex flex-column gap-3">
              {data?.recentJourneys && data.recentJourneys.length > 0 ? (
                data.recentJourneys.map((journey, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-4 border ${journey.convertedToOrder ? 'border-success bg-success-subtle bg-opacity-25' : 'bg-light'}`}
                  >
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge bg-dark font-monospace extra-small">{journey.sessionId.slice(0, 14)}...</span>
                        <span className="badge bg-secondary extra-small">
                          <i className={`bi bi-${journey.device === 'mobile' ? 'phone' : 'laptop'} me-1`}></i>
                          {journey.device}
                        </span>
                        <span className="badge bg-light text-dark border extra-small">
                          Source: {journey.referrerSource}
                        </span>
                        {journey.convertedToOrder && (
                          <span className="badge bg-success extra-small">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            ORDER CONVERTED {journey.orderId ? `(${journey.orderId})` : ''}
                          </span>
                        )}
                      </div>
                      <small className="text-muted extra-small">
                        {new Date(journey.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>

                    {/* Step-by-step trail pills */}
                    <div className="d-flex align-items-center gap-1 flex-wrap">
                      <span className="text-muted extra-small me-1">Path:</span>
                      {journey.steps.map((step, sIdx) => (
                        <span key={sIdx} className="d-inline-flex align-items-center">
                          <span className="badge bg-white text-dark border font-monospace extra-small py-1 px-2">
                            {step}
                          </span>
                          {sIdx < journey.steps.length - 1 && (
                            <i className="bi bi-arrow-right text-muted mx-1 extra-small"></i>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-compass fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  <h6>No user journeys logged yet</h6>
                  <p className="small mb-0">As visitors click around your farm site, their navigation paths will appear here live in real-time.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}

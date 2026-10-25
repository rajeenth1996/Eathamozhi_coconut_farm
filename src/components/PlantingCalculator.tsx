'use client';

import { useState } from 'react';
import Link from 'next/link';
import PatternVisualizer from '@/components/PatternVisualizer';

export default function PlantingCalculator() {
  const [acres, setAcres] = useState<number>(1);
  const [spacingDistance, setSpacingDistance] = useState<number>(25);
  const [spacingType, setSpacingType] = useState<'triangular' | 'square'>('triangular');
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const unitPrice = 150; // Standard price per sapling

  const [hoveredPattern, setHoveredPattern] = useState<'triangular' | 'square' | null>(null);

  // Dynamic tree count calculations based on land area and palm spacing distance (minimum 20 ft)
  // 1 Acre = 43,560 sq ft. Field coefficient 0.93 accounts for perimeter buffer and irrigation rows.
  const squarePerAcre = Math.round((43560 * 0.93) / (spacingDistance * spacingDistance));
  const triangularPerAcre = Math.round(squarePerAcre * 1.08); // +15% equilateral quincunx efficiency calibrated to 70 at 25 ft

  const treesPerAcre = spacingType === 'triangular' ? triangularPerAcre : squarePerAcre;
  const totalTrees = Math.round(acres * treesPerAcre);
  const totalCost = totalTrees * unitPrice;
  const batchesNeeded = Math.ceil(totalTrees / 25);
  const pitSize = spacingDistance <= 22 ? '2.5 ft × 2.5 ft × 2.5 ft' : '3 ft × 3 ft × 3 ft';

  return (
    <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white p-4 p-md-5">
      <div className="row g-4 align-items-center">
        
        {/* Left Column: Input Controls & Interactive Diagram */}
        <div className="col-lg-6">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 rounded-pill fw-bold">
              <i className="bi bi-calculator me-1"></i> FARM PLANNING UTILITY
            </span>
          </div>

          <h3 className="fw-bold text-dark mb-2">Coconut Grove Planning Calculator</h3>
          <p className="text-secondary small mb-3">
            Calculate exact sapling quantity, plantation spacing, pit size, and estimated cost for your agricultural land.
          </p>

          {/* 1. Acreage Slider & Input */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="fw-bold text-dark small">1. Your Land Area (Acres):</label>
              <div className="input-group" style={{ maxWidth: '140px' }}>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0.5" 
                  max="50" 
                  value={acres} 
                  onChange={(e) => setAcres(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  className="form-control text-center fw-bold"
                />
                <span className="input-group-text small bg-light">Acre{acres > 1 ? 's' : ''}</span>
              </div>
            </div>

            <input 
              type="range" 
              className="form-range custom-range" 
              min="0.5" 
              max="10" 
              step="0.5" 
              value={acres}
              onChange={(e) => setAcres(parseFloat(e.target.value))}
            />
            <div className="d-flex justify-content-between text-muted extra-small">
              <span>0.5 Acre</span>
              <span>2.5 Acres</span>
              <span>5 Acres</span>
              <span>10 Acres</span>
            </div>
          </div>

          {/* 2. Planting Distance (Spacing in Feet) - Minimum 20 ft */}
          <div className="mb-3 p-3 rounded-3 bg-light border">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <label className="fw-bold text-dark small mb-0 d-flex align-items-center gap-1">
                  <i className="bi bi-rulers text-success"></i> 2. Spacing Distance Between Palms:
                </label>
                <small className="text-muted extra-small d-block">Minimum distance allowed: 20 ft</small>
              </div>
              <div className="input-group" style={{ maxWidth: '120px' }}>
                <input 
                  type="number" 
                  min={20} 
                  max={35} 
                  step={1} 
                  value={spacingDistance} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      setSpacingDistance(Math.max(20, Math.min(35, val)));
                    }
                  }}
                  className="form-control text-center fw-bold"
                />
                <span className="input-group-text small bg-white fw-bold">ft</span>
              </div>
            </div>

            <input 
              type="range" 
              className="form-range custom-range" 
              min={20} 
              max={35} 
              step={1} 
              value={spacingDistance}
              onChange={(e) => setSpacingDistance(parseInt(e.target.value))}
            />

            {/* Quick Preset Buttons */}
            <div className="d-flex flex-wrap gap-1 mt-2 mb-2">
              {[
                { label: '20 ft (Max Density)', val: 20 },
                { label: '22 ft (Compact)', val: 22 },
                { label: '25 ft (Standard)', val: 25 },
                { label: '28 ft (Wide)', val: 28 },
                { label: '30 ft (Intercrop)', val: 30 }
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setSpacingDistance(preset.val)}
                  className={`btn btn-xs extra-small px-2 py-1 rounded-pill ${
                    spacingDistance === preset.val
                      ? 'btn-success fw-bold text-white'
                      : 'btn-outline-secondary bg-white'
                  }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Spacing Agronomy Guidance Cue */}
            <div className="extra-small text-secondary pt-1">
              {spacingDistance === 20 ? (
                <span className="text-warning-emphasis">
                  <i className="bi bi-exclamation-circle-fill text-warning me-1"></i>
                  <strong>20 ft (Minimum Limit):</strong> High-density layout gives maximum tree count (~{treesPerAcre} palms/acre). Requires diligent canopy pruning and fertile soil.
                </span>
              ) : spacingDistance < 25 ? (
                <span>
                  <i className="bi bi-info-circle-fill text-info me-1"></i>
                  <strong>{spacingDistance} ft (Compact):</strong> Allows ~{treesPerAcre} palms/acre. Provides higher sapling density than standard.
                </span>
              ) : spacingDistance === 25 ? (
                <span className="text-success">
                  <i className="bi bi-check-circle-fill text-success me-1"></i>
                  <strong>25 ft (Scientifically Recommended):</strong> Optimal sunlight capture and lifelong crown expansion for GI Eathamozhi Tall.
                </span>
              ) : (
                <span>
                  <i className="bi bi-flower1 text-success me-1"></i>
                  <strong>{spacingDistance} ft (Spacious):</strong> Generates wide multi-cropping corridors for intercropping banana, black pepper, cocoa, or vanilla.
                </span>
              )}
            </div>
          </div>

          {/* 3. Spacing Pattern Selection Buttons */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="fw-bold text-dark small mb-0">3. Planting Pattern ({spacingDistance} ft Distance):</label>
              <button 
                type="button" 
                className="btn btn-link text-success p-0 extra-small fw-bold text-decoration-none"
                onClick={() => setShowComparisonModal(!showComparisonModal)}
              >
                <i className="bi bi-arrows-angle-expand me-1"></i>
                {showComparisonModal ? 'Hide Visual Comparison' : 'Compare Patterns Side-by-Side'}
              </button>
            </div>

            <div className="d-flex gap-2 mb-2">
              <button 
                type="button" 
                onClick={() => setSpacingType('triangular')}
                onMouseEnter={() => setHoveredPattern('triangular')}
                onMouseLeave={() => setHoveredPattern(null)}
                className={`btn btn-sm px-3 py-2 rounded-3 flex-fill text-start transition-all position-relative ${
                  spacingType === 'triangular' 
                    ? 'btn-success fw-bold shadow-sm' 
                    : 'btn-outline-secondary'
                }`}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-triangle-fill me-1 small"></i> Triangular Pattern</span>
                  <span className="badge bg-warning text-dark extra-small">+15% Yield</span>
                </div>
                <small className="d-block extra-small opacity-75">~{triangularPerAcre} palms/acre &bull; Hover for diagram</small>
              </button>

              <button 
                type="button" 
                onClick={() => setSpacingType('square')}
                onMouseEnter={() => setHoveredPattern('square')}
                onMouseLeave={() => setHoveredPattern(null)}
                className={`btn btn-sm px-3 py-2 rounded-3 flex-fill text-start transition-all position-relative ${
                  spacingType === 'square' 
                    ? 'btn-success fw-bold shadow-sm' 
                    : 'btn-outline-secondary'
                }`}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-square-fill me-1 small"></i> Square Pattern</span>
                  <span className="badge bg-light text-dark extra-small">Grid</span>
                </div>
                <small className="d-block extra-small opacity-75">~{squarePerAcre} palms/acre &bull; Hover for diagram</small>
              </button>
            </div>

            {/* Pattern Visual Diagram - Revealed on Hover Only */}
            {hoveredPattern ? (
              <div 
                className="border rounded-3 p-3 bg-light shadow-sm animate-fade-in"
                onMouseEnter={() => setHoveredPattern(hoveredPattern)}
                onMouseLeave={() => setHoveredPattern(null)}
              >
                <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                  <small className="fw-bold text-dark extra-small text-uppercase d-flex align-items-center gap-1">
                    <i className="bi bi-eye-fill text-success"></i> Visual Preview: {hoveredPattern === 'triangular' ? `Triangular Layout (${spacingDistance} ft)` : `Square Layout (${spacingDistance} ft)`}
                  </small>
                  <span className="badge bg-success-subtle text-success border border-success extra-small">
                    {hoveredPattern === 'triangular' ? `Staggered Quincunx (${spacingDistance} ft)` : `Orthogonal 90° Grid (${spacingDistance} ft)`}
                  </span>
                </div>

                <PatternVisualizer 
                  selectedPattern={hoveredPattern} 
                  spacingDistance={spacingDistance}
                  onSelectPattern={(p) => {
                    setSpacingType(p);
                    setHoveredPattern(p);
                  }} 
                />
              </div>
            ) : (
              <div className="border border-dashed rounded-3 p-2 px-3 bg-light d-flex align-items-center justify-content-between text-muted">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-circle p-1">
                    <i className="bi bi-cursor-fill extra-small"></i>
                  </span>
                  <span className="extra-small text-secondary">
                    Hover over <strong>Triangular</strong> or <strong>Square</strong> above to view field geometry & spacing details
                  </span>
                </div>
                <span className="badge bg-white text-muted border extra-small d-none d-sm-inline-block">Hover only</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Output Card */}
        <div className="col-lg-6">
          <div className="p-4 rounded-4 text-white shadow-md position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="badge bg-warning text-dark fw-bold mb-1">RECOMMENDED ORDER</span>
                <h4 className="fw-bold mb-0 text-white">{acres} Acre Plantation Plan</h4>
                <small className="text-light opacity-75 extra-small">
                  {spacingDistance} ft spacing &bull; {spacingType === 'triangular' ? 'Triangular (Staggered)' : 'Square (Grid)'} pattern
                </small>
              </div>
              <span className="badge bg-success-subtle text-success border border-success">
                GI Eathamozhi Tall
              </span>
            </div>

            <div className="row g-3 py-3 border-top border-bottom border-success border-opacity-25 my-3">
              <div className="col-6 border-end border-success border-opacity-25">
                <small className="text-light opacity-75 d-block extra-small text-uppercase">Saplings Required</small>
                <span className="display-6 fw-bold text-gradient-emerald">{totalTrees}</span>
                <small className="d-block text-light opacity-75 extra-small">palms (~{treesPerAcre}/acre @ {spacingDistance} ft)</small>
              </div>

              <div className="col-6">
                <small className="text-light opacity-75 d-block extra-small text-uppercase">Estimated Value</small>
                <span className="display-6 fw-bold text-warning">₹{totalCost.toLocaleString('en-IN')}</span>
                <small className="d-block text-light opacity-75 extra-small">@ ₹{unitPrice} / sapling</small>
              </div>

              <div className="col-6 border-end border-success border-opacity-25 pt-2">
                <small className="text-light opacity-75 d-block extra-small text-uppercase">Pit Dimensions</small>
                <span className="fw-bold text-light">{pitSize}</span>
                <small className="d-block text-light opacity-75 extra-small">Depth & width</small>
              </div>

              <div className="col-6 pt-2">
                <small className="text-light opacity-75 d-block extra-small text-uppercase">Batches Needed</small>
                <span className="fw-bold text-light">~{batchesNeeded} Batches</span>
                <small className="d-block text-light opacity-75 extra-small">25 saplings / batch</small>
              </div>
            </div>

            <div className="p-2 rounded-3 bg-dark bg-opacity-40 mb-3 border border-success border-opacity-25 small text-light opacity-90">
              <i className="bi bi-info-circle-fill text-warning me-1"></i>
              {spacingType === 'triangular' ? (
                <span><strong>Triangular Benefit ({spacingDistance} ft):</strong> Alternating rows staggered by {(spacingDistance / 2).toFixed(1)} ft gives equal {spacingDistance} ft canopy spread between all adjacent palms with zero light obstruction.</span>
              ) : (
                <span><strong>Square Benefit ({spacingDistance} ft):</strong> Aligned {spacingDistance} ft grid creates straight perpendicular lanes for easier tractor operation and intercrop cultivation.</span>
              )}
            </div>

            <div className="d-flex flex-wrap gap-2 pt-1">
              <Link 
                href={`/batches`} 
                className="btn-gold flex-fill text-decoration-none py-2 text-center"
              >
                <i className="bi bi-cart-check-fill me-1"></i> Book {totalTrees} Saplings Now
              </Link>
              <a 
                href={`https://wa.me/919486880641?text=Hello%20Eathamozhi%20Farm,%20I%20am%20planning%20a%20${acres}%20acre%20coconut%20plantation%20using%20the%20${spacingType}%20pattern%20with%20${spacingDistance}%20ft%20spacing%20(${totalTrees}%20saplings).%20Please%20guide%20me.`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-light border-opacity-50 py-2 px-3 text-nowrap"
              >
                <i className="bi bi-whatsapp me-1 text-success"></i> Farm Advice
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Expandable Side-by-Side Visual Comparison Tray */}
      {showComparisonModal && (
        <div className="mt-4 pt-4 border-top">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="badge bg-success mb-1">FIELD GEOMETRY COMPARISON</span>
              <h4 className="fw-bold text-dark mb-0">Visual Comparison: Triangular vs Square Pattern ({spacingDistance} ft Spacing)</h4>
            </div>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary" 
              onClick={() => setShowComparisonModal(false)}
            >
              ✕ Close Comparison
            </button>
          </div>

          <PatternVisualizer 
            selectedPattern={spacingType} 
            spacingDistance={spacingDistance}
            onSelectPattern={(p) => setSpacingType(p)} 
            showComparison={true} 
          />
        </div>
      )}
    </div>
  );
}

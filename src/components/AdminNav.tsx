'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', exact: true },
    { href: '/admin/farms', label: 'Farm Registry', icon: 'bi-geo-alt-fill' },
    { href: '/admin/mother-trees', label: 'Mother Tree Registry', icon: 'bi-tree-fill' },
    { href: '/admin/batches', label: 'Batch Management', icon: 'bi-grid-3x3-gap-fill' },
    { href: '/admin/germination', label: 'Germination Tracking', icon: 'bi-flower1' },
    { href: '/admin/seedling-inventory', label: 'Seedling Inventory', icon: 'bi-box-seam-fill' },
    { href: '/admin/orders', label: 'Customer Orders', icon: 'bi-bag-check-fill' },
    { href: '/admin/youtube', label: 'YouTube Videos', icon: 'bi-youtube' },
    { href: '/admin/analytics', label: 'Website Analytics', icon: 'bi-graph-up-arrow' },
    { href: '/admin/traceability', label: 'Traceability & Reports', icon: 'bi-diagram-3-fill' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1020 }}>
      <div className="container">
        <div className="d-flex overflow-x-auto py-2 gap-1 text-nowrap scrollbar-none">
          {links.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 transition-all ${
                  active
                    ? 'btn-success text-white shadow-sm'
                    : 'btn-outline-light text-dark hover-bg-light border-0'
                }`}
              >
                <i className={`bi ${link.icon} ${active ? 'text-white' : 'text-success'}`}></i>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'all').toLowerCase();

    const batches = await DataStore.getBatchesAsync();
    const bookings = await DataStore.getBookingsAsync();
    const palms = await DataStore.getParentPalmsAsync();
    const enquiries = await DataStore.getEnquiriesAsync();
    const adjustments = await DataStore.getAdjustmentsAsync();
    const reviews = await DataStore.getReviewsAsync();

    const wb = XLSX.utils.book_new();

    // 1. Executive Summary
    const totalProduced = batches.reduce((acc, b) => acc + (b.totalQuantity || 0) + (b.inventoryAdjustments || 0), 0);
    const totalBooked = batches.reduce((acc, b) => acc + (b.bookedQuantity || 0), 0);
    const totalAvailable = batches.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
    const totalRevenue = bookings.filter(b => b.paymentStatus === 'PAID').reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    const summaryData = [
      { 'Metric': 'Export Generated At', 'Value': new Date().toLocaleString('en-IN') },
      { 'Metric': 'Farm Name', 'Value': 'Eathamozhi Coconut Farm (GI-Tagged Cultivar)' },
      { 'Metric': 'Total Batches Managed', 'Value': batches.length },
      { 'Metric': 'Total Mother Trees Registered', 'Value': palms.length },
      { 'Metric': 'Total Saplings Produced (Net)', 'Value': totalProduced },
      { 'Metric': 'Total Saplings Booked / Sold', 'Value': totalBooked },
      { 'Metric': 'Total Saplings Available Now', 'Value': totalAvailable },
      { 'Metric': 'Total Orders Logged', 'Value': bookings.length },
      { 'Metric': 'Confirmed Paid Revenue', 'Value': `₹${totalRevenue.toLocaleString('en-IN')}` },
      { 'Metric': 'Total Customer Enquiries', 'Value': enquiries.length },
      { 'Metric': 'Total Inventory Audit Logs', 'Value': adjustments.length },
      { 'Metric': 'Total Farmer Reviews', 'Value': reviews.length },
    ];

    // Parse filter parameters
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || 'ALL').trim();
    const orderStartDate = (searchParams.get('orderStartDate') || '').trim();
    const orderEndDate = (searchParams.get('orderEndDate') || '').trim();
    const deliveryStartDate = (searchParams.get('deliveryStartDate') || '').trim();
    const deliveryEndDate = (searchParams.get('deliveryEndDate') || '').trim();

    let targetBookings = bookings;
    if (search) {
      const q = search.toLowerCase();
      targetBookings = targetBookings.filter(b => 
        b.bookingId?.toLowerCase().includes(q) ||
        b.customerName?.toLowerCase().includes(q) ||
        b.mobile?.includes(q) ||
        b.batchCode?.toLowerCase().includes(q) ||
        b.district?.toLowerCase().includes(q)
      );
    }
    if (status && status !== 'ALL') {
      targetBookings = targetBookings.filter(b => b.bookingStatus === status);
    }
    if (orderStartDate) {
      targetBookings = targetBookings.filter(b => {
        const d = b.createdAt ? b.createdAt.split('T')[0] : '';
        return d ? d >= orderStartDate : false;
      });
    }
    if (orderEndDate) {
      targetBookings = targetBookings.filter(b => {
        const d = b.createdAt ? b.createdAt.split('T')[0] : '';
        return d ? d <= orderEndDate : false;
      });
    }
    if (deliveryStartDate) {
      targetBookings = targetBookings.filter(b => {
        const d = b.expectedDeliveryDate ? b.expectedDeliveryDate.split('T')[0] : '';
        return d ? d >= deliveryStartDate : false;
      });
    }
    if (deliveryEndDate) {
      targetBookings = targetBookings.filter(b => {
        const d = b.expectedDeliveryDate ? b.expectedDeliveryDate.split('T')[0] : '';
        return d ? d <= deliveryEndDate : false;
      });
    }

    // 2. Orders Sheet
    const ordersData = targetBookings.map(b => ({
      'Booking ID': b.bookingId,
      'Order Date': b.createdAt ? b.createdAt.split('T')[0] : 'N/A',
      'Expected Delivery Date': b.expectedDeliveryDate || 'N/A',
      'Customer Name': b.customerName,
      'Mobile': b.mobile,
      'WhatsApp': b.whatsapp || b.mobile,
      'Batch Code': b.batchCode,
      'Quantity (Saplings)': b.quantity,
      'Subtotal (₹)': b.subtotal,
      'Delivery Charge (₹)': b.deliveryCharge,
      'Total Amount (₹)': b.totalAmount,
      'Order Type': (b as any).isPreOrder || (b as any).orderType === 'PRE_ORDER' || b.bookingStatus === 'Pre-order' ? 'Pre-Order (50% Advance)' : 'Complete Order (100%)',
      'Advance Paid (₹)': ((b as any).paidAmount || (b as any).advancePaid || ((b as any).isPreOrder ? Math.round(b.totalAmount / 2) : b.totalAmount)),
      'Balance Amount (₹)': ((b as any).balanceAmount ?? ((b as any).isPreOrder || b.bookingStatus === 'Pre-order' ? Math.max(0, b.totalAmount - ((b as any).paidAmount || Math.round(b.totalAmount / 2))) : 0)),
      'Payment Status': b.paymentStatus,
      'Order Status': b.bookingStatus,
      'Delivery Address': b.address,
      'District': b.district,
      'State': b.state,
      'PIN Code': b.pinCode,
      'Delivery Service / Courier': b.deliveryService || b.courierName || 'ST Couriers',
      'Nearest Delivery Hub': b.nearestHub || 'District Main Hub',
      'Tracking ID': b.trackingId || 'Pending',
      'Dispatch Date': b.dispatchDate || 'N/A',
      'Special Instructions': b.specialInstructions || 'None',
      'Booking Created Timestamp': b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN') : 'N/A',
    }));

    // 3. Batches Sheet
    const batchesData = batches.map(b => {
      const net = (b.totalQuantity || 0) + (b.inventoryAdjustments || 0);
      return {
        'Batch Code': b.batchCode,
        'Batch Name': b.name,
        'Mother Tree Code(s)': (b.parentPalmCodes && b.parentPalmCodes.length > 0) ? b.parentPalmCodes.join(', ') : b.parentPalmCode,
        'Sapling Age': b.age || 'N/A',
        'Average Height': b.height || 'N/A',
        'Harvest Date': b.harvestDate,
        'Seeded Date': b.seededDate,
        'Initial Total Quantity': b.totalQuantity,
        'Inventory Adjustments': b.inventoryAdjustments || 0,
        'Net Stock (Produced)': net,
        'Booked / Sold Quantity': b.bookedQuantity,
        'Available Live Stock': b.availableQuantity,
        'Price per Sapling (₹)': b.price,
        'Batch Status': b.status,
        'Views Count': b.viewsCount || 0,
        'Description': b.description,
      };
    });

    // 4. Mother Trees Sheet
    const treesData = palms.map(p => ({
      'Tree Code': p.code,
      'Mother Tree Name': p.name,
      'Age (Years)': p.age,
      'Grove Location': p.location,
      'Health Status': p.healthStatus,
      'Recorded Yield History': p.yieldHistory,
      'Nut & Water Characteristics': p.nutCharacteristics,
      'Why Selected': p.whySelected,
      'Description': p.description,
      'Photos Count': p.images ? p.images.length : 0,
    }));

    // 5. Enquiries Sheet
    const enquiriesData = enquiries.map(e => ({
      'Enquiry ID': e.id,
      'Customer Name': e.name,
      'Mobile': e.mobile,
      'Location': e.location || 'N/A',
      'Message / Requirement': e.message,
      'Status': e.status,
      'Received At': e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN') : 'N/A',
    }));

    // 6. Inventory Audit Sheet
    const auditData = adjustments.map(a => ({
      'Audit ID': a.id,
      'Batch Code': a.batchCode,
      'Quantity Change (+/-)': a.quantityChange,
      'Audit Reason': a.reason,
      'Admin Staff Name': a.adminName,
      'Logged At': a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN') : 'N/A',
    }));

    // 7. Farmer Reviews Sheet
    const reviewsData = reviews.map(r => ({
      'Review ID': r.id,
      'Farmer / Customer Name': r.customerName,
      'Location': r.location,
      'Batch Code': r.batchCode,
      'Quantity (Saplings)': r.quantity,
      'Rating (Stars)': r.rating,
      'Verified Buyer': r.verified ? 'Yes (Verified)' : 'No',
      'Review Date': r.date,
      'Farmer Feedback / Comment': r.comment,
    }));

    if (type === 'orders') {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersData), 'Orders');
    } else if (type === 'batches') {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(batchesData), 'Batches');
    } else if (type === 'trees' || type === 'mother-trees') {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(treesData), 'Mother Trees');
    } else if (type === 'enquiries') {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(enquiriesData), 'Enquiries');
    } else if (type === 'audit' || type === 'inventory') {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(auditData), 'Inventory Audit');
    } else if (type === 'reviews' || type === 'farmer-reviews') {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reviewsData), 'Farmer Reviews');
    } else {
      // Complete export: all tabs included
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Overview Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersData), 'Customer Orders');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(batchesData), 'Batch Management');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(treesData), 'Mother Trees Registry');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(enquiriesData), 'Customer Enquiries');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(auditData), 'Inventory Audit Log');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reviewsData), 'Farmer Reviews');
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const today = new Date().toISOString().split('T')[0];
    const isFiltered = Boolean(search || (status && status !== 'ALL') || orderStartDate || orderEndDate || deliveryStartDate || deliveryEndDate);
    const filterTag = isFiltered ? '_Filtered' : '';
    const filename = `Eathamozhi_${type === 'all' ? 'Complete_Farm_Data' : type}${filterTag}_${today}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}

import { authenticate, authorize, requireMinimumRole, applyDataFilters } from './enhancedAuth.js';

// Simplified route protection configurations
export const routeProtection = {
  
  // Loan routes protection
  loans: {
    list: [authenticate, applyDataFilters],
    view: [authenticate, applyDataFilters],
    create: [authenticate],
    update: [authenticate, applyDataFilters],
    updateStage: [authenticate, applyDataFilters],
    delete: [authenticate, authorize('admin')],
    uploadDocument: [authenticate, applyDataFilters]
  },

  // Dashboard routes protection
  dashboard: {
    stats: [authenticate, applyDataFilters],
    performance: [authenticate, applyDataFilters],
    convertedLeads: [authenticate, applyDataFilters],
    export: [authenticate, requireMinimumRole('sales_manager')]
  },

  // User management routes protection
  users: {
    list: [authenticate, requireMinimumRole('sales_manager'), applyDataFilters],
    view: [authenticate, applyDataFilters],
    create: [authenticate, requireMinimumRole('sales_manager')],
    update: [authenticate, requireMinimumRole('sales_manager')],
    delete: [authenticate, authorize('admin')]
  },

  // Lead routes protection
  leads: {
    list: [authenticate, applyDataFilters],
    view: [authenticate, applyDataFilters],
    create: [authenticate],
    update: [authenticate, applyDataFilters],
    delete: [authenticate, requireMinimumRole('sales_manager')]
  }
};

// Apply protection to routes automatically
export const protectRoute = (module, action) => {
  const protection = routeProtection[module]?.[action];
  if (!protection) {
    console.warn(`No protection defined for ${module}.${action}`);
    return [authenticate, applyDataFilters]; // Default protection
  }
  return protection;
};

export default {
  routeProtection,
  protectRoute
};
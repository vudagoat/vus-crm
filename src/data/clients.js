export const clients = [
  { id: 1, name: 'Apex Creative Co.', projectType: 'Brand Identity', value: 4500, dueDate: '2026-05-15', status: 'active' },
  { id: 2, name: 'Horizon Labs', projectType: 'Web Design', value: 8200, dueDate: '2026-04-28', status: 'overdue' },
  { id: 3, name: 'Solaris Studio', projectType: 'E-commerce', value: 12000, dueDate: '2026-06-01', status: 'active' },
  { id: 4, name: 'Driftwood Agency', projectType: 'Landing Page', value: 2800, dueDate: '2026-05-03', status: 'review' },
  { id: 5, name: 'Nova Ventures', projectType: 'Brand Identity', value: 6500, dueDate: '2026-04-20', status: 'overdue' },
  { id: 6, name: 'Ember & Co.', projectType: 'Web Design', value: 9100, dueDate: '2026-07-10', status: 'active' },
  { id: 7, name: 'Cascade Digital', projectType: 'E-commerce', value: 15500, dueDate: '2026-06-30', status: 'active' },
  { id: 8, name: 'Prism Media', projectType: 'Rebranding', value: 7200, dueDate: '2026-05-22', status: 'review' },
  { id: 9, name: 'Fieldwork Studio', projectType: 'Landing Page', value: 1900, dueDate: '2026-04-18', status: 'completed' },
  { id: 10, name: 'Vantage Creative', projectType: 'Web Design', value: 5400, dueDate: '2026-08-01', status: 'active' },
];

export const deals = [
  { id: 1, client: 'Midnight Labs', type: 'Web Design', value: 9500, stage: 'Lead', avatar: 'ML', avatarColor: '#6366f1' },
  { id: 2, client: 'Oaktree Brand', type: 'Brand Identity', value: 4200, stage: 'Lead', avatar: 'OB', avatarColor: '#8b5cf6' },
  { id: 3, client: 'Pinewave Co.', type: 'E-commerce', value: 18000, stage: 'Lead', avatar: 'PC', avatarColor: '#06b6d4' },
  { id: 4, client: 'Terrain Studio', type: 'Landing Page', value: 3100, stage: 'Proposal', avatar: 'TS', avatarColor: '#f59e0b' },
  { id: 5, client: 'Summit Digital', type: 'Web Design', value: 11200, stage: 'Proposal', avatar: 'SD', avatarColor: '#10b981' },
  { id: 6, client: 'Basalt Creative', type: 'Rebranding', value: 8700, stage: 'Proposal', avatar: 'BC', avatarColor: '#ef4444' },
  { id: 7, client: 'Ember & Co.', type: 'Web Design', value: 9100, stage: 'Active', avatar: 'EC', avatarColor: '#f97316' },
  { id: 8, client: 'Cascade Digital', type: 'E-commerce', value: 15500, stage: 'Active', avatar: 'CD', avatarColor: '#14b8a6' },
  { id: 9, client: 'Prism Media', type: 'Rebranding', value: 7200, stage: 'Active', avatar: 'PM', avatarColor: '#a855f7' },
  { id: 10, client: 'Fieldwork Studio', type: 'Landing Page', value: 1900, stage: 'Closed', avatar: 'FS', avatarColor: '#22c55e' },
  { id: 11, client: 'Apex Creative', type: 'Brand Identity', value: 4500, stage: 'Closed', avatar: 'AC', avatarColor: '#6366f1' },
  { id: 12, client: 'Solaris Studio', type: 'E-commerce', value: 12000, stage: 'Closed', avatar: 'SS', avatarColor: '#3b82f6' },
];

export const chartData = {
  daily: [
    { label: 'Mon', current: 1200, previous: 980 },
    { label: 'Tue', current: 1850, previous: 1400 },
    { label: 'Wed', current: 1100, previous: 1650 },
    { label: 'Thu', current: 2400, previous: 1800 },
    { label: 'Fri', current: 3200, previous: 2100 },
    { label: 'Sat', current: 2800, previous: 2450 },
    { label: 'Sun', current: 1650, previous: 1220 },
  ],
  weekly: [
    { label: 'Wk 14', current: 8400, previous: 7200 },
    { label: 'Wk 15', current: 11200, previous: 9800 },
    { label: 'Wk 16', current: 9600, previous: 10500 },
    { label: 'Wk 17', current: 14200, previous: 11800 },
  ],
  monthly: [
    { label: 'Nov', current: 22100, previous: 18500 },
    { label: 'Dec', current: 19800, previous: 21000 },
    { label: 'Jan', current: 26300, previous: 19800 },
    { label: 'Feb', current: 21700, previous: 23100 },
    { label: 'Mar', current: 31200, previous: 21700 },
    { label: 'Apr', current: 24800, previous: 26300 },
  ],
};

export const invoices = [
  { id: 'INV-042', client: 'Apex Creative Co.', amount: 4500, issued: '2026-04-01', due: '2026-04-30', status: 'pending' },
  { id: 'INV-041', client: 'Cascade Digital', amount: 7750, issued: '2026-03-15', due: '2026-04-15', status: 'paid' },
  { id: 'INV-040', client: 'Nova Ventures', amount: 3250, issued: '2026-03-01', due: '2026-03-31', status: 'overdue' },
  { id: 'INV-039', client: 'Solaris Studio', amount: 6000, issued: '2026-03-01', due: '2026-03-31', status: 'paid' },
  { id: 'INV-038', client: 'Horizon Labs', amount: 4100, issued: '2026-02-15', due: '2026-03-15', status: 'overdue' },
  { id: 'INV-037', client: 'Ember & Co.', amount: 4550, issued: '2026-02-01', due: '2026-03-01', status: 'paid' },
  { id: 'INV-036', client: 'Driftwood Agency', amount: 2800, issued: '2026-01-20', due: '2026-02-20', status: 'paid' },
  { id: 'INV-035', client: 'Prism Media', amount: 3600, issued: '2026-01-01', due: '2026-02-01', status: 'paid' },
];

export const metrics = {
  revenueMTD: 24800,
  activeProjects: 8,
  pipelineValue: 142500,
  overdueCount: 2,
};

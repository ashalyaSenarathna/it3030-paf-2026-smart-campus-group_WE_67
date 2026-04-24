// Shared resource types and statuses used across Admin Dashboard and Resource Catalogue
// Update this file to add/remove types or statuses app-wide.

export const RESOURCE_TYPES = [
  'Lecture Hall',
  'Lab',
  'Meeting Room',
  'Sports Facility',
  'Sports Equipment',
  'Library',
  'Cafeteria',
  'Auditorium',
  'Office',
  'Equipment',
];

export const RESOURCE_STATUSES = [
  'Available',
  'Occupied',
  'Maintenance',
  'OUT_OF_SERVICE'
];

export const RESOURCE_TYPE_ICONS = {
  'Lecture Hall':    '🏛️',
  'Lab':             '💻',
  'Meeting Room':    '🏢',
  'Sports Facility': '🏟️',
  'Sports Equipment':'🏅',
  'Library':         '📚',
  'Cafeteria':       '🍽️',
  'Auditorium':      '🎭',
  'Office':          '🗂️',
  'Equipment':       '📦',
};

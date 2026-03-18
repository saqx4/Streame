export * from '../stores/servers';

export const isResumableServerKey = (key: string): boolean => {
  // In the dynamic paradigm, we can assume servers that support startAt 
  // parameter are resumable. For now, we return true to not break the UI.
  return true;
};

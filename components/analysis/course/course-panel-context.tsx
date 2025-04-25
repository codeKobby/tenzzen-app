'use client';

import React, { createContext, useContext } from 'react';

// Define the shape of the context
interface CoursePanelContextType {
  handleEnroll: () => Promise<void>;
  handleCancel: () => void;
  isEnrolling: boolean;
}

// Create the context with default values
export const CoursePanelContext = createContext<CoursePanelContextType>({
  handleEnroll: async () => {},
  handleCancel: () => {},
  isEnrolling: false,
});

// Optional: Create a hook to use this context
export const useCoursePanelContext = () => {
  const context = useContext(CoursePanelContext);
  if (!context) {
    throw new Error('useCoursePanelContext must be used within a CoursePanelProvider');
  }
  return context;
};
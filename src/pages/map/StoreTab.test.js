import React from 'react';
import { render, waitFor } from '@testing-library/react';
import StoreTab from './StoreTab';
import { collection, getDocs } from 'firebase/firestore';

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn()
}));

jest.mock('../../firebase', () => ({
  db: {}
}));

describe('StoreTab Firestore fetching', () => {
  it('fetches stores from Firestore on mount', async () => {
    const mockDocs = [
      {
        id: '1',
        data: () => ({
          "Business Name": "Test Store",
          "Rating": 4.0,
          "Address": "123 Test St",
          "imgLink": "/stores/store1.png"
        })
      }
    ];

    getDocs.mockResolvedValueOnce({
      docs: mockDocs
    });

    render(<StoreTab selectedStoreId={null} selectedStore={null} stores={[]} />);

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalledTimes(1);
      expect(collection).toHaveBeenCalledWith({}, 'stores');
    });
  });
});
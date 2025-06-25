// src/pages/map/HomeMap.test.js

// Mocks
jest.mock('../../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('axios');

jest.mock('./StoreTab', () => () => (
  <div data-testid="store-tab">Mock StoreTab</div>
));

jest.mock('../NavBar', () => () => (
  <div data-testid="navbar">Mock NavBar</div>
));

jest.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }) => <div data-testid="api-provider">{children}</div>,
  Map: ({ children }) => <div data-testid="map">{children}</div>,
  AdvancedMarker: ({ children, title, onClick }) => (
    <div onClick={onClick} data-testid="marker">
      {title}
      {children}
    </div>
  ),
  Pin: () => <div data-testid="pin" />,
  InfoWindow: ({ children }) => <div data-testid="info-window">{children}</div>,
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import HomeMap from './HomeMap';
import '@testing-library/jest-dom';
import { getDocs } from 'firebase/firestore';

describe('HomeMap Component', () => {
  beforeEach(() => {
    // Mock store data returned from Firestore
    getDocs.mockResolvedValue({
      docs: [
        {
          id: '1',
          data: () => ({
            'Business Name': 'Mock Store',
            Latitude: '39.9526',
            Longitude: '-75.1652',
            Rating: 4.7,
            Address: '123 Main St',
            imgLink: '/img/default.jpg',
          }),
        },
      ],
    });
  });

  it('renders the Philadelphia header', async () => {
    render(<HomeMap />);
    expect(screen.getByText(/Philadelphia/i)).toBeInTheDocument();
  });

  it('renders the map and StoreTab', async () => {
    render(<HomeMap />);
    expect(screen.getByTestId('store-tab')).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });

  it('displays store after fetching Firestore data', async () => {
    render(<HomeMap />);
    await waitFor(() => {
      expect(screen.getByText(/Mock Store/i)).toBeInTheDocument();
    });
  });
});
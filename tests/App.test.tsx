import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { ModalProvider } from '../contexts/ModalContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import React from 'react';
import './setup.ts';

// Mock child components that are complex or irrelevant to the App logic test
vi.mock('../components/Dashboard', () => ({ default: () => <div>Dashboard View</div> }));
vi.mock('../components/PortfolioView', () => ({ default: () => <div>Portfolio View</div> }));
vi.mock('../components/ActionsView', () => ({ default: () => <div>Actions View</div> }));
vi.mock('../components/AccountingView', () => ({ default: () => <div>Accounting View</div> }));
vi.mock('../components/SettingsView', () => ({ default: () => <div>Settings View</div> }));

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();

    // Mock the fetch API to prevent network errors and provide a stable response
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: 'success', rates: { TRY: 33.0 } }),
      })
    ));
    
    // Create a root element for the notification portal
    const notificationRoot = document.createElement('div');
    notificationRoot.id = 'notification-root';
    document.body.appendChild(notificationRoot);

    // Mock window.matchMedia for ThemeProvider which uses it
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false, // Default to light mode for tests
        media: query,
        onchange: null,
        addListener: vi.fn(), 
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    // Restore all mocks and clean up the DOM after each test
    vi.restoreAllMocks();
    const notificationRoot = document.getElementById('notification-root');
    if (notificationRoot) {
      document.body.removeChild(notificationRoot);
    }
  });

  const renderApp = () => {
    // Wrap App in all required providers to simulate the real app environment
    render(
      <React.StrictMode>
        <ThemeProvider>
          <ModalProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </ModalProvider>
        </ThemeProvider>
      </React.StrictMode>
    );
  };

  it('renders the Dashboard view by default', async () => {
    renderApp();
    expect(await screen.findByText('Dashboard View')).toBeInTheDocument();
  });

  it('loads data from localStorage on initial render', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const mockTransactions = [{ id: '1', ticker: 'TEST', type: 'BUY', quantity: 1, price: 1, date: '2023-01-01' }];
    localStorage.setItem('transactions', JSON.stringify(mockTransactions));
    
    renderApp();
    
    // Wait for effects to run, ensuring component is fully mounted
    await waitFor(() => {
      expect(getItemSpy).toHaveBeenCalledWith('transactions');
      expect(getItemSpy).toHaveBeenCalledWith('stockPrices');
      expect(getItemSpy).toHaveBeenCalledWith('currentUsdTryRate');
    });
  });

  it('saves data to localStorage on mount', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderApp();
    
    // useEffects that save to localStorage run after the initial render.
    // We need to wait for these effects to fire.
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('transactions', '[]');
      expect(setItemSpy).toHaveBeenCalledWith('stockPrices', '{}');
      expect(setItemSpy).toHaveBeenCalledWith('currentUsdTryRate', expect.any(String));
    });
  });

  it('switches to the Portfolio view when the navigation button is clicked', async () => {
    const user = userEvent.setup();
    renderApp();
    
    expect(await screen.findByText('Dashboard View')).toBeInTheDocument();

    const portfolioButtons = screen.getAllByRole('button', { name: 'Portfolio' });
    await user.click(portfolioButtons[0]);

    expect(await screen.findByText('Portfolio View')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard View')).not.toBeInTheDocument();
  });
  
  it('switches to the Accounting view via the bottom nav bar', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Dashboard View')).toBeInTheDocument();

    const accountingButtons = screen.getAllByRole('button', { name: /Accounting/i });
    await user.click(accountingButtons[0]);

    expect(await screen.findByText('Accounting View')).toBeInTheDocument();
  });

  it('toggles the settings view', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Dashboard View')).toBeInTheDocument();

    const settingsButton = screen.getByRole('button', { name: /Toggle settings/i });
    
    // Open settings
    await user.click(settingsButton);
    expect(await screen.findByText('Settings View')).toBeInTheDocument();

    // Close settings
    await user.click(settingsButton);
    
    // Wait for settings to disappear and dashboard to reappear
    await waitFor(() => {
      expect(screen.queryByText('Settings View')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Dashboard View')).toBeInTheDocument();
  });
});
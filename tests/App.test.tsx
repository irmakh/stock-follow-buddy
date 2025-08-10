/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { ModalProvider } from '../contexts/ModalContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import React from 'react';

// Mock child components that are complex or irrelevant to the App logic test
vi.mock('../components/Dashboard', () => ({ default: () => <div data-testid="dashboard-view">Dashboard View</div> }));
vi.mock('../components/PortfolioView', () => ({ default: () => <div data-testid="portfolio-view">Portfolio View</div> }));
vi.mock('../components/ActionsView', () => ({ default: () => <div data-testid="actions-view">Actions View</div> }));
vi.mock('../components/AccountingView', () => ({ default: () => <div data-testid="accounting-view">Accounting View</div> }));
vi.mock('../components/SettingsView', () => ({ default: () => <div data-testid="settings-view">Settings View</div> }));

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
    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();
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
    
    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();

    const portfolioButtons = screen.getAllByRole('button', { name: 'Portfolio' });
    // In the test environment without CSS, both header and bottom nav buttons are rendered.
    // The test should target a specific button. We choose the last one found, which
    // corresponds to the BottomNavBar button, ensuring consistent test behavior.
    await user.click(portfolioButtons[portfolioButtons.length - 1]);

    expect(await screen.findByTestId('portfolio-view')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-view')).not.toBeInTheDocument();
  });
  
  it('switches to the Accounting view via the bottom nav bar', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();

    const accountingButtons = screen.getAllByRole('button', { name: /Accounting/i });
    // In the test environment, multiple "Accounting" buttons exist (header, bottom nav).
    // We click the last one, which corresponds to the BottomNavBar, matching the test's intent.
    await user.click(accountingButtons[accountingButtons.length - 1]);

    expect(await screen.findByTestId('accounting-view')).toBeInTheDocument();
  });

  it('toggles the settings view', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();

    const settingsButton = screen.getByRole('button', { name: /Toggle settings/i });
    
    // Open settings
    await user.click(settingsButton);
    expect(await screen.findByTestId('settings-view')).toBeInTheDocument();

    // Close settings
    await user.click(settingsButton);
    
    // Wait for settings to disappear and dashboard to reappear
    await waitFor(() => {
      expect(screen.queryByTestId('settings-view')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
  });
});
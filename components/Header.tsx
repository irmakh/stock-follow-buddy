

import React from 'react';

type View = 'dashboard' | 'transactions' | 'actions' | 'accounting' | 'settings';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
  toggleSettingsView: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, toggleSettingsView }) => {

    const NavButton: React.FC<{viewName: 'dashboard' | 'transactions' | 'actions' | 'accounting', children: React.ReactNode}> = ({viewName, children}) => {
        const isActive = activeView === viewName;
        return (
             <button
                onClick={() => setActiveView(viewName)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {children}
            </button>
        )
    }

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span role="img" aria-label="money bag" className="text-2xl">💰</span>
              <span className="hidden sm:inline">Stock Follow Buddy</span>
            </h1>
            <nav className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                <NavButton viewName='dashboard'>Dashboard</NavButton>
                <NavButton viewName='transactions'>Portfolio</NavButton>
                <NavButton viewName='actions'>Actions</NavButton>
                <NavButton viewName='accounting'>Accounting</NavButton>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSettingsView}
              className={`p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-blue-500 ${activeView === 'settings' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              aria-label="Toggle settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CustomerContext = createContext();

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

const read = (key) => {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
};

const write = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch { /* ignore */ }
};

/**
 * Lightweight, password-less customer identity: a phone number (plus an optional
 * name and the current table). Persisted locally so orders can be linked to a
 * phone number and the guest can look up history on any device with that number.
 */
export const CustomerProvider = ({ children }) => {
  const [phone, setPhone] = useState(() => read('customerPhone'));
  const [name, setName] = useState(() => read('customerName'));
  const [tableNumber, setTableNumber] = useState(() => read('customerTable'));

  const setCustomer = useCallback(({ phone: nextPhone, name: nextName }) => {
    const cleanPhone = String(nextPhone || '').trim();
    const cleanName = String(nextName || '').trim();
    setPhone(cleanPhone);
    setName(cleanName);
    write('customerPhone', cleanPhone);
    write('customerName', cleanName);
  }, []);

  const setTable = useCallback((nextTable) => {
    const value = nextTable === null || nextTable === undefined ? '' : String(nextTable).trim();
    setTableNumber(value);
    write('customerTable', value);
  }, []);

  const clearCustomer = useCallback(() => {
    setPhone('');
    setName('');
    write('customerPhone', '');
    write('customerName', '');
  }, []);

  const value = useMemo(
    () => ({
      phone,
      name,
      tableNumber,
      isKnown: Boolean(phone),
      setCustomer,
      setTable,
      clearCustomer,
    }),
    [phone, name, tableNumber, setCustomer, setTable, clearCustomer]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
};

export default CustomerContext;

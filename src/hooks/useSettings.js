import { useState, useEffect } from 'react';
import { getCompanyData } from '../services/firebaseService';

export const useSettings = (userId) => {
  const [settings, setSettings] = useState({
    nombre: '',
    rfc: '',
    direccion: '',
    direccion2: '',
    telefono: '',
    logo: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await getCompanyData(userId);
        if (data) {
          setSettings({
            nombre: data.nombre || '',
            rfc: data.rfc || '',
            direccion: data.direccion || '',
            direccion2: data.direccion2 || '',
            telefono: data.telefono || '',
            logo: data.logo || ''
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userId]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  return { settings, loading, updateSettings };
};

import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export function useStoreSettings() {
  const [settings, setSettings] = useState({
    storeStatus: 'open', // 'open' | 'closed'
    closedMessage: '',
    shippingMin: 100,
    bannerUrl: '',
    loading: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*');
        if (error) throw error;

        if (data) {
          const configMap = {};
          data.forEach(item => configMap[item.key] = item.value);

          setSettings({
            storeStatus: configMap.store_status || 'open',
            closedMessage: configMap.store_closed_message || 'Estamos cerrados por el momento.',
            shippingMin: Number(configMap.shipping_min_value) || 100,
            bannerUrl: configMap.home_banner || '',
            loading: false
          });
        }
      } catch (err) {
        console.error("Error cargando configuración:", err);
        setSettings(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSettings();
  }, []);

  return settings;
}
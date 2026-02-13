import { useState, useEffect } from 'react';
import { db } from '../firebase/client';
import { collection, onSnapshot } from 'firebase/firestore';

export function useStoreSettings() {
  const [settings, setSettings] = useState({
    storeStatus: 'open',
    closedMessage: '',
    bannerUrl: '',
    whatsappNumber: '5554993294396', // Valor por defecto
    topBarText: '',
    topBarActive: false,
    shippingMin: 0,
    pixKey: ''
  });

  useEffect(() => {
    // Escuchamos la colección "site_settings" en tiempo real
    const unsubscribe = onSnapshot(collection(db, "site_settings"), (snapshot) => {
      const data = {};
      
      snapshot.forEach((doc) => {
        // Mapeamos: ID del documento -> Valor
        data[doc.id] = doc.data().value;
      });

      // Actualizamos el estado con los datos reales de Firebase
      setSettings({
        storeStatus: data.store_status || 'open',
        closedMessage: data.store_closed_message || 'Cerrado temporalmente',
        bannerUrl: data.home_banner || '', // Aquí llega la imagen Base64
        whatsappNumber: data.whatsapp_number || '',
        topBarText: data.top_bar_text || '',
        topBarActive: data.top_bar_active === 'true',
        shippingMin: Number(data.shipping_min_value) || 0,
        pixKey: data.pix_key || ''
      });
    });

    return () => unsubscribe();
  }, []);

  return settings;
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { requestNotificationPermission, getFCMToken, initializeMessaging, setupForegroundMessageHandler } from '@/lib/firebase';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        await initializeMessaging();
      }
    };

    checkSupport();
  }, []);

  useEffect(() => {
    // Setup foreground message handler
    setupForegroundMessageHandler((payload) => {
      toast.info(payload.notification?.title || 'Nova notificação', {
        description: payload.notification?.body
      });
    });
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    setIsLoading(true);

    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          await saveToken(token);
          toast.success('Notificações ativadas com sucesso!');
          return true;
        } else {
          toast.error('Erro ao obter token de notificação');
          return false;
        }
      } else if (result === 'denied') {
        toast.error('Permissão de notificações negada. Ative nas configurações do navegador.');
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Erro ao solicitar permissão de notificações');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const saveToken = async (token: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        return false;
      }

      // Check if token already exists
      const { data: existing } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('token', token)
        .single();

      if (existing) {
        // Update timestamp
        await supabase
          .from('device_tokens')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Insert new token
        const { error } = await supabase
          .from('device_tokens')
          .insert({
            user_id: user.id,
            token: token,
            platform: 'web'
          });

        if (error) {
          console.error('Error saving token:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  };

  const removeToken = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !fcmToken) {
        return false;
      }

      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', fcmToken);

      if (error) {
        console.error('Error removing token:', error);
        return false;
      }

      setFcmToken(null);
      return true;
    } catch (error) {
      console.error('Error removing token:', error);
      return false;
    }
  };

  return {
    permission,
    isSupported,
    isLoading,
    fcmToken,
    requestPermission,
    removeToken
  };
};

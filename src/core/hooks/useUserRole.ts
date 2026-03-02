import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsDeveloper(false);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Check if user is developer
        const { data: devData } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'developer'
        });

        // Check if user is admin
        const { data: adminData } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        setIsDeveloper(devData || false);
        setIsAdmin(adminData || false);
      } catch (error) {
        console.error('Error checking user roles:', error);
        setIsDeveloper(false);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRoles();
  }, []);

  return { isDeveloper, isAdmin, isLoading };
};

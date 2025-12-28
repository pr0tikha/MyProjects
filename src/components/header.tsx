'use client';

import { Bell, Wallet, BellRing, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Expense } from '@/lib/types';
import { requestNotificationPermission } from '@/firebase/messaging';
import { useAuth, useFirestore, useUser, useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onNotificationClick: () => void;
  expenses: Expense[];
}

export default function Header({ onNotificationClick, expenses }: HeaderProps) {
  const totalUpcoming = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const auth = useAuth();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { user } = useUser();
  const { toast } = useToast();
  const [notificationStatus, setNotificationStatus] = useState<string>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!user || !firestore || !firebaseApp) return;
    try {
      await requestNotificationPermission(firebaseApp, firestore, user.uid);
      setNotificationStatus('granted');
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive payment reminders.',
      });
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setNotificationStatus('denied');
      toast({
        variant: 'destructive',
        title: 'Notification Error',
        description:
          'Failed to enable notifications. Please check your browser settings.',
      });
    }
  };

  const renderNotificationButton = () => {
    switch (notificationStatus) {
      case 'granted':
        return (
          <Button variant="ghost" size="icon" disabled>
            <BellRing className="h-6 w-6 text-green-500" />
          </Button>
        );
      case 'denied':
        return (
          <Button variant="ghost" size="icon" disabled>
            <BellOff className="h-6 w-6 text-red-500" />
          </Button>
        );
      default:
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableNotifications}
          >
            <Bell className="mr-2 h-4 w-4" /> Enable Notifications
          </Button>
        );
    }
  };

  return (
    <header className="p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary">PayMind</h1>
        <div className="flex items-center gap-2">
          {renderNotificationButton()}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNotificationClick}
            aria-label="Show notifications"
          >
            <Bell className="h-6 w-6" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-lg">
        <div className="p-3 bg-primary/10 rounded-full">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-400">Upcoming Payments</p>
          <p className="text-xl font-semibold">${totalUpcoming.toFixed(2)}</p>
        </div>
      </div>
    </header>
  );
}

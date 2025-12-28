"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onNotificationClick: () => void;
}

export default function Header({ onNotificationClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-primary">PayMind</h1>
      <Button variant="ghost" size="icon" onClick={onNotificationClick} aria-label="Show notifications">
        <Bell className="h-6 w-6" />
      </Button>
    </header>
  );
}

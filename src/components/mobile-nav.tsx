
"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Menu } from 'lucide-react';

interface NavItem {
    value: string;
    label: string;
    icon: React.ElementType;
    disabled: boolean;
    visible?: boolean;
}

interface MobileNavProps {
    navItems: NavItem[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function MobileNav({ navItems, activeTab, onTabChange }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleTabClick = (tab: string) => {
        onTabChange(tab);
        setIsOpen(false);
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-2 pt-6">
                    {navItems.filter(item => item.visible !== false).map(item => (
                        <Button
                            key={item.value}
                            variant={activeTab === item.value ? 'default' : 'ghost'}
                            disabled={item.disabled}
                            onClick={() => handleTabClick(item.value)}
                            className="justify-start text-lg p-6"
                        >
                            <item.icon className="mr-4 h-5 w-5" />
                            {item.label}
                        </Button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}

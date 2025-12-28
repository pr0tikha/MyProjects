
"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Sparkles } from "lucide-react";

import type { Expense, ExpenseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { getSuggestedTime } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { categoryIcons } from "./icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  dueDate: z.date({ required_error: "A due date is required." }),
  category: z.enum([
    "Housing",
    "Utilities",
    "Subscriptions",
    "Insurance",
    "Debt",
    "Transportation",
    "Food",
    "Pet Care",
    "Childcare",
    "Business",
    "Travel",
    "Other",
    "Health"
  ]),
  recurrence: z.enum(["One-off", "Monthly"]),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
});

interface ExpenseFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: Omit<Expense, 'id' | 'status'>) => void;
  expense: Expense | null;
}

export default function ExpenseForm({
  isOpen,
  onOpenChange,
  onSave,
  expense,
}: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<{ time: string; reason: string } | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      amount: 0,
      recurrence: "Monthly",
      category: "Utilities",
      reminderTime: "09:00",
    },
  });

  const { setValue, watch } = form;
  const watchedCategory = watch("category");
  const watchedDueDate = watch("dueDate");


  useEffect(() => {
    if (expense) {
      form.reset({
        ...expense,
        amount: expense.amount,
      });
    } else {
      form.reset({
        title: "",
        amount: undefined,
        dueDate: new Date(),
        recurrence: "Monthly",
        category: "Utilities",
        reminderTime: "09:00",
      });
    }
    setSuggestion(null);
    setIsCalendarOpen(false);
  }, [expense, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
  };
  
  const handleSuggestTime = () => {
    if (!watchedDueDate || !watchedCategory) return;
    startTransition(async () => {
      setSuggestion(null);
      const result = await getSuggestedTime({
        paymentType: watchedCategory,
        paymentDueDate: format(watchedDueDate, 'yyyy-MM-dd'),
        userWakeUpTime: '7:00 AM'
      });
      if (result.success && result.data) {
        setSuggestion({ time: result.data.reminderTime, reason: result.data.reasoning });
      }
    });
  }

  const applySuggestion = () => {
    if (suggestion) {
        // AI can return "6:00 PM", which needs parsing.
        const parsedDate = parse(suggestion.time, 'h:mm a', new Date());
        // Then format to "HH:mm" for the input
        const formattedTime = format(parsedDate, 'HH:mm');
        setValue('reminderTime', formattedTime, { shouldValidate: true });
        setSuggestion(null);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{expense ? "Edit Expense" : "Add New Expense"}</SheetTitle>
          <SheetDescription>
            {expense ? "Update the details of your expense." : "Log a new expense to get reminders."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-grow pr-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Monthly Rent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {(Object.keys(categoryIcons) as ExpenseCategory[]).map(cat => {
                            const Icon = categoryIcons[cat];
                            return (
                                <SelectItem key={cat} value={cat}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" /> {cat}
                                    </div>
                                </SelectItem>
                            )
                        })}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                   <Collapsible open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <CollapsibleTrigger asChild>
                             <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-0">
                            <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                field.onChange(date);
                                setIsCalendarOpen(false);
                                }}
                                disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0); // Set to start of today
                                    return date < today;
                                }}
                                initialFocus
                            />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurrence</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="One-off">One-off</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reminderTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
             <div className="space-y-2">
                 <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleSuggestTime} disabled={isPending || !watchedDueDate}>
                   {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />}
                   Suggest a time with AI
                 </Button>
                 {isPending && <p className="text-sm text-center text-muted-foreground">Thinking...</p>}
                 {suggestion && (
                     <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle>AI Suggestion: {suggestion.time}</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2">
                            {suggestion.reason}
                            <Button size="sm" variant="secondary" className="mt-2" onClick={applySuggestion}>Apply Suggestion</Button>
                        </AlertDescription>
                    </Alert>
                 )}
             </div>
          </form>
        </Form>
        <SheetFooter className="mt-4">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

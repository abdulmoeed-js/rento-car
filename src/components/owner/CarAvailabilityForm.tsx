
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CarFormData } from "@/types/owner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarX, CalendarCheck } from "lucide-react";

const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

const formSchema = z.object({
  available_days: z.array(z.string()).min(1, "Select at least one day"),
  available_hours: z.object({
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format")
  }),
  custom_availability: z.array(
    z.object({
      date: z.date(),
      available: z.boolean()
    })
  ).optional()
});

interface CarAvailabilityFormProps {
  formData: Partial<CarFormData>;
  updateFormData: (data: Partial<CarFormData>, isValid: boolean) => void;
}

const CarAvailabilityForm: React.FC<CarAvailabilityFormProps> = ({ formData, updateFormData }) => {
  const [availabilityMode, setAvailabilityMode] = useState<'weekly' | 'custom'>('weekly');
  const [customDates, setCustomDates] = useState<{date: Date, available: boolean}[]>(
    formData.custom_availability || []
  );
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      available_days: formData.available_days || daysOfWeek.map(day => day.id),
      available_hours: formData.available_hours || { start: '08:00', end: '20:00' },
      custom_availability: formData.custom_availability || []
    }
  });

  const { watch, formState } = form;
  const watchedValues = watch();
  const { isValid } = formState;

  // Initialize custom dates
  useEffect(() => {
    if (formData.custom_availability && formData.custom_availability.length > 0) {
      setCustomDates(formData.custom_availability);
      setAvailabilityMode('custom');
    }
  }, [formData.custom_availability]);

  // Handle day selection
  const handleDaySelection = (day: string) => {
    const currentDays = form.getValues().available_days;
    const index = currentDays.indexOf(day);
    
    if (index > -1) {
      if (currentDays.length > 1) {
        // Remove day if it's not the last one
        const newDays = [...currentDays];
        newDays.splice(index, 1);
        form.setValue('available_days', newDays);
      }
    } else {
      // Add day
      form.setValue('available_days', [...currentDays, day]);
    }
    
    form.trigger('available_days');
  };

  // Handle date selection in calendar
  const handleDateSelect = (date: Date, isAvailable: boolean) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const newCustomDates = [...customDates];
    
    // Check if date already exists
    const existingIndex = newCustomDates.findIndex(
      item => format(item.date, 'yyyy-MM-dd') === dateString
    );
    
    if (existingIndex > -1) {
      // Update existing date
      newCustomDates[existingIndex] = { date, available: isAvailable };
    } else {
      // Add new date
      newCustomDates.push({ date, available: isAvailable });
    }
    
    setCustomDates(newCustomDates);
    form.setValue('custom_availability', newCustomDates);
  };

  // Check if a date is marked as available or unavailable
  const getDateAvailability = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const found = customDates.find(
      item => format(item.date, 'yyyy-MM-dd') === dateString
    );
    
    return found ? found.available : null;
  };

  // Custom day render function for calendar
  const renderDay = (day: Date) => {
    const availability = getDateAvailability(day);
    let className = '';
    
    if (availability === true) {
      className = 'bg-green-100 text-green-800 hover:bg-green-200';
    } else if (availability === false) {
      className = 'bg-red-100 text-red-800 hover:bg-red-200';
    }
    
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        {day.getDate()}
      </div>
    );
  };

  // Update parent component with form data when values change
  useEffect(() => {
    const formData = {
      ...watchedValues,
      custom_availability: availabilityMode === 'custom' ? customDates : undefined
    };
    
    updateFormData(formData, isValid);
  }, [watchedValues, isValid, customDates, availabilityMode, updateFormData]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Tabs 
          defaultValue={availabilityMode} 
          onValueChange={(value) => setAvailabilityMode(value as 'weekly' | 'custom')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="custom">Custom Calendar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="available_days"
              render={() => (
                <FormItem>
                  <FormLabel>Available Days</FormLabel>
                  <FormDescription>
                    Select the days of the week your car is available for rent
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {daysOfWeek.map((day) => {
                      const days = form.getValues().available_days || [];
                      return (
                        <div
                          key={day.id}
                          className={`
                            flex items-center justify-center p-3 rounded-md cursor-pointer border
                            ${days.includes(day.id) 
                              ? 'bg-rento-blue text-white'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }
                          `}
                          onClick={() => handleDaySelection(day.id)}
                        >
                          {day.label}
                        </div>
                      );
                    })}
                  </div>
                  {form.formState.errors.available_days && (
                    <FormMessage>
                      {form.formState.errors.available_days.message}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="available_hours.start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="available_hours.end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-6 pt-4">
            <div className="text-center space-y-4">
              <FormDescription>
                Mark specific dates as available or unavailable in the calendar below
              </FormDescription>
              
              <div className="flex justify-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center"
                  onClick={() => {
                    const today = new Date();
                    handleDateSelect(today, false);
                  }}
                >
                  <CalendarX className="mr-2 h-4 w-4 text-red-500" />
                  Mark Unavailable
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center"
                  onClick={() => {
                    const today = new Date();
                    handleDateSelect(today, true);
                  }}
                >
                  <CalendarCheck className="mr-2 h-4 w-4 text-green-500" />
                  Mark Available
                </Button>
              </div>
              
              <div className="flex justify-center mt-4">
                <Calendar
                  mode="single"
                  onSelect={(date) => date && handleDateSelect(date, true)}
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  className="p-3 pointer-events-auto rounded-md border"
                  components={{
                    Day: ({ date, ...props }) => (
                      <button
                        {...props}
                        className={`w-9 h-9 ${props.className}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const availability = getDateAvailability(date);
                          // Toggle or set availability
                          handleDateSelect(date, availability === null || availability === false);
                        }}
                      >
                        {renderDay(date)}
                      </button>
                    ),
                  }}
                />
              </div>
              
              <div className="flex justify-center items-center space-x-4 mt-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 mr-1"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 mr-1"></div>
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-white border mr-1"></div>
                  <span>Default</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">Availability Notes</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Your car will only be shown to renters for dates you mark as available</li>
            <li>You can always update your availability later</li>
            <li>Your car won't be double-booked, as the system automatically blocks dates when someone books your car</li>
            <li>For the custom calendar, dates not marked are treated according to your weekly schedule</li>
          </ul>
        </div>
      </form>
    </Form>
  );
};

export default CarAvailabilityForm;

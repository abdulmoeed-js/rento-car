
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logInfo, logError, LogType } from "@/utils/logger";
import { Booking } from "@/types/car";

interface BookingActionsProps {
  bookings: Booking[];
  onRefresh: () => void;
}

export const BookingActions: React.FC<BookingActionsProps> = ({ bookings, onRefresh }) => {
  const exportToCSV = () => {
    logInfo(LogType.ADMIN, "Exporting bookings to CSV");
    try {
      // Format bookings data for CSV
      const csvData = bookings.map(booking => ({
        id: booking.id,
        car: booking.cars ? `${booking.cars.brand || 'Unknown'} ${booking.cars.model || 'Car'}` : 'Unknown Car',
        user: booking.profiles?.full_name || 'Unknown User',
        status: booking.status,
        start_date: booking.start_date,
        end_date: booking.end_date,
        location: booking.cars?.location || 'Unknown',
        price: booking.cars?.price_per_day || 0,
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `bookings-${new Date().toISOString().split('T')[0]}.csv`);
      a.click();
      URL.revokeObjectURL(url);
      
      logInfo(LogType.ADMIN, "Bookings exported successfully", { count: bookings.length });
      toast.success("Bookings exported successfully");
    } catch (error) {
      logError(LogType.ADMIN, "Error exporting bookings", { error });
      toast.error("Failed to export bookings");
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={onRefresh} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <Button onClick={exportToCSV} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export to CSV
      </Button>
    </div>
  );
};

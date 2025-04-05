
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { logInfo, LogType } from "@/utils/logger";
import { Booking } from "@/types/car";
import { BookingFilters } from "./BookingFilters";
import { BookingTable } from "./BookingTable";
import { BookingActions } from "./BookingActions";
import { fetchBookings } from "@/services/BookingDataService";

export const BookingsTab: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [flaggedFilter, setFlaggedFilter] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { bookings: fetchedBookings, locations: fetchedLocations } = await fetchBookings(
        statusFilter,
        locationFilter,
        flaggedFilter
      );
      setBookings(fetchedBookings);
      setLocations(fetchedLocations);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter, locationFilter, flaggedFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Bookings Management</h2>
        <BookingActions bookings={bookings} onRefresh={loadBookings} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <BookingFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            flaggedFilter={flaggedFilter}
            setFlaggedFilter={setFlaggedFilter}
            locations={locations}
          />
          <BookingTable bookings={bookings} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

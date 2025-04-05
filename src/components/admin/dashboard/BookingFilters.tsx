
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BookingFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  flaggedFilter: boolean;
  setFlaggedFilter: (value: boolean) => void;
  locations: string[];
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  locationFilter,
  setLocationFilter,
  flaggedFilter,
  setFlaggedFilter,
  locations,
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-6">
      <div className="w-full lg:w-1/3">
        <label className="block text-sm font-medium mb-1">Status</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full lg:w-1/3">
        <label className="block text-sm font-medium mb-1">Location</label>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full lg:w-1/3 flex items-end">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="flagged"
            checked={flaggedFilter}
            onChange={() => setFlaggedFilter(!flaggedFilter)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="flagged" className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
            Show Flagged Only
          </label>
        </div>
      </div>
    </div>
  );
};

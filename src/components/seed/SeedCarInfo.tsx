
import React from "react";

interface SeedCarInfoProps {
  log: string[];
  isComplete: boolean;
}

import { CheckCircle2 } from "lucide-react";

export const SeedCarInfo: React.FC<SeedCarInfoProps> = ({ log, isComplete }) => {
  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-md">
        <p className="font-medium mb-2">This tool will:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Find or create a host user</li>
          <li>Add 5 sample cars with different characteristics</li>
          <li>Link the cars to the host user</li>
          <li>Add sample images to each car</li>
          <li>Set up car tags for the Wheelationship feature</li>
        </ul>
      </div>

      {log.length > 0 && (
        <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm overflow-auto max-h-60">
          {log.map((entry, index) => (
            <div key={index} className="leading-relaxed">
              &gt; {entry}
            </div>
          ))}
        </div>
      )}

      {isComplete && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
          <div>
            <p className="font-medium">Database seeded successfully!</p>
            <p className="text-sm mt-1">You can now browse the cars in the car listing page or try the Wheelationship feature.</p>
          </div>
        </div>
      )}
    </div>
  );
};

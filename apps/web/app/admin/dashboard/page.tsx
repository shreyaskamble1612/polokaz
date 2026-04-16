"use client";

import { Button } from "@/components/ui/button";
import { CreateReferralDialog } from "@/components/create-referral-dialog";
import {
  PlusIcon,
  PersonIcon,
  BarChartIcon,
  GearIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";

export default function Page() {
  return (
    <main className="px-20 py-36">
      <h1 className="text-4xl tracking-tighter font-semibold flex items-center gap-3">
        <GearIcon className="h-8 w-8" />
        Admin test panel
      </h1>

      <div className="my-16 space-y-4">
        <CreateReferralDialog>
          <Button className="rounded-full tracking-tight">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create referral link
          </Button>
        </CreateReferralDialog>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Button variant="outline" className="h-24 flex-col gap-2">
            <PersonIcon className="h-6 w-6" />
            <span>Manage Users</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <BarChartIcon className="h-6 w-6" />
            <span>View Analytics</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <ReaderIcon className="h-6 w-6" />
            <span>Content Manager</span>
          </Button>
        </div>
      </div>
    </main>
  );
}

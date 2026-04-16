import { CreateReferralDialog } from "@/components/create-referral-dialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="h-screen flex items-center px-6">
      <div className="w-full h-96 md:h-[90vh] bg-primary rounded-4xl flex items-center px-12 justify-center">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl md:text-6xl tracking-tighter text-primary-foreground font-medium max-w-2xl">
            Unlock More Benefits
          </h1>
          <p className="text-xl md:text-2xl tracking-tighter text-primary-foreground">
            With Polokaz’s Referral Program
          </p>

          <CreateReferralDialog>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full text-base md:my-4 my-4"
            >
              Invite friends
            </Button>
          </CreateReferralDialog>
        </div>
      </div>
    </div>
  );
}

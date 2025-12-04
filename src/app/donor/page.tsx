import { AuthGate } from '@/components/AuthGate';
import { RoleGate } from '@/components/RoleGate';
import { DonationForm } from '@/components/donor/DonationForm';
import { DonationHistory } from '@/components/donor/DonationHistory';

export default function DonorPage() {
  return (
    <AuthGate>
      <RoleGate role="donor">
        <div className="space-y-8">
          <DonationForm />
          <section>
            <h3 className="mb-3 text-xl font-semibold">Recent donations</h3>
            <DonationHistory />
          </section>
        </div>
      </RoleGate>
    </AuthGate>
  );
}

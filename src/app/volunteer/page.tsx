import { AuthGate } from '@/components/AuthGate';
import { RoleGate } from '@/components/RoleGate';
import { VolunteerFeed } from '@/components/volunteer/VolunteerFeed';

export default function VolunteerPage() {
  return (
    <AuthGate>
      <RoleGate role="volunteer">
        <VolunteerFeed />
      </RoleGate>
    </AuthGate>
  );
}

import { WizardStep } from "@/components/quiz/wizard-step";
import { ProfileForm } from "@/components/quiz/profile-form";

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <WizardStep step={2} label="About you" />
      <ProfileForm />
    </div>
  );
}

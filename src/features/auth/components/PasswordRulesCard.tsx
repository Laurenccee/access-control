import { Card, CardContent } from '@/components/ui/card';
import { SquareCheck, SquareDashed, SquareX } from 'lucide-react';

interface PasswordRulesProps {
  rules: {
    minLen: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    mustMatch?: boolean;
  };
}

export default function PasswordRulesCard({ rules }: PasswordRulesProps) {
  return (
    <Card className="bg-accent">
      <CardContent className="flex flex-col gap-2">
        <span className="text-sm">Your password must contain:</span>
        <div className="flex mx-2 flex-col">
          <RuleItem label="At least 8 characters long" isMet={rules.minLen} />
          <RuleItem
            label="At least one uppercase letter"
            isMet={rules.uppercase}
          />
          <RuleItem
            label="At least one lowercase letter"
            isMet={rules.lowercase}
          />
          <RuleItem label="At least one number" isMet={rules.number} />
          {rules.mustMatch !== undefined && (
            <RuleItem label="Passwords match" isMet={rules.mustMatch} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RuleItem({ label, isMet }: { label: string; isMet: boolean }) {
  return (
    <p
      className={`flex items-center gap-2 text-sm transition-colors duration-200 ${isMet ? 'text-green-600' : 'text-red-500'}`}
    >
      {isMet ? <SquareCheck size={16} /> : <SquareDashed size={16} />}

      {label}
    </p>
  );
}

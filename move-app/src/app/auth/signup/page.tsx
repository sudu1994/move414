import { SignUp } from '@clerk/nextjs';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">MOVE</h1>
          <p className="text-muted-foreground text-sm mt-2">Create your account — 2 minutes</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              card: 'shadow-none border rounded-xl bg-background',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
            },
          }}
        />
      </div>
    </div>
  );
}

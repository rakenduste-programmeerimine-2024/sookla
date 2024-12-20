import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <form className="flex flex-col min-w-64 max-w-64 mx-auto items-center m-10 min-h-screen">
      <h1 className="text-2xl font-medium">Logi sisse</h1>
      <p className="text-sm text-foreground">
        Pole kontot?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Liitu
        </Link>
      </p>

      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="Sinu email" required />
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Parool</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            Unustasid parooli?
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          placeholder="Sinu parool"
          required
        />
        <SubmitButton pendingText="Logime sisse..." formAction={signInAction}>
          Logi sisse
        </SubmitButton>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}

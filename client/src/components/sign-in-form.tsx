import { signIn } from "@hono/auth-js/react";
import { useCallback, useState } from "react";

type Props = {
  onSuccess?: () => void;
};

export default function SignInForm({ onSuccess }: Props) {
  const [err, setErr] = useState<string | null>();
  const isPending = err === null;

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setErr(null);
      signIn("credentials", {
        ...Object.fromEntries(formData.entries()),
        redirect: false,
      })
        .then((response) => {
          if (response?.error) setErr(response.error);
          else if (response?.ok) onSuccess?.();
        });
    },
    [onSuccess],
  );

  return (
    <form
      onSubmit={onSubmit}
      noValidate
    >
      <fieldset>
        <label>
          Email:
          <input
            type="email"
            name="email"
            id="email-input"
            autoComplete="email"
            disabled={isPending}
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            name="password"
            id="password-input"
            autoComplete="current-password"
            disabled={isPending}
          />
        </label>
      </fieldset>
      {err && <div className="alert alert-danger">{err}</div>}
      <input type="submit" aria-busy={isPending} />
    </form>
  );
}

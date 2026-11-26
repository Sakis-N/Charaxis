import { login } from "../actions";
import { inputCls, btn } from "@/components/ui";

export default function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100 p-4">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">E</span>
          <div>
            <div className="text-lg font-bold">Ergon</div>
            <div className="text-xs text-gray-500">Διαχείριση πελατών & εργασιών</div>
          </div>
        </div>
        <input type="hidden" name="next" value={searchParams.next || "/"} />
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Κωδικός</span>
          <input name="password" type="password" autoFocus required className={inputCls} />
        </label>
        {searchParams.error && <p className="text-sm text-red-600">Λάθος κωδικός.</p>}
        <button className={`${btn.primary} w-full`}>Είσοδος</button>
      </form>
    </div>
  );
}

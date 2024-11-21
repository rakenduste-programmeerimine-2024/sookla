import { createClient } from "@/utils/supabase/server";
import SearchUserButton from "@/components/user-search-form";

export default async function SearchUserPage() {
  const supabase = await createClient();

  // Fetch kasutajate list
  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, email");

  if (error) {
    return <p>Viga kasutajate nimekirja laadimisel.</p>;
  }

  return (
    <div className="flex flex-col items-center p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold mb-4">Otsi Kasutajat</h2>

      {/* List laheb client side user-search-form.tsx-i */}
      <SearchUserButton users={users} />
    </div>
  );
}
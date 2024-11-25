import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import BackButton from "@/components/back-button";
import { FollowButton } from "@/components/ui/follow-button";
import FollowersList from "@/components/followers-list";

export default async function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: userSession, error: userError } = await supabase.auth.getUser();

  if (userError || !userSession?.user) {
    console.error("Error fetching user data:", userError?.message);
    return notFound();
  }

  const currentUserId = userSession.user.id;

  // kas logged in user proovib enda public lehele minna? kui jah saada konto lehele
  if (currentUserId === id) {
    redirect(`/protected/user-account`);
  }

  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (profileError || !profileData) {
    notFound();
  }

  // Fetch followers
  const { data: followersData, error: followersError } = await supabase
    .from("followings")
    .select("follower_id, users!fk_follower(username)")
    .eq("following_id", id)
    .order("created_at", { ascending: false });

  if (followersError) {
    console.error("Error fetching followers:", followersError.message);
  }

  const followers = followersData as FollowerData[] | null;

  return (
    <div className="flex flex-col items-center p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-6">
      {/* Profiilipilt */}
      <div className="w-24 h-24 bg-gray-200 rounded-full mb-4">
        <img
          src="path/to/profile-picture"
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {/* Kasutajanimi */}
      <div className="mb-4 text-center">
        <p className="text-2xl font-bold">
          {profileData.username || "Kasutajanimi pole määratud"}
        </p>
      </div>

      {/* Follow Nupp */}
      <FollowButton targetUserId={profileData.id} />
      <FollowersList followers={followers} />

      {/* Kasutaja andmed */}
      <div className="w-full bg-gray-100 p-4 rounded-lg shadow-inner space-y-4">
        <div>
          <p className="text-sm text-gray-500">Kasutaja ID:</p>
          <p className="text-lg font-medium">{profileData.id}</p>
        </div>
      </div>

      {/* Tagasi nupp */}
      <BackButton />
    </div>
  );
}

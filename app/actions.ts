"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Recipe } from "@/types/Recipe";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const username = formData.get("username")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !username) {
    return { error: "Email, parool, ja kasutajanimi on vajalikud" };
  }

  // Signup koos usernamega
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (authError) {
    console.error(authError.message);
    return encodedRedirect("error", "/sign-up", authError.message);
  }

  const userId = data?.user?.id;

  const { error: publicError } = await supabase.from("users").insert({
    id: userId,
    email,
    username,
  });

  if (publicError) {
    console.error(publicError.message);
    return { error: publicError.message };
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Tänud liitumast! Palun kontrolli oma emaili kinnituse jaoks."
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email vajalik");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Parooli taastamine nurjus"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Parooli taastamise link saadetud emailile."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect("error", "/protected/reset-password", "Parool vajalik");
  }

  if (password !== confirmPassword) {
    encodedRedirect("error", "/protected/reset-password", "Paroolid ei ühti");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Parooli uuendamine nurjus"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Parool uuendatud");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const getAllRecipesAction = async (): Promise<Recipe[]> => {
  const supabase = await createClient();

  let { data: recipes, error } = await supabase
    .from("published_recipes")

    .select(`*, categories(*), ingredients!inner(*), users(username)`)
    .order("time_of_creation", { ascending: false });
  //console.log("server read all");

  if (error) {
    console.log("Error serveri retseptide kätte saamisel");
    return [];
  }

  return recipes ?? [];
};

export const getSingleRecipe = async (id: number) => {
  const supabase = await createClient();
  let { data: recipe, error } = await supabase
    .from("published_recipes")
    .select(`*, categories(*), ingredients!inner(*), users(username)`)
    .eq("id", id)
    .single();

  //console.log(recipe);

  if (error) {
    console.log("Error ühe serveri retsepti kättesaamisel");
    return [];
  }

  return recipe;
};

export const getUserRecipesAction = async (
  userId: string
): Promise<Recipe[]> => {
  const supabase = await createClient();

  let { data: recipes, error } = await supabase
    .from("published_recipes")
    .select(`*, categories(*), ingredients!inner(*)`)
    .eq("users_id", userId)
    .order("time_of_creation", { ascending: false });

  if (error) {
    console.log("Error kasutaja retseptide kätte saamisel");
    return [];
  }

  return recipes ?? [];
};

export const getLikedRecipesAction = async (
  userId: string
): Promise<number[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("liked_recipes")
    .select("published_recipes_id")
    .eq("users_id", userId);

  if (error) {
    console.error("Error liked retseptide kättesaamisel:", error);
    return [];
  }

  return data.map((like) => like.published_recipes_id);
};

export const getCateories = async () => {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("category_name");

  if (error) {
    console.error("Error kategooriate kättesaamisel");
    return [];
  }

  console.log(categories);

  return categories;
};

export const getFollowedUsersRecipes = async (userId: string): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("followings")
    .select("following_id")
    .eq("follower_id", userId);

  console.log("Followed Users IDs:", data);

  if (error) {
    console.error("Error fetching followed users' IDs:", error);
    return [];
  }

  return data ? data.map((item) => item.following_id) : [];
};

export async function deleteRecipe(recipeId: number): Promise<boolean> {
  const supabase = await createClient(); 
  console.log("Supabase client initialized for deletion");

  try {
    const { data: recipe, error: fetchError } = await supabase
      .from("published_recipes")
      .select("ingredients_id")
      .eq("id", recipeId)
      .single();

    if (fetchError) {
      console.error("Error fetching recipe:", fetchError.message);
      return false;
    }

    console.log("Fetched recipe data:", recipe);

    const ingredientsId = recipe?.ingredients_id;

    const { error: likesError } = await supabase
      .from("liked_recipes")
      .delete()
      .eq("published_recipes_id", recipeId);

    if (likesError) {
      console.error("Error deleting likes:", likesError.message);
      return false;
    }

    console.log("Successfully deleted likes for recipe ID:", recipeId);

    const { error: recipeError } = await supabase
      .from("published_recipes")
      .delete()
      .eq("id", recipeId);

    if (recipeError) {
      console.error("Error deleting recipe:", recipeError.message);
      return false;
    }

    console.log("Successfully deleted recipe with ID:", recipeId);

    if (ingredientsId) {
      const { error: ingredientsError } = await supabase
        .from("ingredients")
        .delete()
        .eq("id", ingredientsId);

      if (ingredientsError) {
        console.error("Error deleting ingredients:", ingredientsError.message);
        return false;
      }

      console.log("Successfully deleted ingredients with ID:", ingredientsId);
    }

    return true;
  } catch (err) {
    console.error("Unexpected error during deletion:", err);
    return false;
  }
}


export const fetchCategories = async () => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, category_name");

    if (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error("Error in fetchCategories function:", err);
    throw err;
  }
};

export const uploadImage = async (
  image: File | null,
  croppedImageURL: string | null
) => {
  if (!croppedImageURL || !image) {
    console.error("No cropped image or image available");
    return null;
  }

  const blob = await (await fetch(croppedImageURL)).blob();
  const fileExtension = image.name.split(".").pop();
  const filePath = `recipe-images/${Date.now()}.${fileExtension}`;

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.storage
      .from("recipe-images")
      .upload(filePath, blob);

    if (error) {
      console.error("Error uploading image:", error.message);
      return null;
    }
    return data?.path;
  } catch (err) {
    console.error("Error uploading image:", err);
    return null;
  }
};

export const addRecipe = async (
  title: string,
  servings: number,
  selectedCategory: string,
  totalTimeMinutes: number,
  stepsDescription: string,
  ingredients: { name: string; quantity: string }[],
  imagePath: string | null,
  userId: string
) => {
  const supabase = await createClient();

  const ingredientText = ingredients
    .map((ingredient) => `${ingredient.name} ${ingredient.quantity}`)
    .join(", ");

  try {
    const { data, error } = await supabase
      .from("ingredients")
      .insert({ ingredient_text: ingredientText })
      .select("id")
      .single();

    if (error) {
      console.error("Error adding ingredient:", error.message);
      return null;
    }

    const ingredientId = data?.id;

    const { data: recipeData, error: recipeError } = await supabase
      .from("published_recipes")
      .insert([
        {
          title,
          servings,
          categories_id: parseInt(selectedCategory),
          total_time_minutes: totalTimeMinutes,
          ingredients_id: ingredientId,
          steps_description: stepsDescription,
          image_url: imagePath,
          time_of_creation: new Date().toISOString(),
          users_id: userId,
        },
      ])
      .single();

    if (recipeError) {
      console.error("Error adding recipe:", recipeError.message);
      return null;
    }

    console.log("Recipe added successfully:", recipeData);
    return recipeData;
  } catch (err) {
    console.error("Error adding recipe:", err);
    return null;
  }
};

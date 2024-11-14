"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Cropper, ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Alert } from "flowbite-react";

type Category = {
  id: number;
  category_name: string;
};

type Ingredient = {
  name: string;
  quantity: string;
};

export default function RecipeForm() {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(0);
  const [stepsDescription, setStepsDescription] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: "" },
  ]);
  const [image, setImage] = useState<File | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = () => {
    const missingFields = [];
    if (!title) missingFields.push("Pealkiri");
    if (
      ingredients.some((ingredient) => !ingredient.name || !ingredient.quantity)
    ) {
      missingFields.push("Koostisosa ja kogus");
    }
    if (!servings) missingFields.push("Portsjonite arv");
    if (!selectedCategory) missingFields.push("Kategooria");
    if (!totalTimeMinutes) missingFields.push("Valmistusaeg");
    if (!stepsDescription) missingFields.push("Valmstusjuhend");

    if (missingFields.length > 0) {
      setErrors(missingFields);
      return false;
    }

    setErrors([]);
    return true;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, category_name");

        if (error) {
          console.error("Error fetching categories:", error);
          throw error;
        }

        setCategories(data || []);
      } catch (err) {
        console.error("Error in fetchCategories function:", err);
      }
    };

    fetchCategories();
  }, []);

  const addIngredientField = () => {
    setIngredients([...ingredients, { name: "", quantity: "" }]);
  };

  const removeIngredientField = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: "name" | "quantity",
    value: string
  ) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index][field] = value;
    setIngredients(updatedIngredients);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImage(file);
    }
  };

  const getCroppedImageURL = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
        resolve(cropper.getCroppedCanvas().toDataURL());
      } else {
        resolve(null);
      }
    });
  };

  const uploadImage = async (croppedImageURL: string | null) => {
    if (!croppedImageURL) {
      console.error("No cropped image available");
      return null;
    }

    const blob = await (await fetch(croppedImageURL)).blob();
    const fileExtension = image?.name.split(".").pop();
    const filePath = `recipe-images/${Date.now()}.${fileExtension}`;

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

  const addRecipe = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (
      !title ||
      !ingredients ||
      !servings ||
      !categories ||
      !totalTimeMinutes ||
      !stepsDescription
    ) {
      console.error("All fields, except image field, are required.");
      return;
    }

    const croppedImageURL = await getCroppedImageURL();
    const imagePath = croppedImageURL
      ? await uploadImage(croppedImageURL)
      : null;

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) {
      console.error("Error fetching session:", sessionError.message);
      return;
    }

    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      console.error("User must be logged in to submit a recipe.");
      return;
    }

    const ingredientText = ingredients
      .map((ingredient) => `${ingredient.name} ${ingredient.quantity}`)
      .join(", ");

    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        ingredient_text: ingredientText,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error adding ingredient:", error.message);
      return;
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
      return;
    }

    console.log("Recipe added successfully:", recipeData);

    setTitle("");
    setIngredients([{ name: "", quantity: "" }]);
    setServings(0);
    setSelectedCategory("");
    setTotalTimeMinutes(0);
    setStepsDescription("");
    setImage(null);
  };

  return (
    <form onSubmit={addRecipe}>
      {errors.length > 0 && (
        <Alert color="red" onDismiss={() => setErrors([])}>
          <span className="font-medium">Palun täida järgmised väljad:</span>
          <ul className="mt-2 ml-4 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Label htmlFor="title">Pealkiri</Label>
      <Input
        id="title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div>
        <Label>Koostisosad</Label>
        {ingredients.map((ingredient, index) => (
          <div key={index}>
            <Input
              type="text"
              placeholder="Koostisosa nimi"
              value={ingredient.name}
              onChange={(e) =>
                handleIngredientChange(index, "name", e.target.value)
              }
            />
            <Input
              type="text"
              placeholder="Kogus"
              value={ingredient.quantity}
              onChange={(e) =>
                handleIngredientChange(index, "quantity", e.target.value)
              }
            />
            <button type="button" onClick={() => removeIngredientField(index)}>
              Eemalda
            </button>
          </div>
        ))}
        <button type="button" onClick={addIngredientField}>
          Lisa koostisosa
        </button>
      </div>

      <Label htmlFor="servings">Portsjonite arv</Label>
      <select
        id="servings"
        value={servings}
        onChange={(e) => setServings(parseInt(e.target.value))}
      >
        <option value="">Vali portsjonite arv</option>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((number) => (
          <option key={number} value={number}>
            {number}
          </option>
        ))}
      </select>
      <br></br>

      <Label htmlFor="categories">Kategooria</Label>
      <select
        id="categories"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">Vali kategooria</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.category_name}
          </option>
        ))}
      </select>
      <br></br>
      <Label htmlFor="totalTimeMinutes">Valmistusaeg (minutites)</Label>
      <Input
        id="totalTimeMinutes"
        type="number"
        value={totalTimeMinutes}
        onChange={(e) => setTotalTimeMinutes(parseInt(e.target.value))}
      />

      <Label htmlFor="stepsDescription">Valmistusjuhend</Label>
      <Input
        id="stepsDescription"
        type="text"
        value={stepsDescription}
        onChange={(e) => setStepsDescription(e.target.value)}
      />

      <Label htmlFor="image">Retsepti pilt</Label>
      <Input
        id="image"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />

      {image && (
        <div>
          <Cropper
            src={URL.createObjectURL(image)}
            style={{
              height: "auto",
              width: "100%",
              maxWidth: "400px",
              maxHeight: "400px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
            initialAspectRatio={1}
            aspectRatio={1}
            guides={false}
            ref={cropperRef}
            viewMode={1}
            minContainerWidth={400}
            minContainerHeight={400}
          />
        </div>
      )}

      <button type="submit">Postita</button>
    </form>
  );
}

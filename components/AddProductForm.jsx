"use client";

import { useState } from "react";
import { addProduct } from "@/app/action";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

export default function AddProductForm({ user }) {
  const [url, setUrl] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("url", url);
    if (targetPrice) {
      formData.append("targetPrice", targetPrice);
    }

    const result = await addProduct(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Product added successfully");
      setUrl("");
      setTargetPrice("");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2"
    >
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste Amazon / Flipkart URL"
        className="flex-1"
      />

      <Input
        type="number"
        min="0"
        step="0.01"
        value={targetPrice}
        onChange={(e) => setTargetPrice(e.target.value)}
        placeholder="Target price (optional)"
        className="sm:w-48"
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Track Price"}
      </Button>
    </form>
  );
}
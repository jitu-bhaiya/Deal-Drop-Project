"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Trash2,
  Loader2,
  TrendingUp,
} from "lucide-react";

import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { deleteProduct } from "@/app/action";
import PriceHistoryChart from "./PriceHistoryChart";

const formatPrice = (price, currency) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(price || 0);
  } catch {
    return `${currency || "USD"} ${price || 0}`;
  }
};

export default function ProductCard({ product }) {
  const [deleting, setDeleting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!product) {
    return (
      <Card className="p-4">
        <p className="text-gray-500">No Product Data Available</p>
      </Card>
    );
  }

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const result = await deleteProduct(product.id);

      if (result?.error) {
        toast.error(result.error);
        setDeleting(false);
        return;
      }

      toast.success("Product removed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete product");
      setDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden pt-0 pb-4 text-left gap-4">
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-gray-50 border-b border-gray-100">
        {product?.image_url ? (
          <img
            src={product.image_url}
            alt={product?.name || "Product"}
            className="w-full h-full object-contain p-4"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Product Info */}
      <CardContent className="flex flex-col gap-2">
        <h3
          className="font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]"
          title={product?.name || ""}
        >
          {product?.name || "Unnamed Product"}
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-orange-600">
            {formatPrice(product?.current_price, product?.currency)}
          </span>

          <Badge variant="secondary">
            {product?.currency || "USD"}
          </Badge>
        </div>

        {product?.target_price && (
          <p className="text-sm text-gray-500">
            Target Price: {formatPrice(product.target_price, product.currency)}
          </p>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a href={product?.url || "#"} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View
          </a>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          History
        </Button>

        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </CardFooter>

      {/* Price History - ab Card ke ANDAR, isliye grid layout nahi tootega */}
      {showHistory && (
        <div className="px-4 pt-2 border-t border-gray-100">
          <h3 className="font-semibold mb-3 mt-2 text-sm">Price History</h3>
          <PriceHistoryChart productId={product.id} />
        </div>
      )}
    </Card>
  );
}
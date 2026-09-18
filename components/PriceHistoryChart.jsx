"use client";

import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader2 } from "lucide-react";
import { getPriceHistory } from "@/app/action";

const PriceHistoryChart = ({ productId }) => {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    let active = true;
    setHistory(null);

    getPriceHistory(productId).then((data) => {
      if (active) setHistory(data);
    });

    return () => {
      active = false;
    };
  }, [productId]);

  if (history === null) {
    return (
      <div className="flex items-center justify-center h-52">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-sm text-gray-500">
        No price history yet. Check back after the next price check.
      </div>
    );
  }

  const chartData = history.map((h) => ({
    date: new Date(h.checked_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    price: h.price,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" fontSize={12} tickMargin={8} />
        <YAxis fontSize={12} domain={["auto", "auto"]} width={50} />
        <Tooltip
          formatter={(value) => [`₹${value}`, "Price"]}
          contentStyle={{ fontSize: 13, borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PriceHistoryChart;
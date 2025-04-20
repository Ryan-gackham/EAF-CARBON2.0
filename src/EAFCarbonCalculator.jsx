import React, { useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Button } from "./components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const emissionFactors = {
  "天然气": { unit: "Nm³/t", factor: 21.65 },
  "废钢": { unit: "t/t", factor: 0.015 },
  "石灰": { unit: "kg/t", factor: 1.024 },
  "轻烧白云石": { unit: "kg/t", factor: 1.024 },
  "电极": { unit: "kg/t", factor: 3.663 },
  "增碳剂、碳粉": { unit: "kg/t", factor: 3.667 },
  "铬铁合金": { unit: "kg/t", factor: 0.275 },
  "电力": { unit: "kWh/t", factor: 0.5568 },
  "蒸汽（净使用）": { unit: "kg/t", factor: 0.1100 },
  "铁水、生铁": { unit: "kg/t", factor: 1.739 },
  "钢坯": { unit: "kg/t", factor: 0.0154 }
};

const unitConversion = {
  "天然气": 10000,
  "废钢": 10000,
  "电力": 10000,
  "石灰": 10000000,
  "轻烧白云石": 10000000,
  "电极": 10000000,
  "增碳剂、碳粉": 10000000,
  "铬铁合金": 10000000,
  "蒸汽（净使用）": 10000000,
  "铁水、生铁": 10000000,
  "钢坯": 10000000
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28EF1", "#F76060", "#9DD866", "#FF6E97", "#FF9F40", "#66C2A5", "#E78AC3"];

export default function EAFCarbonCalculator() {
  const [capacity, setCapacity] = useState(100);
  const [days, setDays] = useState(320);
  const [steelRatio, setSteelRatio] = useState(1.05);
  const [intensities, setIntensities] = useState(() => {
    const init = {};
    Object.keys(emissionFactors).forEach(key => init[key] = 0);
    return init;
  });

  const handleIntensityChange = (material, value) => {
    setIntensities((prev) => ({ ...prev, [material]: parseFloat(value) || 0 }));
  };

  const annualOutput = capacity * days;
  const annualSteelInput = annualOutput * steelRatio;

  const materialAmounts = Object.entries(intensities).reduce((acc, [material, intensity]) => {
    const divisor = unitConversion[material] || 10000;
    const baseOutput = material === "废钢" ? annualSteelInput : annualOutput;
    acc[material] = (intensity * baseOutput) / divisor;
    return acc;
  }, {});

  const emissionBreakdown = Object.entries(materialAmounts).map(([material, amount]) => {
    const emission = amount * emissionFactors[material].factor;
    return { name: material, value: emission };
  }).filter(item => item.value > 0);

  const totalEmissions = emissionBreakdown.reduce((sum, item) => sum + item.value, 0);
  const steelOutput = annualOutput * 10000;
  const emissionIntensity = totalEmissions / steelOutput;

  const exportPDF = () => {
    const input = document.getElementById("calculator-result");
    if (!input) return;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("carbon-report.pdf");
    });
  };

  return (
    <div className="px-4 py-6 w-full max-w-2xl mx-auto sm:px-6 md:px-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">电弧炉碳排放计算器（基于排放因子）</h1>
      <p className="text-center text-sm text-gray-500 mb-4">电弧炉智控新观察 出品</p>
      {/* ... content omitted for brevity ... */}
    </div>
  );
}

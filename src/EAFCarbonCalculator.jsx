import React, { useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Button } from "./components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import domtoimage from "dom-to-image";
import jsPDF from "jspdf";

const emissionFactors = {
  "天然气": { unit: "Nm³/t", factor: 0.0021650151996 },
  "铁水、生铁": { unit: "kg/t", factor: 1.7393 },
  "石灰": { unit: "kg/t", factor: 1.0237 },
  "轻烧白云石": { unit: "kg/t", factor: 1.0237 },
  "废钢": { unit: "t/t", factor: 0.0154 },
  "电极": { unit: "kg/t", factor: 3.6630 },
  "增碳剂、碳粉": { unit: "kg/t", factor: 3.6667 },
  "电力": { unit: "kWh/t", factor: 0.5568 },
  "蒸汽（净使用）": { unit: "kg/t", factor: 0.1100 },
    "合金": { unit: "kg/t", factor: 0.2750 }
},
  "铁水、生铁": { unit: "kg/t", factor: 1.739 },
  "石灰": { unit: "kg/t", factor: 1.024 },
  "轻烧白云石": { unit: "kg/t", factor: 1.024 },
  "废钢": { unit: "t/t", factor: 0.015 },
  "电极": { unit: "kg/t", factor: 3.663 },
  "增碳剂、碳粉": { unit: "kg/t", factor: 3.667 },
  "电力": { unit: "kWh/t", factor: 0.5568 },
  "蒸汽（净使用）": { unit: "kg/t", factor: 0.1100 },
  "钢坯": { unit: "kg/t", factor: 0.0154 }
};

const unitConversion = {
  "天然气": 10000,
  "铁水、生铁": 10000000,
  "石灰": 10000000,
  "轻烧白云石": 10000000,
  "废钢": 10000,
  "电极": 10000000,
  "增碳剂、碳粉": 10000000,
  "电力": 10000,
  "蒸汽（净使用）": 10000000,
  "合金": 10000000
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28EF1", "#F76060", "#9DD866", "#FF6E97", "#FF9F40", "#66C2A5", "#E78AC3"];

export default function EAFCarbonCalculator() {
  const [capacity, setCapacity] = useState(100);
  const [cycle, setCycle] = useState(60);
  const [days, setDays] = useState(320);
  const [steelRatio, setSteelRatio] = useState(1.087);
  const [intensities, setIntensities] = useState(() => {
    const init = {};
    Object.keys(emissionFactors).forEach(key => init[key] = 0);
    return init;
  });
  const [scrapRatio, setScrapRatio] = useState(0.7);

  const handleIntensityChange = (material, value) => {
    setIntensities((prev) => ({ ...prev, [material]: parseFloat(value) || 0 }));
  };

  const dailyFurnaceCount = 1440 / cycle;
  const dailyOutput = capacity * dailyFurnaceCount;
  const annualOutput = dailyOutput * days;
  const annualSteelInput = annualOutput * steelRatio;

  const totalSteelInput = 1.087;
  const materialAmounts = Object.entries(intensities).reduce((acc, [material, intensity]) => {
    // 特殊处理：蒸汽由 kg 转为 GJ（1 kg ≈ 0.0026 GJ）
    const adjustedIntensity = material === "蒸汽（净使用）" ? intensity * 0.0026 : intensity;
    if (material === "废钢") {
      const fs = totalSteelInput * scrapRatio;
      const divisor = unitConversion[material];
      acc[material] = (fs * annualOutput) / divisor;
    } else if (material === "铁水、生铁") {
      const hs = totalSteelInput * (1 - scrapRatio);
      const divisor = unitConversion[material];
      acc[material] = (hs * annualOutput) / divisor;
    } else {
      const divisor = unitConversion[material] || 10000;
      acc[material] = (adjustedIntensity * annualOutput) / divisor;
    }
    return acc;
  }, {});

  const emissionBreakdown = Object.entries(materialAmounts).map(([material, amount]) => {
    const emission = amount * emissionFactors[material].factor;
    return { name: material, value: emission };
  }).filter(item => item.value > 0);

  const totalEmissions = emissionBreakdown.reduce((sum, item) => sum + item.value, 0);

  console.log("计算过程如下：");
  console.log("年产量（万吨）=", annualOutput);
  console.log("年钢铁料消耗（万吨）=", annualSteelInput);
  console.log("各物料使用量（单位换算后）=", materialAmounts);
  console.log("各物料碳排放量（吨 CO₂）=", emissionBreakdown);
  console.log("总碳排放量=", totalEmissions);
  console.log("碳排放强度=", emissionIntensity);
  const steelOutput = annualOutput * 10000;
  const emissionIntensity = totalEmissions / steelOutput;

  const exportPDF = () => {
    const input = document.getElementById("calculator-result");
    if (!input) return;
    domtoimage.toPng(input).then((dataUrl) => {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 20;
        const imgHeight = (img.height * imgWidth) / img.width;
        pdf.addImage(img, "PNG", 10, 10, imgWidth, imgHeight);
        pdf.save("carbon-report.pdf");
      };
    });
  };

  return (
    <div className="px-4 py-6 w-full max-w-2xl mx-auto sm:px-6 md:px-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">电弧炉碳排放计算器（基于排放因子）</h1>
      <p className="text-center text-sm text-gray-500 mb-4">电弧炉智控新观察 出品</p>
      <Card>
        $1
          <div className="text-sm text-gray-600 space-y-2">
            <h2 className="font-semibold text-base">📘 计算过程：</h2>
            <p>📌 日生产炉数 = 1440 / 冶炼周期 = 1440 / {cycle} = {dailyFurnaceCount.toFixed(2)}</p>
            <p>📌 日产量（吨） = 电炉容量 × 日生产炉数 = {capacity} × {dailyFurnaceCount.toFixed(2)} = {dailyOutput.toFixed(2)}</p>
            <p>📌 年产量（万吨） = 日产量 × 生产天数 / 10000 = {dailyOutput.toFixed(2)} × {days} / 10000 = {annualOutput.toFixed(4)}</p>
            <p>📌 年钢铁料用量（万吨） = 年产量 × 钢铁料消耗 = {annualOutput.toFixed(2)} × {steelRatio} = {annualSteelInput.toFixed(2)}</p>
            <p>📌 各物料使用量（已换算）:</p>
            <ul className="list-disc list-inside">
              {Object.entries(materialAmounts).map(([material, amount]) => (
                <li key={material}>{material}：{amount.toFixed(4)}</li>
              ))}
            </ul>
            <p>📌 各物料碳排放（吨 CO₂）:</p>
            <ul className="list-disc list-inside">
              {emissionBreakdown.map((item) => (
                <li key={item.name}>{item.name}：{item.value.toFixed(4)}</li>
              ))}
            </ul>
            <p>📌 碳排总量：{totalEmissions.toFixed(4)} 吨 CO₂</p>
            <p>📌 碳排强度：{emissionIntensity.toFixed(8)} 吨 CO₂ / 吨钢</p>
          </div>

          <div className=\"grid gap-4\">
            <div>
              <Label>废钢比例（0~1）</Label>
              <Input type=\"number\" step=\"0.01\" min=\"0\" max=\"1\" value={scrapRatio} onChange={(e) => setScrapRatio(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>电炉工程容量（吨/炉）</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>电炉冶炼周期（分钟/炉）</Label>
              <Input type="number" value={cycle} onChange={(e) => setCycle(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>年生产天数</Label>
              <Input type="number" value={days} onChange={(e) => setDays(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>钢铁料消耗（吨钢用钢铁料，默认1.087）</Label>
              <Input type="number" value={steelRatio} onChange={(e) => setSteelRatio(parseFloat(e.target.value) || 1)} />
            </div>
            {Object.entries(emissionFactors).map(([material, { unit }]) => (
              material !== "废钢" && material !== "钢坯" && (
                <div key={material}>
                  <Label>{material} 吨钢耗量（{unit}）</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    className="text-base"
                    value={intensities[material]}
                    onChange={(e) => handleIntensityChange(material, e.target.value)}
                  />
                </div>
              )
            ))}
          </div>
        </CardContent>
        <div className="p-4 text-center">
          <Button onClick={exportPDF}>📄 导出 PDF 报告</Button>
        </div>
      </Card>
    </div>
  );
}

export default function SizeGuide() {
  const babySizes = [
    ['0–3 months', '50–58', '3–5', '0–3M'],
    ['3–6 months', '58–65', '5–7', '3–6M'],
    ['6–12 months', '65–75', '7–9', '6–12M'],
    ['1–2 years', '75–85', '9–12', '1–2Y'],
    ['2–4 years', '85–95', '12–15', '2–4Y'],
    ['4–6 years', '95–110', '15–20', '4–6Y'],
  ]

  const momSizes = [
    ['XS', '32–34', '74–80', '84–88'],
    ['S', '34–36', '80–86', '88–92'],
    ['M', '36–38', '86–92', '92–96'],
    ['L', '38–40', '92–98', '96–100'],
    ['XL', '40–42', '98–104', '100–106'],
    ['XXL', '42–44', '104–110', '106–112'],
  ]

  return (
    <div className="section-padding py-12 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Size Guide</h1>

      <div className="card p-6 mb-8">
        <h2 className="text-xl font-serif text-wine-800 mb-4">Baby Clothing</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-300">
                <th className="text-left py-3 text-wine-700">Age</th>
                <th className="text-left py-3 text-wine-700">Height (cm)</th>
                <th className="text-left py-3 text-wine-700">Weight (kg)</th>
                <th className="text-left py-3 text-wine-700">Size</th>
              </tr>
            </thead>
            <tbody>
              {babySizes.map((row) => (
                <tr key={row[0]} className="border-b border-cream-200">
                  {row.map((cell, i) => (
                    <td key={i} className="py-3 text-wine-600">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="text-xl font-serif text-wine-800 mb-4">Mom Clothing</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-300">
                <th className="text-left py-3 text-wine-700">Size</th>
                <th className="text-left py-3 text-wine-700">Bust (cm)</th>
                <th className="text-left py-3 text-wine-700">Waist (cm)</th>
                <th className="text-left py-3 text-wine-700">Hip (cm)</th>
              </tr>
            </thead>
            <tbody>
              {momSizes.map((row) => (
                <tr key={row[0]} className="border-b border-cream-200">
                  {row.map((cell, i) => (
                    <td key={i} className="py-3 text-wine-600">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blush-50 rounded-xl p-6">
        <h3 className="font-serif text-wine-800 mb-2">Tips</h3>
        <ul className="space-y-2 text-sm text-wine-600">
          <li>• When in doubt, size up — babies grow quickly!</li>
          <li>• Our baby clothing has a comfortable, slightly relaxed fit.</li>
          <li>• For maternity wear, choose your pre-pregnancy size for the best fit.</li>
          <li>• If you're between sizes, we recommend going with the larger size.</li>
          <li>• Still unsure? Contact us and we'll help you find the perfect fit.</li>
        </ul>
      </div>
    </div>
  )
}

export function generateUniqueVirtualCard(holderName: string) {
  // Generate random 16 digit number
  const prefix = "4532"; // Visa
  const num1 = Math.floor(1000 + Math.random() * 9000).toString();
  const num2 = Math.floor(1000 + Math.random() * 9000).toString();
  const num3 = Math.floor(1000 + Math.random() * 9000).toString();
  const number = `${prefix}${num1}${num2}${num3}`;

  // Generate Expiry (3 to 5 years from now)
  const now = new Date();
  const expYear = now.getFullYear() + Math.floor(3 + Math.random() * 3);
  const expMonth = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');
  const expiry = `${expMonth}/${expYear.toString().slice(-2)}`;

  // Generate CVV
  const cvv = Math.floor(100 + Math.random() * 900).toString();

  // English representation for the card display
  const englishName = holderName.replace(/[^\x00-\x7F]/g, "").trim().toUpperCase() || "SAFE USER";

  return {
    number,
    expiry,
    cvv,
    holderName: englishName,
  };
}

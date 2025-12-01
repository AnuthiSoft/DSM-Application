namespace DSM_Application.Server.Services
{
    public class DiscountService
    {
        public (decimal finalPrice,
                 decimal totalPercent,
                 decimal qtyPct,
                 decimal pricePct,
                 decimal specialPct,
                 decimal yearlyPct,
                 decimal discountAmount)
             Calculate(int quantity, decimal subtotal, decimal specialDiscountPercent, decimal yearlyDiscountPercent)
        {
            // Quantity-based %
            decimal qtyPct = 0;
            if (quantity >= 5 && quantity <= 9)
                qtyPct = 3;
            else if (quantity >= 10 && quantity <= 19)
                qtyPct = 5;
            else if (quantity >= 20)
                qtyPct = 8;

            // Subtotal-based %
            decimal pricePct = 0;
            if (subtotal > 10000)
                pricePct = 4;
            else if (subtotal > 5000)
                pricePct = 2;

            // Clamp specials
            if (specialDiscountPercent < 0) specialDiscountPercent = 0;
            if (specialDiscountPercent > 10) specialDiscountPercent = 10;

            if (yearlyDiscountPercent < 0) yearlyDiscountPercent = 0;
            if (yearlyDiscountPercent > 5) yearlyDiscountPercent = 5; // choose your cap

            // Sum
            decimal totalPct = qtyPct + pricePct + specialDiscountPercent + yearlyDiscountPercent;

            // Money
            decimal discountAmount = (subtotal * totalPct) / 100m;
            decimal finalPrice = subtotal - discountAmount;

            return (finalPrice, totalPct, qtyPct, pricePct, specialDiscountPercent, yearlyDiscountPercent, discountAmount);
        }
    }
}

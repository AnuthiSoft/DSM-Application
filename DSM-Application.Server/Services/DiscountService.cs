namespace DSM_Application.Server.Services
{
    public class DiscountService
    {
        public (decimal finalPrice, decimal totalPercent, decimal qtyPct, decimal pricePct, decimal discountAmount)
            Calculate(int quantity, decimal subtotal, decimal specialDiscountPercent)
        {
            decimal qtyPct = 0;
            if (quantity >= 5 && quantity <= 9)
                qtyPct = 3;
            else if (quantity >= 10 && quantity <= 19)
                qtyPct = 5;
            else if (quantity >= 20)
                qtyPct = 8;

            decimal pricePct = 0;
            if (subtotal > 10000)
                pricePct = 4;
            else if (subtotal > 5000)
                pricePct = 2;

            if (specialDiscountPercent < 0)
                specialDiscountPercent = 0;
            if (specialDiscountPercent > 10)
                specialDiscountPercent = 10;

            decimal totalPct = qtyPct + pricePct + specialDiscountPercent ;
            decimal discountAmount = (subtotal * totalPct) / 100m;
            decimal finalPrice = subtotal - discountAmount;

            return (finalPrice, totalPct, qtyPct, pricePct, discountAmount);
        }
    }
}

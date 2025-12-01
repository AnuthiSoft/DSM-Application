namespace DSM_Application.Server.Models
{
    public class YearlyLoyaltyDiscountSettings
    {
        public int ThresholdOrders { get; set; } = 20;
        public decimal ExtraDiscountPercent { get; set; } = 3m;
    }
}

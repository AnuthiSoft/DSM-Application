public class DamageExpiredSummaryDto
{
    public string ProductId { get; set; }
    public string ProductName { get; set; }

    public int DamagedQty { get; set; }
    public int ExpiredQty { get; set; }

    public int TotalNonSellableQty => DamagedQty + ExpiredQty;
}

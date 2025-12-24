namespace DSM_Application.Server.Models.DTOs
{
    public class EwayItem
    {
        public string productName { get; set; }
        public string hsnCode { get; set; }
        public decimal qty { get; set; }
        public decimal taxableAmount { get; set; }
        public decimal taxValue { get; set; }
    }

}

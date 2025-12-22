namespace DSM_Application.Server.Models
{
    public class StockHistory
    {
        public int Quantity { get; set; }
        public string Type { get; set; }   // IN / OUT
        public DateTime Date { get; set; }
        public string Note { get; set; }
    }

}

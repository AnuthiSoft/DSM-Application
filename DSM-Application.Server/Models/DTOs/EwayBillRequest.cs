namespace DSM_Application.Server.Models.DTOs
{
    public class EwayBillRequest
    {
        public string supplyType { get; set; }
        public int subSupplyType { get; set; }
        public string docType { get; set; }
        public string docNo { get; set; }
        public string docDate { get; set; }

        public string fromGstin { get; set; }
        public string fromTrdName { get; set; }
        public string fromAddr1 { get; set; }
        public string fromPlace { get; set; }
        public int fromPincode { get; set; }
        public int fromStateCode { get; set; }

        public string toGstin { get; set; }
        public string toTrdName { get; set; }
        public string toAddr1 { get; set; }
        public string toPlace { get; set; }
        public int toPincode { get; set; }
        public int toStateCode { get; set; }

        public decimal totalValue { get; set; }
        public decimal cgstValue { get; set; }
        public decimal sgstValue { get; set; }
        public decimal igstValue { get; set; }

        public List<EwayItem> itemList { get; set; }
        public string vehicleNo { get; set; }
    }

}

using System.ComponentModel.DataAnnotations;

public class EmployeeUpdateDto
{
    public string Name { get; set; }

    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public string Address { get; set; }
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;

}

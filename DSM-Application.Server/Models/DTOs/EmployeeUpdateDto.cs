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
    
}

using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace DSM_Application.Server.Models.DTOs
{
    // ------------------------------
    // Existing DTO
    // ------------------------------
    public class DistributorCreateCustomerDto
    {
        [Required(ErrorMessage = "Name is required")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress]
        [StringLength(254)]
        public string Email { get; set; }

        [Required(ErrorMessage = "Phone Number is required")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Address is required")]
        public string Address { get; set; }



        public string Password { get; set; }
    }

    // ------------------------------
    // ⭐ Distributor Profile GET DTO
    // ------------------------------
    public class DistributorProfileDto
    {
        public string DistributorId { get; set; }
        public string Name { get; set; }

        public string Email { get; set; }
        public string PhoneNumber { get; set; }

        public string? Street { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string? Country { get; set; }

        public bool PhoneVerified { get; set; }

        public string? ProfileImageBase64 { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }

    // ------------------------------
    // ⭐ Distributor Profile UPDATE DTO
    // ------------------------------
    public class DistributorProfileUpdateDto
    {
        [Required]
        public string Name { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; }

        [Required]
        public string PhoneNumber { get; set; }

        public string? Street { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string? Country { get; set; }

        public IFormFile? ProfileImage { get; set; }
    }
}
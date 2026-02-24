import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ReturnApiService } from '../../services/return-api.service';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/order.model';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-distributor-return-requests',
  templateUrl: './distributor-return-requests.component.html',
  styleUrls: ['./distributor-return-requests.component.css']
})
export class DistributorReturnRequestsComponent implements OnInit {


  apiBaseUrl = environment.apiUrl.replace('/api', '');
  distributorId = localStorage.getItem('distributorId') || '';
  returnRequests: any[] = [];
  employees: any[] = [];
  loading = true;
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  paginatedReturns: any[] = [];

  constructor(
    private http: HttpClient,
    private employeeService: EmployeeService,
    private returnApiService: ReturnApiService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    console.log('Distributor ID:', this.distributorId);
    this.loadReturns();
    this.loadEmployees();
  }

  loadReturns() {
    this.loading = true;

    this.returnApiService
      .getReturnHistoryForDistributor(this.distributorId)
      .subscribe({
        next: res => {

          this.returnRequests = res.map(r => ({
            ...r,
            imageUrls: (r.imageUrls ?? []).map((imageId: string) =>
              `${environment.apiUrl}/returns/return-image/${imageId}`
            )
          }));

          this.totalPages = Math.ceil(this.returnRequests.length / this.itemsPerPage);
          this.updatePagination();

          this.loading = false;
        },
        error: err => {
          this.loading = false;
          this.showErrorAlert(
            'Error Loading Returns',
            err.error?.message || 'Unable to load return requests'
          );
        }
      });
  }

  loadEmployees() {
    this.employeeService.getDeliveryEmployees(this.distributorId)
      .subscribe({
        next: (res: any[]) => {
          console.log("Delivery Employees:", res);

          // Backend already returns only delivery employees
          this.employees = res;
        },
        error: (err) => {
          console.error("Failed to load delivery employees:", err);
          this.toastr.error("Unable to load delivery employees");
        }
      });
  }

  approveAndSchedule(r: any) {
    // Prevent action if already scheduled
    if (r.status !== 'Pending') {
      this.showAlreadyScheduledAlert(r);
      return;
    }

    this.showScheduleModal(r);
  }

  showAlreadyScheduledAlert(r: any) {
    Swal.fire({
      title: 'Already Scheduled',
      html: `
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 4rem; color: #f39c12; margin-bottom: 15px;">
            <i class="fas fa-clock"></i>
          </div>
          <h3 style="color: #2c3e50; margin-bottom: 10px; font-weight: 600;">
            Pickup Already Scheduled
          </h3>
          <p style="color: #7f8c8d; margin-bottom: 5px; font-size: 15px;">
            Return #${r.id} has already been scheduled for pickup.
          </p>
          <div style="color: #2c3e50; font-weight: 500; background: rgba(243, 156, 18, 0.1); 
                padding: 12px; border-radius: 8px; border-left: 4px solid #f39c12; margin-top: 15px;">
            <i class="fas fa-calendar-alt"></i> 
            Check the scheduled date in return details.
          </div>
        </div>
      `,
      background: '#ffffff',
      color: '#2c3e50',
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3498db',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn'
      }
    });
  }

  showScheduleModal(r: any) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const minDate = tomorrow.toISOString().split('T')[0];
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const maxDate = nextWeek.toISOString().split('T')[0];
    const defaultDate = tomorrow.toISOString().split('T')[0];

    Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 10px;">' +
        '<i class="fas fa-calendar-check" style="color: #3498db; font-size: 1.5rem;"></i>' +
        '<span>Schedule Return Pickup</span>' +
        '</div>',
      html: `
        <div class="return-schedule-modal">
          <div style="background: linear-gradient(135deg, #3498db, #2c3e50); color: white; 
                padding: 15px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-box-open" style="font-size: 1.2rem;"></i>
              <h3 style="margin: 0; font-size: 1.1rem;">Return #${r.id}</h3>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div style="background: rgba(52, 152, 219, 0.1); padding: 10px; border-radius: 8px;">
                <div style="font-size: 0.85rem; color: #7f8c8d; margin-bottom: 4px;">Customer</div>
                <div style="font-weight: 600; color: #2c3e50;">${r.customerName}</div>
              </div>
              <div style="background: rgba(52, 152, 219, 0.1); padding: 10px; border-radius: 8px;">
                <div style="font-size: 0.85rem; color: #7f8c8d; margin-bottom: 4px;">Quantity</div>
                <div style="font-weight: 600; color: #e74c3c;">${r.returnQty}</div>
              </div>
            </div>

            
            
            <div style="background: rgba(52, 152, 219, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 15px;">
              <div style="font-size: 0.85rem; color: #7f8c8d; margin-bottom: 4px;">Product</div>
              <div style="font-weight: 500; color: #2c3e50;">${r.productName}</div>
            </div>
          </div>
          
          <div class="form-section">
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 500; 
                    display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-calendar-day" style="color: #3498db;"></i> 
                Pickup Date
              </label>
              <input 
                type="date" 
                id="pickupDate" 
                class="custom-swal-input" 
                min="${minDate}" 
                max="${maxDate}"
                value="${defaultDate}"
                style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; 
                      border-radius: 8px; background: #f8fafc; color: #2c3e50; 
                      font-size: 14px; outline: none; transition: all 0.3s;"
              >
            </div>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 500; 
                    display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-clock" style="color: #3498db;"></i> 
                Time Slot
              </label>
              <select 
                id="pickupSlot" 
                class="custom-swal-select"
                style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; 
                      border-radius: 8px; background: #f8fafc; color: #2c3e50; 
                      font-size: 14px; outline: none; transition: all 0.3s;"
              >
                <option value="">Select Time Slot</option>
                <option value="9 AM - 12 PM">Morning (9 AM - 12 PM)</option>
                <option value="12 PM - 3 PM">Afternoon (12 PM - 3 PM)</option>
                <option value="3 PM - 6 PM">Evening (3 PM - 6 PM)</option>
                <option value="6 PM - 9 PM">Night (6 PM - 9 PM)</option>
              </select>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 500; 
                    display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-user-tie" style="color: #3498db;"></i> 
                Assign Employee
              </label>
              <select 
                id="employeeId" 
                class="custom-swal-select"
                style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; 
                      border-radius: 8px; background: #f8fafc; color: #2c3e50; 
                      font-size: 14px; outline: none; transition: all 0.3s;"
              >
                <option value="">Select Employee</option>
                ${this.employees.map(e => `
                  <option value="${e.employeeId}">${e.name} - ${e.role || 'Employee'}</option>
                `).join('')}
              </select>
            </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      background: '#ffffff',
      color: '#2c3e50',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-check-circle"></i> Schedule Pickup',
      cancelButtonText: '<i class="fas fa-times"></i> Cancel',
      confirmButtonColor: '#27ae60',
      cancelButtonColor: '#e74c3c',
      width: 500,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-content',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      },
      didOpen: () => {
        // Add hover effects to inputs
        const inputs = document.querySelectorAll('.custom-swal-input, .custom-swal-select');
        inputs.forEach(input => {
          input.addEventListener('mouseenter', () => {
            (input as HTMLElement).style.borderColor = '#3498db';
            (input as HTMLElement).style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
          });
          input.addEventListener('mouseleave', () => {
            (input as HTMLElement).style.borderColor = '#e2e8f0';
            (input as HTMLElement).style.boxShadow = 'none';
          });
          input.addEventListener('focus', () => {
            (input as HTMLElement).style.borderColor = '#3498db';
            (input as HTMLElement).style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.2)';
          });
          input.addEventListener('blur', () => {
            (input as HTMLElement).style.borderColor = '#e2e8f0';
            (input as HTMLElement).style.boxShadow = 'none';
          });
        });
      },
      preConfirm: () => {
        const pickupDate = (document.getElementById('pickupDate') as HTMLInputElement)?.value;
        const pickupSlot = (document.getElementById('pickupSlot') as HTMLSelectElement)?.value;
        const employeeId = (document.getElementById('employeeId') as HTMLSelectElement)?.value;
        const notifyCustomer = (document.getElementById('notifyCustomer') as HTMLInputElement)?.checked;

        if (!pickupDate) {
          Swal.showValidationMessage('Please select a pickup date');
          return false;
        }
        if (!pickupSlot) {
          Swal.showValidationMessage('Please select a time slot');
          return false;
        }
        if (!employeeId) {
          Swal.showValidationMessage('Please assign an employee');
          return false;
        }

        return { pickupDate, pickupSlot, employeeId, notifyCustomer };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { pickupDate, pickupSlot, employeeId, notifyCustomer } = result.value;
        this.schedulePickup(r.id, { pickupDate, pickupSlot, employeeId, notifyCustomer });
      }
    });
  }

  schedulePickup(returnId: string, data: any) {
    this.returnApiService.schedulePickup(returnId, {
      pickupDate: data.pickupDate,
      pickupSlot: data.pickupSlot,
      employeeId: data.employeeId,
      message: `Pickup scheduled on ${data.pickupDate} (${data.pickupSlot})`,
      //notifyCustomer: data.notifyCustomer
    }).subscribe({
      next: () => {
        this.showSuccessAlert(returnId, data);
        // Update UI
        const r = this.returnRequests.find(x => x.id === returnId);
        if (r) {
          r.status = 'PickupConfirmed';
          r.pickupDate = data.pickupDate;
          r.pickupSlot = data.pickupSlot;
        }
      },
      error: (error) => {
        this.showErrorAlert(
          'Schedule Failed',
          error.error?.message || 'Unable to schedule pickup. Please try again.'
        );
      }
    });
  }

  showSuccessAlert(returnId: string, data: any) {
    Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 10px; color: #27ae60;">' +
        '<i class="fas fa-check-circle" style="font-size: 2rem;"></i>' +
        '<span>Pickup Scheduled!</span>' +
        '</div>',
      html: `
        <div style="text-align: center; padding: 10px;">
          <h3 style="color: #2c3e50; margin-bottom: 15px; font-weight: 600;">
            Return #${returnId}
          </h3>
          <p style="color: #7f8c8d; margin-bottom: 20px; font-size: 15px;">
            Pickup has been successfully scheduled.
          </p>
          
          <div style="background: rgba(39, 174, 96, 0.1); padding: 20px; border-radius: 10px; 
                border-left: 4px solid #27ae60; margin: 20px 0; text-align: left;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
              <i class="fas fa-calendar-check" style="color: #27ae60; font-size: 1.2rem;"></i>
              <span style="font-weight: 600; color: #2c3e50;">Scheduled Details</span>
            </div>
            <div style="color: #2c3e50;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <span style="color: #7f8c8d;">Date:</span>
                <span style="font-weight: 500;">${new Date(data.pickupDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <span style="color: #7f8c8d;">Time Slot:</span>
                <span style="font-weight: 500;">${data.pickupSlot}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #7f8c8d;">Notification:</span>
                <span style="font-weight: 500; color: ${data.notifyCustomer ? '#27ae60' : '#e74c3c'}">
                  ${data.notifyCustomer ? 'Sent' : 'Not Sent'}
                </span>
              </div>
            </div>
          </div>
          
          <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 10px; 
                margin-top: 15px; text-align: left;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 0.95rem; 
                  display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-list-check" style="color: #3498db;"></i> 
              Next Steps:
            </h4>
            <ul style="margin: 0; padding-left: 20px; color: #7f8c8d; font-size: 0.9rem;">
              <li>Employee has been assigned for pickup</li>
              <li>Track pickup progress in Live Tracking section</li>
              <li>Monitor return status in Returns dashboard</li>
            </ul>
          </div>
        </div>
      `,
      background: '#ffffff',
      color: '#2c3e50',
      showConfirmButton: true,
      confirmButtonText: '<i class="fas fa-thumbs-up"></i> Done',
      confirmButtonColor: '#3498db',
      showDenyButton: true,
      denyButtonText: '<i class="fas fa-user-tie"></i> Track Employee',
      denyButtonColor: '#f39c12',
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-content',
        confirmButton: 'custom-swal-confirm-btn',
        denyButton: 'custom-swal-secondary-btn'
      }
    }).then((result) => {
      if (result.isDenied) {
        // Navigate to employee tracking
        // this.router.navigate(['/live-tracking']);
      }
    });
  }

  markReceived(r: any) {

    this.returnApiService.completeReturn(r.id).subscribe(() => {
      this.toastr.success(
        'Product received and return completed',
        'Completed'
      );

      // ✅ FINAL STATUS
      r.status = 'Completed';
    });
  }

  showMarkReceivedSuccess(r: any) {
    Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 10px; color: #27ae60;">' +
        '<i class="fas fa-check-circle" style="font-size: 2rem;"></i>' +
        '<span>Product Received!</span>' +
        '</div>',
      html: `
        <div style="text-align: center; padding: 10px;">
          <h3 style="color: #2c3e50; margin-bottom: 10px; font-weight: 600;">
            Return #${r.id} Completed
          </h3>
          <p style="color: #7f8c8d; margin-bottom: 20px; font-size: 15px;">
            The return process has been successfully completed.
          </p>
          
          <div style="background: rgba(39, 174, 96, 0.1); padding: 15px; border-radius: 10px; 
                margin: 20px 0; border-left: 4px solid #27ae60;">
            <div style="color: #2c3e50;">
              <div style="margin-bottom: 8px;">
                <i class="fas fa-clipboard-check" style="color: #27ae60; margin-right: 8px;"></i>
                <span>Product inspection completed</span>
              </div>
              <div style="margin-bottom: 8px;">
                <i class="fas fa-sync-alt" style="color: #27ae60; margin-right: 8px;"></i>
                <span>Refund process initiated</span>
              </div>
              <div>
                <i class="fas fa-file-alt" style="color: #27ae60; margin-right: 8px;"></i>
                <span>Return report generated</span>
              </div>
            </div>
          </div>
          
          <div style="color: #7f8c8d; font-size: 0.9rem; margin-top: 15px;">
            The customer will be notified about the completion and refund status.
          </div>
        </div>
      `,
      background: '#ffffff',
      color: '#2c3e50',
      showConfirmButton: true,
      confirmButtonText: '<i class="fas fa-thumbs-up"></i> Great!',
      confirmButtonColor: '#3498db',
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-content',
        confirmButton: 'custom-swal-confirm-btn'
      }
    });
  }

  rejectReturnUI(r: any) {
    Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 10px; color: #e74c3c;">' +
        '<i class="fas fa-ban" style="font-size: 1.5rem;"></i>' +
        '<span>Reject Return Request</span>' +
        '</div>',
      html: `
        <div style="text-align: left; padding: 5px;">
          <div style="background: rgba(231, 76, 60, 0.1); padding: 15px; border-radius: 10px; 
                border-left: 4px solid #e74c3c; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 1rem;">
              <i class="fas fa-exclamation-triangle" style="color: #e74c3c; margin-right: 8px;"></i>
              Return #${r.id}
            </h4>
            <div style="color: #7f8c8d; font-size: 0.9rem;">
              <div><strong>Customer:</strong> ${r.customerName}</div>
              <div><strong>Product:</strong> ${r.productName}</div>
              <div><strong>Reason:</strong> ${r.reason}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 500; 
                  display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-comment-dots" style="color: #e74c3c;"></i> 
              Rejection Reason
            </label>
            <select 
              id="rejectReason" 
              class="custom-swal-select"
              style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; 
                    border-radius: 8px; background: #f8fafc; color: #2c3e50; 
                    font-size: 14px; outline: none; margin-bottom: 10px;"
            >
              <option value="">Select a reason</option>
              <option value="Out of return window">Out of return window</option>
              <option value="Product used/damaged">Product used/damaged</option>
              <option value="Missing original packaging">Missing original packaging</option>
              <option value="Accessories missing">Accessories missing</option>
              <option value="Not as per return policy">Not as per return policy</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 500;">
              <i class="fas fa-pen" style="color: #e74c3c; margin-right: 8px;"></i>
              Additional Comments (Optional)
            </label>
            <textarea 
              id="rejectComments" 
              placeholder="Provide additional details for rejection..."
              rows="3"
              style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; 
                    border-radius: 8px; background: #f8fafc; color: #2c3e50; 
                    font-size: 14px; resize: vertical; outline: none;"
            ></textarea>
          </div>
          
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; 
                padding: 12px; background: rgba(231, 76, 60, 0.05); border-radius: 8px;">
            <input type="checkbox" id="notifyCustomerReject" checked 
                  style="width: 18px; height: 18px; accent-color: #e74c3c; cursor: pointer;">
            <label style="color: #2c3e50; font-weight: 500; cursor: pointer;">
              <i class="fas fa-bell" style="color: #e74c3c; margin-right: 6px;"></i>
              Notify customer about rejection
            </label>
          </div>
          
          <div style="background: rgba(243, 156, 18, 0.1); padding: 12px; border-radius: 8px; 
                border-left: 4px solid #f39c12;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <i class="fas fa-exclamation-triangle" style="color: #f39c12;"></i>
              <div style="font-size: 0.9rem; color: #2c3e50;">
                <strong>Warning:</strong> This action cannot be undone. The customer will be notified.
              </div>
            </div>
          </div>
        </div>
      `,
      background: '#ffffff',
      color: '#2c3e50',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-ban"></i> Confirm Rejection',
      cancelButtonText: '<i class="fas fa-times"></i> Cancel',
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#7f8c8d',
      width: 500,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-content',
        confirmButton: 'custom-swal-danger-btn',
        cancelButton: 'custom-swal-cancel-btn'
      },
      preConfirm: () => {
        const rejectReason = (document.getElementById('rejectReason') as HTMLSelectElement)?.value;
        const rejectComments = (document.getElementById('rejectComments') as HTMLTextAreaElement)?.value;
        const notifyCustomer = (document.getElementById('notifyCustomerReject') as HTMLInputElement)?.checked;

        if (!rejectReason) {
          Swal.showValidationMessage('Please select a rejection reason');
          return false;
        }

        return { rejectReason, rejectComments, notifyCustomer };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { rejectReason, rejectComments, notifyCustomer } = result.value;
        this.rejectReturn(r.id, rejectReason, rejectComments, notifyCustomer);
      }
    });
  }

  rejectReturn(
    returnId: string,
    reason: string,
    comments: string,
    notifyCustomer: boolean
  ) {
    this.returnApiService.rejectReturn(returnId, reason).subscribe({
      next: () => {
        // ✅ Update UI AFTER backend success
        const r = this.returnRequests.find(x => x.id === returnId);
        if (r) {
          r.status = 'Rejected';
          r.rejectedBy = 'Distributor';
          r.rejectionReason = reason;
          r.rejectionComments = comments;
        }

        this.toastr.success('Return rejected successfully');

        // ✅ safest option (recommended)
        // this.loadReturns();
      },
      error: err => {
        this.toastr.error(
          err.error?.message || 'Failed to reject return'
        );
      }
    });
  }


  getStatusLabel(status: string): string {
    switch (status) {
      case 'Pending': return 'Pending';
      case 'PickupConfirmed': return 'Pickup Confirmed';
      case 'Received': return 'Awaiting Confirmation';
      case 'Completed': return 'Completed';
      case 'Rejected': return 'Rejected';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Pending': return 'fa-clock';
      case 'PickupConfirmed': return 'fa-calendar-check';
      case 'Received': return 'fa-box-open';
      case 'Completed': return 'fa-check-circle';
      case 'Rejected': return 'fa-times-circle';
      default: return 'fa-clock';
    }
  }

  getStatusCount(status: string): number {
    return this.returnRequests.filter(r => r.status === status).length;
  }

  viewDetails(r: any) {
    Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 10px; color: #3498db;">' +
        '<i class="fas fa-info-circle" style="font-size: 1.5rem;"></i>' +
        '<span>Return Details</span>' +
        '</div>',
      html: `
        <div style="text-align: left; padding: 10px;">
          <div style="background: linear-gradient(135deg, #3498db, #2c3e50); color: white; 
                padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-exchange-alt"></i>
              Return #${r.id}
            </h3>
          </div>
          
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #7f8c8d; font-weight: 500;">Order ID:</span>
              <span style="color: #2c3e50; font-weight: 600;">${r.orderId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #7f8c8d; font-weight: 500;">Product:</span>
              <span style="color: #2c3e50; font-weight: 600;">${r.productName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #7f8c8d; font-weight: 500;">Quantity:</span>
              <span style="color: #e74c3c; font-weight: 600;">${r.returnQty}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
  <span style="color: #7f8c8d; font-weight: 500;">Price:</span>
  <span style="color: #27ae60; font-weight: 600;">₹${r.price ?? '0'}</span>
</div>
           
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #7f8c8d; font-weight: 500;">Status:</span>
              <span style="color: ${this.getStatusColor(r.status)}; font-weight: 600;">
                ${this.getStatusLabel(r.status)}
              </span>
            </div>
            ${r.pickupDate ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #7f8c8d; font-weight: 500;">Pickup Date:</span>
                <span style="color: #2c3e50; font-weight: 500;">${new Date(r.pickupDate).toLocaleDateString()}</span>
              </div>
            ` : ''}
            ${r.pickupSlot ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #7f8c8d; font-weight: 500;">Time Slot:</span>
                <span style="color: #2c3e50; font-weight: 500;">${r.pickupSlot}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="color: #7f8c8d; font-weight: 500;">Request Date:</span>
              <span style="color: #2c3e50; font-weight: 500;">${new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: rgba(52, 152, 219, 0.1); 
                border-radius: 8px; border-left: 4px solid #3498db;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 0.95rem; 
                  display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-comment-alt" style="color: #3498db;"></i>
              Return Reason
            </h4>
            <p style="margin: 0; color: #2c3e50; font-size: 0.9rem;">${r.reason}</p>
          </div>
        </div>
      `,
      background: '#ffffff',
      color: '#2c3e50',
      showConfirmButton: true,
      confirmButtonText: '<i class="fas fa-times"></i> Close',
      confirmButtonColor: '#3498db',
      width: 450,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-content',
        confirmButton: 'custom-swal-confirm-btn'
      }
    });
  }

  contactCustomer(r: any) {
    Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 10px; color: #3498db;">' +
        '<i class="fas fa-phone-alt" style="font-size: 1.5rem;"></i>' +
        '<span>Contact Customer</span>' +
        '</div>',
      html: `
        <div style="text-align: left; padding: 10px;">
          <div style="background: linear-gradient(135deg, #3498db, #2c3e50); color: white; 
                padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-user"></i>
              ${r.customerName}
            </h3>
          </div>
          
          <div style="display: grid; gap: 15px; margin-bottom: 20px;">
            <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <i class="fas fa-phone" style="color: #3498db; font-size: 1.2rem;"></i>
                <span style="font-weight: 600; color: #2c3e50;">Phone Number</span>
              </div>
              <div style="color: #2c3e50; font-size: 1.1rem; font-weight: 500;">
                ${r.customerPhone || 'N/A'}
              </div>
            </div>
            
            <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <i class="fas fa-envelope" style="color: #3498db; font-size: 1.2rem;"></i>
                <span style="font-weight: 600; color: #2c3e50;">Email Address</span>
              </div>
              <div style="color: #2c3e50; font-size: 1.1rem; font-weight: 500;">
                ${r.customerEmail || 'N/A'}
              </div>
            </div>
          </div>
          
          <div style="background: rgba(243, 156, 18, 0.1); padding: 12px; border-radius: 8px; 
                border-left: 4px solid #f39c12;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <i class="fas fa-info-circle" style="color: #f39c12;"></i>
              <div style="font-size: 0.9rem; color: #2c3e50;">
                <strong>Note:</strong> Please maintain professional communication when contacting customers.
              </div>
            </div>
          </div>
        </div>
      `,
      background: '#ffffff',
      color: '#2c3e50',
      showConfirmButton: true,
      confirmButtonText: '<i class="fas fa-times"></i> Close',
      confirmButtonColor: '#3498db',
      showDenyButton: true,
      denyButtonText: '<i class="fas fa-phone"></i> Call Now',
      denyButtonColor: '#27ae60',
      width: 400,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-content',
        confirmButton: 'custom-swal-confirm-btn',
        denyButton: 'custom-swal-secondary-btn'
      }
    }).then((result) => {
      if (result.isDenied && r.customerPhone) {
        window.open(`tel:${r.customerPhone}`, '_blank');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return '#f39c12';
      case 'PickupConfirmed': return '#3498db';
      case 'Received': return '#9b59b6';
      case 'Completed': return '#27ae60';
      case 'Rejected': return '#e74c3c';
      default: return '#7f8c8d';
    }
  }

  private showErrorAlert(title: string, message: string) {
    Swal.fire({
      title: `<div style="display: flex; align-items: center; gap: 10px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem;"></i>
                <span>${title}</span>
              </div>`,
      html: `
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 4rem; color: #e74c3c; margin-bottom: 15px;">
            <i class="fas fa-times-circle"></i>
          </div>
          <p style="color: #7f8c8d; margin-bottom: 20px; font-size: 15px;">${message}</p>
        </div>
      `,
      background: '#ffffff',
      color: '#2c3e50',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3498db',
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-content',
        confirmButton: 'custom-swal-confirm-btn'
      }
    });
  }


  selectedImages: string[] = [];
  selectedImageIndex = 0;
  isImageModalOpen = false;

  openImageGallery(images: string[], index: number = 0) {
    this.selectedImages = images;
    this.selectedImageIndex = index;
    this.isImageModalOpen = true;
  }

  closeImageGallery() {
    this.isImageModalOpen = false;
  }

  prevImage() {
    if (this.selectedImageIndex > 0) {
      this.selectedImageIndex--;
    }
  }

  nextImage() {
    if (this.selectedImageIndex < this.selectedImages.length - 1) {
      this.selectedImageIndex++;
    }
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedReturns = this.returnRequests.slice(start, end);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  handlePageClick(page: number | string) {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }

  getPageNumbers(): (number | string)[] {

    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (this.currentPage > 3) pages.push('...');

    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (this.currentPage < this.totalPages - 2) pages.push('...');

    pages.push(this.totalPages);

    return pages;
  }
}

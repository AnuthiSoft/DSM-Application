import { Component } from '@angular/core';
import { DistributorService } from '../../services/distributor.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-distributor-settings',
  templateUrl: './distributor-settings.component.html',
  styleUrl: './distributor-settings.component.css'
})
export class DistributorSettingsComponent {
   distributorId: string = '';
  expectedDays: number = 1;
  leadTime:number = 1;
  selectedQrFile: File | null = null;
  scannerQrUrl: string | null = null;
   activeTab: string = 'distributor-settings';

  isActive(tabName: string): boolean {
    return this.activeTab === tabName;
  }
    // ✅ DATE DISPLAY
  currentDate: Date = new Date();

  // ✅ UPLOAD STATE
  uploading: boolean = false;

  // ✅ FULLSCREEN MODAL
  showFullscreen: boolean = false;
    constructor(private distributorService: DistributorService) {}
ngOnInit() {
    this.distributorId = localStorage.getItem('distributorId') || '';
    // this.loadRequests();
      // this.loadAcceptedCustomers();
      // this.distributorId = localStorage.getItem('distributorId') || '';

  // Load only ONCE when component is created
  const stored = localStorage.getItem(`leadTime_${this.distributorId}`);
  this.expectedDays = stored ? Number(stored) : 1;
               // ⬅ added
        this.loadScannerQr();
  }
  loadScannerQr() {
  if (!this.distributorId) return;

  this.distributorService.getScannerQr(this.distributorId)
    .subscribe({
      next: res => {
        this.scannerQrUrl = res?.scannerQrUrl || null; // blob name
      },
      error: () => {
        this.scannerQrUrl = null;
      }
    });
}
saveLeadTime() {
  localStorage.setItem(`leadTime_${this.distributorId}`, this.leadTime.toString());
  alert("Delivery lead time saved!");
}

saveExpectedDayss() {
  localStorage.setItem(`leadTime_${this.distributorId}`, this.expectedDays.toString());
  alert("Expected delivery days saved!");
}

getScannerQrUrl(blobName: string | null): string {
  if (!blobName) return '';
  return `${environment.apiUrl}/distributor/scanner-qr/view/${blobName}`;
}
  downloadQr() {
    if (!this.scannerQrUrl) return;

    const link = document.createElement('a');
    link.href = this.getScannerQrUrl(this.scannerQrUrl);
    link.download = 'scanner-qr.png';
    link.click();
  }


  onImageLoad() {
    console.log('QR image loaded');
  }

  onImageError() {
    console.log('QR image failed to load');
  }
  viewFullscreen() {
    this.showFullscreen = true;
  }

onQrSelected(event: any) {
  this.selectedQrFile = event.target.files[0];
}

uploadScannerQr() {
  if (!this.selectedQrFile || !this.distributorId) return;

  this.distributorService
    .uploadScannerQr(this.distributorId, this.selectedQrFile)
    .subscribe({
      next: (res) => {
        this.scannerQrUrl = res?.scannerQrUrl || null;
        alert('Scanner QR uploaded successfully');
        this.selectedQrFile = null;
      },
      error: () => {
        alert('Failed to upload QR');
      }
    });
}
}

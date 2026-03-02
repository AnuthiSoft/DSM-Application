import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-otp-input',
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.css'
})
export class OtpInputComponent {
 otpArray = [1, 2, 3, 4, 5, 6];
  otpValues: string[] = ["", "", "", "", "", ""];

  @Output() otpCompleted = new EventEmitter<string>();
  @Output() resend = new EventEmitter<void>();

  // Move to next box automatically
  onKeyUp(event: any, index: number) {
    const input = event.target;

    if (input.value && index < 5) {
      const next = input.nextElementSibling;
      next.focus();
    }
  }

  // Allow only numbers
  onKeyDown(event: KeyboardEvent) {
    if (!/[0-9]/.test(event.key) && event.key !== "Backspace") {
      event.preventDefault();
    }
  }

  verifyOtp() {
    const otp = this.otpValues.join("");
    if (otp.length === 6) {
      this.otpCompleted.emit(otp);
    }
  }

  resendOtp() {
    this.resend.emit();
  }
}

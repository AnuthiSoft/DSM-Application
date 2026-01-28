import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-collection-for-cashcollector',
  templateUrl: './payment-collection-for-cashcollector.component.html',
  styleUrl: './payment-collection-for-cashcollector.component.css'
})
export class PaymentCollectionForCashcollectorComponent {
   activeSection: 'collect' | 'summary' | 'handover' = 'collect';

  switch(section: 'collect' | 'summary' | 'handover') {
    this.activeSection = section;
  }

}

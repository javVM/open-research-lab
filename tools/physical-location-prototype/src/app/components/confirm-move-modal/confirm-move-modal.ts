import { Component, inject } from '@angular/core';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createConfirmMoveModalTranslations } from './confirm-move-modal.translations';

@Component({
  selector: 'app-confirm-move-modal',
  imports: [],
  templateUrl: './confirm-move-modal.html',
  styleUrl: './confirm-move-modal.css',
})
export class ConfirmMoveModalComponent {
  protected readonly data = inject(DataService);
  protected readonly text = createConfirmMoveModalTranslations(inject(TranslationService));

  confirm(): void {
    this.data.confirmPendingMove();
  }

  cancel(): void {
    this.data.cancelPendingMove();
  }
}

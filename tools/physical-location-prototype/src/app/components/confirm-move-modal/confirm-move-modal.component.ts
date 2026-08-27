import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { createConfirmMoveModalTranslations } from './confirm-move-modal.translations';

@Component({
  standalone: true,
  selector: 'app-confirm-move-modal',
  imports: [MatButtonModule],
  templateUrl: './confirm-move-modal.component.html',
  styleUrl: './confirm-move-modal.component.scss',
})
export class ConfirmMoveModalComponent {
  protected readonly move = inject(MoveService);
  private readonly navigation = inject(NavigationService);
  protected readonly text = createConfirmMoveModalTranslations(inject(TranslationService));

  confirm(): void {
    const targetId = this.move.confirmPendingMove();
    if (targetId) {
      this.navigation.navigateToLocation(targetId);
    }
  }

  cancel(): void {
    this.move.cancelPendingMove();
  }
}

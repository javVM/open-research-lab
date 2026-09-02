import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { SettingsService } from '../../settings.service';
import { TranslationService } from '../../i18n/translation.service';
import { createConfirmMoveModalTranslations } from './confirm-move-modal.translations';

@Component({
  standalone: true,
  selector: 'app-confirm-move-modal',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './confirm-move-modal.component.html',
  styleUrl: './confirm-move-modal.component.scss',
})
export class ConfirmMoveModalComponent {
  protected readonly move = inject(MoveService);
  private readonly navigation = inject(NavigationService);
  protected readonly settings = inject(SettingsService);
  protected readonly text = createConfirmMoveModalTranslations(inject(TranslationService));
  protected readonly agent = signal('');
  protected readonly note = signal('');

  confirm(): void {
    const s = this.settings.settings();
    const agent = s.requireAgentOnMove ? (this.agent().trim() || this.settings.settings().institutionName.trim()) : undefined;
    const note = s.requireNoteOnMove ? this.note().trim() : undefined;
    const targetId = this.move.confirmPendingMove(note, agent);
    if (targetId) {
      this.agent.set('');
      this.note.set('');
      this.navigation.navigateToLocation(targetId);
    }
  }

  cancel(): void {
    this.agent.set('');
    this.note.set('');
    this.move.cancelPendingMove();
  }
}

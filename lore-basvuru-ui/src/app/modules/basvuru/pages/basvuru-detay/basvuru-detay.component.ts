import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-basvuru-detay',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6">
      <a mat-button routerLink="/basvurular" class="mb-4">
        <mat-icon>arrow_back</mat-icon> Geri
      </a>
      <h2 class="text-2xl font-semibold mt-4">Başvuru Detayı</h2>
      <p class="text-secondary mt-1">EID: {{ eid }}</p>
    </div>
  `
})
export class BasvuruDetayComponent {
  eid: string;
  constructor(private route: ActivatedRoute) {
    this.eid = this.route.snapshot.paramMap.get('eid') ?? '';
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { BasvuruService } from '../../services/basvuru.service';
import { UserBasvuruModel, BasvuruListeFiltresi } from '../../models/basvuru.model';

@Component({
  selector: 'app-basvuru-listesi',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatTooltipModule, MatProgressSpinnerModule, MatMenuModule,
  ],
  templateUrl: './basvuru-listesi.component.html',
})
export class BasvuruListesiComponent implements OnInit, OnDestroy {
  basvurular: UserBasvuruModel[] = [];
  yukleniyor = false;
  displayedColumns = ['formAdi', 'durum', 'tarih', 'islemler'];
  private subs: Subscription[] = [];

  constructor(private basvuruService: BasvuruService) {}

  ngOnInit(): void {
    this.listeleGetir();
  }

  listeleGetir(): void {
    this.yukleniyor = true;
    const filtre = new BasvuruListeFiltresi();
    this.subs.push(
      this.basvuruService.Listele(filtre).subscribe({
        next: res => {
          if (res?.isSuccess) {
            this.basvurular = res.data ?? [];
          }
        },
        complete: () => { this.yukleniyor = false; }
      })
    );
  }

  durumRengi(durum: string): string {
    const map: Record<string, string> = {
      'Taslak': 'bg-gray-100 text-gray-700',
      'Gonderildi': 'bg-blue-100 text-blue-700',
      'Onayda': 'bg-yellow-100 text-yellow-700',
      'Onaylandi': 'bg-green-100 text-green-700',
      'Reddedildi': 'bg-red-100 text-red-700',
    };
    return map[durum] ?? 'bg-gray-100 text-gray-700';
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}

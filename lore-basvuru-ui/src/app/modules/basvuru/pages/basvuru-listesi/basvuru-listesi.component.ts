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
import { BasvuruService } from '../../services/basvuru.service';
import { UserBasvuruModel } from '../../models/basvuru.model';

@Component({
  selector: 'app-basvuru-listesi',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  templateUrl: './basvuru-listesi.component.html',
})
export class BasvuruListesiComponent implements OnInit, OnDestroy {
  basvurular: UserBasvuruModel[] = [];
  yukleniyor = false;
  displayedColumns = ['formAd', 'durum', 'baslamaTarihi', 'islemler'];
  private subs: Subscription[] = [];

  constructor(private basvuruService: BasvuruService) {}

  ngOnInit(): void {
    this.listeleGetir();
  }

  listeleGetir(): void {
    this.yukleniyor = true;
    this.subs.push(
      this.basvuruService.Listele().subscribe({
        next: res => {
          if (res?.isSuccess) {
            this.basvurular = res.data ?? [];
          }
          this.yukleniyor = false;
        },
        error: () => { this.yukleniyor = false; }
      })
    );
  }

  // Backend durum numaraları: 1=Taslak, 2=Gönderildi, 3=İncelemede, 4=Tamamlandı
  durumRengi(durum: number): string {
    const map: Record<number, string> = {
      1: 'bg-gray-100 text-gray-700',
      2: 'bg-blue-100 text-blue-700',
      3: 'bg-yellow-100 text-yellow-700',
      4: 'bg-green-100 text-green-700',
    };
    return map[durum] ?? 'bg-gray-100 text-gray-700';
  }

  durumAdi(durum: number): string {
    const map: Record<number, string> = {
      1: 'Taslak', 2: 'Gönderildi', 3: 'İncelemede', 4: 'Tamamlandı'
    };
    return map[durum] ?? 'Bilinmiyor';
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}

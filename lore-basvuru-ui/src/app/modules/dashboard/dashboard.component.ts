import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from 'app/base/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);

  kullaniciAdi = '';
  kartlar = [
    { baslik: 'Başvurularım', ikon: 'description', renk: 'bg-blue-500', link: '/basvurular', aciklama: 'Tüm başvurularınızı görüntüleyin' },
    { baslik: 'Form Yönetimi', ikon: 'dynamic_form', renk: 'bg-green-500', link: '/form-builder', aciklama: 'Başvuru formlarını tasarlayın' },
    { baslik: 'Yönetim', ikon: 'admin_panel_settings', renk: 'bg-purple-500', link: '/admin', aciklama: 'Rol ve yetki yönetimi' },
  ];

  ngOnInit(): void {
    const kisiDto = this.authService.currentUserValue?.kisiTokenDto?.kisiDto;
    this.kullaniciAdi = kisiDto?.adSoyad || kisiDto?.ad || 'Kullanıcı';
  }
}

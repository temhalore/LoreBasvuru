import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PageSchema } from '../../../models/form-schema.model';
import { PageProgress } from '../models/form-respondent-navigation.model';

@Injectable()
export class FormNavigationService {

    private pages: PageSchema[] = [];
    private pageHistory: string[] = [];
    private currentPageEidSubject = new BehaviorSubject<string>('');

    currentPageEid$ = this.currentPageEidSubject.asObservable();

    /** Sayfa listesini yükle ve ilk sayfayı set et */
    initialize(pages: PageSchema[]): void {
        this.pages = [...pages].sort((a, b) => a.order - b.order);
        this.pageHistory = [];
        this.currentPageEidSubject.next(this.pages.length > 0 ? this.pages[0].eid : '');
        this.reconcile();
    }

    /** Navigation state'ini geçerli sayfa listesine göre tutarlı hale getir */
    reconcile(): void {
        this.pageHistory = this.pageHistory.filter((eid) => this.hasPage(eid));

        if (this.pages.length === 0) {
            if (this.currentPageEidSubject.value !== '') {
                this.currentPageEidSubject.next('');
            }
            return;
        }

        const current = this.currentPageEidSubject.value;
        if (this.hasPage(current)) {
            return;
        }

        const fallback = this.getLastValidHistoryPage() ?? this.pages[0].eid;
        while (this.pageHistory.length > 0 && this.pageHistory[this.pageHistory.length - 1] === fallback) {
            this.pageHistory.pop();
        }

        this.currentPageEidSubject.next(fallback);
    }

    /** Aktif sayfayı getir */
    getCurrentPage(): PageSchema | undefined {
        this.reconcile();
        return this.pages.find(p => p.eid === this.currentPageEidSubject.value);
    }

    /** Aktif sayfanın eid'sini döner */
    getCurrentPageEid(): string {
        this.reconcile();
        return this.currentPageEidSubject.value;
    }

    /** Sıralı sayfa listesini döner */
    getPages(): PageSchema[] {
        return [...this.pages];
    }

    /** Sonraki sayfaya geç (ya da skip logic ile hedef sayfaya atla) */
    goNext(targetPageEid?: string): void {
        this.reconcile();

        const current = this.currentPageEidSubject.value;
        if (!this.hasPage(current)) {
            return;
        }

        let nextPageEid: string | undefined;

        if (targetPageEid && this.hasPage(targetPageEid) && targetPageEid !== current) {
            nextPageEid = targetPageEid;
        } else {
            const idx = this.getCurrentPageIndex();
            if (idx >= 0 && idx < this.pages.length - 1) {
                nextPageEid = this.pages[idx + 1].eid;
            }
        }

        if (!nextPageEid) {
            return;
        }

        this.pageHistory.push(current);
        this.currentPageEidSubject.next(nextPageEid);
    }

    /** Geri git (stack'ten pop) */
    goBack(): boolean {
        this.reconcile();

        const current = this.currentPageEidSubject.value;

        while (this.pageHistory.length > 0) {
            const prevPageEid = this.pageHistory.pop()!;
            if (this.hasPage(prevPageEid) && prevPageEid !== current) {
                this.currentPageEidSubject.next(prevPageEid);
                return true;
            }
        }

        const currentIndex = this.getCurrentPageIndex();
        if (currentIndex > 0) {
            this.currentPageEidSubject.next(this.pages[currentIndex - 1].eid);
            return true;
        }

        return false;
    }

    /** İlk sayfada mıyız? */
    isFirstPage(): boolean {
        const currentIndex = this.getCurrentPageIndex();
        return this.pages.length === 0 || currentIndex <= 0;
    }

    /** Son sayfada mıyız? */
    isLastPage(): boolean {
        if (this.pages.length === 0) {
            return false;
        }

        const currentIndex = this.getCurrentPageIndex();
        return currentIndex >= 0 && currentIndex === this.pages.length - 1;
    }

    /** Toplam / aktif sayfa numarası */
    getProgress(): PageProgress {
        const total = this.pages.length;
        if (total === 0) {
            return { current: 0, total: 0 };
        }

        const idx = this.getCurrentPageIndex();
        const current = Math.min(Math.max(idx + 1, 1), total);
        return { current, total };
    }

    private getCurrentPageIndex(): number {
        this.reconcile();
        const current = this.currentPageEidSubject.value;
        return this.pages.findIndex(p => p.eid === current);
    }

    private hasPage(pageEid: string): boolean {
        return !!pageEid && this.pages.some((page) => page.eid === pageEid);
    }

    private getLastValidHistoryPage(): string | null {
        for (let index = this.pageHistory.length - 1; index >= 0; index--) {
            const pageEid = this.pageHistory[index];
            if (this.hasPage(pageEid)) {
                return pageEid;
            }
        }

        return null;
    }
}

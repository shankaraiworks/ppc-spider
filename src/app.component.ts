import { Component, ChangeDetectionStrategy, signal, inject, computed, WritableSignal, Signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, Validators, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { DashboardData, FormValue } from './models/dashboard.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule]
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  form: FormGroup;
  apiKeyControl: FormControl;
  loading: WritableSignal<boolean> = signal(false);
  isExportingPdf: WritableSignal<boolean> = signal(false);
  loadingMessage: WritableSignal<string> = signal('');
  error: WritableSignal<string | null> = signal(null);
  dashboardData: WritableSignal<DashboardData | null> = signal(null);

  apiKeyMissing: Signal<boolean> = computed(() => !this.geminiService.apiKey());

  maxTrendValue: Signal<number> = computed(() => {
    const data = this.dashboardData();
    if (!data?.keywordAnalysis?.keywords) return 100;
    const allTrends = data.keywordAnalysis.keywords.flatMap(k => k.trend);
    return Math.max(...allTrends, 100);
  });

  keywordRankingHeaders: Signal<string[]> = computed(() => {
    const data = this.dashboardData();
    if (!data?.competitorAnalysis?.keywordRankingComparison) return [];
    
    // Create a set of all competitor names from all keyword rankings to get a unique, consistent list
    const names = new Set<string>();
    data.competitorAnalysis.keywordRankingComparison.forEach(kw => {
        kw.rankings.forEach(r => names.add(r.name));
    });
    return Array.from(names);
  });

  private loadingMessages = [
      "Crafting your marketing strategy...",
      "Analyzing market trends...",
      "Sizing up the competition...",
      "Auditing digital footprints...",
      "Identifying keyword opportunities...",
      "Generating platform recommendations...",
      "Finalizing your dashboard..."
  ];
  private loadingInterval: any;

  constructor() {
    this.form = new FormGroup({
      companyName: new FormControl('EDKENT® Media', Validators.required),
      targetLocation: new FormControl('Toronto, Canada', Validators.required),
      adSpend: new FormControl(1000, [Validators.required, Validators.min(100)]),
      campaignObjective: new FormControl('Lead Generation', Validators.required),
      competitors: new FormControl(''),
      keywords: new FormControl(''),
      currency: new FormControl('CAD', Validators.required),
    });
    this.apiKeyControl = new FormControl('', [Validators.required]);
  }

  setApiKey(): void {
    if (this.apiKeyControl.invalid) {
      return;
    }
    try {
      this.geminiService.initialize(this.apiKeyControl.value!);
      this.error.set(null);
    } catch(e: any) {
      this.error.set(e.message);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    this.dashboardData.set(null);
    this.startLoadingMessages();

    try {
      const formData = this.form.value as FormValue;
      const data = await this.geminiService.generateDashboardData(formData);
      this.dashboardData.set(data);
    } catch (e: any) {
      this.error.set(e.message || 'An unknown error occurred.');
    } finally {
      this.loading.set(false);
      this.stopLoadingMessages();
    }
  }
  
  getRankingFor(keyword: any, competitorName: string): string {
    const rank = keyword.rankings.find((r: any) => r.name === competitorName);
    return rank ? rank.position : 'N/A';
  }

  startNewReport(): void {
    this.dashboardData.set(null);
    this.error.set(null);
    this.form.reset({
      companyName: 'EDKENT® Media',
      targetLocation: 'Toronto, Canada',
      adSpend: 1000,
      campaignObjective: 'Lead Generation',
      competitors: '',
      keywords: '',
      currency: 'CAD',
    });
  }

  async exportToPdf(): Promise<void> {
    const dashboardElement = document.getElementById('dashboard-content');
    if (!dashboardElement) {
        console.error('Dashboard element not found');
        return;
    }
    
    this.isExportingPdf.set(true);

    try {
        const canvas = await html2canvas(dashboardElement, {
            scale: 3, // Increased scale for higher quality
            useCORS: true,
            backgroundColor: '#f1f5f9' // bg-slate-100
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        
        const companyName = this.form.get('companyName')?.value || 'Report';
        const fileName = `Performance-Report-${companyName.replace(/\s+/g, '-')}.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        this.error.set('Failed to export dashboard to PDF.');
    } finally {
        this.isExportingPdf.set(false);
    }
  }
  
  private startLoadingMessages(): void {
    let index = 0;
    this.loadingMessage.set(this.loadingMessages[index]);
    this.loadingInterval = setInterval(() => {
      index = (index + 1) % this.loadingMessages.length;
      this.loadingMessage.set(this.loadingMessages[index]);
    }, 2500);
  }

  private stopLoadingMessages(): void {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
    }
  }
}
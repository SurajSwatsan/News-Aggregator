import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-source-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './source-profile.html',
  styleUrl: './source-profile.scss'
})
export class SourceProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  sourceId = signal<string | null>(null);
  publisher = signal<any>(null);
  articles = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.sourceId.set(params.get('id'));
      this.loadMockData();
    });
  }

  loadMockData() {
    // Simulate API delay
    setTimeout(() => {
      this.publisher.set({
        name: 'Sakal',
        firstName: 'Sumit',
        lastName: 'Patil',
        email: 'Sumit.Patil@swatsan.com',
        orgName: 'Sakal Media Group',
        orgWebsite: 'https://www.esakal.com',
        orgDescription: 'Sakal is a Marathi-language daily newspaper published from Pune, Maharashtra, India. It is the largest circulated Marathi newspaper in Maharashtra regions.'
      });

      this.articles.set([
        {
          id: '1',
          title: 'Regional Elections: High Voter Turnout Expected in Pune',
          synopsis: 'As the regional elections approach, political analysts predict a significant increase in voter participation...',
          postedAt: new Date(),
          category: 'POLITICS',
          imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=1000'
        },
        {
          id: '2',
          title: 'New Infrastructure Project Announced for Maharashtra Highway',
          synopsis: 'The state government has unveiled a multi-billion dollar plan to modernize the highway connecting major cities...',
          postedAt: new Date(Date.now() - 86400000),
          category: 'DEVELOPMENT',
          imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000'
        }
      ]);
      
      this.isLoading.set(false);
    }, 800);
  }

  formatDate(date: any) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

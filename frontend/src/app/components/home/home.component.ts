import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import * as GitHubCalendar from 'github-calendar';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { map, take, catchError } from 'rxjs/operators';
import { from, of, Subscription } from 'rxjs';
import { ProjectComponent } from '../projects/project.component';
import { WeerdenProject } from '../projects/project.model';
import { projects } from './projects';
import { ApiService } from '../../services/api.service';
import { RssFeedResponse } from '../../services/api.service.model';

// wrap in object for unit test
export const dependencies = {
  GitHubCalendar
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  modalRef: NgbModalRef;
  projects: WeerdenProject[] = projects;
  featuredProject: WeerdenProject;
  blogUrl = 'https://jimenezweerden.wordpress.com/';
  subscriptions = new Subscription();

  rssFeed$ = this.apiService.getRSSFeed()
    .pipe(
      map(rssFeed => ({...rssFeed, items: rssFeed.items.slice(0, 3)} as RssFeedResponse)),
      catchError(() => of('error'))
    );

  constructor(private modalService: NgbModal,
              private route: ActivatedRoute,
              private router: Router,
              private apiService: ApiService) {
  }

  ngOnInit(): void {
    this.initGithubCalendar();
    this.watchQueryParams();
    this.featuredProject = this.projects.find(project => project.featured);
  }

  initGithubCalendar(): void {
    dependencies.GitHubCalendar('#github-graph', 'jimenezweerden', {responsive: true});
  }

  watchQueryParams() {
    this.subscriptions.add(
      this.route.queryParams
        .subscribe((params: Params) => {
          const project = this.projects.find(prjct => prjct.name === params.project);
          project
            ? this.openProjectDialog(project)
            : this.removeQueryParams();
        })
    );
  }

  openProjectDialog(project: WeerdenProject): void {
    this.modalRef = this.modalService.open(ProjectComponent);
    this.modalRef.componentInstance.project = project;

    const result$ = from(this.modalRef.result);
    result$
      .pipe(take(1))
      .subscribe()
      .add(() => this.removeQueryParams());
  }

  removeQueryParams(): void {
    this.modalRef?.close();
    this.router.navigate(['.'], {relativeTo: this.route});
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

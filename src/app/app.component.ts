import {Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild, AfterViewInit, ElementRef, NgZone} from '@angular/core';
import {CategoryId, OptionsService, OptionType} from './services/options.service';
import {SearchBarService} from './components/search-bar/search-bar.service';
import {NavigationEnd, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {ResearchHubApiService} from './services/research-hub-api.service';
import {AnalyticsService} from './services/analytics.service';
import {isPlatformBrowser} from '@angular/common';
import {AuthService} from './services/auth.service';
import {ChangeDetectorRef} from '@angular/core';
import * as format from 'date-fns/format';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import {HeaderService} from './components/header/header.service';
import {Location} from '@angular/common';
import {AppComponentService} from './app.component.service';
import {Title} from "@angular/platform-browser";
import { ScrollDispatcher } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {

  public aucklandUniUrl = 'https://auckland.ac.nz';
  public eResearchUrl = 'http://eresearch.auckland.ac.nz';
  public disclaimerUrl = 'https://www.auckland.ac.nz/en/admin/footer-links/disclaimer.html';

  private mediaChangeSub: Subscription;
  private searchTextChangeSub: Subscription;
  private routerSub: Subscription;
  private progressBarVisibilitySub: Subscription;
  private titleSub: Subscription;
  private contentSidenavVisibilitySub: Subscription;
  private topbarScrollSub : Subscription;

  public selectedCategory = CategoryId.All;
  public searchText = '';
  public showFilterButton = false;
  public showLoginBtn = true;
  public showProgressBar = false;
  public showBackBtn = false;
  public showContentSidenav = false;
  public contentSidenavHasContent = false;
  public pageTitle = '';

  private previousRoute = undefined;
  private currentRoute = undefined;
  private isContentSidenavFixed = false;
  private contentSidenavAffixedHeight;

  @ViewChild('topbar')
  private topbarElement : ElementRef;

  @ViewChild('topContent')
  private topContentElement : ElementRef;

  constructor(private location: Location, public optionsService: OptionsService, private headerService: HeaderService,
              private searchBarService: SearchBarService, private router: Router,
              public apiService: ResearchHubApiService, public analyticsService: AnalyticsService,
              public authService: AuthService, private ref: ChangeDetectorRef, private appComponentService: AppComponentService,
              private titleService: Title,
              private scrollDispatcher: ScrollDispatcher,
              private ngZone : NgZone) {

    authService.loginChange.subscribe((loggedIn) => {
      this.showLoginBtn = !loggedIn;
      this.ref.detectChanges();
    });
  }

  getSearchQueryParams(item: any) {
    const type = item['type'];

    if (type === OptionType.Category) {
      return {categoryId: item.id};
    } else {
      return {researchActivityIds: [item.id]};
    }
  }

  getRouteName(url: string) {
    const routeName = url.replace('?', '/');
    return routeName.split('/')[1];
  }

  back() {
    if (this.previousRoute) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  initContentSidenav(){
    this.contentSidenavVisibilitySub = this.appComponentService.contentSidenavVisibilityChange.subscribe((isVisible) => {
      // Sets if we pop out the content sidenav.
      // First check if there is content inside the sidenav, if not, then don't bother popping it out.
      if (this.contentSidenavHasContent){
        this.showContentSidenav = isVisible;
      }
    });
  }

  setContentSidenavHasContent(hasContent: boolean){
    // Hide the content sidenav if there is no longer any content inside.
    if (!hasContent){
      this.showContentSidenav = false;
    }
    this.contentSidenavHasContent = hasContent;
  }

  ngOnInit() {
    this.titleSub = this.appComponentService.titleChange.subscribe((title) => {
      this.pageTitle = title;
    });


    this.progressBarVisibilitySub = this.appComponentService.progressBarVisibilityChange.subscribe((isVisible) => {
      this.showProgressBar = isVisible;
    });

    this.initContentSidenav();
    // Navigate to the search page if the user types text in
    this.searchTextChangeSub = this.searchBarService.searchTextChange.distinctUntilChanged().subscribe(searchText => {
      const url = this.location.path();
      if (url && !url.startsWith('/search') && searchText != null && searchText !== '') {
        this.router.navigate(['/search'], {
          queryParams: {
            categoryId: this.searchBarService.category,
            searchText: this.searchBarService.searchText
          }
        });
      }
    });

    if (isPlatformBrowser) {
      this.routerSub = this.router.events
        .filter(event => event instanceof NavigationEnd)
        .subscribe(event => {
          // Need to use urlAfterRedirects rather than url to get correct routeName, even when route redirected automatically
          const url = event['urlAfterRedirects'];
          const routeName = this.getRouteName(url);

          if (routeName) {
            // Update previous and current routes
            if (this.currentRoute) {
              this.previousRoute = this.currentRoute;
            }
            this.currentRoute = routeName;

            this.showBackBtn = routeName !== 'home';

            this.appComponentService.setProgressBarVisibility(false);
            const pageInfo = this.optionsService.pageInfo[routeName];

            if (pageInfo) {
              this.pageTitle = pageInfo.title;

              // Set title and track page view for pages with pre-defined titles
              if (pageInfo.title) {
                this.titleService.setTitle('ResearchHub: ' + pageInfo.title);
                this.analyticsService.trackPageView(url, pageInfo.title);
              }

              this.headerService.setBatchParams(pageInfo.title, pageInfo.description, pageInfo.imageUrl, pageInfo.isHeaderVisible);
              this.searchBarService.setVisibility(pageInfo.isSearchBarVisible);
            } else {
              console.log('Error pageInfo not set for route:', routeName);
            }

            this.showFilterButton = routeName === 'search';
            window.scrollTo(0, 0); // TODO: remove or change when this pull request is merged https://github.com/angular/angular/pull/20030
          }
        });
    }
  }

  setupContentSidenavFixedSub(){
    this.topbarScrollSub = this.scrollDispatcher.scrolled(150).subscribe(
      event => {
        const topbarRect = this.topbarElement.nativeElement.getBoundingClientRect(),
        contentHeight = this.topContentElement.nativeElement.clientHeight,
        topbarBottom = topbarRect.bottom,
        winY = window.scrollY,
        winHeight = window.innerHeight;
        let newFixedValue, newSidenavHeight;
        if (topbarBottom < 0){
          // The topbar is now scrolled out of view, so we need to affix the
          // content sidenav if it is not affixed.
          if (!this.isContentSidenavFixed){
              newFixedValue = true;
          }
        } else {
          // The topbar is now in view, so we need to un-affix the content
          // sidenav if it is affixed.
          if (this.isContentSidenavFixed){
            newFixedValue = false;
          }
        }
        if (newFixedValue || (newFixedValue === undefined && this.isContentSidenavFixed)){
          // We calculate the height of the affixed content sidenav so that the sidenav does not
          // overlap with the footer.
          newSidenavHeight = Math.min(contentHeight - winY,winHeight);
        }
        this.ngZone.runGuarded(() => {
          if (newFixedValue !== undefined){
            this.isContentSidenavFixed = newFixedValue;
          }
          if (newSidenavHeight !== undefined){
            this.contentSidenavAffixedHeight = newSidenavHeight;
          }
        });
      });

  }

  ngAfterViewInit() {
    this.setupContentSidenavFixedSub();
  }

  ngOnDestroy() {
    this.mediaChangeSub.unsubscribe();
    this.searchTextChangeSub.unsubscribe();
    this.routerSub.unsubscribe();
    this.progressBarVisibilitySub.unsubscribe();
    this.titleSub.unsubscribe();
    this.contentSidenavVisibilitySub.unsubscribe();
    this.topbarScrollSub.unsubscribe();
  }

  getYear() {
    return format(new Date(), 'YYYY');
  }
}

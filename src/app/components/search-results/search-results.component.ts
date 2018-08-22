import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SearchBarService} from 'app/components/search-bar/search-bar.service';
import {Subscription} from 'rxjs/Subscription';
import {CategoryId, OptionsService, RoleTypeId} from 'app/services/options.service';
import {
  ResearchHubApiService, OrderBy,
  SearchResultsParams
} from 'app/services/research-hub-api.service';
import {Page} from 'app/model/Page';
import {AnalyticsService} from 'app/services/analytics.service';

import {FormControl, FormGroup} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common';
import {FilterDialogComponent} from './filter-dialog/filter-dialog.component';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/of';
import { map } from 'rxjs/operators';
import {Tag} from './mat-tags/mat-tags.component';
import {ListItem} from '../../model/ListItem';
import {AppComponentService} from '../../app.component.service';
import {PageEvent} from '@angular/material/paginator';
import {Subject} from 'rxjs/Subject';
import {MatPaginator} from '@angular/material/paginator';
import {LayoutService} from '../../services/layout.service';

import {MediaChange, ObservableMedia} from '@angular/flex-layout';
import {forkJoin} from 'rxjs/observable/forkJoin';

import {SearchFiltersService} from './search-filters/search-filters.service';
import { SearchResultsComponentService } from './search-results-component.service';

// The screen size at which we should switch to opening filters in dialog or sidenav.
const FILTER_VIEW_BREAKPOINT = "md";

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit, OnDestroy {

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('resultsDummyHeader') private resultsDummyHeader: ElementRef;

  public filtersForm: FormGroup;
  public resultsPage: Page<ListItem>;

  private buttonClickSub: Subscription;
  private categoryIdSub: Subscription;
  private searchChangeSub: Subscription;
  private routeParamsSub: Subscription;
  private contentNavVisibilitySub: Subscription;

  private resultsSub : Subscription;
  private categoriesSub : Subscription;

  public searchTextIsBlank = true;
  public noResultsSummary = '';
  public resultsSummary = '';
  public showEmptyState = false;

  public pageSizeOptions = [6, 12, 60, 120, 600];

  public orderBy;
  public pageSize;
  public pageIndex;

  private pageEventChange: Subject<any> = new Subject<any>();
  private orderByChange: Subject<OrderBy> = new Subject<OrderBy>();
  private previousPageEvent: any;
  private previousFiltersFormValues: any;
  private previousSearchText: any;
  private filterVisible: boolean = false;

  // Used for determining number of columns for card-view results
  public cardViewResultsNumberOfColumns = 3;
  private mediaSub: Subscription;

  public showCardView = false;

  // Display number of results from each category type
  public categoryListArray = [];

  public currentCategoryString = '';

  // A reference to the search filters dialog, if one is currently displayed.
  // Otherwise null.
  private filterDialogRef : MatDialogRef<any>;

  public static getFilterVisibility(categoryId: number) {
    return {
      person: categoryId !== CategoryId.Policies && categoryId !== CategoryId.Person,
      orgUnit: categoryId !== CategoryId.Policies,
      researchActivity: categoryId !== CategoryId.Policies && categoryId !== CategoryId.Person
    };
  }

  private static parseParamArray(str: string) {
    let nums = [];

    if (str) {
      if (str.includes(',')) {
        nums = str.split(',');
      } else {
        nums = [str];
      }

      nums = nums.reduce((result, value) => {
        const num = Number(value);

        if (num) {
          result.push(num);
        }

        return result;
      }, []);
    }

    return nums;
  }

  // Return a number version of the category version to the view (decoupling model/view/controller)
  public getCategoryId = () => Number(this.searchBarService.getCategory());

  public getCurrentCategoryId(category: string) {
    switch (category) {
      case 'Service':
        return 2;
      case 'Equipment':
        return 3;
      case 'Training':
        return 4;
      case 'Software':
        return 5;
      case 'Facility':
        return 6;
      case 'Guide':
        return 7;
      case 'People':
        return 8;
      case 'Policy':
        return 9;
    }
    return false;
  }

  // Update the category if someone clicks a category in the mat-list search results list
  public updateCategoryFromCategoryList(category: string) {
    // Necessary because of discrepancies between item category description and service enums (enums should be updated in future)
    switch (category) {
      case 'Policy':
        category = 'Policies';
        break;
      case 'Service':
        category = 'Support';
        break;
      case 'Facility':
        category = 'Facilities';
        break;
      case 'People':
        category = 'Person';
        break;
    }
    this.searchBarService.setCategory(CategoryId[category]);
  }

  /**
   * Checks if the passed string corresponds with the currently searched for category.
   * Used to highlight the mat-chip corresponding to the currently searched category.
   * @param {string} category
   */
  public isCurrentCategory(category: string) {
    switch (category) {
      case 'Service':
        return this.searchBarService.category == '2';
      case 'Equipment':
        return this.searchBarService.category == '3';
      case 'Training':
        return this.searchBarService.category == '4';
      case 'Software':
        return this.searchBarService.category == '5';
      case 'Facility':
        return this.searchBarService.category == '6';
      case 'Guide':
        return this.searchBarService.category == '7';
      case 'People':
        return this.searchBarService.category == '8';
      case 'Policy':
        return this.searchBarService.category == '9';
    }
    return false;
  }

  fromTags(tags: Tag[]) {
    return tags.map(tag => tag.id);
  }

  toTags(ids: number[]) {
    return ids.map(id => {
      return {id: id};
    });
  }

  constructor(private searchBarService: SearchBarService,
              public optionsService: OptionsService, public apiService: ResearchHubApiService,
              private analyticsService: AnalyticsService, private route: ActivatedRoute,
              private location: Location, public dialog: MatDialog, private appComponentService: AppComponentService,
              private componentService : SearchResultsComponentService,
              private layoutService: LayoutService, private media: ObservableMedia,
              private searchFiltersService: SearchFiltersService) {
    this.filtersForm = searchFiltersService.filtersForm;
  }

  // Results cards
  updateCols(mqAlias: string) {
    const cols = this.layoutService.getNumGridColsCardResults(mqAlias);
    this.cardViewResultsNumberOfColumns = Math.min(3, cols);
  }

  initFilterSidenav(){
    this.contentNavVisibilitySub = this.appComponentService.contentSidenavVisibilityChange.subscribe(
      (isSidenavVisible: boolean) => {
        this.filterVisible = isSidenavVisible;
      });
    if (!this.layoutService.isWidthLessThan(FILTER_VIEW_BREAKPOINT)){
      // If we are in desktop mode, pop open the filters by default.
      this.openFilters();
    }
  }

  initResultSubs(){
    this.resultsSub = this.componentService.results$.subscribe(
      page => {
        this.resultsPage = page;
        this.orderBy = page.sort;
        const filtersFormValue = this.filtersForm.value;
        const personTags = filtersFormValue.personTags;
        const orgUnitTags = filtersFormValue.orgUnitTags;
        const categoryId = filtersFormValue.categoryId;
        const searchText = this.searchBarService.searchText;
        const researchActivityIds = filtersFormValue.researchActivityIds;
        this.setFiltersTextIfUndefined(personTags, orgUnitTags).subscribe(res => {
          const[personTagsRes, orgUnitTagsRes] = res;
          this.updateResultsSummary(page, categoryId, searchText, personTagsRes, orgUnitTagsRes, researchActivityIds);
        });
        this.appComponentService.setProgressBarVisibility(false);
      }
    );
    this.categoriesSub = this.componentService.resultsCategories$.subscribe(
      categories => {
        this.categoryListArray = categories;
        console.log("New results categories!");
      });
  }

  ngOnInit() {
    this.initFilterSidenav();
    this.initResultSubs();
    // Results cards
    this.updateCols(this.layoutService.getMQAlias());

    this.mediaSub = this.media.subscribe((change: MediaChange) => {
      this.updateCols(change.mqAlias);
      this.updateFiltersView(change.mqAlias);
    });

    // Results page
    this.resultsPage = {totalElements: 0} as Page<ListItem>;

    // Category changes
    this.categoryIdSub = this.searchBarService.searchCategoryChange.subscribe(category => {
      if (category !== this.filtersForm.controls.categoryId.value) {
        this.filtersForm.controls.categoryId.patchValue(category);
      }
    });

    // Subscribe to search parameter changes
    this.searchChangeSub = Observable
      .combineLatest(
        this.searchBarService.searchTextChange.debounceTime(250).distinctUntilChanged(),
        this.filtersForm.valueChanges.distinctUntilChanged(),
        this.pageEventChange.distinctUntilChanged(),
        this.orderByChange
      )
      .debounceTime(100)
      .subscribe(latestValues => {
        const [searchText, filtersFormValues, pageEvent, orderBy] = latestValues;

        this.searchTextIsBlank = searchText == "";

        if (filtersFormValues.categoryId !== this.searchBarService.category) {
          this.searchBarService.setCategory(filtersFormValues.categoryId);
        }

        if ((this.previousSearchText !== searchText || this.previousFiltersFormValues !== filtersFormValues) && this.previousPageEvent === pageEvent) {
          pageEvent.pageIndex = 0;
          this.paginator.pageIndex = 0;
        }

        this.onSearchChange(filtersFormValues.categoryId, searchText, filtersFormValues.personTags,
          filtersFormValues.orgUnitTags, filtersFormValues.researchActivityIds, pageEvent, orderBy);

        this.previousPageEvent = pageEvent;
        this.previousSearchText = searchText;
        this.previousFiltersFormValues = filtersFormValues;
      });

    // Update filtersForm and searchBar based on route parameters
    this.routeParamsSub =
      this.route.queryParams
      .subscribe(params => {
        // These need to be set initially so that the combineLatest observable will fire
        // Always set category id and search text  from url if you want to change them
        const categoryId = +(params['categoryId'] || CategoryId.All);
        const searchText = typeof params['searchText'] === 'string' ? params['searchText'] : '';
        const personIds = SearchResultsComponent.parseParamArray(params['personIds']);
        const orgUnitIds = SearchResultsComponent.parseParamArray(params['orgUnitIds']);
        const researchActivityIds = SearchResultsComponent.parseParamArray(params['researchActivityIds']);
        this.pageIndex = +(params['pageIndex'] || 0);
        this.pageSize = +(params['pageSize'] || 12);
        this.orderBy = params['orderBy'] || OrderBy.Relevance;


        // Update values in search bar and search filters form
        this.searchBarService.setSearchText(searchText);
        this.searchBarService.setCategory(categoryId);
        this.filtersForm.controls.categoryId.setValue(categoryId);
        this.filtersForm.controls.personTags.setValue(this.toTags(personIds));
        this.filtersForm.controls.orgUnitTags.setValue(this.toTags(orgUnitIds));
        this.filtersForm.controls.researchActivityIds.setValue(researchActivityIds);

        // Send page event order by event to trigger search
        this.pageEventChange.next({pageIndex: this.pageIndex, pageSize: this.pageSize} as PageEvent);
        this.orderByChange.next(this.orderBy);
      });

    this.buttonClickSub = this.searchBarService.filterButtonClickChange.subscribe((buttonName) => {
      this.openDialog();
    });
  }

  onPageChange(event: PageEvent) {
    this.pageEventChange.next({pageSize: event.pageSize, pageIndex: event.pageIndex});
    this.resultsDummyHeader.nativeElement.scrollIntoView();
  }

  onOrderByChange(orderBy) {
    this.orderByChange.next(orderBy);
  }

  setFiltersTextIfUndefined(personTags: Tag[], orgUnitTags: Tag[]) {
    // To be filled with API request observables
    const observablePersonBatch = [];
    const observableOrgUnitBatch = [];

    // Queue up API requests for persons and orgUnits
    orgUnitTags.forEach(key => observableOrgUnitBatch.push(this.apiService.getOrgUnit(key.id)));
    personTags.forEach(key => observablePersonBatch.push(this.apiService.getPerson(key.id)));

    // Return an observable containing the batches of observables for both personTags and orgUnitTags
    return forkJoin(
      forkJoin(observablePersonBatch).map(x => x.map(y => {y['text'] = y['firstName'] + ' ' + y['lastName']; return (y)}))
        .pipe(z => observablePersonBatch.length ? z : Observable.of([])),
      forkJoin(observableOrgUnitBatch).map(x => x.map(y => {y['text'] = y['name'];  return (y)}))
        .pipe(z => observableOrgUnitBatch.length ? z : Observable.of([]))
    );
  }

  openFilters(){
    const winWidth = this.layoutService.getMQAlias();
    if (this.layoutService.isWidthLessThan(FILTER_VIEW_BREAKPOINT)){
      this.openDialog();
    } else {
      this.appComponentService.setContentSidenavVisibility(true);
    }
  }

  private openDialog(): void {
    this.filterDialogRef = this.dialog.open(FilterDialogComponent, {
      maxWidth: '100%',
      width: '100%',
      height: '100%',
      data: {
        form: this.searchFiltersService.duplicateFilters()
      }
    });

    this.filterDialogRef.afterClosed().subscribe(newFiltersForm => {
      if (newFiltersForm) {
        this.searchFiltersService.patchFilters(newFiltersForm);
      }
      this.filterDialogRef = null;
    });
  }


  /**
  * Hide the filters view that isn't applicable to the screen size
  * if media width has changed.
  * See ngOnInit.
  */
  private updateFiltersView(winWidth: string){
    if (this.layoutService.isWidthLessThan(FILTER_VIEW_BREAKPOINT)){
      this.appComponentService.setContentSidenavVisibility(false);
    } else {
      if (this.filterDialogRef){
        this.filterDialogRef.close();
      }
    }
  }

  onSearchChange(categoryId: number, searchText: string, personTags: Tag[], orgUnitTags: Tag[], researchActivityIds: number[], pageEvent: any, orderBy: OrderBy) {
    const friendlyCategoryId = this.optionsService.categoryOptions.filter((obj) => {
      return obj.id === categoryId;
    })[0].name;

    this.analyticsService.trackSearch(friendlyCategoryId, searchText);
    this.appComponentService.setProgressBarVisibility(true);

    const personIds = this.fromTags(personTags);
    const orgUnitIds = this.fromTags(orgUnitTags);
    this.updateUrl(categoryId, searchText, personIds, orgUnitIds, researchActivityIds, pageEvent, orderBy);

    const params = new SearchResultsParams();
    params.setObjectType('all');
    params.setSearchText(searchText);
    params.setPage(pageEvent.pageIndex);
    params.setSize(pageEvent.pageSize);
    params.setOrderBy(orderBy);

    if (categoryId !== CategoryId.All) {
      if (categoryId === CategoryId.Policies) {
        params.setObjectType('policy');
      } else if (categoryId === CategoryId.Person) {
        params.setObjectType('person');
        params.setOrgUnits(orgUnitIds);
        params.setRoleTypes([RoleTypeId.UserSupport]);
      } else {
        const contentTypeIds = this.optionsService.contentTypeMap[categoryId];
        params.setObjectType('content');
        params.setContentTypes(contentTypeIds);
        params.setResearchPhases(researchActivityIds);
        params.setPeople(personIds);
        params.setRoleTypes([RoleTypeId.UserSupport]);
        params.setOrgUnits(orgUnitIds);
      }
    } else {
      params.setPeople(personIds);
      params.setRoleTypes([RoleTypeId.UserSupport]);
      params.setOrgUnits(orgUnitIds);
      params.setResearchPhases(researchActivityIds);
    }

    this.componentService.searchWithParams(params);
  }


  updateUrl(categoryId: number, searchText: string, personIds: number[], orgUnitIds: number[], researchActivityIds: number[], pageEvent: any, orderBy: OrderBy) {
    let url = '/search';
    const params = [];
    const visibilities = SearchResultsComponent.getFilterVisibility(categoryId);

    if (categoryId) {
      params.push('categoryId=' + categoryId);
    }

    if (searchText) {
      params.push('searchText=' + searchText);
    }

    if (personIds  && personIds.length && visibilities['person']) {
      params.push('personIds=' + personIds.join(','));
    }

    if (orgUnitIds  && orgUnitIds.length && visibilities['orgUnit']) {
      params.push('orgUnitIds=' + orgUnitIds.join(','));
    }

    if (researchActivityIds && researchActivityIds.length && visibilities['researchActivity']) {
      params.push('researchActivityIds=' + researchActivityIds.join(','));
    }

    if (pageEvent) {
      params.push('pageIndex=' + pageEvent.pageIndex);
      params.push('pageSize=' + pageEvent.pageSize);
    }

    if (orderBy) {
      params.push('orderBy=' + orderBy);
    }

    const paramsStr = params.join('&');
    if (paramsStr) {
      url += '?' + paramsStr;
    }

    this.location.replaceState(encodeURI(url)); // Update url without reloading page
  }

  updateResultsSummary(page: Page<ListItem>, categoryId: number, searchText: string, personTags: Tag[], orgUnitTags: Tag[], researchActivityIds: number[]) {
    const statements = [];
    const visibilities = SearchResultsComponent.getFilterVisibility(categoryId);

    if (categoryId) {
      this.currentCategoryString = this.optionsService.categoryOptions[categoryId - 1]['name'];
      statements.push('in <span class="search-results-text">' + this.optionsService.categoryOptions[categoryId - 1]['name'] + '</span>');
    }

    if (personTags && personTags.length && visibilities['person']) {
      const people = [];

      for (const tag of personTags) {
        people.push('<span class="search-results-text">' + tag.text + '</span>');
      }

      statements.push('supported by ' + people.join(', '));
    }

    if (orgUnitTags && orgUnitTags.length && visibilities['orgUnit']) {
      const orgUnits = [];

      for (const tag of orgUnitTags) {
        orgUnits.push('<span class="search-results-text">' + tag.text + '</span>');
      }

      statements.push('provided by ' + orgUnits.join(', '));
    }

    if (researchActivityIds && researchActivityIds.length && visibilities['researchActivity']) {
      const activities = [];

      for (const researchActivityId of researchActivityIds) {
        activities.push('<span class="search-results-text">' + this.optionsService.researchActivityOptions[researchActivityId - 1]['name'] + '</span>');
      }

      let researchPhaseText = 'applicable to the ' + activities.join(', ') + ' research activity';

      if (researchActivityIds.length > 1) {
        researchPhaseText = researchPhaseText.slice(0, -1) + 'ies';
      }

      statements.push(researchPhaseText);
    }

    let searchTextSummary = '';
    if (searchText) {
      searchTextSummary = 'for <span class="search-results-text">"' + searchText + '"</span> ';
    }

    const summary = searchTextSummary + statements.join(', ');
    this.noResultsSummary = 'Sorry - your search ' + summary + ', did not match anything on the ResearchHub.';
    this.resultsSummary = 'Found <span class="search-results-text">' + (page.totalElements) + '</span> results ' + summary + '. Showing page <span class="search-results-text">' + (page.number + 1) + '</span> of <span class="search-results-text">' + (page.totalPages) + '</span>.';
    this.showEmptyState = page.totalElements === 0;

  }

  trackOutboundLink(result: ListItem) {
    if (result['type'] !== undefined && result['type'] === 'policy') {
      this.analyticsService.trackPolicy(result.title, result.url);
    } else {
      this.analyticsService.trackOutboundLink(result.url);
    }
  }

  ngOnDestroy() {
    this.categoryIdSub.unsubscribe();
    this.searchChangeSub.unsubscribe();
    this.routeParamsSub.unsubscribe();
    this.buttonClickSub.unsubscribe();
    this.contentNavVisibilitySub.unsubscribe();
    this.resultsSub.unsubscribe();
    this.categoriesSub.unsubscribe();
  }
}

import {Component, OnInit, Input, OnDestroy} from "@angular/core";
import {MenuItem, MenuItemType, MenuService} from "../menu.service";
import {ActivatedRoute} from "@angular/router";
import {ApiService, ContentItemsSearchParams, SearchParams} from "../app.api.service";
import {ProgressBarService} from "../app.progress-bar.service";
import {SearchBarService} from "../search-bar/search-bar.service";
import {Subscription} from 'rxjs/Subscription';
import {MediaChange, ObservableMedia, DEFAULT_BREAKPOINTS} from '@angular/flex-layout';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent implements OnInit, OnDestroy {

  private menuItems = [];
  mediaSub: Subscription;

  @Input()
  embedded = false;

  @Input()
  maxCols = 5;

  @Input()
  numCols = 4;
  teal = '#0294a5';
  navy = '#004059';
  orange = '#ff8300';
  tileColors = [this.teal, this.navy, this.orange];

  constructor(private menuService: MenuService, private route: ActivatedRoute, private progressBarService: ProgressBarService,
              private searchBarService: SearchBarService, private media: ObservableMedia) {
  }


  ngOnInit() {

    this.getMQAlias();

    this.setNumCategoryColumns(this.getMQAlias());

    this.mediaSub = this.media.subscribe((change: MediaChange) => {
      console.log(change.mqAlias);
      this.setNumCategoryColumns(change.mqAlias);
    });

    this.route.params.subscribe(params => {
      const categoryId = MenuService.getMenuItemId([params['contentTypeId'], params['subcategoryId']]);
      const menuItem = this.menuService.getMenuItem(categoryId);

      if (!menuItem.isLeaf()) {
        this.progressBarService.setHidden();

        // Remove 'all' category when root category is requested
        let start = 0;
        if (categoryId === '/') {
          start = 1;
          this.searchBarService.setCategory('all');
        }
        this.menuItems = menuItem.menuItems.slice(start);
      }
    });
  }

  ngOnDestroy() {
    this.mediaSub.unsubscribe();
  }

  getMQAlias(): string {

    //console.log(DEFAULT_BREAKPOINTS);

    const width = window.innerWidth;

    // fxFlex breakpoints
    const xs = 600;
    const sm = 960;
    const md = 1280;
    const lg = 1920;
    const xl = 5000;

    if ( width < xs){

    } else if (width >= xs && width < sm){
      return 'xs';
    } else if (width >= sm && width < md){
      return 'sm';
    } else if (width >= md && width < lg){
      return 'md';
    } else if (width >= lg && width < xl){
      return 'lg';
    } else {
      return 'xl';
    }
  }

  setNumCategoryColumns(mqAlias: string) {
    let numCols = 0;
    switch (mqAlias) {

      case 'xs':
        numCols = 2;
        break;
      case 'sm':
        numCols = 3;
        break;
      case 'md':
        numCols = 3;
        break;
      case 'lg':
        numCols = 4;
        break;
      case 'xl':
        numCols = 5;
        break;
      default:
        numCols = 4;
        break;
    }
    //console.log(mqAlias);

    if (this.embedded && mqAlias !== 'xs') {
      numCols -= 1;
    }

    this.numCols = Math.min(this.maxCols, numCols);
  }

  getTileColor(id: number): any {
    return {'background-color': this.tileColors[id % 3]};
  }
}

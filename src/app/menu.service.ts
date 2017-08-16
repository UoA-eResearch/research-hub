import {Injectable} from '@angular/core';
import {BreadcrumbService} from "ng2-breadcrumb/ng2-breadcrumb";


export enum MenuItemType {
  Root = 1,
  All,
  Content,
  Person,
  Guide,
  Policy
}

export class MenuItem {

  public parent: MenuItem;

  constructor(public id: string, public name: string, public icon: string, public type: MenuItemType,
              public contentTypeId: number, public menuItems: [MenuItem]) {

    // Set this menuItem as the parent
    if (menuItems != null) {
      for (const child of menuItems) {
        child.parent = this;
      }
    }
  }

  public isLeaf() {
    return this.menuItems == null;
  }
}


@Injectable()
export class MenuService {

  public contentTypeIdSupport = 1;
  public contentTypeIdInstrumentsEquipment = 2;
  public contentTypeIdTraining = 3;
  public contentTypeIdSoftware = 4;
  public contentTypeIdFacilitiesSpaces = 5;
  public contentTypeIdKnowledgeArticle = 6;
  public nameAll = 'All Categories';
  public nameSupport = 'Services & Support';
  public nameInstrumentsEquipment = 'Instruments & Equipment';
  public nameTraining = 'Skills Development';
  public nameSoftware = 'Software';
  public nameFacilitiesSpaces = 'Facilities & Spaces';
  public nameGuides = 'Guides';
  public namePeople = 'People';
  public nameKnowledgeArticle = 'Knowledge Articles & Know-How';
  public namePolicies = 'Policies';

  private root: MenuItem;
  private menuItemsDict = {};

  public static getMenuItemId(params: [string]) {
    const notNulls = [];

    for (const id of params) {
      if (id != null) {
        notNulls.push(id);
      }
    }
    return '/' + notNulls.join('/');
  }

  constructor(private breadcrumbService: BreadcrumbService) {
    this.root =
      new MenuItem('', '', '', MenuItemType.Root, null, [
        new MenuItem('all', this.nameAll, '', MenuItemType.All, null, null),
        new MenuItem('support', this.nameSupport, 'help', MenuItemType.Content, this.contentTypeIdSupport, null),
        new MenuItem('instrumentsEquipment', this.nameInstrumentsEquipment, 'camera_roll', MenuItemType.Content, this.contentTypeIdInstrumentsEquipment, null),
        new MenuItem('training', this.nameTraining, 'directions_bike', MenuItemType.Content, this.contentTypeIdTraining, null),
        new MenuItem('software', this.nameSoftware, 'shop', MenuItemType.Content, this.contentTypeIdSoftware, null),
        new MenuItem('facilitiesSpaces', this.nameFacilitiesSpaces, 'home', MenuItemType.Content, this.contentTypeIdFacilitiesSpaces, null),
        new MenuItem('guides', this.nameGuides, 'language', MenuItemType.Guide, null, null),
        new MenuItem('people', this.namePeople, 'face', MenuItemType.Person, null, null),
        new MenuItem('knowledgeArticle', this.nameKnowledgeArticle, 'book', MenuItemType.Content, this.contentTypeIdKnowledgeArticle, null),
        new MenuItem('policies', this.namePolicies, 'account_balance', MenuItemType.Policy, null, null),
      ]);

    this.createMenuItemsDict('', this.root.menuItems);
    this.createFriendlyNames('/browse', this.root.menuItems);
  }

  private createMenuItemsDict(parentId: string, menuItems: [MenuItem]) {
    for (const menuItem of menuItems) {
      const childId = parentId + '/' + menuItem.id;
      this.menuItemsDict[childId] = menuItem;

      if (!menuItem.isLeaf()) {
        this.createMenuItemsDict(childId, menuItem.menuItems);
      }
    }
  }

  private createFriendlyNames(parentRoute: string, menuItems: [MenuItem]) {
    for (const menuItem of menuItems) {
      const childRoute = parentRoute + '/' + menuItem.id;
      this.breadcrumbService.addFriendlyNameForRoute(childRoute, menuItem.name);

      if (!menuItem.isLeaf()) {
        this.createFriendlyNames(childRoute, menuItem.menuItems);
      }
    }
  }

  public getMenuItem(menuItemId: string) {
    if (menuItemId === '/') {
      return this.root;
    }

    return this.menuItemsDict[menuItemId];
  }
}
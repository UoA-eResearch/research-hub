import {Injectable} from '@angular/core';


export enum OptionType {
  ResearchActivity = 1,
  Category,
  Menu
}

export enum ContentTypeId {
  Support = 1,
  Equipment,
  Training,
  Software,
  Facilities,
  KnowledgeArticle,
  Guide
}

export enum ResearchActivityId {
  PlanDesign = 1,
  CreateCollectCapture,
  AnalyzeInterpret,
  PublishReport,
  DiscoverReuse
}

export enum CategoryId {
  All = 1,
  Support,
  Equipment,
  Training,
  Software,
  Facilities,
  Guide,
  Person,
  Policies
}

export enum ActionTypeId {
  Integrated = 1,
  ExternalUrl,
  ExternalMailTo
}

export enum RoleTypeId {
  ServiceOwner = 1,
  CopyOwner,
  UserSupport
}


@Injectable()
export class OptionsService {

  private coverImages = [
    '20151005_Science Detail_001_1680x220_BW.jpg',
    '483_Pacific_28Sep10_1680x220_BW.jpg',
    '20130930_UoA_Details_225_1680x220_BW.jpg'
  ];
  public categoryOptions: any[];
  public researchActivityOptions: any[];
  public menuOptions: any[];
  public pageInfo: any;
  public contentTypeMap: any;

  constructor() {
    this.contentTypeMap = {};
    this.contentTypeMap[CategoryId.Support] = [ContentTypeId.Support];
    this.contentTypeMap[CategoryId.Equipment] = [ContentTypeId.Equipment];
    this.contentTypeMap[CategoryId.Training] = [ContentTypeId.Training];
    this.contentTypeMap[CategoryId.Software] = [ContentTypeId.Software];
    this.contentTypeMap[CategoryId.Facilities] = [ContentTypeId.Facilities];
    this.contentTypeMap[CategoryId.Guide] = [ContentTypeId.Guide, ContentTypeId.KnowledgeArticle];

    this.categoryOptions = [
      {id: CategoryId.All, name: 'All Categories', icon: 'public', type: OptionType.Category},
      {id: CategoryId.Support, name: 'Service', icon: 'local_play', type: OptionType.Category},
      {id: CategoryId.Equipment, name: 'Equipment', icon: 'build', type: OptionType.Category},
      {id: CategoryId.Training, name: 'Training', icon: 'school', type: OptionType.Category},
      {id: CategoryId.Software, name: 'Software', icon: 'desktop_mac', type: OptionType.Category},
      {id: CategoryId.Facilities, name: 'Facility', icon: 'home', type: OptionType.Category},
      {id: CategoryId.Guide, name: 'Guide', icon: 'import_contacts', type: OptionType.Category},
      {id: CategoryId.Person, name: 'Person', icon: 'face', type: OptionType.Category},
      {id: CategoryId.Policies, name: 'Policy', icon: 'gavel', type: OptionType.Category}
    ];

    this.researchActivityOptions = [
      {
        id: ResearchActivityId.PlanDesign,
        name: 'Plan & Design',
        className: 'plan',
        type: OptionType.ResearchActivity
      },
      {
        id: ResearchActivityId.CreateCollectCapture,
        name: 'Create, Collect & Capture',
        className: 'create',
        type: OptionType.ResearchActivity
      },
      {
        id: ResearchActivityId.AnalyzeInterpret,
        name: 'Analyze & Interpret',
        className: 'analyze',
        type: OptionType.ResearchActivity
      },
      {
        id: ResearchActivityId.PublishReport,
        name: 'Publish & Report',
        className: 'publish',
        type: OptionType.ResearchActivity
      },
      {
        id: ResearchActivityId.DiscoverReuse,
        name: 'Discover & Reuse',
        className: 'discover',
        type: OptionType.ResearchActivity
      }
    ];

    this.menuOptions = [
      {name: 'Search', icon: 'search', routerLink: '/search', type: OptionType.Menu},
      {name: 'Browse', icon: 'view_list', routerLink: '', sublist: this.categoryOptions, type: OptionType.Menu},
      {
        name: 'Research Activities',
        icon: 'school',
        routerLink: '',
        sublist: this.researchActivityOptions,
        type: OptionType.Menu
      },
      {name: 'User Study', icon: 'people', routerLink: '/userStudy', type: OptionType.Menu},
      {name: 'Feedback', icon: 'thumbs_up_down', routerLink: '/feedback', type: OptionType.Menu},
      {name: 'Contact', icon: 'phone', routerLink: '/contact', type: OptionType.Menu},
      {name: 'About', icon: 'info', routerLink: '/about', type: OptionType.Menu}
    ];

    this.pageInfo = {
      home: {
        title: 'Welcome to the ResearchHub',
        description: 'The ResearchHub connects you with people, resources, and services from across the University to enhance and accelerate your research.',
        imageUrl: 'page-elements/' + this.coverImages[Math.floor(Math.random() * 3)], // Generate a random number between 1 and 3 and
        isHeaderVisible: true,
        isSearchBarVisible: true
      },
      search: {title: 'Search', isHeaderVisible: false, isSearchBarVisible: true},
      feedback: {
        title: 'Feedback',
        description: 'We appreciate your visit to the beta-version of the ResearchHub, our platform for research support.',
        imageUrl: 'page-elements/AU_Gen_Detail2010_073_1680x220_BW.jpg',
        isHeaderVisible: true,
        isSearchBarVisible: false
      },
      userStudy: {
        title: 'User Study',
        description: 'We appreciate your visit to the beta-version of the ResearchHub, our platform for research support.',
        imageUrl: 'page-elements/AU_Gen_Detail2010_073_1680x220_BW.jpg',
        isHeaderVisible: true,
        isSearchBarVisible: false
      },
      about: {
        title: 'About',
        description: 'The Centre for eResearch comprises a team of highly qualified research and technical staff dedicated to the delivery of advanced computational solutions to help power the University\'s research mission.',
        imageUrl: 'page-elements/20151005_Science Detail_013_1680x220_BW.jpg',
        isHeaderVisible: true,
        isSearchBarVisible: false
      },
      contact: {
        title: 'Contact',
        description: 'If you want to get in touch you can ring us, write to us or even visit us. We\'d love to hear from you.',
        imageUrl: 'page-elements/DSC_0192_1680x220_BW.jpg',
        isHeaderVisible: true,
        isSearchBarVisible: false
      },
      orgUnit: {isHeaderVisible: false, isSearchBarVisible: false},
      person: {isHeaderVisible: false, isSearchBarVisible: false},
      content: {isHeaderVisible: false, isSearchBarVisible: false},
      guide: {isHeaderVisible: false, isSearchBarVisible: false},
      guideCategory: {isHeaderVisible: false, isSearchBarVisible: false},
      requestVm: {isHeaderVisible: false, isSearchBarVisible: false},
      requestData: {isHeaderVisible: false, isSearchBarVisible: false}
    };
  }
}
